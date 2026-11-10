import { createHmac, randomUUID, timingSafeEqual } from "node:crypto";

export type ClearanceClaims = {
  iss: "interlock-sentinel";
  aud: "interlock-runner";
  workspaceId: string;
  decisionId: string;
  planId: string;
  planHash: string;
  nonce: string;
  jti: string;
  iat: number;
  exp: number;
  mode: "simulation";
};

function b64url(value: string | Buffer) {
  return Buffer.from(value).toString("base64url");
}

function signature(input: string, secret: string) {
  return createHmac("sha256", secret).update(input).digest("base64url");
}

export function issueClearance(input: {
  workspaceId: string;
  decisionId: string;
  planId: string;
  planHash: string;
}): string {
  const secret = process.env.INTERLOCK_SIGNING_SECRET;
  if (!secret) throw new Error("INTERLOCK_SIGNING_SECRET is not configured.");
  const now = Math.floor(Date.now() / 1000);
  const claims: ClearanceClaims = {
    iss: "interlock-sentinel",
    aud: "interlock-runner",
    workspaceId: input.workspaceId,
    decisionId: input.decisionId,
    planId: input.planId,
    planHash: input.planHash,
    nonce: randomUUID(),
    jti: randomUUID(),
    iat: now,
    exp: now + 60,
    mode: "simulation",
  };
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const payload = b64url(JSON.stringify(claims));
  const signingInput = `${header}.${payload}`;
  return `${signingInput}.${signature(signingInput, secret)}`;
}

export function verifyClearance(token: string, nowSeconds = Math.floor(Date.now() / 1000)): ClearanceClaims {
  const secret = process.env.INTERLOCK_SIGNING_SECRET;
  if (!secret) throw new Error("INTERLOCK_SIGNING_SECRET is not configured.");
  const parts = token.split(".");
  if (parts.length !== 3) throw new Error("Invalid clearance token.");
  const [header, payload, supplied] = parts;
  if (!header || !payload || !supplied) throw new Error("Invalid clearance token.");
  const expected = signature(`${header}.${payload}`, secret);
  const suppliedBuffer = Buffer.from(supplied);
  const expectedBuffer = Buffer.from(expected);
  if (suppliedBuffer.length !== expectedBuffer.length || !timingSafeEqual(suppliedBuffer, expectedBuffer)) {
    throw new Error("Invalid clearance signature.");
  }

  let claims: ClearanceClaims;
  try {
    claims = JSON.parse(Buffer.from(payload, "base64url").toString("utf8")) as ClearanceClaims;
  } catch {
    throw new Error("Invalid clearance payload.");
  }

  if (claims.iss !== "interlock-sentinel" || claims.aud !== "interlock-runner" || claims.mode !== "simulation") {
    throw new Error("Invalid clearance claims.");
  }
  if (!claims.exp || claims.exp <= nowSeconds) throw new Error("Clearance expired.");
  if (!claims.iat || claims.iat > nowSeconds + 5) throw new Error("Invalid clearance issue time.");
  if (claims.exp - claims.iat > 60) throw new Error("Clearance lifetime exceeds 60 seconds.");
  return claims;
}
