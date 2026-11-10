# AI_HANDOFF.md — Interlock Current State

## Current status

- Product: **Interlock** — one agent's verified memory can prevent another agent from executing a policy-violating action.
- Implementation phase: **Phase 4 complete — MVP journeys connected to the backend.**
- Application: authenticated operations console with live Tatum, Walrus, Sentinel and Runner flows.
- Repository: `https://github.com/onyebuchidaniel60/interlock`, branch `main`.
- Phase 4 commit: **`5c03b94`** (`feat: connect interlock MVP journeys to backend`).
- Preview URL: **https://interlock-qwhwpocpu-uhhh2.vercel.app**
- Deployed source commit: **`5c03b94`**; target: preview.
- Protection: **Vercel Authentication**; public requests `302` to Vercel SSO; automation bypass empty.
- Neon: preview database, `app_user` (`NOBYPASSRLS`) application queries, versioned migrations applied through `neondb_owner`.
- Managed Better Auth: real sign-up/sign-in/sign-out, invite links, OWNER/OPERATOR/OBSERVER membership.
- Tatum: live funded balance observation (`1,212,098,830` MIST at Phase 3 re-check); no checkpoint/finality fabrication.
- Walrus Memory: signed FACT, CONSTRAINT and VERDICT writes verified by metadata + recall + SHA-256 + author.
- Sentinel: deterministic; 15% plan REJECTED against verified 10% policy; 5% plan APPROVED; missing evidence HOLDs.
- Runner: one simulation consumed; replay blocked by unique decision execution.
- Groq Analyst: adapter with deterministic fallback; no policy authority; not required for safety.
- Production: not deployed; bounded Phase 9 release only.
- Budget: **$0 unapproved spend; free tiers only.**

## Phase 4 delivered

- `/observations`: live Scout form (public address → Tatum → Walrus FACT), observation history and active policies.
- `/settings`: owner policy creation (verified CONSTRAINT), active constraints, members, invites, runtime guard.
- `/plans`: real plan list with status/verdict/hash/amount/exposure.
- `/plans/new`: immutable plan form with observation selector, integer MIST, basis points and rationale.
- `/plans/[id]`: canonical payload, observation anchor, expiry and Sentinel evaluation action.
- `/decisions/[id]`: verdict, reason, plan/evaluation hashes, cited evidence with blob/hash/author, VERDICT memory reference, one-time simulation or execution state.
- `/dashboard`: real memory/policy/decision/execution counts and recent decisions.
- `/memory`: real memory ledger with type/status/author/scope/blob/hash.
- `/audit`: real append-only audit events.
- All mutations are server actions with server-verified workspace/role checks; no client verdict is trusted.
- Long-running observation/evaluation/simulation pages have `maxDuration=60`.

## Verification evidence

- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm test` — **14/14 PASS** (runtime guard, canonical hashing, Sentinel decisions, clearance signing/tamper/expiry).
- `npm run test:integration` — **6/6 PASS** across RLS, live Tatum, live pipeline (written/recalled Walrus evidence, REJECT, APPROVE, single simulation, replay block).
- `npm run test:e2e -- tests/e2e/shell.spec.ts` — **10/10 PASS** against a production build.
- `npm run test:e2e -- tests/e2e/auth.spec.ts` with local storage state — **6/6 PASS**:
  - real workspace/OWNER role
  - members, invite and policy controls
  - observations/memory/plans live data
  - decision detail citations and simulation state
  - primary navigation
  - `/api/readiness` proves session + membership + `app_user_rls`
- `npm run build` — PASS.
- Preview `/api/health` → `{"status":"ok","service":"interlock","phase":"4","mode":"simulation"}`.
- Public preview `/api/health` → `302` Vercel SSO.

## Product invariants retained

1. Walrus Memory mainnet is the memory system of record; Neon is the deterministic index.
2. Sentinel is deterministic; Groq/Analyst has zero policy authority.
3. Runner is simulation-only; no custody, signing, transactions or transfers.
4. Missing/stale/conflicting/unverifiable evidence or missing policy → HOLD.
5. Final APPROVE requires a completed, verified, recalled VERDICT memory.
6. Production startup fails if the demo baseline is enabled or execution mode is not simulation.
7. Runner clearance is HMAC-signed, 60 seconds max, plan/workspace/decision-bound and one-time via unique constraints.

## Next task — Phase 5

Complete the end-to-end safety and failure-path gate:

1. Add an automated E2E journey that runs the full operator flow against fresh state: observation → policy → 15% plan → REJECT citations → compliant plan → APPROVE → simulate once → replay blocked.
2. Add failure-path tests for missing policy HOLD, stale observation HOLD, unverified/missing memory HOLD, wrong workspace/role denial, and decision/plan mutation invalidation.
3. Verify the Memory OFF/ON demo comparison with the same plan hash and no fabricated evidence; restrict baseline to preview.
4. Exercise mobile/tablet/responsive layouts for all new data tables and forms.
5. Inspect and fix any visual/functional defects before Phase 6.
6. Update AI_HANDOFF/BUILD_LOG, commit `test: verify interlock end-to-end safety flows`, deploy preview, continue to Phase 6.

## Known issues / limitations

- The Phase 4 UI uses the provisional visual system; reference-led refinement is Phase 6.
- The demo comparison route is still a placeholder until Phase 5.
- The Analyst path is optional and fallback-first; it is not on the critical decision path.
- No production deployment or production migration.
- Demo video/TTS is Phase 8.

## Authorization boundaries

- Preview only; Vercel Authentication; no custom domain.
- Production gated to Phase 9: Vercel production deploy and version-controlled Neon production migrations only after a verified backup/rollback path; separate Neon project/branch and `interlock-prod` Walrus namespace.
- No DNS, public marketing, production data import, real funds, custody, signing or transaction submission.
- Secrets remain server-only; `.env.local` is ignored; no secret values in docs/logs/client bundles.
