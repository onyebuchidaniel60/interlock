# AI_HANDOFF.md — Interlock Current State

## Current status

- Product: **Interlock** — one agent's verified memory can prevent another agent from executing a policy-violating action.
- Implementation phase: **Phase 0 complete — Phase 1 not started.**
- Application implementation: **NOT STARTED.** No app scaffold, dependencies, database, deployment or preview exists.
- Repository: **CONFIRMED** — `https://github.com/onyebuchidaniel60/interlock`, branch `main`.
- Phase 0 checkpoint commit: **`docs: complete interlock operator readiness`** (see `git log -1` for SHA; reported to operator).
- Reference UI images: **SUPPLIED AND INSPECTED** — four original WebP images in `design/reference/`; inventory in `REFERENCE_ASSETS.md`.
- Walrus Memory mainnet: **VALIDATED** — dedicated account/namespace/delegate keys; signed synthetic FACT write → terminal success → blob ID → metadata → exact recall → namespace/author/SHA-256 verification passed. Evidence in `docs/BUILD_LOG.md`.
- Tatum Sui mainnet gRPC: **METHOD/AUTH VALIDATED** — exact `StateService.GetBalance` works through `sui-mainnet-grpc.gateway.tatum.io:443` with official protos. Returned `balance="0"` MIST for the supplied `SUI_DEMO_ADDRESS`; no checkpoint/finality fields returned. Demo funding/address action remains open.
- Neon Postgres + Managed Better Auth: **CONFIGURED IN DOCS, NOT YET CONNECTED.** Supabase is removed by operator-authorized architecture change.
- Groq Analyst: **CONFIGURED IN DOCS, NOT YET CALLED.** OpenAI is removed by operator-authorized architecture change. Model `qwen/qwen3.8-27b`; strict JSON schema only; no policy authority.
- Vercel: **AUTHORIZED FOR PREVIEW, NOT DEPLOYED** — project `interlock`, Vercel Authentication, generated `*.vercel.app` URL, no custom domain.
- Preview URL: **NONE.**
- Deployed commit: **NONE.**
- Production authorization: **BOUNDED RELEASE AFTER PHASE 9** — exactly the actions recorded in `OPERATOR_INTAKE.md` and below; everything else remains DENIED.
- Budget: **$0 unapproved spend; free tiers only.**
- Demo video: **NOT PRODUCED.** Plan in `DEMO_VIDEO_PLAN.md`; output to `demo/`; Kokoro TTS primary, Piper fallback.

## Architecture changes authorized in Phase 0

1. **Supabase → Neon (Lakebase Postgres + Managed Better Auth).** Supabase quota is exhausted.
   - `DATABASE_URL_UNPOOLED` (role `neondb_owner`) is used **only** for migrations.
   - `DATABASE_URL_APP` (role `app_user`, `NOBYPASSRLS`) is used for **all** application queries.
   - Application startup/readiness must prove `SELECT current_user` is `app_user`; never run app queries as `neondb_owner`.
   - Auth: Managed Better Auth via `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET`; server integration uses `@neon/auth/next/server` (verify exact package version at implementation). `@supabase/ssr` is removed.
   - RLS is plain PostgreSQL. `auth.uid()` is **not** available. Policies must use request-scoped `app.user_id` (set with `set_config(..., true)` inside a transaction) plus `workspace_members` checks. Missing context must deny.
2. **OpenAI → Groq for Analyst.**
   - Base URL `https://api.groq.com/openai/v1`; OpenAI-compatible SDK; `GROQ_API_KEY` server-only.
   - Model `qwen/qwen3.8-27b`, confirmed to support structured outputs on Groq.
   - Structured outputs must use strict JSON schema: `additionalProperties: false`, every property listed in `required`.
   - Analyst has no policy authority. Sentinel remains deterministic. Model output never authorizes an action.

## Product-critical invariants

1. Walrus Memory mainnet must be core functionality, not decoration.
2. Same immutable plan hash and observation must be used for memory-off baseline and memory-on protected comparison.
3. Memory OFF baseline exists only in local/test/protected preview and only as a simulation; startup must fail if enabled in production.
4. Normal production decision path is fail-closed. Missing policy/evidence, incomplete semantic recall, stale or conflicting evidence => HOLD.
5. Sentinel is deterministic; an LLM cannot approve/reject.
6. Runner accepts only final APPROVE with signed, 60-second, workspace/plan/decision-bound, single-use clearance.
7. All execution is simulated; no wallet custody/signing, trades or transfers.
8. Final APPROVE requires a completed, verified Walrus VERDICT memory.
9. Postgres metadata alone is never decision evidence; recall content and provenance must be verified.
10. Production startup must fail unless `INTERLOCK_EXECUTION_MODE=simulation` and `INTERLOCK_DEMO_BASELINE_ENABLED=false`.

## Walrus smoke-test evidence (Phase 0)

- Namespace: `interlock` (preview); production will use `interlock-prod`.
- Relayer: `https://relayer.memory.walrus.xyz`; SDK `@mysten-incubation/memwal@0.1.14`; relayer version `0.1.0`.
- Synthetic FACT canonical payload SHA-256: `1b512a8151f4ee15b8e2f6f7f30b12b703f51b8159e34f7902953c0c3a2b4933`.
- Job ID: `fdb7c51b-4208-4b97-906a-238725596bdc`.
- Blob ID: `nOgMyB2p1dHhQT_HwSf6MPsWoGScPXMIStHJdlbnlR8`.
- `listMemories` metadata: active record, namespace `interlock`, matching blob, `agent_id` equal to Scout delegate public key.
- `recall`: exact payload returned; recomputed SHA-256 matched; author/namespace/blob verified.
- No secret values are recorded in documentation.

## Tatum smoke-test evidence (Phase 0)

- Endpoint: `sui-mainnet-grpc.gateway.tatum.io:443`, TLS, `x-api-key`.
- Method: `/sui.rpc.v2.StateService/GetBalance`; official `MystenLabs/sui-apis` protos pinned at `79485a8328e2f58fa047e4ce1327704b412e958a`.
- Address: `0xd03b03c92392dae185d84189e8a6623603626ad5a33314f9246633169e271273`.
- Requested coin: `0x2::sui::SUI`.
- Returned: canonical coin type `0x000…002::sui::SUI`, `balance="0"` MIST, no `addressBalance`, no `coinBalance`, no checkpoint/finality fields.
- `ListBalances` returned empty.
- **Method/auth: PASS. Demo balance: FAIL / NOT NON-ZERO.** The operator stated the address was funded and non-zero; independent Tatum and public-fullnode diagnostics both returned zero. Fund or replace the address before the funded-balance demo path. Zero is a supported safe state (display zero, block exposure plan, HOLD), so Phase 1 may proceed.
- Do not switch to JSON-RPC or another provider for the application integration.

## Next task — exact start point

**Wait for the operator's explicit “begin Phase 1” message.** Then execute Phase 1 exactly as specified in `IMPLEMENTATION_PLAN.md`:

1. Establish the Next.js 16 App Router + React 19 + strict TypeScript foundation in the confirmed repository.
2. Deploy a navigable, responsive skeletal shell with the agreed routes and clearly labelled placeholders early.
3. Add Neon migration/bootstrap scripts, `db/` schema structure and environment template without connecting production.
4. Add Vercel project `interlock`, Vercel Authentication, preview-only deployment; record exact preview URL and deployed commit.
5. Add lint/typecheck/test scripts and Playwright route/navigation smoke tests.
6. Run the StageShow UI skill attempt at Phase 6, not now.
7. Update `AI_HANDOFF.md`, `docs/BUILD_LOG.md`, `OPERATOR_INTAKE.md`, `REFERENCE_ASSETS.md` and `docs/DESIGN_NOTES.md` at each checkpoint.

## Authorization boundaries

- **Allowed now:** Phase 0 documentation only; no application code, dependency install, scaffold, database connection/migration, provider call beyond the two authorized smoke tests, or deployment.
- **Preview:** Vercel project `interlock`, Vercel Authentication, preview only, generated `*.vercel.app`, no custom domain.
- **Production after Phase 9:** create Vercel production deployment; apply version-controlled Neon migrations after a verified backup/rollback path; separate Neon project/branch; separate Walrus namespace `interlock-prod`; no preview secrets; no DNS changes; no public marketing; no production data import; flags enforced.
- **Never:** private keys/seed phrases, wallet custody/signing, real transactions/transfers/trades, bypassing auth/RLS/provider scopes, exposing secrets in client bundles/logs/docs, committing `.env` files, unapproved spend.
- **Data:** public Sui address + synthetic data only. No customer or production data.
- **Demo:** hackathon judges; `demo/` output only; no public upload; redact secrets/private URLs/emails/account IDs; truncate wallet addresses if requested.

## Known open issues / blockers

1. **Demo data:** `SUI_DEMO_ADDRESS` currently returns zero liquid balance. Fund or replace it before the 10%-vs-15% demo; no alternative address is authorized. Not a Phase 1 scaffold blocker.
2. **Neon connection not yet exercised:** Phase 0 validated the credentials exist and recorded role boundaries, but deliberately did not connect to the database (no app queries authorized). Phase 2 must verify `current_user=app_user`, `NOBYPASSRLS`, and RLS behavior.
3. **Neon Auth implementation:** exact `@neon/auth` package version and invitation flow to be pinned/verified in Phase 2.
4. **Groq not yet called:** model availability/structured-output behavior to be verified in Phase 3 within free-tier limits; deterministic fallback remains required.
5. **Preview:** no URL or deployed commit yet; Phase 1.
6. **Demo video/TTS:** not produced; verify Kokoro/Piper locally during demo production.

## Checkpoint template

```text
Current phase:
Completed:
Tests and evidence:
Preview/staging URL:
Deployed commit:
Reference image and UI skill status:
Documentation status:
Demo video status:
Known issues:
Authorization boundaries:
Next task:
Blocked by (if any):
```

## Do not claim

Do not claim that app code, a live preview, deployed build, real Neon/Groq integration, tests or a demo video exist until produced and verified. The Phase 0 smoke tests prove only the exact Walrus and Tatum calls recorded in `docs/BUILD_LOG.md`; they do not prove the application integration.
