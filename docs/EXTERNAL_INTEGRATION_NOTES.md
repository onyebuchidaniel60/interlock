# EXTERNAL_INTEGRATION_NOTES.md — Verified Documentation and Intake Caveats

This note separates provider documentation facts from items that must be proven with the operator's actual accounts during Phase 0. URLs are official vendor/project documentation unless stated otherwise. Provider behavior can change; the coding agent must re-check the current docs and pin tested SDK versions before implementation.

## Walrus Memory

Official documentation:
- [Walrus Memory SDK API reference](https://docs.wal.app/walrus-memory/sdk/api-reference)
- [Walrus Memory SDK usage](https://docs.wal.app/walrus-memory/sdk/usage/memwal)
- [Walrus Memory quick start](https://docs.wal.app/walrus-memory/quick-start)

Design implications from the documented SDK:
- Mainnet Memory service/relayer documented at `https://relayer.memory.walrus.xyz`.
- `remember` is asynchronous; `rememberAndWait` waits for the write and exposes a blob ID on completion.
- `recall` is semantic retrieval within the account/namespace scope; it is not a relational exact-match query.
- `listMemories` provides memory metadata and pagination, not the full decrypted memory payload. Use the SDK recall path for content.
- Account ID and namespace isolate a memory space; Interlock must use a dedicated account/namespace, not documentation examples or another application’s shared account.
- Delegated agent identities can support attribution; application-side role/capability checks are still required.

**Phase 0 proof required:** With the actual dedicated account and delegate keys, perform a signed mainnet write, wait for terminal success, capture blob ID, list metadata, recall the exact record and verify the payload. Confirm that the selected SDK's actual returned types match the adapter contract. A pending write or successful shallow health check is not sufficient.

## Tatum and Sui gRPC

Official documentation:
- [Tatum Sui gRPC API](https://docs.tatum.io/reference/sui-grpc)
- [Sui gRPC balance queries](https://docs.sui.io/guides/developer/getting-started/get-coins)
- [Sui RPC migration cookbook](https://docs.sui.io/guides/developer/sui-apis/migrate-to-grpc)
- [Sui API protobuf definitions](https://github.com/MystenLabs/sui-apis)

Architecture decision:
- Preferred gateway: `https://sui-mainnet-grpc.gateway.tatum.io` (host target value `sui-mainnet-grpc.gateway.tatum.io`).
- Tatum authentication uses `x-api-key`.
- Preferred Sui method: `StateService.GetBalance` from the official Sui gRPC API.
- SUI native coin type: `0x2::sui::SUI`.
- Atomic unit: MIST; `1 SUI = 1,000,000,000 MIST`.
- Use integer strings/BigInt, not JavaScript floating-point numbers.

**Phase 0 verification:** `StateService.GetBalance` is implemented by Tatum mainnet. The exact call succeeded during Phase 0 with official Sui API protobufs pinned at `MystenLabs/sui-apis` commit `79485a8328e2f58fa047e4ce1327704b412e958a`. The supplied `SUI_DEMO_ADDRESS` returned `balance="0"` MIST and no checkpoint/finality fields; `ListBalances` was empty. Method/auth is verified; the funded-balance demo path needs a funded or replacement address. Do not silently switch to legacy JSON-RPC or an unapproved provider. The Sui Foundation mainnet JSON-RPC deprecation/disablement makes a legacy JSON-RPC assumption especially inappropriate.

Store only provider fields actually returned. A checkpoint or finality field must remain null/absent if the selected method does not supply it.

## Neon Postgres and Managed Better Auth

Official documentation:
- [Neon Managed Better Auth overview](https://neon.com/docs/auth/overview)
- [Neon Auth Next.js server SDK](https://neon.com/docs/auth/reference/nextjs-server)
- [Neon branching](https://neon.com/docs/introduction/branching)
- [PostgreSQL Row Level Security](https://www.postgresql.org/docs/current/ddl-rowsecurity.html)

Phase 0 operator-authorized change: Supabase is replaced by Neon because the Supabase quota is exhausted. Use Neon Postgres with Managed Better Auth. `DATABASE_URL_UNPOOLED` (`neondb_owner`) is for migrations only; `DATABASE_URL_APP` (`app_user`, `NOBYPASSRLS`) is for all application queries. Verify `SELECT current_user` is `app_user` and that the role cannot bypass RLS. RLS policies are plain PostgreSQL; `auth.uid()` is not available. Set request-scoped `app.user_id` inside a transaction with `set_config(..., true)` and join to `workspace_members`. Server auth uses `createNeonAuth` from `@neon/auth/next/server` with `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET`; verify and pin the exact package version during implementation. Preview and production use separate Neon projects/branches.

## Next.js

Official documentation:
- [Next.js App Router](https://nextjs.org/docs/app)

Use App Router and Node runtime for server route handlers that load gRPC and Walrus SDKs. Pin a version compatible with React/SDK dependencies during Phase 0/Phase 1; do not float major versions.

## Groq (Analyst only)

Official documentation:
- [Groq OpenAI compatibility](https://console.groq.com/docs/openai)
- [Groq structured outputs](https://console.groq.com/docs/structured-outputs)

Phase 0 operator-authorized change: OpenAI is replaced by Groq for Analyst. Use the OpenAI-compatible SDK against `https://api.groq.com/openai/v1`, `GROQ_API_KEY` server-only, and the confirmed model `qwen/qwen3.8-27b`. Structured outputs must use a strict JSON schema with `additionalProperties: false` and every property listed in `required`. The model is optional and limited to Analyst-generated explanatory text/structured draft. It cannot set numeric plan fields, invoke privileged tools, evaluate constraints or issue a Sentinel verdict. Verify current model/quota/price during implementation; use deterministic fixture text for tests and a deterministic fallback on failure.

## Vercel and TTS

- Vercel preview deployment documentation: [Deploying to Vercel](https://vercel.com/docs/deployments/overview)
- Google AI Studio / Gemini API documentation and current pricing/quota: [Google AI for Developers](https://ai.google.dev/gemini-api/docs)

A preview deployment is not production-release permission. Google TTS/model availability and any free quota must be checked at demo production time. Do not assume a particular free tier or incur charges without explicit authority.
