import { createHash, randomBytes } from "node:crypto";

export function createInviteToken() {
  return randomBytes(32).toString("base64url");
}

export function hashInviteToken(token: string) {
  return createHash("sha256").update(token, "utf8").digest("hex");
}

export function isInviteToken(value: unknown): value is string {
  return typeof value === "string" && /^[A-Za-z0-9_-]{32,128}$/.test(value);
}

export function isInvitationActive(expiresAt: Date | string, acceptedAt: Date | string | null) {
  return !acceptedAt && new Date(expiresAt).getTime() > Date.now();
}
