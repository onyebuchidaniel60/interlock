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

**Important compatibility caveat:** The Tatum documentation establishes its Sui gRPC endpoint and authentication, but does not conclusively list support for the exact `StateService.GetBalance` method required here. The coding agent must smoke-test that exact method against Tatum's endpoint with the operator's key and public address before implementation relies on it. If unavailable, report the method/status and pause the Tatum integration for operator choice. Do not silently switch to legacy JSON-RPC or an unapproved provider. The Sui Foundation mainnet JSON-RPC deprecation/disablement makes a legacy JSON-RPC assumption especially inappropriate.

Store only provider fields actually returned. A checkpoint or finality field must remain null/absent if the selected method does not supply it.

## Supabase

Official documentation:
- [Supabase Auth with Next.js SSR](https://supabase.com/docs/guides/auth/server-side/nextjs)
- [Supabase Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security)
- [Supabase CLI migrations](https://supabase.com/docs/guides/cli/local-development)

Use `@supabase/ssr` for Next.js cookie-based server/client auth integration. Enforce RLS on all workspace-owned tables and test cross-tenant isolation. Do not expose service-role credentials in client code or use them as a shortcut around authorization.

## Next.js

Official documentation:
- [Next.js App Router](https://nextjs.org/docs/app)

Use App Router and Node runtime for server route handlers that load gRPC and Walrus SDKs. Pin a version compatible with React/SDK dependencies during Phase 0/Phase 1; do not float major versions.

## OpenAI

Official documentation:
- [OpenAI Responses API](https://platform.openai.com/docs/api-reference/responses)
- [Structured Outputs](https://platform.openai.com/docs/guides/structured-outputs)

The model is optional and limited to Analyst-generated explanatory text/structured draft. It cannot set numeric plan fields, invoke privileged tools, evaluate constraints or issue a Sentinel verdict. Model availability, quota, price and account permissions must be checked in intake; use deterministic fixture text for tests.

## Vercel and TTS

- Vercel preview deployment documentation: [Deploying to Vercel](https://vercel.com/docs/deployments/overview)
- Google AI Studio / Gemini API documentation and current pricing/quota: [Google AI for Developers](https://ai.google.dev/gemini-api/docs)

A preview deployment is not production-release permission. Google TTS/model availability and any free quota must be checked at demo production time. Do not assume a particular free tier or incur charges without explicit authority.
