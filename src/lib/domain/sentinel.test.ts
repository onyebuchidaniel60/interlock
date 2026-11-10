import { describe, expect, it } from "vitest";

import { canonicalJson, hashCanonical } from "@/lib/domain/canonical";
import type { MemoryEnvelope } from "@/lib/domain/schemas";
import { evaluatePlan, type EvaluatorEvidence, type EvaluatorObservation, type EvaluatorPlan } from "@/lib/domain/sentinel";

const now = "2026-11-10T08:00:00.000Z";
const workspaceId = "11111111-1111-4111-8111-111111111111";
const planId = "22222222-2222-4222-8222-222222222222";
const observationId = "33333333-3333-4333-8333-333333333333";
const factId = "44444444-4444-4444-8444-444444444444";
const constraintId = "55555555-5555-4555-8555-555555555555";

const observation: EvaluatorObservation = {
  id: observationId,
  address: `0x${"a".repeat(64)}`,
  coinType: "0x2::sui::SUI",
  balanceMist: "1000000000",
  observedAt: "2026-11-10T07:59:50.000Z",
};

const fact: MemoryEnvelope = {
  schema: "interlock.memory.v1",
  recordId: factId,
  workspaceId,
  type: "FACT",
  scope: `wallet:${observation.address}`,
  author: "SCOUT",
  authorAgentId: "66666666-6666-4666-8666-666666666666",
  createdAt: now,
  validFrom: now,
  expiresAt: null,
  content: {
    kind: "FACT",
    metric: "sui_balance_mist",
    valueMist: "1000000000",
    address: observation.address,
    coinType: "0x2::sui::SUI",
    provider: "TATUM",
    network: "MAINNET",
    method: "StateService.GetBalance",
    observationId,
    observedAt: observation.observedAt,
  },
};

const constraint: MemoryEnvelope = {
  schema: "interlock.memory.v1",
  recordId: constraintId,
  workspaceId,
  type: "CONSTRAINT",
  scope: `wallet:${observation.address}`,
  author: "POLICY",
  authorAgentId: "77777777-7777-4777-8777-777777777777",
  createdAt: now,
  validFrom: now,
  expiresAt: null,
  content: {
    kind: "CONSTRAINT",
    rule: "MAX_EXPOSURE_BPS",
    metric: "sui_balance_mist",
    maxExposureBps: 1000,
    description: "Maximum simulated exposure is 10% of the verified balance.",
  },
};

const plan: EvaluatorPlan = {
  planId,
  workspaceId,
  walletSourceId: "88888888-8888-4888-8888-888888888888",
  observationId,
  amountMist: "150000000",
  exposureBps: 1500,
  scope: `wallet:${observation.address}`,
  planHash: hashCanonical({ planId }),
  createdAt: now,
  expiresAt: "2026-11-10T08:05:00.000Z",
  rulesVersion: "interlock-policy-v1",
};

const verified = (envelope: MemoryEnvelope, blobId: string): EvaluatorEvidence => ({
  envelope,
  blobId,
  verificationStatus: "VERIFIED",
});

describe("canonical JSON", () => {
  it("sorts object keys recursively and is stable", () => {
    expect(canonicalJson({ b: 2, a: { d: 4, c: 3 } })).toBe('{"a":{"c":3,"d":4},"b":2}');
    expect(hashCanonical({ b: 2, a: 1 })).toBe(hashCanonical({ a: 1, b: 2 }));
  });
});

describe("deterministic Sentinel", () => {
  it("rejects a 15% plan against a verified 10% policy", () => {
    const result = evaluatePlan({
      plan,
      observation,
      evidence: [verified(fact, "blob-fact"), verified(constraint, "blob-policy")],
      candidateSetComplete: true,
      now,
    });
    expect(result.verdict).toBe("REJECT");
    expect(result.reasonCode).toBe("EXPOSURE_BPS_EXCEEDED");
    expect(result.citedRecordIds).toContain(constraintId);
  });

  it("approves a compliant plan", () => {
    const result = evaluatePlan({
      plan: { ...plan, amountMist: "50000000", exposureBps: 500 },
      observation,
      evidence: [verified(fact, "blob-fact"), verified(constraint, "blob-policy")],
      candidateSetComplete: true,
      now,
    });
    expect(result.verdict).toBe("APPROVE");
    expect(result.reasonCode).toBe("POLICY_SATISFIED");
  });

  it("holds when no policy exists", () => {
    const result = evaluatePlan({
      plan,
      observation,
      evidence: [verified(fact, "blob-fact")],
      candidateSetComplete: true,
      now,
    });
    expect(result.verdict).toBe("HOLD");
    expect(result.reasonCode).toBe("NO_POLICY");
  });

  it("holds on a stale observation", () => {
    const result = evaluatePlan({
      plan,
      observation: { ...observation, observedAt: "2026-11-10T07:50:00.000Z" },
      evidence: [verified(fact, "blob-fact"), verified(constraint, "blob-policy")],
      candidateSetComplete: true,
      now,
    });
    expect(result.verdict).toBe("HOLD");
    expect(result.reasonCode).toBe("OBSERVATION_STALE");
  });

  it("holds when evidence is unverified", () => {
    const result = evaluatePlan({
      plan,
      observation,
      evidence: [{ ...verified(fact, "blob-fact"), verificationStatus: "MISMATCH" }, verified(constraint, "blob-policy")],
      candidateSetComplete: true,
      now,
    });
    expect(result.verdict).toBe("HOLD");
    expect(result.reasonCode).toBe("EVIDENCE_UNVERIFIED");
  });
});
