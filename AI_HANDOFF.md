# AI_HANDOFF.md — Interlock Current State

## Current status

- Product: **Interlock** — one agent's verified memory can prevent another agent from executing a policy-violating action.
- Implementation phase: **Phase 9 complete for preview release; production release BLOCKED by missing separate production Neon/Walrus credentials and backup path.**
- Application: authenticated operations console with live Tatum, Walrus, Sentinel and Runner flows.
- Repository: `https://github.com/onyebuchidaniel60/interlock`, branch `main`.
- Phase 4: **`5c03b94`**; Phase 5: **`d141f0c`**; Phase 6: **`a8aa450`**; Phase 7: **`a609b8c`**; Phase 8: **`0fa8015`**; Phase 9 release commit: **`2ad6646`**; final phase marker: **`b6c0aba`**.
- Preview URL: **https://interlock-835nkre11-uhhh2.vercel.app**
- Deployed source commit: **`b6c0aba`**; target: preview.
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

## Phase 9 final verification

- `npm run typecheck` PASS; `npm run lint` PASS; `npm test` 14/14 PASS.
- `npm run test:integration` 6/6 PASS (RLS, live Tatum, live Walrus decision pipeline, replay block).
- Public shell E2E 10/10 PASS; authenticated live-data E2E 6/6 PASS; responsive authenticated pages 6/6 PASS at 390/768/1280.
- Live Memory OFF/ON comparison PASS on desktop (mobile skips live provider mutation).
- `npm run build` PASS.
- `npm audit --omit=dev` 0 vulnerabilities after upgrading `@grpc/grpc-js` to 1.14.7.
- Tracked-content secret scan clean across 158 text files.
- Security headers verified: nosniff, frame deny, strict referrer, restrictive permissions policy, no-store health.
- Preview remains Vercel Authentication protected; public requests 302 to SSO; `protectionBypass` empty.
- Demo video 109.36s, H.264/AAC, captions, Kokoro `af_bella`; playback/audio verified.

## Production release status

**BLOCKED — no production release performed.** The bounded authority allows a Vercel production deployment and production Neon migrations only after a separate production Neon project/branch, production Managed Auth configuration, production Walrus namespace (`interlock-prod`) and a verified backup/rollback path exist. None of those production credentials/configurations were provided; preview secrets/database must not be reused.

Minimum operator action: provide a separate production Neon project/branch connection URLs (`DATABASE_URL_UNPOOLED`/`DATABASE_URL_APP`), production Managed Better Auth env, verified backup/restore procedure, and confirm `interlock-prod` Walrus configuration. Then run migrations as `neondb_owner`, verify `app_user`/RLS, add production-only Vercel env, and deploy with `INTERLOCK_DEMO_BASELINE_ENABLED=false`.

## Phase 8 delivered

- `demo/interlock-demo.mp4`: 109.36s, 1280×800 H.264/AAC, burned captions.
- Kokoro ONNX 0.6.1 local TTS, voice `af_bella`; Piper fallback not needed.
- Real preview workspace/data captured with Playwright; no fabricated provider evidence.
- Redactions: synthetic workspace/email, truncated wallets, no secrets.
- Playback verified with ffprobe (video/audio duration match, audio levels present).
- Production notes, narration and reproducible scripts are in `demo/`.

## Phase 7 delivered

- README now documents the functional MVP, preview journeys, local commands, API, architecture and limitations.
- SETUP covers Neon roles, auth, migrations, first workspace and verification.
- DEPLOYMENT records the protected preview, env names, preview-only rules and Phase 9 production gate.
- TROUBLESHOOTING covers auth origin, RLS, migrations, Tatum/Walrus, Sentinel/Runner and Vercel.
- OPERATOR_GUIDE describes the actual observation → policy → plan → Sentinel → simulation flow.
- API documentation lists implemented endpoints and safe error envelopes.
- Repository structure records db/proto/tests and service boundaries.
- StageShow attempt and responsive decisions are in DESIGN_NOTES.

## Phase 5 delivered

- Preview-only Memory OFF/ON comparison using one immutable plan and observation.
- Same plan hash across both branches; baseline is explicitly illustrative and creates no decision/clearance.
- Protected branch writes real FACT/CONSTRAINT/VERDICT memories, REJECTS 15% vs 10%, and links the evidence panel.
- Live desktop E2E comparison passed; mobile project intentionally skips live provider mutation.
- Failure semantics covered by unit/integration tests: missing policy, stale observation, unverified evidence, cross-tenant denial, replay, plan hash.

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

## Next task — operator production inputs

Provide the production inputs listed above; otherwise the preview release is complete. After inputs arrive: apply migrations as `neondb_owner`, verify `app_user`/RLS, set production-only Vercel env, deploy production, smoke-test health/auth/readiness, verify public protection/domain policy, and record the release in AI_HANDOFF/BUILD_LOG.

## Known issues / limitations

- The Phase 4/5 UI uses the provisional visual system; reference-led refinement is Phase 6.
- The live demo comparison is preview-only and skips mobile provider mutation in tests.
- The Analyst path is optional and fallback-first; it is not on the critical decision path.
- No production deployment or production migration.
- Demo video/TTS is Phase 8.

## Authorization boundaries

- Preview only; Vercel Authentication; no custom domain.
- Production gated to Phase 9: Vercel production deploy and version-controlled Neon production migrations only after a verified backup/rollback path; separate Neon project/branch and `interlock-prod` Walrus namespace.
- No DNS, public marketing, production data import, real funds, custody, signing or transaction submission.
- Secrets remain server-only; `.env.local` is ignored; no secret values in docs/logs/client bundles.
