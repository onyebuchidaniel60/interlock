import { z } from "zod";

/**
 * Runtime environment guard.
 *
 * Phase 1 only needs the safety invariants that must never regress:
 * - production can never enable the memory-off demo baseline
 * - execution is always simulation in the MVP
 *
 * Missing values are safe local defaults. Invalid values fail closed.
 */
const runtimeSchema = z.object({
  INTERLOCK_ENVIRONMENT: z
    .enum(["development", "test", "preview", "production"])
    .default("development"),
  INTERLOCK_EXECUTION_MODE: z.enum(["simulation"]).default("simulation"),
  INTERLOCK_DEMO_BASELINE_ENABLED: z
    .enum(["true", "false"])
    .default("false")
    .transform((value) => value === "true"),
});

export type RuntimeConfig = z.infer<typeof runtimeSchema>;

export function readRuntimeConfig(
  env: Record<string, string | undefined> = process.env,
): RuntimeConfig {
  const parsed = runtimeSchema.safeParse(env);

  if (!parsed.success) {
    throw new Error(
      "Invalid Interlock runtime configuration. Refusing to start in an unsafe mode.",
    );
  }

  const config = parsed.data;

  if (config.INTERLOCK_ENVIRONMENT === "production" && config.INTERLOCK_DEMO_BASELINE_ENABLED) {
    throw new Error(
      "Unsafe configuration: INTERLOCK_DEMO_BASELINE_ENABLED must be false when INTERLOCK_ENVIRONMENT=production.",
    );
  }

  if (
    config.INTERLOCK_ENVIRONMENT === "production" &&
    config.INTERLOCK_EXECUTION_MODE !== "simulation"
  ) {
    throw new Error(
      "Unsafe configuration: INTERLOCK_EXECUTION_MODE must be simulation in the MVP, including production.",
    );
  }

  return config;
}
