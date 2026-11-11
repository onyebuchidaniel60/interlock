import { config as loadEnv } from "dotenv";

import { withUser } from "../src/lib/db";
import {
  createConstraint,
  createObservation,
  createPlan,
  evaluatePlanById,
  simulateDecision,
} from "../src/lib/services/interlock";

loadEnv({ path: ".env.local", quiet: true });

const DEMO_EMAIL = "demo@interlock.dev";
const DEMO_PASSWORD = "InterlockDemo2026!";
const DEMO_NAME = "Interlock Demo";

const baseUrl = process.env.NEON_AUTH_BASE_URL?.replace(/\/$/, "");
const address = process.env.SUI_DEMO_ADDRESS;
if (!baseUrl || !address) throw new Error("NEON_AUTH_BASE_URL and SUI_DEMO_ADDRESS are required.");

const authOrigin = new URL(baseUrl).origin;
const demoAddress: string = address;

async function createOrSignInDemoUser() {
  const signUp = await fetch(`${baseUrl}/sign-up/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: authOrigin },
    body: JSON.stringify({ name: DEMO_NAME, email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });
  if (signUp.ok) {
    const body = (await signUp.json()) as { user?: { id?: string } };
    if (body.user?.id) return body.user.id;
  }

  const signIn = await fetch(`${baseUrl}/sign-in/email`, {
    method: "POST",
    headers: { "content-type": "application/json", origin: authOrigin },
    body: JSON.stringify({ email: DEMO_EMAIL, password: DEMO_PASSWORD }),
  });
  const body = (await signIn.json()) as { user?: { id?: string }; message?: string };
  if (!signIn.ok || !body.user?.id) {
    throw new Error(`Demo account setup failed: ${body.message ?? signIn.status}`);
  }
  return body.user.id;
}

async function main() {
const userId = await createOrSignInDemoUser();

const existing = await withUser(userId, async (client) => {
  const result = await client.query<{ workspace_id: string }>(
    `select workspace_id from public.workspace_members
     where user_id=$1 and status='ACTIVE' limit 1`,
    [userId],
  );
  return result.rows[0]?.workspace_id ?? null;
});

let workspaceId = existing;
if (!workspaceId) {
  workspaceId = await withUser(userId, async (client) => {
    const result = await client.query<{ id: string }>(
      "select public.app_create_workspace($1,$2,$3) as id",
      ["Interlock Demo Workspace", "interlock-demo", userId],
    );
    const id = result.rows[0]?.id;
    if (!id) throw new Error("Demo workspace creation failed.");
    await client.query(
      "update public.workspace_members set email=$1, display_name=$2 where workspace_id=$3 and user_id=$4",
      [DEMO_EMAIL, DEMO_NAME, id, userId],
    );
    return id;
  });
  console.log("created demo workspace", workspaceId);
} else {
  console.log("demo workspace already exists", workspaceId);
}

const actor = { userId, workspaceId, role: "OWNER" as const };
const counts = await withUser(userId, async (client) => {
  const result = await client.query<{ observation: number; policy: number; plan: number; decision: number }>(
    `select
      (select count(*)::int from public.chain_observations where workspace_id=$1) as observation,
      (select count(*)::int from public.memory_entries where workspace_id=$1 and record_type='CONSTRAINT' and status='ACTIVE') as policy,
      (select count(*)::int from public.action_plans where workspace_id=$1) as plan,
      (select count(*)::int from public.decision_records where workspace_id=$1) as decision`,
    [workspaceId],
  );
  return result.rows[0]!;
});

if (counts.observation === 0 || counts.policy === 0 || counts.plan === 0 || counts.decision === 0) {
  console.log("seeding demo evidence (this writes real Tatum/Walrus synthetic data)...");
  const observation = await createObservation(actor, demoAddress, "Judge demo wallet");
  await createConstraint(actor, {
    address: demoAddress,
    maxExposureBps: 1000,
    description: "Demo policy: maximum simulated exposure is 10% of the verified balance.",
  });

  const rejectPlan = await createPlan(actor, {
    observationId: observation.observationId,
    amountMist: "100000000",
    exposureBps: 1500,
    rationale: "Judge demo: 15% simulated exposure against a verified 10% policy.",
  });
  const reject = await evaluatePlanById(actor, rejectPlan.planId);
  console.log("seeded reject decision", reject.decisionId, reject.verdict);

  const approvePlan = await createPlan(actor, {
    observationId: observation.observationId,
    amountMist: "50000000",
    exposureBps: 500,
    rationale: "Judge demo: 5% compliant plan.",
  });
  const approve = await evaluatePlanById(actor, approvePlan.planId);
  console.log("seeded approve decision", approve.decisionId, approve.verdict);
  const execution = await simulateDecision(actor, approve.decisionId);
  console.log("seeded simulation", execution.executionId);
} else {
  console.log("demo evidence already present; skipping seed writes");
}

console.log(`DEMO_EMAIL=${DEMO_EMAIL}`);
console.log(`DEMO_PASSWORD=${DEMO_PASSWORD}`);
console.log(`DEMO_WORKSPACE_ID=${workspaceId}`);
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
