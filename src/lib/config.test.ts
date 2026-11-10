import { describe, expect, it } from "vitest";

import { readRuntimeConfig } from "./config";

describe("runtime configuration guard", () => {
  it("defaults to a safe local simulation", () => {
    const config = readRuntimeConfig({});
    expect(config.INTERLOCK_ENVIRONMENT).toBe("development");
    expect(config.INTERLOCK_EXECUTION_MODE).toBe("simulation");
    expect(config.INTERLOCK_DEMO_BASELINE_ENABLED).toBe(false);
  });

  it("allows the preview baseline only in a non-production environment", () => {
    const config = readRuntimeConfig({
      INTERLOCK_ENVIRONMENT: "preview",
      INTERLOCK_EXECUTION_MODE: "simulation",
      INTERLOCK_DEMO_BASELINE_ENABLED: "true",
    });
    expect(config.INTERLOCK_DEMO_BASELINE_ENABLED).toBe(true);
  });

  it("rejects the demo baseline in production", () => {
    expect(() =>
      readRuntimeConfig({
        INTERLOCK_ENVIRONMENT: "production",
        INTERLOCK_EXECUTION_MODE: "simulation",
        INTERLOCK_DEMO_BASELINE_ENABLED: "true",
      }),
    ).toThrow(/must be false/);
  });

  it("rejects any non-simulation execution mode", () => {
    expect(() =>
      readRuntimeConfig({
        INTERLOCK_ENVIRONMENT: "preview",
        INTERLOCK_EXECUTION_MODE: "live",
        INTERLOCK_DEMO_BASELINE_ENABLED: "false",
      }),
    ).toThrow(/Invalid Interlock runtime configuration/);
  });
});
