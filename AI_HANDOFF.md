# AI_HANDOFF.md — Interlock Current State

## Current status

- Product: **Interlock** — one agent's verified memory can prevent another agent from executing a policy-violating action.
- Implementation phase: **Production live on `https://interlock-recall.vercel.app`; simulation-only decision audit ready for submission.**
- Application: authenticated operations console with live Tatum, Walrus, Sentinel and Runner flows.
- Repository: `https://github.com/onyebuchidaniel60/interlock`, branch `main`.
- Phase 4: **`5c03b94`**; Phase 5: **`d141f0c`**; Phase 6: **`a8aa450`**; Phase 7: **`a609b8c`**; Phase 8: **`0fa8015`**; Phase 9 release: **`2ad6646`**; production landing/demo guard: **`11dac78`**; production deployment: **`626d9d1`**.
- Production URL: **https://interlock-recall.vercel.app**
- Production deployment ID: **`dpl_CQZGh8Q9FXrr731t2qHGwAafDy5e`**; source commit **`626d9d1`** (production alias follows latest deployment).
- Preview: `https://interlock-hud4jt7nr-uhhh2.vercel.app` (Vercel Authentication).
- Protection: production custom domain is public; preview remains Vercel Authentication. `/demo` returns **404** in production.
- Neon: production currently uses the provided preview `DATABASE_URL_APP` and `MEMWAL_NAMESPACE=interlock` per explicit operator finalization instruction; this is a shared synthetic data plane, not a separated production branch.
- Managed Better Auth: real sign-up/sign-in/sign-out, invite links, OWNER/OPERATOR/OBSERVER membership.
- Tatum: live funded balance observation (`1,212,098,830` MIST at Phase 3 re-check); no checkpoint/finality fabrication.
- Walrus Memory: signed FACT, CONSTRAINT and VERDICT writes verified by metadata + recall + SHA-256 + author.
- Sentinel: deterministic; 15% plan REJECTED against verified 10% policy; 5% plan APPROVED; missing evidence HOLDs.
- Runner: one simulation consumed; replay blocked by unique decision execution.
- Groq Analyst: adapter with deterministic fallback; no policy authority; not required for safety.
- Production: deployed; Vercel project renamed `interlock-recall`; production env uses `INTERLOCK_ENVIRONMENT=production`, `INTERLOCK_EXECUTION_MODE=simulation`, `INTERLOCK_DEMO_BASELINE_ENABLED=false` and a fresh signing secret.
- Budget: **$0 unapproved spend; free tiers only.**

## Submission-readiness finalization

- README restructured with a judge-facing one-paragraph summary and Quick Start click path. Production URL is `https://interlock-recall.vercel.app`; `interlock.vercel.app` remains an unrelated app and must not be submitted.
- UI pass applied StageShow restraint/hierarchy guidance: solid surfaces instead of decorative gradients, removed blur/shadow flourishes, calmer verdict typography with saturated color reserved for badges, constrained tables, intentional empty states, copyable evidence provenance and a Tatum anchor panel.
- Simulation messaging retained and restyled: persistent footer line, subtle `Execution: simulated · no funds move` chip at the Runner control, no removal of API/evidence/verdict labels.
- Login behavior exercised end to end: fresh login, reload persistence, logout, login again, cleared-session redirect, and invited OPERATOR account. No architecture-level auth quirk was found; no auth-model change made.
- Full finalization tests: 14 unit, 7 integration, 10 public shell, 6 authenticated live-data, 6 responsive, session checks and live Memory OFF/ON comparison. `npm audit --omit=dev` 0 vulnerabilities; secret scan clean; security headers verified.
- Demo video unchanged (approved): `demo/interlock-demo.mp4`, 109.36s.
- Production was deployed to Vercel project `interlock-recall`; `/demo` is 404; health reports production/simulation/baseline false. Public login is intermittently behind a Vercel Security Checkpoint from the automation IP (browser check required); the app login path itself passed before the challenge and is covered by local/authenticated E2E.

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

**Deployed.** Vercel project `interlock-recall`; production URL `https://interlock-recall.vercel.app`; deployment `dpl_CQZGh8Q9FXrr731t2qHGwAafDy5e`; `INTERLOCK_ENVIRONMENT=production`, `INTERLOCK_EXECUTION_MODE=simulation`, `INTERLOCK_DEMO_BASELINE_ENABLED=false`, fresh `INTERLOCK_SIGNING_SECRET`, `/demo` 404, public health reports healthy.

**Residual risks / operator notes:** production currently shares the provided preview Neon database and `interlock` Walrus namespace because the finalization instruction required the same `.env.local` values except the listed production flags. This is acceptable only for synthetic hackathon data; separate production Neon/Walrus isolation and a verified backup path are still required before real customer data. Vercel's bot checkpoint can challenge automated traffic; a human browser may need to complete the checkpoint.

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

## Next task — submission

Use `https://interlock-recall.vercel.app` as the submission URL. Do not use `interlock.vercel.app`. Optional post-hackathon hardening: separate production Neon branch and `interlock-prod` namespace, plus backup/restore verification.

## Known issues / limitations

- Production login can be challenged by Vercel Security Checkpoint for automated IPs; this is infrastructure bot mitigation, not an app regression.
- Production shares the preview Neon/`interlock` Walrus data plane per the finalization instruction; separate isolation is optional hardening before real data.
- `/demo` is intentionally 404 in production.
- No production migration was run (preview schema already exists).

## Authorization boundaries

- Preview only; Vercel Authentication; no custom domain.
- Production gated to Phase 9: Vercel production deploy and version-controlled Neon production migrations only after a verified backup/rollback path; separate Neon project/branch and `interlock-prod` Walrus namespace.
- No DNS, public marketing, production data import, real funds, custody, signing or transaction submission.
- Secrets remain server-only; `.env.local` is ignored; no secret values in docs/logs/client bundles.
