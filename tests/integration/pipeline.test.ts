import { config as loadEnv } from "dotenv";
import { Client } from "pg";
import { afterAll, beforeAll, describe, expect, it } from "vitest";

import {
  ServiceError,
  createConstraint,
  createObservation,
  createPlan,
  evaluatePlanById,
  simulateDecision,
} from "@/lib/services/interlock";
import type { WorkspaceRole } from "@/lib/workspace";

loadEnv({ path: ".env.local", quiet: true });

const email = process.env.E2E_EMAIL;
const address = process.env.SUI_DEMO_ADDRESS;
const connectionString = process.env.DATABASE_URL_UNPOOLED;

describe.skipIf(!email || !address || !connectionString)("live Interlock decision pipeline", () => {
  const client = new Client({ connectionString, ssl: { rejectUnauthorized: true } });
  let actor: { userId: string; workspaceId: string; role: WorkspaceRole };

  beforeAll(async () => {
    await client.connect();
    const result = await client.query<{ user_id: string; workspace_id: string; role: WorkspaceRole }>(
      `select u.id as user_id, m.workspace_id, m.role
       from neon_auth."user" u
       join public.workspace_members m on m.user_id = u.id
       where lower(u.email) = lower($1) and m.status = 'ACTIVE'
       limit 1`,
      [email],
    );
    const row = result.rows[0];
    if (!row) throw new Error("No active workspace found for E2E_EMAIL.");
    actor = { userId: row.user_id, workspaceId: row.workspace_id, role: row.role };
  }, 30_000);

  afterAll(async () => {
    await client.end();
  });

  it(
    "writes verified Tatum/Walrus evidence and rejects a 15% plan against a 10% policy",
    async () => {
      const observation = await createObservation(actor, address!);
      expect(observation.balance.balanceMist).not.toBe("0");

      const constraint = await createConstraint(actor, {
        address: address!,
        maxExposureBps: 1000,
        description: "Synthetic Phase 3 policy: maximum simulated exposure is 10% of the verified balance.",
      });
      expect(constraint.blobId.length).toBeGreaterThan(10);

      const plan = await createPlan(actor, {
        observationId: observation.observationId,
        amountMist: "100000000",
        exposureBps: 1500,
        rationale: "Phase 3 synthetic 15% test plan.",
      });

      const decision = await evaluatePlanById(actor, plan.planId);
      expect(decision.verdict).toBe("REJECT");
      expect(decision.reasonCode).toBe("EXPOSURE_BPS_EXCEEDED");
      expect(decision.verdictMemory?.blobId).toBeTruthy();
      expect(decision.citedRecordIds).toContain(constraint.recordId);

      await expect(simulateDecision(actor, decision.decisionId)).rejects.toMatchObject({
        code: "NOT_APPROVED",
      } satisfies Partial<ServiceError>);
    },
    240_000,
  );

  it(
    "approves a compliant plan, simulates once, and blocks replay",
    async () => {
      // Re-observing refreshes the 300-second observation freshness window.
      const refreshed = await createObservation(actor, address!);
      const plan = await createPlan(actor, {
        observationId: refreshed.observationId,
        amountMist: "50000000",
        exposureBps: 500,
        rationale: "Phase 3 synthetic 5% compliant plan.",
      });
      const decision = await evaluatePlanById(actor, plan.planId);
      expect(decision.verdict).toBe("APPROVE");
      expect(decision.verdictMemory?.blobId).toBeTruthy();

      const first = await simulateDecision(actor, decision.decisionId);
      expect(first.mode).toBe("SIMULATION");

      await expect(simulateDecision(actor, decision.decisionId)).rejects.toMatchObject({
        code: "ALREADY_SIMULATED",
      } satisfies Partial<ServiceError>);
    },
    240_000,
  );

  it(
    "holds when the observation is stale",
    async () => {
      const observation = await createObservation(actor, address!);
      const plan = await createPlan(actor, {
        observationId: observation.observationId,
        amountMist: "50000000",
        exposureBps: 500,
        rationale: "Synthetic stale-observation HOLD test.",
      });

      await client.query("update public.chain_observations set observed_at = now() - interval '10 minutes' where id = $1", [
        observation.observationId,
      ]);
      await client.query("update public.action_plans set created_at = now() - interval '10 minutes' where id = $1", [
        plan.planId,
      ]);

      const decision = await evaluatePlanById(actor, plan.planId);
      expect(decision.verdict).toBe("HOLD");
      expect(["OBSERVATION_STALE", "PLAN_STALE"]).toContain(decision.reasonCode);
    },
    240_000,
  );
});
