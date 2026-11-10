import { randomUUID } from "node:crypto";
import type { PoolClient } from "pg";

import { hashCanonical } from "@/lib/domain/canonical";
import {
  CanonicalActionPlanSchema,
  MemoryEnvelopeSchema,
  type CanonicalActionPlan,
  type MemoryEnvelope,
  type Verdict,
  type VerdictContent,
} from "@/lib/domain/schemas";
import { evaluatePlan, RULES_VERSION, type EvaluatorEvidence, type SentinelOutput } from "@/lib/domain/sentinel";
import { issueClearance, verifyClearance } from "@/lib/domain/clearance";
import { getSuiBalance } from "@/lib/integrations/tatum";
import { recallVerifiedMemory, walrusNamespace, writeMemory } from "@/lib/integrations/walrus";
import { withUser } from "@/lib/db";
import type { WorkspaceRole } from "@/lib/workspace";

export class ServiceError extends Error {
  constructor(
    public code: string,
    message: string,
    public status = 400,
  ) {
    super(message);
  }
}

type Actor = { userId: string; workspaceId: string; role: WorkspaceRole };

type MemoryRow = {
  id: string;
  record_type: string;
  scope: string;
  walrus_blob_id: string;
  content_hash: string;
  anchor_observation_id: string | null;
  status: string;
};

type PlanRow = {
  id: string;
  workspace_id: string;
  wallet_source_id: string;
  observation_id: string;
  amount_mist: string;
  exposure_bps: number;
  plan_hash: string;
  rules_version: string;
  created_at: Date;
  expires_at: Date;
  status: string;
  address: string;
  coin_type: string;
  balance_mist: string;
  observed_at: Date;
};

type DecisionRow = {
  id: string;
  plan_id: string;
  plan_hash: string;
  verdict_memory_id: string | null;
  verdict_blob_id: string | null;
  verdict_hash: string | null;
  status: string;
  verdict: string;
  plan_status: string;
};

function assertCanWrite(role: WorkspaceRole) {
  if (role !== "OWNER" && role !== "OPERATOR") {
    throw new ServiceError("FORBIDDEN", "Owner or Operator permission is required.", 403);
  }
}

function assertOwner(role: WorkspaceRole) {
  if (role !== "OWNER") throw new ServiceError("FORBIDDEN", "Only the workspace owner can change policy.", 403);
}

async function getAgentId(client: PoolClient, workspaceId: string, type: string) {
  const result = await client.query<{ id: string }>(
    "select id from public.agent_identities where workspace_id = $1 and agent_type = $2 and status = 'ACTIVE'",
    [workspaceId, type],
  );
  const id = result.rows[0]?.id;
  if (!id) throw new ServiceError("AGENT_IDENTITY_MISSING", `The ${type} agent identity is missing.`, 500);
  return id;
}

async function insertPendingMemory(
  client: PoolClient,
  actor: Actor,
  envelope: MemoryEnvelope,
  anchorObservationId: string | null,
  payloadIndex: Record<string, unknown>,
) {
  const contentHash = hashCanonical(envelope);
  await client.query(
    `insert into public.memory_entries
      (id, workspace_id, record_type, scope, author_agent_id, status, created_at, valid_from, expires_at,
       walrus_namespace, content_hash, schema_version, payload_index, anchor_observation_id, created_by)
     values ($1,$2,$3,$4,$5,'PENDING_MEMORY',$6,$7,$8,$9,$10,$11,$12,$13,$14)`,
    [
      envelope.recordId,
      actor.workspaceId,
      envelope.type,
      envelope.scope,
      envelope.authorAgentId,
      envelope.createdAt,
      envelope.validFrom,
      envelope.expiresAt,
      walrusNamespace(),
      contentHash,
      envelope.schema === "interlock.memory.v1" ? 1 : 1,
      payloadIndex,
      anchorObservationId,
      actor.userId,
    ],
  );
  await client.query(
    `insert into public.memory_write_jobs
      (workspace_id, memory_entry_id, agent_type, idempotency_key, status)
     values ($1,$2,$3,$4,'PENDING')`,
    [actor.workspaceId, envelope.recordId, envelope.author, `${envelope.recordId}:INITIAL`],
  );
  return contentHash;
}

async function finalizeMemory(
  actor: Actor,
  envelope: MemoryEnvelope,
  evidence: { blobId: string; memoryId: string; payloadHash: string },
) {
  await withUser(actor.userId, async (client) => {
    const result = await client.query(
      `update public.memory_entries
       set status='ACTIVE', walrus_blob_id=$1, walrus_memory_id=$2, verified_at=now(), updated_at=now()
       where id=$3 and workspace_id=$4 and status='PENDING_MEMORY'`,
      [evidence.blobId, evidence.memoryId, envelope.recordId, actor.workspaceId],
    );
    if (result.rowCount !== 1) throw new ServiceError("MEMORY_NOT_PENDING", "Memory was not in a pending state.", 409);
    await client.query(
      `update public.memory_write_jobs
       set status='VERIFIED_ACTIVE', blob_id=$1, completed_at=now(), updated_at=now()
       where workspace_id=$2 and memory_entry_id=$3`,
      [evidence.blobId, actor.workspaceId, envelope.recordId],
    );
    await client.query(
      `insert into public.audit_events
        (workspace_id, actor_user_id, event_type, resource_type, resource_id, summary, metadata_redacted)
       values ($1,$2,'MEMORY_VERIFIED',$3,$4,'Walrus memory completed and verified.',$5)`,
      [
        actor.workspaceId,
        actor.userId,
        envelope.type,
        envelope.recordId,
        { blobId: evidence.blobId, contentHash: evidence.payloadHash, namespace: walrusNamespace() },
      ],
    );
  });
}

async function failMemory(actor: Actor, recordId: string, error: unknown) {
  const message = error instanceof Error ? error.message.slice(0, 240) : "Memory write failed.";
  await withUser(actor.userId, async (client) => {
    await client.query(
      `update public.memory_entries set status='FAILED', updated_at=now()
       where id=$1 and workspace_id=$2 and status='PENDING_MEMORY'`,
      [recordId, actor.workspaceId],
    );
    await client.query(
      `update public.memory_write_jobs set status='FAILED', last_error_code='WRITE_FAILED',
       last_error_safe_message=$1, updated_at=now()
       where workspace_id=$2 and memory_entry_id=$3`,
      [message, actor.workspaceId, recordId],
    );
    await client.query(
      `insert into public.audit_events
        (workspace_id, actor_user_id, event_type, resource_type, resource_id, summary, metadata_redacted)
       values ($1,$2,'MEMORY_FAILED',$3,$4,'Walrus memory write failed.',$5)`,
      [actor.workspaceId, actor.userId, "MEMORY", recordId, { reason: message }],
    );
  }).catch(() => {});
}

export async function createObservation(actor: Actor, address: string, label?: string) {
  assertCanWrite(actor.role);
  const balance = await getSuiBalance(address);
  const observedAt = new Date(balance.observedAt);
  const now = new Date();

  const result = await withUser(actor.userId, async (client) => {
    const agentId = await getAgentId(client, actor.workspaceId, "SCOUT");
    const wallet = await client.query<{ id: string }>(
      `insert into public.wallet_sources (workspace_id, address, coin_type, label, status, created_by)
       values ($1,$2,$3,$4,'ACTIVE',$5)
       on conflict (workspace_id, network, address, coin_type)
       do update set label = coalesce(excluded.label, public.wallet_sources.label), updated_at=now()
       returning id`,
      [actor.workspaceId, address, balance.coinType, label ?? null, actor.userId],
    );
    const walletSourceId = wallet.rows[0]?.id;
    if (!walletSourceId) throw new ServiceError("WALLET_SOURCE_FAILED", "Could not create the wallet source.", 500);

    const observation = await client.query<{ id: string }>(
      `insert into public.chain_observations
        (workspace_id, wallet_source_id, provider, method, chain, network, address, coin_type,
         balance_mist, coin_balance_mist, address_balance_mist, observed_at, received_at,
         provider_reference, checkpoint, raw_response_hash, created_by)
       values ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17)
       returning id`,
      [
        actor.workspaceId,
        walletSourceId,
        balance.provider,
        balance.method,
        balance.chain,
        balance.network,
        balance.address,
        balance.coinType,
        balance.balanceMist,
        balance.coinBalanceMist,
        balance.addressBalanceMist,
        balance.observedAt,
        balance.receivedAt,
        balance.providerReference,
        balance.checkpoint,
        balance.rawResponseHash,
        actor.userId,
      ],
    );
    const observationId = observation.rows[0]?.id;
    if (!observationId) throw new ServiceError("OBSERVATION_FAILED", "Could not persist the observation.", 500);

    const recordId = randomUUID();
    const envelope = MemoryEnvelopeSchema.parse({
      schema: "interlock.memory.v1",
      recordId,
      workspaceId: actor.workspaceId,
      type: "FACT",
      scope: `wallet:${address}`,
      author: "SCOUT",
      authorAgentId: agentId,
      createdAt: now.toISOString(),
      validFrom: now.toISOString(),
      expiresAt: new Date(observedAt.getTime() + 300_000).toISOString(),
      content: {
        kind: "FACT",
        metric: "sui_balance_mist",
        valueMist: balance.balanceMist,
        address,
        coinType: "0x2::sui::SUI",
        provider: "TATUM",
        network: "MAINNET",
        method: "StateService.GetBalance",
        observationId,
        observedAt: balance.observedAt,
      },
    });
    const contentHash = await insertPendingMemory(client, actor, envelope, observationId, {
      observationId,
      address,
      balanceMist: balance.balanceMist,
      observedAt: balance.observedAt,
    });

    return { observationId, walletSourceId, envelope, contentHash };
  });

  try {
    const evidence = await writeMemory("SCOUT", result.envelope);
    await finalizeMemory(actor, result.envelope, evidence);
    return {
      observationId: result.observationId,
      walletSourceId: result.walletSourceId,
      recordId: result.envelope.recordId,
      blobId: evidence.blobId,
      contentHash: result.contentHash,
      balance,
    };
  } catch (error) {
    await failMemory(actor, result.envelope.recordId, error);
    throw new ServiceError("MEMORY_WRITE_FAILED", "The FACT was persisted but Walrus verification failed.", 502);
  }
}

export async function createConstraint(actor: Actor, input: { address: string; maxExposureBps: number; description: string }) {
  assertOwner(actor.role);
  if (!/^0x[a-fA-F0-9]{64}$/.test(input.address)) {
    throw new ServiceError("INVALID_ADDRESS", "A public Sui address is required.", 400);
  }
  const now = new Date();
  const result = await withUser(actor.userId, async (client) => {
    const agentId = await getAgentId(client, actor.workspaceId, "POLICY");
    const envelope = MemoryEnvelopeSchema.parse({
      schema: "interlock.memory.v1",
      recordId: randomUUID(),
      workspaceId: actor.workspaceId,
      type: "CONSTRAINT",
      scope: `wallet:${input.address}`,
      author: "POLICY",
      authorAgentId: agentId,
      createdAt: now.toISOString(),
      validFrom: now.toISOString(),
      expiresAt: null,
      content: {
        kind: "CONSTRAINT",
        rule: "MAX_EXPOSURE_BPS",
        metric: "sui_balance_mist",
        maxExposureBps: input.maxExposureBps,
        description: input.description,
      },
    });
    const contentHash = await insertPendingMemory(client, actor, envelope, null, {
      address: input.address,
      rule: "MAX_EXPOSURE_BPS",
      maxExposureBps: input.maxExposureBps,
    });
    return { envelope, contentHash };
  });

  try {
    const evidence = await writeMemory("POLICY", result.envelope);
    await finalizeMemory(actor, result.envelope, evidence);
    return { recordId: result.envelope.recordId, blobId: evidence.blobId, contentHash: result.contentHash };
  } catch (error) {
    await failMemory(actor, result.envelope.recordId, error);
    throw new ServiceError("MEMORY_WRITE_FAILED", "The constraint was persisted but Walrus verification failed.", 502);
  }
}

export async function createPlan(
  actor: Actor,
  input: { observationId: string; amountMist: string; exposureBps: number; rationale?: string },
): Promise<{ planId: string; planHash: string }> {
  assertCanWrite(actor.role);
  if (!/^[1-9][0-9]*$/.test(input.amountMist)) {
    throw new ServiceError("INVALID_AMOUNT", "Amount must be a positive integer string.", 400);
  }
  const result = await withUser(actor.userId, async (client) => {
    const observation = await client.query<{
      id: string;
      wallet_source_id: string;
      address: string;
      balance_mist: string;
      observed_at: Date;
    }>(
      `select id, wallet_source_id, address, balance_mist, observed_at
       from public.chain_observations
       where id=$1 and workspace_id=$2`,
      [input.observationId, actor.workspaceId],
    );
    const row = observation.rows[0];
    if (!row) throw new ServiceError("OBSERVATION_NOT_FOUND", "Observation not found.", 404);
    if (Date.now() - new Date(row.observed_at).getTime() > 300_000) {
      throw new ServiceError("OBSERVATION_STALE", "Observation is older than 300 seconds.", 409);
    }
    if (BigInt(row.balance_mist) === 0n) {
      throw new ServiceError("ZERO_BALANCE", "A zero balance cannot support an exposure plan.", 409);
    }

    const planId = randomUUID();
    const createdAt = new Date();
    const expiresAt = new Date(createdAt.getTime() + 300_000);
    const plan: CanonicalActionPlan = CanonicalActionPlanSchema.parse({
      schema: "interlock.plan.v1",
      workspaceId: actor.workspaceId,
      planId,
      walletSourceId: row.wallet_source_id,
      observationId: row.id,
      actionType: "SIMULATED_EXPOSURE",
      amountMist: input.amountMist,
      exposureBps: input.exposureBps,
      scope: `wallet:${row.address}`,
      createdAt: createdAt.toISOString(),
      expiresAt: expiresAt.toISOString(),
      rulesVersion: RULES_VERSION,
    });
    const planHash = hashCanonical(plan);
    await client.query(
      `insert into public.action_plans
        (id, workspace_id, created_by, wallet_source_id, observation_id, action_type, exposure_bps,
         amount_mist, rationale, status, canonical_plan, plan_hash, rules_version, expires_at)
       values ($1,$2,$3,$4,$5,'SIMULATED_EXPOSURE',$6,$7,$8,'READY_FOR_CHECK',$9,$10,$11,$12)`,
      [
        planId,
        actor.workspaceId,
        actor.userId,
        row.wallet_source_id,
        row.id,
        input.exposureBps,
        input.amountMist,
        input.rationale ?? null,
        plan,
        planHash,
        RULES_VERSION,
        expiresAt.toISOString(),
      ],
    );
    await client.query(
      `insert into public.audit_events
        (workspace_id, actor_user_id, event_type, resource_type, resource_id, summary, metadata_redacted)
       values ($1,$2,'PLAN_CREATED','ACTION_PLAN',$3,'Immutable simulated action plan created.',$4)`,
      [actor.workspaceId, actor.userId, planId, { planHash, exposureBps: input.exposureBps, amountMist: input.amountMist }],
    );
    return { planId, planHash };
  });
  return result;
}

async function writeVerdictMemory(actor: Actor, plan: PlanRow, output: SentinelOutput) {
  const now = new Date();
  const planScope = `wallet:${plan.address}`;
  const content: VerdictContent = {
    kind: "VERDICT",
    planId: plan.id,
    planHash: plan.plan_hash,
    verdict: output.verdict,
    reasonCode: output.reasonCode,
    explanation: output.explanation,
    citedRecordIds: output.citedRecordIds,
    citedBlobIds: output.citedBlobIds,
    rulesVersion: plan.rules_version,
    evaluatorVersion: "sentinel-v1",
    evaluatedAt: now.toISOString(),
    evaluationHash: output.evaluationHash,
  };

  const result = await withUser(actor.userId, async (client) => {
    const agentId = await getAgentId(client, actor.workspaceId, "SENTINEL");
    const envelope = MemoryEnvelopeSchema.parse({
      schema: "interlock.memory.v1",
      recordId: randomUUID(),
      workspaceId: actor.workspaceId,
      type: "VERDICT",
      scope: planScope,
      author: "SENTINEL",
      authorAgentId: agentId,
      createdAt: now.toISOString(),
      validFrom: now.toISOString(),
      expiresAt: null,
      content,
    });
    const contentHash = await insertPendingMemory(client, actor, envelope, null, {
      planId: plan.id,
      verdict: output.verdict,
      reasonCode: output.reasonCode,
      planHash: plan.plan_hash,
    });
    return { envelope, contentHash };
  });

  try {
    const evidenceOut = await writeMemory("SENTINEL", result.envelope);
    await finalizeMemory(actor, result.envelope, evidenceOut);
    return { recordId: result.envelope.recordId, blobId: evidenceOut.blobId, contentHash: result.contentHash };
  } catch (error) {
    await failMemory(actor, result.envelope.recordId, error);
    throw new ServiceError("VERDICT_MEMORY_FAILED", "The VERDICT memory could not be verified.", 502);
  }
}

export async function evaluatePlanById(actor: Actor, planId: string) {
  assertCanWrite(actor.role);
  const planResult = await withUser(actor.userId, async (client) => {
    const plan = await client.query<PlanRow>(
      `select p.*, o.address, o.coin_type, o.balance_mist, o.observed_at
       from public.action_plans p
       join public.chain_observations o on o.id = p.observation_id
       where p.id=$1 and p.workspace_id=$2`,
      [planId, actor.workspaceId],
    );
    return plan.rows[0];
  });
  if (!planResult) throw new ServiceError("PLAN_NOT_FOUND", "Plan not found.", 404);

  const expected = await withUser(actor.userId, async (client) => {
    const planScope = `wallet:${planResult.address}`;
    const result = await client.query<MemoryRow>(
      `select id, record_type, scope, walrus_blob_id, content_hash, anchor_observation_id, status
       from public.memory_entries
       where workspace_id=$1 and status='ACTIVE'
         and valid_from <= now()
         and (expires_at is null or expires_at > now())
         and (
           (record_type='CONSTRAINT' and scope=$2) or
           (record_type='FACT' and anchor_observation_id=$3)
         )
       order by id
       limit 91`,
      [actor.workspaceId, planScope, planResult.observation_id],
    );
    return result.rows;
  });

  const candidateSetComplete = expected.length <= 90;
  const evaluatorEvidence: EvaluatorEvidence[] = [];
  const evidenceRows: Array<{ memory: MemoryRow; status: string }> = [];

  for (const memory of expected) {
    if (!memory.walrus_blob_id) {
      evidenceRows.push({ memory, status: "MISSING" });
      continue;
    }
    const verified = await recallVerifiedMemory("SENTINEL", {
      recordId: memory.id,
      blobId: memory.walrus_blob_id,
      contentHash: memory.content_hash,
    });
    if (!verified || verified.workspaceId !== actor.workspaceId || verified.scope !== memory.scope) {
      evidenceRows.push({ memory, status: "MISMATCH" });
      continue;
    }
    evaluatorEvidence.push({ envelope: verified, blobId: memory.walrus_blob_id, verificationStatus: "VERIFIED" });
    evidenceRows.push({ memory, status: "VERIFIED" });
  }

  const anyMissing = evidenceRows.some((row) => row.status !== "VERIFIED");
  const now = new Date().toISOString();
  const output: SentinelOutput = anyMissing
    ? {
        verdict: "HOLD" as Verdict,
        reasonCode: "EVIDENCE_UNVERIFIED",
        explanation: "At least one required Walrus record could not be recalled and verified.",
        citedRecordIds: [],
        citedBlobIds: [],
        evaluationHash: hashCanonical({ planHash: planResult.plan_hash, reason: "EVIDENCE_UNVERIFIED", now }),
      }
    : evaluatePlan({
        plan: {
          planId: planResult.id,
          workspaceId: planResult.workspace_id,
          walletSourceId: planResult.wallet_source_id,
          observationId: planResult.observation_id,
          amountMist: String(planResult.amount_mist),
          exposureBps: planResult.exposure_bps,
          scope: `wallet:${planResult.address}`,
          planHash: planResult.plan_hash,
          createdAt: new Date(planResult.created_at).toISOString(),
          expiresAt: new Date(planResult.expires_at).toISOString(),
          rulesVersion: planResult.rules_version,
        },
        observation: {
          id: planResult.observation_id,
          address: planResult.address,
          coinType: "0x2::sui::SUI",
          balanceMist: String(planResult.balance_mist),
          observedAt: new Date(planResult.observed_at).toISOString(),
        },
        evidence: evaluatorEvidence,
        candidateSetComplete: candidateSetComplete && !anyMissing,
        now,
      });

  const decisionId = randomUUID();
  await withUser(actor.userId, async (client) => {
    await client.query(
      `insert into public.decision_records
        (id, workspace_id, plan_id, verdict, status, reason_code, explanation, rules_version, evaluator_version,
         plan_hash, evaluation_hash, cited_record_ids, cited_blob_ids, requested_by)
       values ($1,$2,$3,$4,'VERDICT_MEMORY_PENDING',$5,$6,$7,'sentinel-v1',$8,$9,$10,$11,$12)`,
      [
        decisionId,
        actor.workspaceId,
        planId,
        output.verdict,
        output.reasonCode,
        output.explanation,
        planResult.rules_version,
        planResult.plan_hash,
        output.evaluationHash,
        output.citedRecordIds,
        output.citedBlobIds,
        actor.userId,
      ],
    );
    for (const row of evidenceRows) {
      await client.query(
        `insert into public.decision_evidence
          (workspace_id, decision_id, memory_entry_id, evidence_role, verification_status, blob_id, content_hash)
         values ($1,$2,$3,$4,$5,$6,$7)
         on conflict (decision_id, memory_entry_id) do nothing`,
        [
          actor.workspaceId,
          decisionId,
          row.memory.id,
          row.memory.record_type,
          row.status,
          row.memory.walrus_blob_id,
          row.memory.content_hash,
        ],
      );
    }
  });

  let verdictMemory: { recordId: string; blobId: string } | null = null;
  let finalVerdict = output.verdict;
  let finalStatus = output.verdict === "APPROVE" ? "FINAL_APPROVED" : output.verdict === "REJECT" ? "FINAL_REJECTED" : "FINAL_HOLD";
  let reasonCode = output.reasonCode;
  let explanation = output.explanation;

  try {
    verdictMemory = await writeVerdictMemory(actor, planResult, output);
  } catch {
    finalVerdict = "HOLD";
    finalStatus = "FINAL_HOLD";
    reasonCode = "VERDICT_MEMORY_FAILED";
    explanation = "The decision was held because its VERDICT memory could not be completed and verified.";
  }

  await withUser(actor.userId, async (client) => {
    await client.query(
      `update public.decision_records
       set verdict=$1, status=$2, reason_code=$3, explanation=$4, verdict_memory_id=$5, finalized_at=now()
       where id=$6 and workspace_id=$7`,
      [finalVerdict, finalStatus, reasonCode, explanation, verdictMemory?.recordId ?? null, decisionId, actor.workspaceId],
    );
    await client.query(
      `update public.action_plans set status=$1, updated_at=now() where id=$2 and workspace_id=$3`,
      [finalVerdict === "APPROVE" ? "APPROVED" : finalVerdict === "REJECT" ? "REJECTED" : "ON_HOLD", planId, actor.workspaceId],
    );
    await client.query(
      `insert into public.audit_events
        (workspace_id, actor_user_id, event_type, resource_type, resource_id, summary, metadata_redacted)
       values ($1,$2,'DECISION_FINALIZED','DECISION',$3,'Sentinel decision finalized.',$4)`,
      [
        actor.workspaceId,
        actor.userId,
        decisionId,
        { verdict: finalVerdict, reasonCode, planHash: planResult.plan_hash, verdictMemoryId: verdictMemory?.recordId ?? null },
      ],
    );
  });

  return {
    decisionId,
    verdict: finalVerdict,
    status: finalStatus,
    reasonCode,
    explanation,
    planHash: planResult.plan_hash,
    verdictMemory,
    citedRecordIds: output.citedRecordIds,
    citedBlobIds: output.citedBlobIds,
  };
}

export async function simulateDecision(actor: Actor, decisionId: string) {
  assertCanWrite(actor.role);
  const decision = await withUser(actor.userId, async (client) => {
    const result = await client.query<DecisionRow>(
      `select d.*, p.status as plan_status, m.walrus_blob_id as verdict_blob_id, m.content_hash as verdict_hash
       from public.decision_records d
       join public.action_plans p on p.id=d.plan_id
       left join public.memory_entries m on m.id=d.verdict_memory_id
       where d.id=$1 and d.workspace_id=$2`,
      [decisionId, actor.workspaceId],
    );
    return result.rows[0];
  });
  if (!decision) throw new ServiceError("DECISION_NOT_FOUND", "Decision not found.", 404);
  if (decision.status !== "FINAL_APPROVED" || decision.verdict !== "APPROVE") {
    throw new ServiceError("NOT_APPROVED", "Only a final approved decision can be simulated.", 409);
  }
  if (!decision.verdict_memory_id || !decision.verdict_blob_id || !decision.verdict_hash) {
    throw new ServiceError("VERDICT_MEMORY_MISSING", "The approval has no verified VERDICT memory.", 409);
  }

  const verdictMemory = await recallVerifiedMemory("SENTINEL", {
    recordId: decision.verdict_memory_id,
    blobId: decision.verdict_blob_id,
    contentHash: decision.verdict_hash,
  });
  if (!verdictMemory || verdictMemory.type !== "VERDICT") {
    throw new ServiceError("VERDICT_MEMORY_UNVERIFIED", "The approval VERDICT memory could not be recalled.", 409);
  }

  const token = issueClearance({
    workspaceId: actor.workspaceId,
    decisionId,
    planId: decision.plan_id,
    planHash: decision.plan_hash,
  });
  const claims = verifyClearance(token);
  const simulatedAt = new Date().toISOString();

  let execution: string | undefined;
  try {
    execution = await withUser(actor.userId, async (client) => {
      const result = await client.query<{ id: string }>(
        `insert into public.execution_records
          (workspace_id, decision_id, plan_id, mode, status, result, clearance_jti, simulated_at)
         values ($1,$2,$3,'SIMULATION','SIMULATED',$4,$5,$6)
         returning id`,
        [
          actor.workspaceId,
          decisionId,
          decision.plan_id,
          { planHash: decision.plan_hash, mode: "SIMULATION", verdict: "APPROVE", simulatedAt },
          claims.jti,
          simulatedAt,
        ],
      );
      await client.query(
        `insert into public.audit_events
          (workspace_id, actor_user_id, event_type, resource_type, resource_id, summary, metadata_redacted)
         values ($1,$2,'SIMULATION_CONSUMED','EXECUTION',$3,'Runner simulated the approved action once.',$4)`,
        [actor.workspaceId, actor.userId, result.rows[0]?.id, { decisionId, planHash: decision.plan_hash }],
      );
      return result.rows[0]?.id;
    });
  } catch (error) {
    if (error && typeof error === "object" && "code" in error && error.code === "23505") {
      throw new ServiceError("ALREADY_SIMULATED", "This decision has already been simulated.", 409);
    }
    throw error;
  }
  if (!execution) throw new ServiceError("SIMULATION_FAILED", "The simulation record was not created.", 500);

  return { executionId: execution, decisionId, planHash: decision.plan_hash, simulatedAt, mode: "SIMULATION" as const };
}
