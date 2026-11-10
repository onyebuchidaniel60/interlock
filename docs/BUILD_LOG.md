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
