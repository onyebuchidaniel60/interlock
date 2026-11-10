import { config as loadEnv } from "dotenv";
import { describe, expect, it } from "vitest";

import { getSuiBalance } from "@/lib/integrations/tatum";

loadEnv({ path: ".env.local", quiet: true });

const address = process.env.SUI_DEMO_ADDRESS;

describe.skipIf(!address)("Tatum mainnet gRPC", () => {
  it("reads a non-zero SUI balance with exact integer fields", async () => {
    const balance = await getSuiBalance(address!);
    expect(balance.provider).toBe("TATUM");
    expect(balance.method).toBe("StateService.GetBalance");
    expect(balance.network).toBe("MAINNET");
    expect(balance.balanceMist).toMatch(/^(0|[1-9][0-9]*)$/);
    expect(BigInt(balance.balanceMist)).toBeGreaterThan(0n);
    expect(balance.checkpoint).toBeNull();
    expect(balance.rawResponseHash).toMatch(/^[a-f0-9]{64}$/);
  }, 30_000);
});
