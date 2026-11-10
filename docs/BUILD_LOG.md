# BUILD_LOG.md — Implementation Evidence Log

## Blueprint handoff entry

- Date: 2026-11-10
- State: blueprint package authored; no application implementation performed.
- Repository: not selected/confirmed at handoff.
- Reference image: none supplied at handoff.
- Walrus/Tatum/Supabase/OpenAI/Vercel: not supplied or validated at handoff.
- Production authority: denied by default at handoff.

## Phase 0 — consolidated operator intake and readiness

```text
Date/time: 2026-11-10T05:07Z
Phase: Phase 0 — consolidated operator intake/readiness
Git commit: docs: complete interlock operator readiness (see git log -1)
Changes:
  - Recorded the consolidated operator reply in OPERATOR_INTAKE.md.
  - Confirmed target repo https://github.com/onyebuchidaniel60/interlock, branch main.
  - Recorded operator-authorized Supabase -> Neon and OpenAI -> Groq changes.
  - Recorded bounded production authority, $0 unapproved spend, data/demo/redaction/TTS/GitHub/legal rules.
  - Inspected four operator-owned reference images in design/reference/ and recorded paths, dimensions, SHA-256 and design observations.
  - Added .gitignore for env files, node_modules, .next, .vercel, coverage, logs and local artifacts.
  - Updated ARCHITECTURE.md, docs/CONFIGURATION.md, docs/TESTING.md and AI_HANDOFF.md for Neon/Groq.
  - Updated remaining affected docs to remove stale Supabase/OpenAI fixed-stack references.
  - No application code, scaffold, dependency install in the repository, database connection, deployment or provider call beyond the two authorized smoke tests.
Commands run:
  - git status --short --branch; git log --oneline
  - npm view @mysten-incubation/memwal version
  - npm install --no-audit --no-fund @mysten-incubation/memwal@0.1.14 dotenv @grpc/grpc-js @grpc/proto-loader (in /tmp/opencode/interlock-smoke only)
  - git clone --depth 1 https://github.com/MystenLabs/sui-apis.git (in /tmp/opencode only)
  - node walrus-smoke.mjs
  - node tatum-smoke.mjs
  - node tatum-diagnose.mjs
  - python3 PIL image dimension inspection
Unit tests: none — no application code exists.
Integration tests: two authorized Phase 0 smoke tests only (see evidence below).
E2E tests: none — no app exists.
Security checks:
  - .env.local remains untracked and ignored.
  - No secret values printed in chat or written to docs.
  - No NEXT_PUBLIC_* secret introduced.
  - Smoke-test dependencies and cloned protos kept outside the repository.
Preview URL: NONE
Deployed commit: NONE
External integrations verified:
  - Walrus Memory mainnet: PASS (signed write -> terminal -> metadata -> recall -> hash/namespace/author).
  - Tatum Sui mainnet gRPC: method/auth PASS; returned zero balance; demo funding open.
Reference/UI skill status: four reference images inspected and recorded; StageShow skill deferred to Phase 6 as required.
Known issues:
  - SUI_DEMO_ADDRESS returned balance="0" MIST; operator stated funded/non-zero. Fund or replace before funded-balance demo.
  - Neon connection not exercised in Phase 0 by design; Phase 2 must verify current_user=app_user and RLS.
  - Groq not called in Phase 0 by design; verify model/structured outputs in Phase 3.
Blocked work: no Phase 1 scaffold work blocked. Funded-balance demo path is blocked until the address is funded/replaced.
Next task: wait for operator's explicit "begin Phase 1"; then proceed with Phase 1.
Authorization boundary: Phase 0 documentation only; no application code, scaffold, dependencies, DB migrations, deployments or extra provider calls.
```

## Walrus Memory mainnet smoke test — PASS

- Test type: authorized signed synthetic FACT write, read-only verification path.
- Environment: mainnet relayer `https://relayer.memory.walrus.xyz`; SDK `@mysten-incubation/memwal@0.1.14`; relayer version `0.1.0`; API version `1.0.0`.
- Account: dedicated Interlock account from `/root/interlock/.env.local` (value not recorded); `owner=0x8d959d4966ec385e148bab8d2dca7707e82b808ffc88e044752b383f46662d5c`.
- Namespace: `interlock`.
- Author/delegate: Scout; public key `3b549b0c8a03bc3746d063fe14473578080eb022619a6fb7d1612e3910f3a4f1`; Sui address `0xe4da72303074deb9cbd4ab2f739b56430f5c880da9da4f8ec6736551af62d314`.
- Payload: JSON `interlock.memory.v1` FACT; scope `policy:max_exposure_bps`; value `1000`; record ID `smoke-fact-2dde7d4c-1741-470a-ae19-cc346a673246`.
- Canonical payload SHA-256: `1b512a8151f4ee15b8e2f6f7f30b12b703f51b8159e34f7902953c0c3a2b4933`.
- Accepted job: `fdb7c51b-4208-4b97-906a-238725596bdc` (status `running`).
- Terminal result: same job ID; blob ID `nOgMyB2p1dHhQT_HwSf6MPsWoGScPXMIStHJdlbnlR8`; namespace `interlock`; owner as above.
- `listMemories` (one page, limit 100): one matching active record; `memory_id=fdb7c51b-4208-4b97-906a-238725596bdc`; `namespace_id=interlock`; `blob_id=nOgMyB2p1dHhQT_HwSf6MPsWoGScPXMIStHJdlbnlR8`; `agent_id=3b549b0c8a03bc3746d063fe14473578080eb022619a6fb7d1612e3910f3a4f1`; `status=active`; `size=627`; `created_at=2026-11-10T05:02:27.465353Z`.
- `recall` (query scoped to the fact; limit 10; sort `recent`): total 1; exact blob returned; distance `0.4083734350696494`; returned text matched the payload byte-for-byte; recomputed SHA-256 matched.
- Verification results: terminal status TRUE; blob match TRUE; namespace match TRUE; record round-trip TRUE; SHA-256 match TRUE; author in payload TRUE; metadata `agent_id` equals Scout delegate public key TRUE.
- **Result: PASS.** This proves the exact signed write/read path required for Phase 0. It does not yet prove the application adapter, error handling or concurrency behavior.

## Tatum Sui mainnet gRPC smoke test — method/auth PASS; demo balance zero

- Test type: authorized read-only `StateService.GetBalance`.
- Endpoint: `sui-mainnet-grpc.gateway.tatum.io:443`; TLS; `x-api-key` metadata.
- Protos: official `MystenLabs/sui-apis` at commit `79485a8328e2f58fa047e4ce1327704b412e958a`; `sui/rpc/v2/state_service.proto`; package `sui.rpc.v2`.
- Method: `/sui.rpc.v2.StateService/GetBalance`.
- Address: `0xd03b03c92392dae185d84189e8a6623603626ad5a33314f9246633169e271273`.
- Coin type requested: `0x2::sui::SUI`.
- Exact response: `balance.coinType=0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI`; `balance.balance="0"`; `addressBalance` absent; `coinBalance` absent; no checkpoint field; no finality field; no other response fields.
- `ListBalances`: empty response for the address.
- Diagnostic cross-check only: public Sui fullnode `fullnode.mainnet.sui.io:443` also returned `balance="0"` for the same address. This was not used as the application provider and did not replace Tatum.
- **Result: method implemented and authenticated; exact fields captured; zero balance contradicts the operator's "funded and non-zero" statement.** No checkpoint or finality metadata was fabricated. The zero balance is a supported safe state (display zero, block exposure plan, HOLD), but a non-zero address is required for the funded-balance demo. Fund or replace `SUI_DEMO_ADDRESS` before that path.

## Reference asset inspection

- Four WebP images, each 2048×1536 RGB, supplied by operator and stated original/owned.
- Exact paths, SHA-256, intended screens and design observations recorded in `REFERENCE_ASSETS.md`.
- No logo/font/icon asset supplied; original Interlock identity to be created.
- Third-party product names/text visible in the reference images are reference-only and must not be copied into the product.

## Required log format for every checkpoint

```text
Date/time:
Phase:
Git commit:
Changes:
Commands run:
Unit tests:
Integration tests:
E2E tests:
Security checks:
Preview URL:
Deployed commit:
External integrations verified:
Reference/UI skill status:
Known issues:
Blocked work:
Next task:
Authorization boundary:
```

The coding agent must append an evidence-based entry after every internal checkpoint. A skipped test must be marked skipped with reason, never passed. Do not record secrets, private keys, tokens or sensitive data.

## Phase 1 — app shell and protected preview

```text
Date/time: 2026-11-10T06:40Z
Phase: Phase 1 — repository/platform foundation + early skeletal frontend
Git commit: f8d5260e11475adc81de7b9b2e3ec5ba4c1b417f (code); docs checkpoint commit follows
Changes:
  - Scaffolded Next.js 16.4.6 App Router, React 19.3.1, strict TypeScript, Tailwind CSS 4.3.5 and Lucide icons.
  - Added responsive dark operations shell with desktop sidebar and mobile drawer.
  - Added routes: /login, /setup, /dashboard, /observations, /memory, /plans, /plans/new, /plans/[id], /decisions/[id], /audit, /agents, /settings, /demo, /api/health, /, 404, error, loading.
  - Added reusable UI components and clearly labelled phase placeholders; no fabricated memories, verdicts or provider evidence.
  - Added runtime safety guard: production demo baseline and non-simulation execution modes fail closed.
  - Added .env.example (names only), .gitignore verification, Prettier, ESLint, Vitest and Playwright configuration.
  - Created Vercel project interlock with Next.js preset and Node 22.x; enabled Vercel Authentication protection.
  - Deployed preview only; removed accidental first production deployment and disabled the temporary automation bypass.
  - Updated README, AI_HANDOFF.md and OPERATOR_INTAKE.md for Phase 1.
Commands run:
  - npm install --no-audit --no-fund
  - npm run typecheck
  - npm run lint
  - npm test
  - npm run build
  - npx playwright install chromium
  - npm run test:e2e
  - vercel project create interlock
  - vercel link --yes --project interlock
  - vercel project update interlock --framework nextjs --node-version 22.x --yes
  - vercel env add INTERLOCK_ENVIRONMENT preview
  - vercel env add INTERLOCK_EXECUTION_MODE preview
  - vercel env add INTERLOCK_DEMO_BASELINE_ENABLED preview
  - vercel deploy --environment preview --yes
  - vercel project protection interlock --json
  - vercel project protection disable interlock --protection-bypass --protection-bypass-secret <redacted> -y
  - vercel remove dpl_<accidental-production> --yes
  - vercel remove dpl_<broken-preview> --yes
Unit tests: 4/4 PASS (runtime config guard).
Integration tests: health endpoint + protected preview checks PASS.
E2E tests: 34/34 PASS (Chromium desktop + mobile Chromium; all routes, auth shells, navigation, footer links, mobile drawer, overflow).
Security checks:
  - Staged-content secret scan found no credential values or private-key patterns.
  - .env.local remains ignored and untracked; .env.example contains names only.
  - Public unauthenticated preview returns 302 to Vercel SSO for / and /api/health.
  - Vercel project protection JSON: ssoProtection enabled; protectionBypass empty.
  - No production deployment remains; deployments list contains one Preview deployment.
Preview URL: https://interlock-ff4vlqtne-uhhh2.vercel.app
Deployed commit: f8d5260e11475adc81de7b9b2e3ec5ba4c1b417f (deployment dpl_Dt8W3dj3HRzvvtGLQFQTw8EqSNEe)
External integrations verified:
  - None in the application. Phase 0 Walrus/Tatum smoke tests remain the only provider calls; no Neon/Groq calls made.
Reference/UI skill status: four reference images inspected in Phase 0; Phase 1 uses provisional tokens; StageShow skill deferred to Phase 6.
Known issues:
  - No Neon database, auth, RLS, provider adapters or decision engine yet.
  - Operator reports SUI_DEMO_ADDRESS is funded; independent Tatum re-check is required in Phase 3, with a stop at Phase 5 if still zero.
  - Groq model/structured outputs not yet exercised.
Blocked work: none.
Next task: Phase 2 — Neon schema/roles/RLS, Managed Better Auth, membership authorization and tests.
Authorization boundary: preview only; production remains gated to Phase 9.
```

### Phase 1 failures, diagnosis and fixes

- Port 3000 was occupied by an unrelated Next.js 14 process. Playwright was moved to isolated port `3127` and `reuseExistingServer` disabled.
- Playwright's iPhone 13 descriptor selected WebKit; the mobile project was explicitly set to Chromium and the browser was installed.
- Next dev blocked HMR from `127.0.0.1`; `allowedDevOrigins: ["127.0.0.1"]` was added.
- Next recommended `data-scroll-behavior="smooth"`; added to the root `<html>` element.
- Vercel's first deployment was automatically assigned to production because it was the project's first deploy. The production deployment and aliases were removed; a separate `--environment preview` deployment was created.
- Vercel initially had no framework preset and returned 404. The project was updated to framework `nextjs`, Node `22.x`, and redeployed.
- `vercel curl` generated a temporary automation bypass secret. It was disabled; the protection configuration now has an empty `protectionBypass`.
- Prettier reformatted existing Markdown during setup. Those unrelated changes were reverted and `*.md` was added to `.prettierignore`.

### Phase 1 preview verification

- Authenticated CLI requests:
  - `/api/health` -> `{"status":"ok","service":"interlock","phase":"1","mode":"simulation"}`.
  - `/dashboard` -> page title `Dashboard · Interlock`.
- Public requests:
  - `/` -> `302` to `https://vercel.com/sso-api?...`.
  - `/api/health` -> `302` to `https://vercel.com/sso-api?...`.
- Deployment target `preview`; deployment protection includes `vercel_authentication`.

## Phase 2 — backend, Neon schema, auth and authorization

```text
Date/time: 2026-11-10T07:32Z
Phase: Phase 2 — backend, database, authentication and authorization foundation
Git commits: 3a8a1b0 (auth/RLS foundation), 14140ca (readiness probe); docs checkpoint follows
Changes:
  - Applied db/migrations/001_foundation.sql and 002_member_labels.sql to the preview Neon database through neondb_owner.
  - Added version-controlled migration runner scripts/migrate.mjs and npm run db:migrate.
  - Added workspace, member, invitation, agent identity, wallet, observation, memory, job, plan, decision, evidence, execution, audit and idempotency tables.
  - Added plain PostgreSQL RLS, request-scoped app.user_id, security-definer bootstrap/acceptance functions and least-privilege app_user grants.
  - Integrated Neon Managed Better Auth through @neon/auth; added /api/auth proxy, src/proxy.ts protection and client/server auth helpers.
  - Added login, sign-up, workspace creation and one-time invitation flows with OWNER/OPERATOR/OBSERVER membership.
  - Added /api/readiness for session, membership and app_user RLS proof.
  - Added RLS integration tests and authenticated Playwright tests.
  - Added preview Vercel env names DATABASE_URL_APP, NEON_AUTH_BASE_URL, NEON_AUTH_COOKIE_SECRET (values not logged).
Commands run:
  - node --env-file=.env.local scripts/migrate.mjs
  - npm run typecheck
  - npm run lint
  - npm test
  - npm run test:integration
  - npm run test:e2e -- tests/e2e/shell.spec.ts
  - E2E_AUTH_STATE=<local-only-state> npm run test:e2e -- tests/e2e/auth.spec.ts
  - npm run build
  - vercel env add DATABASE_URL_APP preview
  - vercel env add NEON_AUTH_BASE_URL preview
  - vercel env add NEON_AUTH_COOKIE_SECRET preview
  - vercel deploy --environment preview --yes
  - vercel project protection ... (temporary automation bypass disabled after verification)
Unit tests: 4/4 PASS.
Integration tests: 3/3 PASS (roles, RLS, cross-tenant denial, missing-context denial).
E2E tests: 10/10 public/protection PASS; 4/4 authenticated PASS with local storage state.
Security checks:
  - app_user current_user verified; rolbypassrls=false.
  - Direct workspace insert and cross-tenant wallet insert denied with PostgreSQL 42501.
  - No request identity -> zero workspaces visible.
  - Auth proxy validates browser Origin against exact app origins before forwarding; upstream sees the auth server origin.
  - No secrets in client bundles, docs or logs; .env.local untracked.
  - Preview public /api/health returns 302 to Vercel SSO; protectionBypass empty after verification.
Preview URL: https://interlock-8t77zyu5r-uhhh2.vercel.app
Deployed commit: 14140ca (preview)
External integrations verified:
  - Neon preview database and Managed Better Auth: PASS.
  - Walrus/Tatum application adapters: not built yet; Phase 3.
Reference/UI skill status: unchanged; StageShow at Phase 6.
Known issues:
  - Tatum demo address must be independently re-verified in Phase 3; stop if zero.
  - Provider adapters and decision pipeline not built.
Blocked work: none.
Next task: Phase 3 — Tatum/Walrus/Groq adapters, canonical memory, deterministic Sentinel and Runner clearance.
Authorization boundary: preview only; production gated to Phase 9.
```

### Phase 2 failures, diagnosis and fixes

- Neon Auth returned `INVALID_ORIGIN` for server-action calls from the app origin. Built `/api/auth/[...path]` as an origin-validating proxy that forwards with the auth server's own origin; browser auth forms now use the documented client SDK.
- Server-action sign-out did not clear the upstream session. Sign-out moved to the client auth proxy.
- Invite links used `APP_BASE_URL` and pointed at the wrong local port. Links now derive from trusted request headers.
- Sign-up initially lost the invitation token. Login now preserves the validated `/setup?token=...` target.
- RLS tests aborted after expected permission errors; added savepoints around negative cases.
- Auth E2E repeated sign-in per test and was flaky under dev-server load. It now uses a Playwright storage state and serial desktop coverage.
- A cold settings query can take several seconds; the authenticated test wait was raised to 20 seconds.

### Phase 2 preview verification

- `/api/health` -> `{"status":"ok","service":"interlock","phase":"2","mode":"simulation"}`.
- `/api/auth/sign-up/email` through the preview proxy returned a Better Auth user token for a synthetic test account.
- Public `/api/health` -> `302` to Vercel SSO.
- Vercel project protection: `ssoProtection` enabled, `protectionBypass: {}`.

## Phase 4 — functional MVP journeys connected

```text
Date/time: 2026-11-10T08:07Z
Phase: Phase 4 — functional frontend integration
Git commit: 5c03b94 (feat: connect interlock MVP journeys to backend)
Changes:
  - Connected the operations console to live Neon, Tatum, Walrus, Sentinel and Runner services.
  - Added real observation, policy, plan, evaluation and simulation forms/actions.
  - Added live dashboard counts/recent decisions, memory ledger, plan list/detail, decision evidence view and audit history.
  - Added server-side role checks and maxDuration=60 for provider-bound operations.
  - Added format/queries helpers and client submit pending states.
  - Fixed a dashboard query (missing observation join), route error boundary nesting and production/dev rendering validation.
Commands run:
  - npm run typecheck
  - npm run lint
  - npm test (14 tests)
  - npm run test:integration (live Tatum/Walrus/RLS/pipeline, 6 tests)
  - npm run test:e2e -- tests/e2e/shell.spec.ts (10 tests, production build)
  - E2E_AUTH_STATE=<local state> npm run test:e2e -- tests/e2e/auth.spec.ts (6 tests)
  - npm run build
  - vercel deploy --environment preview
Unit tests: 14/14 PASS.
Integration tests: 6/6 PASS.
E2E tests: public shell 10/10 PASS; authenticated live-data journeys 6/6 PASS.
Security checks:
  - Server actions derive workspace/role from verified session membership.
  - RLS remains active; no client verdict/clearance trusted.
  - Preview protection remains Vercel Authentication; public health 302.
  - No secrets in docs/client bundles.
Preview URL: https://interlock-qwhwpocpu-uhhh2.vercel.app
Deployed commit: 5c03b94
External integrations verified:
  - Tatum funded balance observation; Walrus FACT/CONSTRAINT/VERDICT writes and recalls; Runner single simulation and replay block.
Reference/UI skill status: provisional tokens; StageShow deferred to Phase 6.
Known issues:
  - Demo comparison route still placeholder.
  - Final reference-led visual pass pending.
Blocked work: none.
Next task: Phase 5 — end-to-end safety/failure-path gate and demo comparison.
Authorization boundary: preview only; production gated to Phase 9.
```

### Phase 4 failures and fixes

- Dashboard initially failed with `column p.address does not exist`; added the missing `chain_observations` join.
- Route error boundary incorrectly rendered nested `<html>`/`<body>`; split route error and global error components.
- Dev-only Suspense streaming produced an empty dashboard; production build rendered correctly. Playwright now tests a production build, matching Vercel.
- Auth test navigation depended on an empty-state link that disappears once data exists; switched to the persistent primary navigation.

## Phase 5 — end-to-end safety and demo comparison

```text
Date/time: 2026-11-10T08:13Z
Phase: Phase 5 — E2E functionality completion and verification
Git commit: d141f0c (test: verify interlock end-to-end safety flows)
Changes:
  - Added preview-only createDemoComparison service and /demo comparison UI.
  - Same immutable plan hash and observation power both branches.
  - Baseline is explicitly WOULD PASS and illustrative; it creates no decision/clearance.
  - Protected branch writes real FACT/CONSTRAINT/VERDICT memories and shows verified citations.
  - Added gated live-demo Playwright test; desktop pass, mobile skip for provider mutation.
  - Confirmed rejection cannot reach simulation.
  - Playwright now runs against a production build rather than the dev-only Suspense path.
Commands run:
  - npm run typecheck; npm run lint; npm test (14)
  - npm run build
  - E2E_AUTH_STATE=<local> E2E_LIVE_DEMO=1 npm run test:e2e -- tests/e2e/live-demo.spec.ts
  - E2E_AUTH_STATE=<local> npm run test:e2e -- tests/e2e/auth.spec.ts (6)
  - npm run test:e2e -- tests/e2e/shell.spec.ts (10)
  - vercel deploy --environment preview
Unit tests: 14/14 PASS.
Integration tests: live pipeline 6/6 PASS (from Phase 3/4 evidence).
E2E tests: live Memory OFF/ON comparison PASS desktop; public shell 10/10; authenticated live-data 6/6.
Security checks:
  - Baseline cannot enable in production; startup guard retained.
  - Rejected decisions have no simulation control; replay blocked.
  - Server actions re-check session membership/role.
Preview URL: https://interlock-cm133bp8u-uhhh2.vercel.app
Deployed commit: d141f0c
External integrations verified:
  - Real Tatum observation + Walrus FACT/CONSTRAINT/VERDICT for the comparison.
Reference/UI skill status: StageShow attempt moves to Phase 6.
Known issues:
  - Provisional visual system; final reference-led pass is Phase 6.
Blocked work: none.
Next task: Phase 6 — reference-led UI and StageShow skill.
Authorization boundary: preview only; production gated to Phase 9.
```

## Phase 6 — reference-led interface and responsive pass

```text
Date/time: 2026-11-10T08:26Z
Phase: Phase 6 — reference-image-led final UI implementation + UI skills
Git commit: a8aa450 (feat: implement reference-led interlock interface)
Skills:
  - npx skills add benjitaylor/skills --skill stageshow installed successfully.
  - Security assessments: Gen Safe, Socket 0 alerts, Snyk Low risk.
  - Inspected SKILL.md; it targets faux marketing UI, not production consoles. Applied restraint/framing/hierarchy guidance; did not import its stage kit.
Changes:
  - Refined shell labels, workspace identity, footer and live-status copy.
  - Constrained table scroll containers and panel min-widths to eliminate responsive overflow.
  - Verified all authenticated data pages at 390, 768 and 1280 px.
  - Added StageShow/design decisions to docs/DESIGN_NOTES.md.
Commands:
  - E2E_AUTH_STATE=<local> npm run test:e2e -- tests/e2e/responsive-auth.spec.ts (6/6)
  - E2E_AUTH_STATE=<local> npm run test:e2e -- tests/e2e/auth.spec.ts (6/6)
  - npm run test:e2e -- tests/e2e/shell.spec.ts (10/10)
  - npm run typecheck; npm run lint; npm test (14)
  - npm run build
Preview URL: https://interlock-w9g75cpnj-uhhh2.vercel.app
Deployed commit: a8aa450
Known issues: final visual polish/demo video remains.
Next task: Phase 7 — documentation and frontend completeness.
Authorization: preview only; production gated to Phase 9.
```

## Phase 7 — documentation and frontend completeness

```text
Date/time: 2026-11-10T08:30Z
Phase: Phase 7 — frontend completeness and documentation
Git commit: docs checkpoint follows
Changes:
  - README rewritten for the functional MVP, preview journeys, local commands, API, architecture and limitations.
  - SETUP updated for Neon roles, Managed Better Auth, migrations, first workspace and verification.
  - DEPLOYMENT updated with preview URL/protection, env names, preview-only rules and Phase 9 production gate.
  - TROUBLESHOOTING updated for auth origin, RLS, migrations, Tatum, Walrus, Sentinel/Runner and Vercel.
  - OPERATOR_GUIDE updated to the real observation/policy/plan/Sentinel/simulation flow.
  - API docs list implemented endpoints, roles and error envelope.
  - Repository structure documents db/proto/tests/service boundaries.
Commands: npm run typecheck; npm run lint; npm test; npm run build
Tests: 14 unit; 6 integration; 10 shell; 6 auth; 6 responsive; live demo desktop PASS.
Preview URL: https://interlock-q8n7d5x66-uhhh2.vercel.app
Deployed commit: pending final Phase 7 deploy
Known issues: demo video pending; production gated.
Next task: Phase 8 — reviewed demo video.
Authorization: preview only; production gated to Phase 9.
```

## Phase 8 — reviewed demo video

```text
Date/time: 2026-11-10T09:42Z
Phase: Phase 8 — demo video production
Output: demo/interlock-demo.mp4
Duration: 109.36s (<=180)
Video/audio: 1280×800 H.264 + AAC, burned captions
TTS: Kokoro ONNX 0.6.1, local, voice af_bella; Piper not needed
Evidence:
  - Real preview workspace/data captured with Playwright.
  - Narrated timeline generated with Kokoro; video scene durations derived from audio.
  - ffprobe confirms 109.36s video and audio; mean -21.4 dB, max -2.0 dB.
  - Synthetic workspace/email only; wallet addresses truncated; no secrets.
  - SHA-256: 87de5f61641eb5b4d882342311f4be76544622bb6c09fcc527e253b23f2904ef
Artifacts: demo/interlock-demo.mp4, demo/narration.md, demo/captions.srt, demo/production-notes.md, demo/timeline.json
Raw capture ignored under demo/raw/; narration.wav ignored.
Next task: Phase 9 — final regression/security/release readiness.
```
