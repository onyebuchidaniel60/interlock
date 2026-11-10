-- Phase 2 follow-up: store display metadata on memberships for the settings view.
-- User identities remain owned by Neon Managed Better Auth; these are denormalized labels only.

alter table public.workspace_members
  add column if not exists email text,
  add column if not exists display_name text;

create or replace function public.app_accept_invitation(
  p_token_hash text,
  p_user_id uuid,
  p_email text
)
returns table (workspace_id uuid, role text)
language plpgsql
security definer
set search_path = public, pg_temp
as $$
declare
  v_invitation public.workspace_invitations%rowtype;
begin
  if p_user_id is null or p_user_id is distinct from public.app_current_user_id() then
    raise exception using errcode = 'P0001', message = 'not_authorized';
  end if;

  if exists (
    select 1 from public.workspace_members
    where user_id = p_user_id and status = 'ACTIVE'
  ) then
    raise exception using errcode = 'P0001', message = 'already_member';
  end if;

  select * into v_invitation
  from public.workspace_invitations
  where token_hash = p_token_hash
    and accepted_at is null
    and expires_at > now()
  for update;

  if not found or lower(v_invitation.email) <> lower(p_email) then
    raise exception using errcode = 'P0001', message = 'invalid_invitation';
  end if;

  insert into public.workspace_members
    (workspace_id, user_id, role, status, invited_by, invited_at, accepted_at, email)
  values
    (v_invitation.workspace_id, p_user_id, v_invitation.role, 'ACTIVE', v_invitation.created_by, v_invitation.created_at, now(), v_invitation.email);

  update public.workspace_invitations
  set accepted_at = now()
  where id = v_invitation.id;

  insert into public.audit_events
    (workspace_id, actor_user_id, event_type, resource_type, resource_id, summary, metadata_redacted)
  values
    (v_invitation.workspace_id, p_user_id, 'INVITATION_ACCEPTED', 'WORKSPACE_MEMBER', p_user_id, 'Workspace invitation accepted.', jsonb_build_object('role', v_invitation.role));

  return query select v_invitation.workspace_id, v_invitation.role;
end;
$$;
