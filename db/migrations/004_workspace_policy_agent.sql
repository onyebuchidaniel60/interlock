-- Ensure every new workspace has the policy-writer identity in addition to the
-- four runtime agents. Existing workspaces were backfilled in migration 003.
create or replace function public.app_create_workspace(
  p_name text,
  p_slug text,
  p_user_id uuid
)
returns uuid
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_workspace_id uuid;
begin
  if p_user_id is null or p_user_id is distinct from public.app_current_user_id() then
    raise exception using errcode = 'P0001', message = 'not_authorized';
  end if;

  if exists (
    select 1 from public.workspace_members
    where user_id = p_user_id and status = 'ACTIVE'
  ) then
    raise exception using errcode = 'P0001', message = 'workspace_exists';
  end if;

  insert into public.workspaces (name, slug, created_by)
  values (p_name, p_slug, p_user_id)
  returning id into v_workspace_id;

  insert into public.workspace_members (workspace_id, user_id, role, status, accepted_at)
  values (v_workspace_id, p_user_id, 'OWNER', 'ACTIVE', now());

  insert into public.agent_identities (workspace_id, agent_type, display_name, capabilities)
  values
    (v_workspace_id, 'SCOUT', 'Scout', '["observe_chain","write_fact","verify_recall"]'::jsonb),
    (v_workspace_id, 'POLICY', 'Policy writer', '["write_constraint"]'::jsonb),
    (v_workspace_id, 'ANALYST', 'Analyst', '["draft_explanation"]'::jsonb),
    (v_workspace_id, 'SENTINEL', 'Sentinel', '["read_evidence","evaluate_plan","write_verdict"]'::jsonb),
    (v_workspace_id, 'RUNNER', 'Runner', '["simulate_execution"]'::jsonb);

  insert into public.audit_events (workspace_id, actor_user_id, event_type, resource_type, resource_id, summary)
  values (v_workspace_id, p_user_id, 'WORKSPACE_CREATED', 'WORKSPACE', v_workspace_id, 'Workspace created with owner membership.');

  return v_workspace_id;
end;
$$;

revoke all on function public.app_create_workspace(text, text, uuid) from public;
grant execute on function public.app_create_workspace(text, text, uuid) to app_user;
