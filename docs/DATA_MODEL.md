# DATA_MODEL.md — Interlock MVP Data Model

All tenant-owned rows include `workspace_id` and are protected by RLS. Use UUID primary keys unless a provider supplies an immutable opaque reference. Timestamps are UTC `timestamptz`. Use `numeric(78,0)` or validated integer text for atomic amounts; never floating point.

## Entity relationship overview

```text
Auth User
  |< workspace_members >| Workspaces
                         |-- agent_identities
                         |-- wallet_sources
                         |     |-- chain_observations
                         |             |-- memory_entries (FACT)
                         |-- memory_entries (CONSTRAINT / VERDICT / OUTCOME)
                         |-- memory_write_jobs
                         |-- action_plans
                         |     |-- decision_records
                         |             |-- decision_evidence
                         |             |-- execution_records
                         |-- audit_events
                         |-- idempotency_records
```

## Tables

### `workspaces`
- `id uuid PK`
- `name text NOT NULL`
- `slug text UNIQUE NOT NULL`
- `status text NOT NULL DEFAULT 'ACTIVE'` (`ACTIVE|SUSPENDED|DELETED_PENDING`)
- `settings jsonb NOT NULL DEFAULT '{}'` — only non-secret feature/rule defaults
- `created_by uuid FK auth.users`
- `created_at`, `updated_at timestamptz`
- Index: unique slug; status.
- Visibility: members only; secrets never stored here.

### `workspace_members`
- `id uuid PK`, `workspace_id uuid FK`, `user_id uuid FK auth.users`
- `role text NOT NULL` (`OWNER|OPERATOR|OBSERVER`)
- `status text NOT NULL` (`INVITED|ACTIVE|REVOKED`)
- `invited_by uuid`, `invited_at`, `accepted_at`, `created_at`, `updated_at`
- Unique `(workspace_id,user_id)`; index `(user_id,status)` and `(workspace_id,role,status)`.
- No cross-workspace visibility.

### `agent_identities`
- `id uuid PK`, `workspace_id uuid FK`
- `agent_type text NOT NULL` (`SCOUT|ANALYST|SENTINEL|RUNNER`)
- `display_name text`, `status text` (`ACTIVE|DISABLED`)
- `capabilities jsonb NOT NULL` — allowlisted capabilities only, no keys
- `walrus_agent_id text NULL` — provider identity reference, not secret
- `created_at`, `updated_at`
- Unique `(workspace_id,agent_type)`; index `(workspace_id,status)`.
- Visible to workspace members; secret keys never included.

### `wallet_sources`
- `id uuid PK`, `workspace_id uuid FK`
- `chain text NOT NULL DEFAULT 'SUI'`; `network text NOT NULL DEFAULT 'MAINNET'`
- `address text NOT NULL`; `coin_type text NOT NULL DEFAULT '0x2::sui::SUI'`
- `label text NULL`; `status text` (`ACTIVE|DISABLED`)
- `created_by uuid`, `created_at`, `updated_at`
- Unique `(workspace_id,network,address,coin_type)`; index `(workspace_id,status)`.
- Public address; no private keys/seed phrases.

### `chain_observations`
- `id uuid PK`, `workspace_id uuid FK`, `wallet_source_id uuid FK`
- `provider text NOT NULL` (`TATUM`); `method text NOT NULL`
- `chain text NOT NULL`; `network text NOT NULL`; `address text NOT NULL`; `coin_type text NOT NULL`
- `balance_mist numeric(78,0) NOT NULL`; optional `coin_balance_mist`, `address_balance_mist` if source returns them
- `observed_at timestamptz NOT NULL`; `received_at timestamptz NOT NULL`
- `provider_reference text NULL`; `checkpoint text NULL` only if provider returns one
- `raw_response_hash text NOT NULL`; `created_by uuid`; `created_at timestamptz`
- Index `(workspace_id,wallet_source_id,observed_at DESC)`; `(workspace_id,network,address,observed_at DESC)`.
- Sensitive-ish: workspace restricted; public chain values only. Raw responses should not be stored unless justified and redacted.

### `memory_entries`
- `id uuid PK` maps to canonical `recordId`; `workspace_id uuid FK`
- `record_type text NOT NULL` (`FACT|CONSTRAINT|VERDICT|OUTCOME`)
- `scope text NOT NULL`; `author_agent_id uuid FK agent_identities`
- `status text NOT NULL` (`DRAFT|PENDING_MEMORY|ACTIVE|SUPERSEDED|REVOKED|EXPIRED|QUARANTINED|FAILED`)
- `created_at timestamptz`; `valid_from timestamptz`; `expires_at timestamptz NULL`
- `walrus_namespace text`; `walrus_blob_id text NULL`; `walrus_memory_id text NULL`
- `content_hash text NOT NULL`; `schema_version integer NOT NULL`
- `payload_index jsonb NOT NULL` — minimal exact tags/fields needed for deterministic filter, never the sole authoritative content
- `anchor_observation_id uuid NULL FK chain_observations`; `supersedes_record_id uuid NULL FK memory_entries`
- `verified_at timestamptz NULL`; `created_by uuid`; `updated_at timestamptz`
- Unique `(workspace_id,id)`; unique `(workspace_id,walrus_blob_id)` when blob ID present; indexes `(workspace_id,record_type,scope,status,valid_from,expires_at)`, `(workspace_id,created_at DESC)`, `(workspace_id,supersedes_record_id)`.
- Canonical full record payload stored in Walrus; Postgres stores deterministic metadata/index and verified references.

### `memory_write_jobs`
- `id uuid PK`, `workspace_id uuid FK`, `memory_entry_id uuid FK`
- `agent_type text`; `provider_job_id text NULL`; `status text` (`PENDING|SUBMITTED|PROCESSING|VERIFIED_ACTIVE|FAILED|QUARANTINED`)
- `attempt_count integer DEFAULT 0`; `next_attempt_at timestamptz NULL`
- `last_error_code text NULL`; `last_error_safe_message text NULL`
- `blob_id text NULL`; `started_at`, `completed_at`, `created_at`, `updated_at`
- Unique idempotency key per workspace/memory purpose; index `(status,next_attempt_at)` and `(workspace_id,created_at DESC)`.
- Do not store delegated key or API key.

### `action_plans`
- `id uuid PK`, `workspace_id uuid FK`, `created_by uuid`
- `wallet_source_id uuid FK`, `observation_id uuid FK`
- `action_type text` (MVP `SIMULATED_EXPOSURE` only)
- `exposure_bps integer NOT NULL`; `amount_mist numeric(78,0) NOT NULL`
- `rationale text`; `status text` (`DRAFT|READY_FOR_CHECK|CHECKING|APPROVED|REJECTED|ON_HOLD|EXPIRED`)
- `canonical_plan jsonb NOT NULL`; `plan_hash text NOT NULL`; `rules_version text`
- `expires_at timestamptz NOT NULL`; `created_at`, `updated_at`
- Unique `(workspace_id,id)`; index `(workspace_id,status,created_at DESC)`, `(workspace_id,plan_hash)`.
- Immutable decision-relevant data after READY_FOR_CHECK; edits create a new plan.

### `decision_records`
- `id uuid PK`, `workspace_id uuid FK`, `plan_id uuid FK`
- `verdict text` (`APPROVE|REJECT|HOLD`); `status text` (`REQUESTED|EVIDENCE_LOADING|EVALUATED|VERDICT_MEMORY_PENDING|FINAL_APPROVED|FINAL_REJECTED|FINAL_HOLD`)
- `reason_code text`; `explanation text`; `rules_version text`; `evaluator_version text`
- `plan_hash text NOT NULL`; `evaluation_hash text NOT NULL`
- `cited_record_ids uuid[]` or normalized evidence table; `cited_blob_ids text[]` (normalized table preferred)
- `verdict_memory_id uuid NULL FK memory_entries`
- `requested_by uuid`; `created_at`, `finalized_at`
- Unique evaluation attempt key where needed; indexes `(workspace_id,created_at DESC)`, `(workspace_id,plan_id,created_at DESC)`.

### `decision_evidence`
- `id uuid PK`, `workspace_id uuid FK`, `decision_id uuid FK`, `memory_entry_id uuid FK`
- `evidence_role text` (`FACT|CONSTRAINT|PRIOR_VERDICT`)
- `verification_status text` (`VERIFIED|MISSING|MISMATCH|STALE|QUARANTINED`)
- `blob_id text`; `content_hash text`; `created_at timestamptz`
- Unique `(decision_id,memory_entry_id)`; index `(workspace_id,decision_id)`.
- Exact reference to what the verdict used; visible to workspace members.

### `execution_records`
- `id uuid PK`, `workspace_id uuid FK`, `decision_id uuid FK UNIQUE`, `plan_id uuid FK`
- `mode text NOT NULL DEFAULT 'SIMULATION'`; `status text` (`SIMULATED|BLOCKED|FAILED`)
- `result jsonb NOT NULL`; `clearance_jti text UNIQUE`; `simulated_at timestamptz`; `created_at timestamptz`
- No tx hash or real funds movement fields in MVP. Do not invent chain settlement.

### `audit_events`
- `id uuid PK`, `workspace_id uuid FK`, `actor_user_id uuid NULL`, `actor_agent_id uuid NULL`
- `event_type text NOT NULL`; `resource_type text`; `resource_id uuid`; `correlation_id text`
- `summary text`; `metadata_redacted jsonb`; `created_at timestamptz`
- Append-only for application roles; no edit/delete UI. Index `(workspace_id,created_at DESC)`, `(workspace_id,event_type,created_at DESC)`.

### `idempotency_records`
- `id uuid PK`, `workspace_id uuid FK`, `actor_id uuid`, `operation text`, `idempotency_key text`
- `request_hash text`; `resource_id uuid NULL`; `response_status integer NULL`; `response_summary jsonb NULL`
- `status text` (`IN_PROGRESS|COMPLETED|FAILED`); `expires_at timestamptz`; `created_at`, `updated_at`
- Unique `(workspace_id,actor_id,operation,idempotency_key)`; index `(expires_at)`.
- Store safe response summary only; do not persist secrets.

## Ownership and visibility

- User owns their auth identity; workspace owns all domain records.
- All workspace members can read product evidence and audit records according to policy.
- Owner has membership/configuration/policy mutation rights; Operator can trigger observation/plan/check/simulation; Observer is read-only.
- Integration keys and delegated secrets exist only in server secret storage.
- Never expose raw provider auth details, delegate keys, session tokens or private signing material.
- Do not expose another workspace's resource existence; use consistent 404/403 strategy.

## Migration and constraints guidance

- Enable RLS on all tables that contain `workspace_id`.
- Add composite foreign keys or trigger checks that ensure referenced records share the same workspace.
- Add immutable update/delete protections for memory payload references, plans after READY_FOR_CHECK, decisions, executions and audit events. State transitions may update status columns through service paths; preserve append-only history in audit events.
- Create partial indexes for active candidate memories and active memberships.
- Avoid storing full Walrus payload in `payload_index`; it exists only to filter and show useful summary tags.
