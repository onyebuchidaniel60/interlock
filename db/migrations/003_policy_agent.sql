-- Allow the policy-writer delegate identity, distinct from the human operator.
alter table public.agent_identities drop constraint if exists agent_identities_agent_type_check;
alter table public.agent_identities
  add constraint agent_identities_agent_type_check
  check (agent_type in ('SCOUT', 'POLICY', 'ANALYST', 'SENTINEL', 'RUNNER'));

insert into public.agent_identities (workspace_id, agent_type, display_name, capabilities)
select w.id, 'POLICY', 'Policy writer', '["write_constraint"]'::jsonb
from public.workspaces w
on conflict (workspace_id, agent_type) do nothing;
