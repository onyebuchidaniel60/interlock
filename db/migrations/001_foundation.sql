-- Interlock Phase 2 foundation.
-- Migrations run as neondb_owner. Application requests run as app_user (NOBYPASSRLS).
-- RLS policies are plain PostgreSQL; auth.uid() is not available.

create table public.workspaces (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 120),
  slug text not null unique check (slug ~ '^[a-z0-9]+(?:-[a-z0-9]+)*$'),
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'SUSPENDED', 'DELETED_PENDING')),
  settings jsonb not null default '{}'::jsonb,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.workspace_members (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  user_id uuid not null,
  role text not null check (role in ('OWNER', 'OPERATOR', 'OBSERVER')),
  status text not null default 'INVITED' check (status in ('INVITED', 'ACTIVE', 'REVOKED')),
  invited_by uuid,
  invited_at timestamptz,
  accepted_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, user_id)
);

create unique index one_active_owner_per_workspace
  on public.workspace_members (workspace_id)
  where role = 'OWNER' and status = 'ACTIVE';

create unique index one_active_workspace_per_user
  on public.workspace_members (user_id)
  where status = 'ACTIVE';

create index workspace_members_user_status_idx on public.workspace_members (user_id, status);
create index workspace_members_workspace_role_idx on public.workspace_members (workspace_id, role, status);

create table public.workspace_invitations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  email text not null,
  role text not null check (role in ('OPERATOR', 'OBSERVER')),
  token_hash text not null unique,
  expires_at timestamptz not null,
  accepted_at timestamptz,
  created_by uuid not null,
  created_at timestamptz not null default now()
);

create index workspace_invitations_workspace_idx
  on public.workspace_invitations (workspace_id, accepted_at, expires_at);

create table public.agent_identities (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  agent_type text not null check (agent_type in ('SCOUT', 'ANALYST', 'SENTINEL', 'RUNNER')),
  display_name text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DISABLED')),
  capabilities jsonb not null default '[]'::jsonb,
  walrus_agent_id text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, agent_type)
);

create index agent_identities_workspace_status_idx on public.agent_identities (workspace_id, status);

create table public.wallet_sources (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  chain text not null default 'SUI' check (chain = 'SUI'),
  network text not null default 'MAINNET' check (network = 'MAINNET'),
  address text not null,
  coin_type text not null default '0x2::sui::SUI',
  label text,
  status text not null default 'ACTIVE' check (status in ('ACTIVE', 'DISABLED')),
  created_by uuid not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, network, address, coin_type)
);

create index wallet_sources_workspace_status_idx on public.wallet_sources (workspace_id, status);

create table public.chain_observations (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  wallet_source_id uuid not null references public.wallet_sources(id),
  provider text not null check (provider = 'TATUM'),
  method text not null,
  chain text not null default 'SUI' check (chain = 'SUI'),
  network text not null default 'MAINNET' check (network = 'MAINNET'),
  address text not null,
  coin_type text not null default '0x2::sui::SUI',
  balance_mist numeric(78, 0) not null check (balance_mist >= 0),
  coin_balance_mist numeric(78, 0) check (coin_balance_mist is null or coin_balance_mist >= 0),
  address_balance_mist numeric(78, 0) check (address_balance_mist is null or address_balance_mist >= 0),
  observed_at timestamptz not null,
  received_at timestamptz not null default now(),
  provider_reference text,
  checkpoint text,
  raw_response_hash text not null,
  created_by uuid not null,
  created_at timestamptz not null default now(),
  check (wallet_source_id is not null)
);

create index chain_observations_wallet_idx
  on public.chain_observations (workspace_id, wallet_source_id, observed_at desc);
create index chain_observations_address_idx
  on public.chain_observations (workspace_id, network, address, observed_at desc);

create table public.memory_entries (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  record_type text not null check (record_type in ('FACT', 'CONSTRAINT', 'VERDICT', 'OUTCOME')),
  scope text not null,
  author_agent_id uuid not null references public.agent_identities(id),
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'PENDING_MEMORY', 'ACTIVE', 'SUPERSEDED', 'REVOKED', 'EXPIRED', 'QUARANTINED', 'FAILED')),
  created_at timestamptz not null default now(),
  valid_from timestamptz not null default now(),
  expires_at timestamptz,
  walrus_namespace text not null,
  walrus_blob_id text,
  walrus_memory_id text,
  content_hash text not null,
  schema_version integer not null default 1 check (schema_version > 0),
  payload_index jsonb not null default '{}'::jsonb,
  anchor_observation_id uuid references public.chain_observations(id),
  supersedes_record_id uuid references public.memory_entries(id),
  verified_at timestamptz,
  created_by uuid not null,
  updated_at timestamptz not null default now(),
  check (expires_at is null or expires_at > valid_from)
);

create unique index memory_entries_workspace_blob_idx
  on public.memory_entries (workspace_id, walrus_blob_id)
  where walrus_blob_id is not null;
create index memory_entries_candidate_idx
  on public.memory_entries (workspace_id, record_type, scope, status, valid_from, expires_at);
create index memory_entries_workspace_created_idx
  on public.memory_entries (workspace_id, created_at desc);
create index memory_entries_supersedes_idx on public.memory_entries (workspace_id, supersedes_record_id);

create table public.memory_write_jobs (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  memory_entry_id uuid not null references public.memory_entries(id) on delete cascade,
  agent_type text not null check (agent_type in ('SCOUT', 'POLICY', 'SENTINEL', 'RUNNER')),
  provider_job_id text,
  idempotency_key text not null,
  status text not null default 'PENDING'
    check (status in ('PENDING', 'SUBMITTED', 'PROCESSING', 'VERIFIED_ACTIVE', 'FAILED', 'QUARANTINED')),
  attempt_count integer not null default 0 check (attempt_count >= 0),
  next_attempt_at timestamptz,
  last_error_code text,
  last_error_safe_message text,
  blob_id text,
  started_at timestamptz,
  completed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, idempotency_key)
);

create index memory_write_jobs_retry_idx on public.memory_write_jobs (status, next_attempt_at);
create index memory_write_jobs_workspace_idx on public.memory_write_jobs (workspace_id, created_at desc);

create table public.action_plans (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  created_by uuid not null,
  wallet_source_id uuid not null references public.wallet_sources(id),
  observation_id uuid not null references public.chain_observations(id),
  action_type text not null default 'SIMULATED_EXPOSURE' check (action_type = 'SIMULATED_EXPOSURE'),
  exposure_bps integer not null check (exposure_bps between 0 and 10000),
  amount_mist numeric(78, 0) not null check (amount_mist >= 0),
  rationale text,
  status text not null default 'DRAFT'
    check (status in ('DRAFT', 'READY_FOR_CHECK', 'CHECKING', 'APPROVED', 'REJECTED', 'ON_HOLD', 'EXPIRED')),
  canonical_plan jsonb not null,
  plan_hash text not null,
  rules_version text not null,
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index action_plans_status_idx on public.action_plans (workspace_id, status, created_at desc);
create index action_plans_hash_idx on public.action_plans (workspace_id, plan_hash);

create table public.decision_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  plan_id uuid not null references public.action_plans(id),
  verdict text not null check (verdict in ('APPROVE', 'REJECT', 'HOLD')),
  status text not null default 'REQUESTED'
    check (status in ('REQUESTED', 'EVIDENCE_LOADING', 'EVALUATED', 'VERDICT_MEMORY_PENDING', 'FINAL_APPROVED', 'FINAL_REJECTED', 'FINAL_HOLD')),
  reason_code text not null,
  explanation text not null,
  rules_version text not null,
  evaluator_version text not null,
  plan_hash text not null,
  evaluation_hash text not null,
  cited_record_ids uuid[] not null default '{}',
  cited_blob_ids text[] not null default '{}',
  verdict_memory_id uuid references public.memory_entries(id),
  requested_by uuid not null,
  created_at timestamptz not null default now(),
  finalized_at timestamptz
);

create index decision_records_workspace_idx on public.decision_records (workspace_id, created_at desc);
create index decision_records_plan_idx on public.decision_records (workspace_id, plan_id, created_at desc);

create table public.decision_evidence (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  decision_id uuid not null references public.decision_records(id) on delete cascade,
  memory_entry_id uuid not null references public.memory_entries(id),
  evidence_role text not null check (evidence_role in ('FACT', 'CONSTRAINT', 'PRIOR_VERDICT')),
  verification_status text not null check (verification_status in ('VERIFIED', 'MISSING', 'MISMATCH', 'STALE', 'QUARANTINED')),
  blob_id text,
  content_hash text,
  created_at timestamptz not null default now(),
  unique (decision_id, memory_entry_id)
);

create index decision_evidence_decision_idx on public.decision_evidence (workspace_id, decision_id);

create table public.execution_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  decision_id uuid not null unique references public.decision_records(id),
  plan_id uuid not null references public.action_plans(id),
  mode text not null default 'SIMULATION' check (mode = 'SIMULATION'),
  status text not null check (status in ('SIMULATED', 'BLOCKED', 'FAILED')),
  result jsonb not null default '{}'::jsonb,
  clearance_jti text unique,
  simulated_at timestamptz,
  created_at timestamptz not null default now()
);

create table public.audit_events (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_user_id uuid,
  actor_agent_id uuid references public.agent_identities(id),
  event_type text not null,
  resource_type text,
  resource_id uuid,
  correlation_id text,
  summary text not null,
  metadata_redacted jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index audit_events_workspace_idx on public.audit_events (workspace_id, created_at desc);
create index audit_events_type_idx on public.audit_events (workspace_id, event_type, created_at desc);

create table public.idempotency_records (
  id uuid primary key default gen_random_uuid(),
  workspace_id uuid not null references public.workspaces(id) on delete cascade,
  actor_id uuid not null,
  operation text not null,
  idempotency_key text not null,
  request_hash text not null,
  resource_id uuid,
  response_status integer,
  response_summary jsonb,
  status text not null default 'IN_PROGRESS' check (status in ('IN_PROGRESS', 'COMPLETED', 'FAILED')),
  expires_at timestamptz not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (workspace_id, actor_id, operation, idempotency_key)
);

create index idempotency_records_expiry_idx on public.idempotency_records (expires_at);

-- Shared updated_at trigger.
create function public.app_touch_updated_at()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger workspaces_touch_updated_at before update on public.workspaces
  for each row execute function public.app_touch_updated_at();
create trigger workspace_members_touch_updated_at before update on public.workspace_members
  for each row execute function public.app_touch_updated_at();
create trigger agent_identities_touch_updated_at before update on public.agent_identities
  for each row execute function public.app_touch_updated_at();
create trigger wallet_sources_touch_updated_at before update on public.wallet_sources
  for each row execute function public.app_touch_updated_at();
create trigger memory_entries_touch_updated_at before update on public.memory_entries
  for each row execute function public.app_touch_updated_at();
create trigger memory_write_jobs_touch_updated_at before update on public.memory_write_jobs
  for each row execute function public.app_touch_updated_at();
create trigger action_plans_touch_updated_at before update on public.action_plans
  for each row execute function public.app_touch_updated_at();
create trigger idempotency_records_touch_updated_at before update on public.idempotency_records
  for each row execute function public.app_touch_updated_at();

-- Request-scoped identity helpers. The app sets app.user_id inside a transaction.
create function public.app_current_user_id()
returns uuid
language sql
stable
set search_path = public, pg_temp
as $$
  select nullif(current_setting('app.user_id', true), '')::uuid;
$$;

create function public.app_is_workspace_member(p_workspace_id uuid)
returns boolean
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select exists (
    select 1
    from public.workspace_members m
    where m.workspace_id = p_workspace_id
      and m.user_id = public.app_current_user_id()
      and m.status = 'ACTIVE'
  );
$$;

create function public.app_workspace_role(p_workspace_id uuid)
returns text
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select m.role
  from public.workspace_members m
  where m.workspace_id = p_workspace_id
    and m.user_id = public.app_current_user_id()
    and m.status = 'ACTIVE'
  limit 1;
$$;

create function public.app_get_invitation(p_token_hash text)
returns table (
  workspace_id uuid,
  workspace_name text,
  email text,
  role text,
  expires_at timestamptz,
  accepted_at timestamptz
)
language sql
stable
security definer
set search_path = public, pg_temp
as $$
  select i.workspace_id, w.name, i.email, i.role, i.expires_at, i.accepted_at
  from public.workspace_invitations i
  join public.workspaces w on w.id = i.workspace_id
  where i.token_hash = p_token_hash
  limit 1;
$$;

create function public.app_create_workspace(
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
    (v_workspace_id, 'ANALYST', 'Analyst', '["draft_explanation"]'::jsonb),
    (v_workspace_id, 'SENTINEL', 'Sentinel', '["read_evidence","evaluate_plan","write_verdict"]'::jsonb),
    (v_workspace_id, 'RUNNER', 'Runner', '["simulate_execution"]'::jsonb);

  insert into public.audit_events (workspace_id, actor_user_id, event_type, resource_type, resource_id, summary)
  values (v_workspace_id, p_user_id, 'WORKSPACE_CREATED', 'WORKSPACE', v_workspace_id, 'Workspace created with owner membership.');

  return v_workspace_id;
end;
$$;

create function public.app_accept_invitation(
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
    (workspace_id, user_id, role, status, invited_by, invited_at, accepted_at)
  values
    (v_invitation.workspace_id, p_user_id, v_invitation.role, 'ACTIVE', v_invitation.created_by, v_invitation.created_at, now());

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

-- RLS: every workspace-owned table.
alter table public.workspaces enable row level security;
alter table public.workspace_members enable row level security;
alter table public.workspace_invitations enable row level security;
alter table public.agent_identities enable row level security;
alter table public.wallet_sources enable row level security;
alter table public.chain_observations enable row level security;
alter table public.memory_entries enable row level security;
alter table public.memory_write_jobs enable row level security;
alter table public.action_plans enable row level security;
alter table public.decision_records enable row level security;
alter table public.decision_evidence enable row level security;
alter table public.execution_records enable row level security;
alter table public.audit_events enable row level security;
alter table public.idempotency_records enable row level security;

create policy workspaces_select on public.workspaces for select
  using (public.app_is_workspace_member(id));
create policy workspaces_update on public.workspaces for update
  using (public.app_workspace_role(id) = 'OWNER')
  with check (public.app_workspace_role(id) = 'OWNER');

create policy workspace_members_select on public.workspace_members for select
  using (public.app_is_workspace_member(workspace_id) or user_id = public.app_current_user_id());
create policy workspace_members_update on public.workspace_members for update
  using (public.app_workspace_role(workspace_id) = 'OWNER')
  with check (public.app_workspace_role(workspace_id) = 'OWNER');

create policy workspace_invitations_select on public.workspace_invitations for select
  using (public.app_workspace_role(workspace_id) = 'OWNER');
create policy workspace_invitations_insert on public.workspace_invitations for insert
  with check (public.app_workspace_role(workspace_id) = 'OWNER' and created_by = public.app_current_user_id());
create policy workspace_invitations_update on public.workspace_invitations for update
  using (public.app_workspace_role(workspace_id) = 'OWNER')
  with check (public.app_workspace_role(workspace_id) = 'OWNER');

create policy agent_identities_select on public.agent_identities for select
  using (public.app_is_workspace_member(workspace_id));
create policy agent_identities_update on public.agent_identities for update
  using (public.app_workspace_role(workspace_id) = 'OWNER')
  with check (public.app_workspace_role(workspace_id) = 'OWNER');

create policy wallet_sources_select on public.wallet_sources for select
  using (public.app_is_workspace_member(workspace_id));
create policy wallet_sources_insert on public.wallet_sources for insert
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));
create policy wallet_sources_update on public.wallet_sources for update
  using (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'))
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));

create policy chain_observations_select on public.chain_observations for select
  using (public.app_is_workspace_member(workspace_id));
create policy chain_observations_insert on public.chain_observations for insert
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));

create policy memory_entries_select on public.memory_entries for select
  using (public.app_is_workspace_member(workspace_id));
create policy memory_entries_insert on public.memory_entries for insert
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));
create policy memory_entries_update on public.memory_entries for update
  using (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'))
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));

create policy memory_write_jobs_select on public.memory_write_jobs for select
  using (public.app_is_workspace_member(workspace_id));
create policy memory_write_jobs_insert on public.memory_write_jobs for insert
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));
create policy memory_write_jobs_update on public.memory_write_jobs for update
  using (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'))
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));

create policy action_plans_select on public.action_plans for select
  using (public.app_is_workspace_member(workspace_id));
create policy action_plans_insert on public.action_plans for insert
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));
create policy action_plans_update on public.action_plans for update
  using (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'))
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));

create policy decision_records_select on public.decision_records for select
  using (public.app_is_workspace_member(workspace_id));
create policy decision_records_insert on public.decision_records for insert
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));
create policy decision_records_update on public.decision_records for update
  using (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'))
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));

create policy decision_evidence_select on public.decision_evidence for select
  using (public.app_is_workspace_member(workspace_id));
create policy decision_evidence_insert on public.decision_evidence for insert
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));

create policy execution_records_select on public.execution_records for select
  using (public.app_is_workspace_member(workspace_id));
create policy execution_records_insert on public.execution_records for insert
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));

create policy audit_events_select on public.audit_events for select
  using (public.app_is_workspace_member(workspace_id));
create policy audit_events_insert on public.audit_events for insert
  with check (public.app_workspace_role(workspace_id) in ('OWNER', 'OPERATOR'));

create policy idempotency_records_select on public.idempotency_records for select
  using (actor_id = public.app_current_user_id() and public.app_is_workspace_member(workspace_id));
create policy idempotency_records_insert on public.idempotency_records for insert
  with check (actor_id = public.app_current_user_id() and public.app_is_workspace_member(workspace_id));
create policy idempotency_records_update on public.idempotency_records for update
  using (actor_id = public.app_current_user_id() and public.app_is_workspace_member(workspace_id))
  with check (actor_id = public.app_current_user_id() and public.app_is_workspace_member(workspace_id));

-- Privileges: application role can only reach public tables and approved functions.
grant usage on schema public to app_user;
grant select, insert, update, delete on all tables in schema public to app_user;

revoke update, delete on public.chain_observations from app_user;
revoke update, delete on public.decision_evidence from app_user;
revoke update, delete on public.execution_records from app_user;
revoke update, delete on public.audit_events from app_user;
revoke delete on public.workspaces from app_user;
revoke delete on public.workspace_members from app_user;
revoke delete on public.workspace_invitations from app_user;
revoke delete on public.memory_entries from app_user;
revoke delete on public.memory_write_jobs from app_user;
revoke delete on public.action_plans from app_user;
revoke delete on public.decision_records from app_user;

revoke all on function public.app_current_user_id() from public;
revoke all on function public.app_is_workspace_member(uuid) from public;
revoke all on function public.app_workspace_role(uuid) from public;
revoke all on function public.app_get_invitation(text) from public;
revoke all on function public.app_create_workspace(text, text, uuid) from public;
revoke all on function public.app_accept_invitation(text, uuid, text) from public;

grant execute on function public.app_current_user_id() to app_user;
grant execute on function public.app_is_workspace_member(uuid) to app_user;
grant execute on function public.app_workspace_role(uuid) to app_user;
grant execute on function public.app_get_invitation(text) to app_user;
grant execute on function public.app_create_workspace(text, text, uuid) to app_user;
grant execute on function public.app_accept_invitation(text, uuid, text) to app_user;

alter default privileges in schema public grant select, insert, update, delete on tables to app_user;
