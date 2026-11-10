import { z } from "zod";

const isoDate = z.string().datetime({ offset: true });
const uuid = z.string().uuid();
const hash = z.string().regex(/^[a-f0-9]{64}$/, "Expected a SHA-256 hex digest.");
const integerString = z.string().regex(/^(0|[1-9][0-9]*)$/, "Expected an unsigned integer string.");
const suiAddress = z.string().regex(/^0x[a-fA-F0-9]{64}$/, "Expected a Sui address.");

export const MemoryTypeSchema = z.enum(["FACT", "CONSTRAINT", "VERDICT", "OUTCOME"]);
export type MemoryType = z.infer<typeof MemoryTypeSchema>;

export const AgentTypeSchema = z.enum(["SCOUT", "POLICY", "SENTINEL", "RUNNER"]);
export type AgentType = z.infer<typeof AgentTypeSchema>;

export const VerdictSchema = z.enum(["APPROVE", "REJECT", "HOLD"]);
export type Verdict = z.infer<typeof VerdictSchema>;

export const FactContentSchema = z
  .object({
    kind: z.literal("FACT"),
    metric: z.literal("sui_balance_mist"),
    valueMist: integerString,
    address: suiAddress,
    coinType: z.literal("0x2::sui::SUI"),
    provider: z.literal("TATUM"),
    network: z.literal("MAINNET"),
    method: z.literal("StateService.GetBalance"),
    observationId: uuid,
    observedAt: isoDate,
  })
  .strict();

export const ConstraintContentSchema = z
  .object({
    kind: z.literal("CONSTRAINT"),
    rule: z.literal("MAX_EXPOSURE_BPS"),
    metric: z.literal("sui_balance_mist"),
    maxExposureBps: z.number().int().min(0).max(10_000),
    description: z.string().min(1).max(300),
  })
  .strict();

export const VerdictContentSchema = z
  .object({
    kind: z.literal("VERDICT"),
    planId: uuid,
    planHash: hash,
    verdict: VerdictSchema,
    reasonCode: z.string().min(1).max(80),
    explanation: z.string().min(1).max(800),
    citedRecordIds: z.array(uuid).max(90),
    citedBlobIds: z.array(z.string().min(1).max(200)).max(90),
    rulesVersion: z.string().min(1).max(40),
    evaluatorVersion: z.string().min(1).max(40),
    evaluatedAt: isoDate,
    evaluationHash: hash,
  })
  .strict();

export const OutcomeContentSchema = z
  .object({
    kind: z.literal("OUTCOME"),
    decisionId: uuid,
    planId: uuid,
    mode: z.literal("SIMULATION"),
    status: z.literal("SIMULATED"),
    simulatedAt: isoDate,
  })
  .strict();

export const MemoryContentSchema = z.discriminatedUnion("kind", [
  FactContentSchema,
  ConstraintContentSchema,
  VerdictContentSchema,
  OutcomeContentSchema,
]);

export const MemoryEnvelopeSchema = z
  .object({
    schema: z.literal("interlock.memory.v1"),
    recordId: uuid,
    workspaceId: uuid,
    type: MemoryTypeSchema,
    scope: z.string().min(1).max(200),
    author: AgentTypeSchema,
    authorAgentId: uuid,
    createdAt: isoDate,
    validFrom: isoDate,
    expiresAt: isoDate.nullable(),
    content: MemoryContentSchema,
  })
  .strict()
  .superRefine((value, ctx) => {
    if (value.type !== value.content.kind) {
      ctx.addIssue({ code: "custom", message: "Envelope type must match content kind." });
    }
  });

export type MemoryEnvelope = z.infer<typeof MemoryEnvelopeSchema>;
export type FactContent = z.infer<typeof FactContentSchema>;
export type ConstraintContent = z.infer<typeof ConstraintContentSchema>;
export type VerdictContent = z.infer<typeof VerdictContentSchema>;
export type OutcomeContent = z.infer<typeof OutcomeContentSchema>;

export const CanonicalActionPlanSchema = z
  .object({
    schema: z.literal("interlock.plan.v1"),
    workspaceId: uuid,
    planId: uuid,
    walletSourceId: uuid,
    observationId: uuid,
    actionType: z.literal("SIMULATED_EXPOSURE"),
    amountMist: integerString,
    exposureBps: z.number().int().min(0).max(10_000),
    scope: z.string().min(1).max(200),
    createdAt: isoDate,
    expiresAt: isoDate,
    rulesVersion: z.string().min(1).max(40),
  })
  .strict();

export type CanonicalActionPlan = z.infer<typeof CanonicalActionPlanSchema>;

export const AnalystOutputSchema = z
  .object({
    summary: z.string().min(1).max(600),
    riskNotes: z.array(z.string().min(1).max(240)).max(5),
  })
  .strict();

export type AnalystOutput = z.infer<typeof AnalystOutputSchema>;

export const PlanInputSchema = z
  .object({
    observationId: z.string().uuid(),
    amountMist: z.string().regex(/^[1-9][0-9]*$/, "Amount must be a positive integer string."),
    exposureBps: z.number().int().min(1).max(10_000),
    rationale: z.string().max(1_000).optional(),
  })
  .strict();

export const ConstraintInputSchema = z
  .object({
    maxExposureBps: z.number().int().min(0).max(10_000),
    description: z.string().trim().min(1).max(300),
  })
  .strict();

export type PlanInput = z.infer<typeof PlanInputSchema>;
export type ConstraintInput = z.infer<typeof ConstraintInputSchema>;
