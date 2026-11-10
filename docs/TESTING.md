# TESTING.md — Interlock Test Strategy

## Unit tests

Test pure domain logic without database/network:
- Canonical plan serialization and SHA-256 hash stability.
- Memory payload canonicalization/hash and versioned Zod schemas.
- Candidate applicability predicates (workspace, scope, type, validFrom, expiresAt, status).
- Exposure basis-point comparisons using BigInt/integer arithmetic.
- Decision semantics: verified violation→REJECT; all verified/satisfied→provisional APPROVE; missing/stale/conflicting/unverifiable evidence or missing policy→HOLD.
- Most restrictive policy handling and ambiguous conflict→HOLD.
- Plan/FACT/clearance expiry boundaries.
- Signed token claim binding and invalid signature/expiry/audience/nonce.
- Demo config guard rejects production baseline.
- Groq structured-output schema validation and deterministic fallback.

## Integration tests

### Database, roles and RLS

- Apply version-controlled migrations through `DATABASE_URL_UNPOOLED` (role `neondb_owner`) in a disposable preview/test Neon branch.
- Verify the application connection reports `current_user=app_user` and the role has `NOBYPASSRLS`.
- Negative test: application code cannot connect with or fall back to the migration URL.
- RLS enabled on every workspace-owned table; test SELECT/INSERT/UPDATE/DELETE cross-workspace denial.
- RLS context test: request-scoped `set_config('app.user_id', $1, true)` inside a transaction; missing/empty/invalid context denies.
- Assert policies do not depend on `auth.uid()` or Supabase-specific functions.
- Test workspace-membership join policies, including revoked/expired membership.
- Test that `app_user` does not own tables and cannot disable RLS or bypass policies.
- Test pooled-connection isolation: `app.user_id` from one request cannot leak into another request.
- Test migration idempotency/rollback in a disposable branch; do not run destructive tests against production.

### Authentication and authorization

- Neon Managed Better Auth session creation, expiry, refresh and sign-out.
- Cookie signature/tamper tests using `NEON_AUTH_COOKIE_SECRET`; invalid/tampered/expired session is rejected.
- Invite-only membership acceptance; duplicate invite; expired invite.
- Membership role checks on every route; Observer read-only; Owner-only policy mutations.
- Cross-tenant IDOR attempts through IDs, query parameters and request bodies.

### Providers and domain flows

- Tatum gRPC adapter: valid response parsing, auth error, timeout, rate limit, unexpected fields, invalid address, zero balance.
- Walrus adapter: pending job, completed job/blob ID, metadata listing, recall content, missing result, hash mismatch, namespace mismatch, SDK timeout and retry.
- Memory lifecycle: pending entry is not active; failed verification cannot be used by Sentinel.
- Decision persistence and evidence rows atomic.
- Clearance consumption + execution row atomic under concurrent requests.
- Idempotency same key/same body returns original result; same key/different body returns 409.
- Analyst Groq structured-output schema failures/timeouts do not impact policy correctness; deterministic fallback is used and never authorizes an action.

## End-to-end critical journeys

1. Invitee sign-in, workspace acceptance and role-based route protection.
2. Owner/operator triggers Scout and sees real Tatum observation.
3. FACT is written to Walrus and only marked active after successful verified recall.
4. Policy constraint is written and visible with evidence.
5. Operator creates a 15% plan; protected Sentinel returns REJECT citing 10% cap and FACT.
6. Click-through opens evidence details; blob ID/author/time/anchor match verified record.
7. Sentinel VERDICT is written to Walrus and appears in audit/memory view.
8. Same plan hash baseline simulation passes only in protected preview; Memory ON rejects.
9. A compliant plan with complete evidence is approved and simulated once.
10. Runner blocks REJECT, HOLD, expired approval, changed plan hash, wrong workspace, wrong decision, invalid signature and replay.
11. Observer is read-only; cross-tenant user cannot access any record.
12. Provider outage or missing recall displays HOLD/degraded state, never approval.
13. Production config guard rejects demo baseline or non-simulation execution mode at startup.

## Security tests

- IDOR/cross-workspace enumeration.
- Role escalation by modifying request body, headers or client state.
- RLS bypass attempts: application role, search path, table ownership, `SET ROLE`, function security, missing `app.user_id`.
- SQL injection/XSS payloads in notes, rationale, labels and memory content.
- CSRF/session misuse for mutating routes.
- SSRF attempt via supplied URLs (there must be no user-configurable provider URL).
- Brute-force and route rate limiting.
- Prompt injection in plan rationale/memory: Analyst cannot call tools; Sentinel treats content as data and validates schemas.
- Memory poisoning by unauthorized agent, wrong scope, malformed hash, replayed record or false anchor.
- Recall omission/partial candidates; all must HOLD.
- Clearance forgery/replay/concurrency.
- Secret scans and client bundle inspection; assert no Neon/Groq/Tatum/Walrus/signing secrets in `NEXT_PUBLIC_*` or client chunks.
- Demo endpoint and baseline feature disabled in production.

## Acceptance/test evidence

Every test command, environment and result must be recorded in `docs/BUILD_LOG.md`; failed tests include cause and retest evidence. Never mark tests passed if skipped. If external provider tests cannot run, label them blocked/not verified and do not claim core integration complete.

## Functionality gate before visual refinement

All MVP unit/integration tests pass, critical E2E journeys pass on protected preview, no critical/high functional or security issue remains, preview URL/deployed commit and known limitations are recorded, and production integrations remain disabled. Only then proceed to Phase 6 final visual refinement.
