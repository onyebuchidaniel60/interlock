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

## Integration tests

- Supabase migrations, constraints and RLS for every tenant-owned table.
- Cross-workspace resource access blocked for SELECT/INSERT/UPDATE/DELETE.
- Supabase session and membership/role checks.
- Tatum gRPC adapter: valid response parsing, auth error, timeout, rate limit, unexpected fields, invalid address, zero balance.
- Walrus adapter: pending job, completed job/blob ID, metadata listing, recall content, missing result, hash mismatch, namespace mismatch, SDK timeout and retry.
- Memory lifecycle: pending entry is not active; failed verification cannot be used by Sentinel.
- Decision persistence and evidence rows atomic.
- Clearance consumption + execution row atomic under concurrent requests.
- Idempotency same key/same body returns original result; same key/different body returns 409.
- Analyst structured output schema failures/timeouts do not impact policy correctness.

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

## Security tests

- IDOR/cross-workspace enumeration.
- Role escalation by modifying request body, headers or client state.
- SQL injection/XSS payloads in notes, rationale, labels and memory content.
- CSRF/session misuse for mutating routes.
- SSRF attempt via supplied URLs (there must be no user-configurable provider URL).
- Brute-force and route rate limiting.
- Prompt injection in plan rationale/memory: Analyst cannot call tools; Sentinel treats content as data and validates schemas.
- Memory poisoning by unauthorized agent, wrong scope, malformed hash, replayed record or false anchor.
- Recall omission/partial candidates; all must HOLD.
- Clearance forgery/replay/concurrency.
- Secret scans and client bundle inspection.
- Demo endpoint and baseline feature disabled in production.

## Acceptance/test evidence

Every test command, environment and result must be recorded in `docs/BUILD_LOG.md`; failed tests include cause and retest evidence. Never mark tests passed if skipped. If external provider tests cannot run, label them blocked/not verified and do not claim core integration complete.

## Functionality gate before visual refinement

All MVP unit/integration tests pass, critical E2E journeys pass on protected preview, no critical/high functional or security issue remains, preview URL/deployed commit and known limitations are recorded, and production integrations remain disabled. Only then proceed to Phase 6 final visual refinement.
