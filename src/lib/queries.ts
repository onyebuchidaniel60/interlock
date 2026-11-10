import { withUser } from "@/lib/db";
import type { WorkspaceRole } from "@/lib/workspace";

export type ObservationRow = {
  id: string;
  address: string;
  label: string | null;
  coin_type: string;
  balance_mist: string;
  address_balance_mist: string | null;
  coin_balance_mist: string | null;
  observed_at: Date;
  provider: string;
  method: string;
};

export type MemoryRow = {
  id: string;
  record_type: string;
  scope: string;
  status: string;
  author_type: string;
  walrus_blob_id: string | null;
  content_hash: string;
  created_at: Date;
  verified_at: Date | null;
  payload_index: Record<string, unknown>;
};

export type PlanRow = {
  id: string;
  status: string;
  exposure_bps: number;
  amount_mist: string;
  plan_hash: string;
  created_at: Date;
  expires_at: Date;
  address: string;
  decision_id: string | null;
  decision_verdict: string | null;
  decision_status: string | null;
};

export type DecisionRow = {
  id: string;
  verdict: string;
  status: string;
  reason_code: string;
  explanation: string;
  plan_hash: string;
  evaluation_hash: string;
  cited_record_ids: string[];
  cited_blob_ids: string[];
  verdict_memory_id: string | null;
  finalized_at: Date | null;
  created_at: Date;
  plan_id: string;
  amount_mist: string;
  exposure_bps: number;
  address: string;
  execution_id: string | null;
  execution_status: string | null;
  execution_at: Date | null;
};

export type EvidenceRow = {
  memory_entry_id: string;
  evidence_role: string;
  verification_status: string;
  blob_id: string | null;
  content_hash: string | null;
  record_type: string;
  scope: string;
  status: string;
  author_type: string | null;
};

export async function getWorkspaceOverview(userId: string, workspaceId: string) {
  return withUser(userId, async (client) => {
    const counts = await client.query<{
      memories: number;
      policies: number;
      plans: number;
      decisions: number;
      holds: number;
      executions: number;
    }>(
      `select
        (select count(*)::int from public.memory_entries where workspace_id=$1 and status='ACTIVE') as memories,
        (select count(*)::int from public.memory_entries where workspace_id=$1 and record_type='CONSTRAINT' and status='ACTIVE') as policies,
        (select count(*)::int from public.action_plans where workspace_id=$1) as plans,
        (select count(*)::int from public.decision_records where workspace_id=$1) as decisions,
        (select count(*)::int from public.decision_records where workspace_id=$1 and verdict='HOLD') as holds,
        (select count(*)::int from public.execution_records where workspace_id=$1) as executions`,
      [workspaceId],
    );
    const recent = await client.query<{
      id: string;
      verdict: string;
      status: string;
      reason_code: string;
      created_at: Date;
      address: string;
      amount_mist: string;
    }>(
      `select d.id, d.verdict, d.status, d.reason_code, d.created_at, o.address, p.amount_mist
       from public.decision_records d
       join public.action_plans p on p.id=d.plan_id
       join public.chain_observations o on o.id=p.observation_id
       where d.workspace_id=$1
       order by d.created_at desc limit 5`,
      [workspaceId],
    );
    return { counts: counts.rows[0], recent: recent.rows };
  });
}

export async function listObservations(userId: string, workspaceId: string) {
  return withUser(userId, async (client) => {
    const result = await client.query<ObservationRow>(
      `select o.id, o.address, w.label, o.coin_type, o.balance_mist, o.address_balance_mist,
              o.coin_balance_mist, o.observed_at, o.provider, o.method
       from public.chain_observations o
       left join public.wallet_sources w on w.id=o.wallet_source_id
       where o.workspace_id=$1
       order by o.observed_at desc limit 50`,
      [workspaceId],
    );
    return result.rows;
  });
}

export async function listMemories(userId: string, workspaceId: string) {
  return withUser(userId, async (client) => {
    const result = await client.query<MemoryRow>(
      `select m.id, m.record_type, m.scope, m.status, a.agent_type as author_type,
              m.walrus_blob_id, m.content_hash, m.created_at, m.verified_at, m.payload_index
       from public.memory_entries m
       join public.agent_identities a on a.id=m.author_agent_id
       where m.workspace_id=$1
       order by m.created_at desc limit 100`,
      [workspaceId],
    );
    return result.rows;
  });
}

export async function listActiveConstraints(userId: string, workspaceId: string) {
  return withUser(userId, async (client) => {
    const result = await client.query<MemoryRow>(
      `select m.id, m.record_type, m.scope, m.status, a.agent_type as author_type,
              m.walrus_blob_id, m.content_hash, m.created_at, m.verified_at, m.payload_index
       from public.memory_entries m
       join public.agent_identities a on a.id=m.author_agent_id
       where m.workspace_id=$1 and m.record_type='CONSTRAINT' and m.status='ACTIVE'
       order by m.created_at desc limit 20`,
      [workspaceId],
    );
    return result.rows;
  });
}

export async function listPlans(userId: string, workspaceId: string) {
  return withUser(userId, async (client) => {
    const result = await client.query<PlanRow>(
      `select p.id, p.status, p.exposure_bps, p.amount_mist, p.plan_hash, p.created_at, p.expires_at,
              o.address,
              d.id as decision_id, d.verdict as decision_verdict, d.status as decision_status
       from public.action_plans p
       join public.chain_observations o on o.id=p.observation_id
       left join lateral (
         select id, verdict, status from public.decision_records
         where plan_id=p.id and workspace_id=p.workspace_id
         order by created_at desc limit 1
       ) d on true
       where p.workspace_id=$1
       order by p.created_at desc limit 50`,
      [workspaceId],
    );
    return result.rows;
  });
}

export async function getPlanDetail(userId: string, workspaceId: string, planId: string) {
  return withUser(userId, async (client) => {
    const plan = await client.query<{
      id: string;
      status: string;
      exposure_bps: number;
      amount_mist: string;
      plan_hash: string;
      created_at: Date;
      expires_at: Date;
      rationale: string | null;
      canonical_plan: Record<string, unknown>;
      address: string;
      observation_id: string;
      balance_mist: string;
      observed_at: Date;
    }>(
      `select p.id, p.status, p.exposure_bps, p.amount_mist, p.plan_hash, p.created_at, p.expires_at,
              p.rationale, p.canonical_plan, o.address, o.id as observation_id, o.balance_mist, o.observed_at
       from public.action_plans p
       join public.chain_observations o on o.id=p.observation_id
       where p.id=$1 and p.workspace_id=$2`,
      [planId, workspaceId],
    );
    if (!plan.rows[0]) return null;
    const decisions = await client.query<{ id: string; verdict: string; status: string; reason_code: string; created_at: Date }>(
      `select id, verdict, status, reason_code, created_at
       from public.decision_records
       where plan_id=$1 and workspace_id=$2
       order by created_at desc`,
      [planId, workspaceId],
    );
    return { plan: plan.rows[0], decisions: decisions.rows };
  });
}

export async function getDecisionDetail(userId: string, workspaceId: string, decisionId: string) {
  return withUser(userId, async (client) => {
    const decision = await client.query<DecisionRow>(
      `select d.id, d.verdict, d.status, d.reason_code, d.explanation, d.plan_hash, d.evaluation_hash,
              d.cited_record_ids, d.cited_blob_ids, d.verdict_memory_id, d.finalized_at, d.created_at,
              d.plan_id, p.amount_mist, p.exposure_bps, o.address,
              e.id as execution_id, e.status as execution_status, e.simulated_at as execution_at
       from public.decision_records d
       join public.action_plans p on p.id=d.plan_id
       join public.chain_observations o on o.id=p.observation_id
       left join public.execution_records e on e.decision_id=d.id
       where d.id=$1 and d.workspace_id=$2`,
      [decisionId, workspaceId],
    );
    if (!decision.rows[0]) return null;
    const evidence = await client.query<EvidenceRow>(
      `select de.memory_entry_id, de.evidence_role, de.verification_status, de.blob_id, de.content_hash,
              m.record_type, m.scope, m.status, a.agent_type as author_type
       from public.decision_evidence de
       join public.memory_entries m on m.id=de.memory_entry_id
       left join public.agent_identities a on a.id=m.author_agent_id
       where de.decision_id=$1 and de.workspace_id=$2
       order by de.created_at`,
      [decisionId, workspaceId],
    );
    return { decision: decision.rows[0], evidence: evidence.rows };
  });
}

export async function listAuditEvents(userId: string, workspaceId: string) {
  return withUser(userId, async (client) => {
    const result = await client.query<{
      id: string;
      event_type: string;
      resource_type: string | null;
      resource_id: string | null;
      summary: string;
      created_at: Date;
    }>(
      `select id, event_type, resource_type, resource_id, summary, created_at
       from public.audit_events
       where workspace_id=$1
       order by created_at desc limit 100`,
      [workspaceId],
    );
    return result.rows;
  });
}

export async function getWorkspaceMembersForView(userId: string, workspaceId: string) {
  return withUser(userId, async (client) => {
    const result = await client.query<{
      user_id: string;
      role: WorkspaceRole;
      status: string;
      email: string | null;
      display_name: string | null;
      created_at: Date;
      accepted_at: Date | null;
    }>(
      `select user_id, role, status, email, display_name, created_at, accepted_at
       from public.workspace_members where workspace_id=$1 order by created_at`,
      [workspaceId],
    );
    return result.rows;
  });
}
