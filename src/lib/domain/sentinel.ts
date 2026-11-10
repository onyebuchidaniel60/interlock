import { hashCanonical } from "@/lib/domain/canonical";
import type { MemoryEnvelope, Verdict } from "@/lib/domain/schemas";

export type EvaluatorPlan = {
  planId: string;
  workspaceId: string;
  walletSourceId: string;
  observationId: string;
  amountMist: string;
  exposureBps: number;
  scope: string;
  planHash: string;
  createdAt: string;
  expiresAt: string;
  rulesVersion: string;
};

export type EvaluatorObservation = {
  id: string;
  address: string;
  coinType: string;
  balanceMist: string;
  observedAt: string;
};

export type EvaluatorEvidence = {
  envelope: MemoryEnvelope;
  blobId: string;
  verificationStatus: "VERIFIED" | "MISSING" | "MISMATCH" | "STALE" | "QUARANTINED";
};

export type SentinelOutput = {
  verdict: Verdict;
  reasonCode: string;
  explanation: string;
  citedRecordIds: string[];
  citedBlobIds: string[];
  evaluationHash: string;
};

export const RULES_VERSION = "interlock-policy-v1";
export const OBSERVATION_MAX_AGE_MS = 300_000;
export const PLAN_MAX_AGE_MS = 300_000;

function hold(reasonCode: string, explanation: string): SentinelOutput {
  return {
    verdict: "HOLD",
    reasonCode,
    explanation,
    citedRecordIds: [],
    citedBlobIds: [],
    evaluationHash: hashCanonical({ verdict: "HOLD", reasonCode, explanation }),
  };
}

export function evaluatePlan(input: {
  plan: EvaluatorPlan;
  observation: EvaluatorObservation;
  evidence: EvaluatorEvidence[];
  candidateSetComplete: boolean;
  now: string;
}): SentinelOutput {
  const nowMs = new Date(input.now).getTime();
  const planCreated = new Date(input.plan.createdAt).getTime();
  const planExpires = new Date(input.plan.expiresAt).getTime();
  const observedAt = new Date(input.observation.observedAt).getTime();

  if (!input.candidateSetComplete) {
    return hold("CANDIDATE_SET_INCOMPLETE", "The deterministic candidate set could not be fully enumerated.");
  }

  if (input.observation.id !== input.plan.observationId) {
    return hold("OBSERVATION_MISMATCH", "The plan does not reference the supplied observation.");
  }

  if (!Number.isFinite(planCreated) || nowMs - planCreated > PLAN_MAX_AGE_MS || nowMs > planExpires) {
    return hold("PLAN_STALE", "The action plan has expired and must be recreated.");
  }

  if (!Number.isFinite(observedAt) || nowMs - observedAt > OBSERVATION_MAX_AGE_MS) {
    return hold("OBSERVATION_STALE", "The chain observation is older than the 300-second freshness window.");
  }

  if (input.observation.address.length === 0 || input.observation.coinType !== "0x2::sui::SUI") {
    return hold("OBSERVATION_INVALID", "The observation address or coin type is invalid.");
  }

  const unverified = input.evidence.find((item) => item.verificationStatus !== "VERIFIED");
  if (unverified) {
    return hold("EVIDENCE_UNVERIFIED", "At least one required Walrus memory could not be verified.");
  }

  const fact = input.evidence.find(
    (item) => item.envelope.type === "FACT" && item.envelope.content.kind === "FACT" && item.envelope.content.observationId === input.observation.id,
  );
  if (!fact || fact.envelope.content.kind !== "FACT") {
    return hold("MISSING_FACT", "The observation FACT is missing from the verified memory set.");
  }

  if (fact.envelope.content.valueMist !== input.observation.balanceMist) {
    return hold("FACT_MISMATCH", "The recalled FACT balance does not match the observation snapshot.");
  }

  const constraints = input.evidence.filter(
    (item) =>
      item.envelope.type === "CONSTRAINT" &&
      item.envelope.content.kind === "CONSTRAINT" &&
      item.envelope.content.rule === "MAX_EXPOSURE_BPS" &&
      item.envelope.content.metric === "sui_balance_mist",
  );
  if (constraints.length === 0) {
    return hold("NO_POLICY", "No applicable exposure policy was found. Missing policy is never implicit approval.");
  }

  const constraintContents = constraints
    .map((item) => item.envelope.content)
    .filter((content): content is Extract<typeof content, { kind: "CONSTRAINT" }> => content.kind === "CONSTRAINT");
  const strictest = constraintContents.reduce((min, current) =>
    current.maxExposureBps < min.maxExposureBps ? current : min,
  );
  const cited = [fact, ...constraints];
  const citedRecordIds = cited.map((item) => item.envelope.recordId);
  const citedBlobIds = cited.map((item) => item.blobId);
  const balance = BigInt(input.observation.balanceMist);
  const amount = BigInt(input.plan.amountMist);
  const maxAmount = (balance * BigInt(strictest.maxExposureBps)) / 10_000n;

  if (balance === 0n) {
    return hold("ZERO_BALANCE", "A zero balance cannot support a funded exposure plan.");
  }

  let verdict: Verdict = "APPROVE";
  let reasonCode = "POLICY_SATISFIED";
  let explanation = `The plan is within the ${strictest.maxExposureBps} bps policy limit and uses a fresh verified observation.`;

  if (input.plan.exposureBps > strictest.maxExposureBps) {
    verdict = "REJECT";
    reasonCode = "EXPOSURE_BPS_EXCEEDED";
    explanation = `The plan requests ${input.plan.exposureBps} bps, above the verified ${strictest.maxExposureBps} bps policy limit.`;
  } else if (amount > maxAmount) {
    verdict = "REJECT";
    reasonCode = "EXPOSURE_AMOUNT_EXCEEDED";
    explanation = `The plan amount exceeds the maximum ${maxAmount.toString()} MIST supported by the verified balance and policy.`;
  }

  return {
    verdict,
    reasonCode,
    explanation,
    citedRecordIds,
    citedBlobIds,
    evaluationHash: hashCanonical({
      planHash: input.plan.planHash,
      verdict,
      reasonCode,
      citedRecordIds,
      rulesVersion: input.plan.rulesVersion,
      now: input.now,
    }),
  };
}
