# OPERATOR_INTAKE.md — Consolidated Readiness Check

**Purpose:** One complete intake before repository modifications. This document records the operator's consolidated Phase 0 reply, the agent's independent verification, and the resulting authority boundaries.

**Status:** Completed 2026-11-10. Secret **values** are never recorded here; only secret-store references and validation results are recorded.

## Consolidated intake

| Area | Required input / question | Recorded answer | Verification / status | Authority boundary |
|---|---|---|---|---|
| Target repository | Exact Git repo URL/local path, owner, branch and write access? | `https://github.com/onyebuchidaniel60/interlock`, branch `main`; operator owns repository and grants Phase 0 documentation commit/push. | **CONFIRMED.** Remote matches; branch `main`; initial commit `d0455bb`. | Phase 0 documentation changes only: `OPERATOR_INTAKE.md`, `AI_HANDOFF.md`, `docs/BUILD_LOG.md`, `REFERENCE_ASSETS.md`, `.gitignore`, `design/reference/`, plus the operator-requested architecture/config/testing docs. No application code. |
| Existing work | Existing branches, code, DB, CI or deployment to preserve? | None. No other branch, worktree, database, deployment or external asset exists to preserve. | **INSPECTED.** Only initial blueprint commit; untracked `.env.local` and `design/reference/` present. No application code, manifests, lockfiles, migrations, tests, CI or deploy config. | Do not overwrite operator work; never commit `.env.local`. |
| Product identity | Confirm Interlock name/pronunciation and Total Recall audience? | Product is **Interlock**, pronounced **“IN-ter-lock”**; audience is hackathon judges. | **CONFIRMED.** | Product naming fixed. |
| UI reference | Owned/licensed reference image(s), source/ownership, intended screens. | Four original WebP images owned by the operator: `design/reference/int-reference1.webp` … `int-reference4.webp`. Intended screens: dashboard, decision detail, memory ledger, evidence panel. | **RECEIVED AND INSPECTED.** 2048×1536 RGB WebP each; paths and SHA-256 recorded in `REFERENCE_ASSETS.md`. | Use directly as visual reference in Phase 6; do not copy third-party branding, logos, trade dress or text. |
| Visual constraints | Brand colors/fonts, logo, existing assets, responsive priorities? | No brand kit or logo supplied. Reference direction: near-black layered surfaces, compact left navigation, dense data panels, emerald primary accent, red/amber/green severity colors, small mono labels, high information density. Responsive phone/tablet/desktop required. | **DERIVED FROM SUPPLIED REFERENCES.** Original Interlock identity to be created; no copied assets. | Do not copy third-party branding or proprietary trade dress. |
| Database and auth | Supabase project URL/ref, access role, Auth enabled, migration permissions, preview vs prod project? | **Operator-authorized architecture change:** Supabase quota exhausted. Replace Supabase with **Neon** (Lakebase Postgres + Managed Better Auth). Preview and production use separate Neon projects/branches. | **ACCEPTED.** `DATABASE_URL_UNPOOLED` (role `neondb_owner`) is for migrations only. `DATABASE_URL_APP` (role `app_user`, `NOBYPASSRLS`) is for all application queries. Auth uses `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET`; `@supabase/ssr` is removed. RLS is plain PostgreSQL; `auth.uid()` is unavailable. | Do not run application queries as `neondb_owner`; verify `SELECT current_user` is `app_user`. No destructive production migration without authority. |
| Walrus Memory | Dedicated account ID, namespace, SDK access and delegated keys for Scout/Policy/Sentinel/Runner? | Dedicated account ID and four delegate keys are in `/root/interlock/.env.local` (values not recorded). Namespace `interlock` for preview, `interlock-prod` for production. Account is confirmed not shared or a sample account. | **VALIDATED BY SIGNED MAINNET WRITE** (see below). | Never disclose key values; no unapproved account sharing. |
| Walrus test | Can a signed mainnet write complete, produce blob ID, list metadata and recall matching content? | **PASS.** Signed synthetic FACT write by Scout delegate → terminal success → blob ID `nOgMyB2p1dHhQT_HwSf6MPsWoGScPXMIStHJdlbnlR8`; `listMemories` metadata found in namespace `interlock`; recall returned the exact payload; namespace, author and SHA-256 verified. | **EVIDENCED** in `docs/BUILD_LOG.md`. SDK `@mysten-incubation/memwal@0.1.14`; relayer `https://relayer.memory.walrus.xyz`; relayer version `0.1.0`. | Do not report integration available before evidence. A pending write or metadata-only result is not active memory. |
| Tatum | API key in secret store and a public Sui mainnet demo address? | `TATUM_API_KEY`, `TATUM_SUI_GRPC_TARGET`, `SUI_DEMO_ADDRESS`, `SUI_COIN_TYPE` are present in `.env.local`. Target is `sui-mainnet-grpc.gateway.tatum.io`; address is public and valid-format; coin type `0x2::sui::SUI`. | **KEY AUTH AND METHOD VERIFIED.** Phase 0 returned `balance="0"` MIST with no checkpoint/finality fields. The operator reports the address is now funded and non-zero; independent re-verification is scheduled for Phase 3 as instructed. | Never request private key/seed phrase. Do not silently use deprecated JSON-RPC or another provider. Re-check the funded balance in Phase 3 and stop at Phase 5 if it is zero. |
| Tatum method | Does Tatum support `StateService.GetBalance` with current official proto? | **YES.** Exact method `/sui.rpc.v2.StateService/GetBalance` succeeded over TLS with `x-api-key` against `sui-mainnet-grpc.gateway.tatum.io:443`, using official `MystenLabs/sui-apis` protos pinned at commit `79485a8328e2f58fa047e4ce1327704b412e958a`, proto `sui/rpc/v2/state_service.proto`. | **EVIDENCED** in `docs/BUILD_LOG.md`. Response contained only the fields listed above; no fabricated checkpoint/finality metadata. | Method support is proven; the zero balance is a data/configuration issue, not an unimplemented method. |
| Analyst provider | OpenAI access, approved model, quota, daily request limit and dollar ceiling? | **Operator-authorized change: Groq replaces OpenAI.** Base URL `https://api.groq.com/openai/v1`; OpenAI-compatible SDK; server-only `GROQ_API_KEY`; model `qwen/qwen3.8-27b`, confirmed to support structured outputs on Groq. | **ACCEPTED.** Strict JSON schema required: `additionalProperties: false`, every property listed in `required`. Analyst has no policy authority; Sentinel remains deterministic. | No spend beyond explicit ceiling; no policy authority; model output never authorizes an action. |
| Vercel | Project/team access, protected preview ability, domain? | Create project `interlock` under the active scope; protection **Vercel Authentication**; preview only; generated `*.vercel.app` URL; no custom domain. | **AUTHORIZED, NOT YET DEPLOYED.** No preview URL exists until Phase 1. | Preview permission is not production permission; no production secrets in preview. |
| Other services | Existing logging/monitoring provider? | None supplied. | **NONE.** Do not add a paid service without approval. | No unapproved integrations. |
| Budget | Total permitted spend across Walrus, Tatum, Neon, Groq, Vercel, TTS and video tooling? | **$0 unapproved spend. Free tiers only.** Stop and ask before any action that would exceed a free tier. API keys are not spending authority. | **ACCEPTED AND BINDING.** | Stop before overage or paid usage. |
| Quotas | Known provider quotas/rate limits and expected demo load? | Use conservative low-rate limits, bounded retries and the configured Groq daily request cap. No paid overage. | **BOUNDED BY DEFAULT.** Exact provider quotas to be re-checked at implementation/demo time. | Stop before overage. |
| Production | May agent deploy production, migrate production DB, configure DNS or publish public content? | **Bounded production release granted after Phase 9 passes, for exactly:** create a Vercel production deployment for `interlock`; apply version-controlled Neon migrations to a production database after a verified backup/rollback path exists. No DNS changes without separate approval. No public marketing beyond the app itself. No production data import; production starts empty or with the approved demo fixture. Production requires `INTERLOCK_DEMO_BASELINE_ENABLED=false` and `INTERLOCK_EXECUTION_MODE=simulation`; startup must fail otherwise. Production uses a separate Neon project/branch and separate Walrus namespace `interlock-prod`; no preview secrets copied. | **RECORDED — BOUNDED AUTHORITY.** | Any action outside the listed set requires separate written approval. |
| Data policy | Synthetic/public wallet data in preview/demo? Prohibited data? | **ACCEPTED:** public Sui address + synthetic data only; no customer or production data. | **BINDING.** | No sensitive production data in preview. |
| Demo audience | Judges, developers, customers or internal team? | Hackathon judges. Pronunciation: **“IN-ter-lock.”** | **CONFIRMED.** | Keep story and terminology audience-appropriate. |
| Demo output | Approved output directory, repository path, sharing requirements? | `demo/` in repo; no public upload. | **CONFIRMED.** | No public video upload without authority. |
| Redactions | Accounts, wallet fragments, private URLs, email, environment info to redact? | **ACCEPTED default:** redact secrets, tokens, private URLs, personal email, private account IDs; truncate wallet addresses if requested during demo review. | **BINDING.** | Never show keys/tokens or private workspace details. |
| TTS | Can agent check free Google AI voice/TTS and use an approved genuinely-free fallback? | Use **Kokoro TTS** (Apache 2.0, local, high-quality). If Kokoro cannot run, fall back to **Piper TTS**. Record exact engine and voice model in `demo/production-notes.md`. No paid usage. | **SELECTED.** Availability to be verified during demo production. | Stop before paid usage. |
| GitHub visibility | Is repository public and may footer link to it? | Repository is public; footer link **APPROVED** to `https://github.com/onyebuchidaniel60/interlock`. | **APPROVED.** | Never expose a private repository URL. |
| Support/legal | Real support, privacy and terms URLs available? | None supplied. | **OMIT.** Do not fabricate support, privacy or terms claims. | No fabricated legal claims. |

## Independent Walrus smoke test — result

- **Verdict:** PASS.
- Namespace: `interlock`.
- Record: synthetic `FACT` for `scope=policy:max_exposure_bps`, value `1000`, author `Scout`.
- Canonical payload SHA-256: `1b512a8151f4ee15b8e2f6f7f30b12b703f51b8159e34f7902953c0c3a2b4933`.
- Job ID: `fdb7c51b-4208-4b97-906a-238725596bdc`.
- Blob ID: `nOgMyB2p1dHhQT_HwSf6MPsWoGScPXMIStHJdlbnlR8`.
- `listMemories`: one matching active record; `namespace_id=interlock`; `blob_id` matches; `agent_id` equals the Scout delegate public key `3b549b0c8a03bc3746d063fe14473578080eb022619a6fb7d1612e3910f3a4f1`.
- `recall`: returned the exact payload; recomputed SHA-256 matched; identity, namespace, blob and author verified.
- Account owner (public): `0x8d959d4966ec385e148bab8d2dca7707e82b808ffc88e044752b383f46662d5c`.
- Scout delegate Sui address (public): `0xe4da72303074deb9cbd4ab2f739b56430f5c880da9da4f8ec6736551af62d314`.

## Independent Tatum smoke test — result

- **Method/auth verdict:** PASS. Exact gRPC method implemented and authorized.
- Endpoint: `sui-mainnet-grpc.gateway.tatum.io:443` over TLS with `x-api-key`.
- Method: `/sui.rpc.v2.StateService/GetBalance`.
- Protos: official `MystenLabs/sui-apis`, commit `79485a8328e2f58fa047e4ce1327704b412e958a`.
- Address: `0xd03b03c92392dae185d84189e8a6623603626ad5a33314f9246633169e271273`.
- Requested coin type: `0x2::sui::SUI`.
- Returned `coinType`: `0x0000000000000000000000000000000000000000000000000000000000000002::sui::SUI`.
- Returned `balance`: `"0"` MIST (0 SUI).
- `addressBalance`: absent. `coinBalance`: absent. Checkpoint/finality fields: absent.
- `ListBalances`: returned an empty response for the address.
- Diagnostic only: the public Sui fullnode `fullnode.mainnet.sui.io:443` also returned `balance="0"` for the same address. This diagnostic did not replace Tatum and is not part of the application integration.
- **Operator update (Phase 1):** the operator reports `SUI_DEMO_ADDRESS` is now funded and returns a non-zero balance. This is an operator statement; independent re-verification is scheduled for Phase 3. If it still returns zero at Phase 5, stop and report.
- **Phase 0 evidence retained:** the earlier zero-balance result is recorded in `docs/BUILD_LOG.md` and must not be misrepresented as a non-zero observation.

## Critical readiness checklist

- [x] Repository and branch confirmed; access verified.
- [x] Existing repo inspected; no uncommitted work will be overwritten.
- [x] Reference images attached and inspected; ownership recorded.
- [x] Neon database/auth decision recorded; migration and app-role boundaries recorded.
- [x] Walrus dedicated account/namespace/delegates validated with signed write → completed job → metadata → recall/hash/author test.
- [x] Tatum key/public address validated; exact `StateService.GetBalance` method works against approved endpoint.
- [x] Tatum returned exact fields; no checkpoint/finality values fabricated.
- [x] Groq model/structured-output contract recorded; deterministic Sentinel boundary retained.
- [x] Preview host/protection authorized; deployment deferred to Phase 1.
- [x] Budget ceiling, quota limits and no-charge restrictions recorded.
- [x] Production actions explicitly bounded or denied.
- [x] Demo audience, pronunciation, redactions and output directory recorded.
- [x] TTS choice and fallback recorded.
- [x] GitHub footer link approved for the public repository.
- [x] Support/legal destinations omitted rather than fabricated.
- [x] Operator reports `SUI_DEMO_ADDRESS` is funded; independent Phase 3 re-verification scheduled (stop at Phase 5 if still zero).

## Readiness result

| Field | Value |
|---|---|
| Readiness | **READY — Phase 1 complete.** The operator reports the demo address is funded; independent re-verification is scheduled for Phase 3. |
| Reviewed by | Coding agent during Phase 0/1 |
| Date/time | 2026-11-10T06:37Z |
| Blocking items | None for Phase 1. Demo funding is operator-reported; re-verify in Phase 3 and stop at Phase 5 if it is still zero. |
| Explicit production authority | Bounded release granted after Phase 9 for exactly the actions recorded above; all other production actions remain DENIED. |
| Architecture changes | Supabase → Neon (operator-authorized); OpenAI → Groq (operator-authorized); recorded in `ARCHITECTURE.md`, `docs/CONFIGURATION.md`, `docs/TESTING.md`, and `AI_HANDOFF.md`. |
