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
