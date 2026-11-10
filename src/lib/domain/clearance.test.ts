import { describe, expect, it } from "vitest";

import { issueClearance, verifyClearance } from "@/lib/domain/clearance";

process.env.INTERLOCK_SIGNING_SECRET = "test-signing-secret-with-at-least-32-characters";

const input = {
  workspaceId: "11111111-1111-4111-8111-111111111111",
  decisionId: "22222222-2222-4222-8222-222222222222",
  planId: "33333333-3333-4333-8333-333333333333",
  planHash: "a".repeat(64),
};

describe("Runner clearance", () => {
  it("issues and verifies a simulation-only clearance", () => {
    const token = issueClearance(input);
    const claims = verifyClearance(token);
    expect(claims.workspaceId).toBe(input.workspaceId);
    expect(claims.decisionId).toBe(input.decisionId);
    expect(claims.mode).toBe("simulation");
    expect(claims.exp - claims.iat).toBeLessThanOrEqual(60);
  });

  it("rejects tampering", () => {
    const token = issueClearance(input);
    const parts = token.split(".");
    const tampered = `${parts[0]}.${parts[1]}.${"x".repeat(parts[2]?.length ?? 0)}`;
    expect(() => verifyClearance(tampered)).toThrow(/signature/);
  });

  it("rejects expiry", () => {
    const token = issueClearance(input);
    expect(() => verifyClearance(token, Math.floor(Date.now() / 1000) + 61)).toThrow(/expired/);
  });

  it("rejects a clearance for another plan", () => {
    const token = issueClearance(input);
    const claims = verifyClearance(token);
    expect(claims.planId).not.toBe("44444444-4444-4444-8444-444444444444");
  });
});
