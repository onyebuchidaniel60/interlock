# CONFIGURATION.md — Environment Variables and Secret Handling

Never commit real values. `.env.example` / `docs/CONFIGURATION_ENV_TEMPLATE.md` contain names and safe placeholders only. All secrets are server-only. Any variable prefixed `NEXT_PUBLIC_` is browser-visible; it may contain only genuinely public values (for example the canonical app URL), never credentials.

## Environment variables

| Variable | Required | Scope | Purpose |
|---|---|---|---|
| `DATABASE_URL_UNPOOLED` | Yes (migrations/CI only) | Server/CI secret | Neon direct migration connection; role `neondb_owner`; **never used by application runtime** |
| `DATABASE_URL_APP` | Yes | Server-only secret | Neon application connection; role `app_user` with `NOBYPASSRLS`; all application queries |
| `NEON_AUTH_BASE_URL` | Yes | Server-only config | Managed Better Auth server URL from Neon Console |
| `NEON_AUTH_COOKIE_SECRET` | Yes | Server-only secret | Session cookie signing secret; 32+ characters; generate with `openssl rand -base64 32` |
| `MEMWAL_ACCOUNT_ID` | Yes | Server-only | Dedicated Interlock Walrus Memory account ID |
| `MEMWAL_NAMESPACE` | Yes | Server-only config | `interlock` for preview; `interlock-prod` for production |
| `MEMWAL_SERVER_URL` | Yes | Server-only | Mainnet relayer; default `https://relayer.memory.walrus.xyz` |
| `MEMWAL_SCOUT_DELEGATE_KEY` | Yes | Server-only secret | Scout Walrus delegate credential |
| `MEMWAL_POLICY_DELEGATE_KEY` | Yes | Server-only secret | Policy writer delegate credential |
| `MEMWAL_SENTINEL_DELEGATE_KEY` | Yes | Server-only secret | Sentinel delegate credential |
| `MEMWAL_RUNNER_DELEGATE_KEY` | Optional | Server-only secret | Runner OUTCOME memory credential if required |
| `TATUM_API_KEY` | Yes | Server-only secret | Tatum gRPC authentication header `x-api-key`; mainnet |
| `TATUM_SUI_GRPC_TARGET` | Yes | Server-only config | Allowlisted target; expected `sui-mainnet-grpc.gateway.tatum.io` |
| `SUI_DEMO_ADDRESS` | Yes for demo | Server-only config | Public Sui address for read-only observation; must be funded/non-zero for the funded-balance demo |
| `SUI_COIN_TYPE` | Yes | Server-only config | Default `0x2::sui::SUI` |
| `GROQ_API_KEY` | Yes for Analyst | Server-only secret | Groq API key; server-only |
| `GROQ_BASE_URL` | Optional | Server-only config | Default `https://api.groq.com/openai/v1` |
| `GROQ_MODEL` | Yes for Analyst | Server-only config | Confirmed `qwen/qwen3.8-27b`; do not assume another model supports strict structured outputs |
| `GROQ_MAX_DAILY_REQUESTS` | Yes for Analyst | Server-only config | Application-level daily request cap; free-tier guard |
| `GROQ_MAX_OUTPUT_TOKENS` | Optional | Server-only config | Strict output bound |
| `INTERLOCK_SIGNING_SECRET` | Yes | Server-only secret | Signs Runner approval clearance; strong random secret or asymmetric key design |
| `INTERLOCK_ENVIRONMENT` | Yes | Server-only config | `development|test|preview|production` |
| `INTERLOCK_EXECUTION_MODE` | Yes | Server-only config | MVP must be `simulation` |
| `INTERLOCK_DEMO_BASELINE_ENABLED` | Yes | Server-only config | `true` only in local/test/protected preview; must be `false` in production |
| `APP_BASE_URL` | Yes | Server-only config | Canonical app URL for redirects and links |
| `NEXT_PUBLIC_APP_BASE_URL` | Optional | Client-safe | Public canonical app URL only; never a secret |
| `SENTRY_DSN` | Optional | Client-safe only if configured as public DSN | Error monitoring; only add after approval |

## Removed variables

The following Supabase/OpenAI variables are obsolete and must not be reintroduced:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`
- `SUPABASE_PROJECT_REF`
- `SUPABASE_ACCESS_TOKEN`
- `SUPABASE_SERVICE_ROLE_KEY`
- `OPENAI_API_KEY`
- `OPENAI_MODEL`
- `OPENAI_MAX_OUTPUT_TOKENS`
- `OPENAI_MAX_DAILY_REQUESTS`
- `OPENAI_MAX_ESTIMATED_DAILY_USD`

`@supabase/ssr`, the Supabase CLI and Supabase Auth are removed from the fixed stack.

## Neon connection and RLS invariants

- **Migrations only:** `DATABASE_URL_UNPOOLED` connects as `neondb_owner`. This role has `BYPASSRLS`; it must never serve application traffic.
- **Application only:** `DATABASE_URL_APP` connects as `app_user`, which has `NOBYPASSRLS` and must not own application tables. All route handlers, server actions and background jobs use this connection.
- At startup/readiness, execute `SELECT current_user` and fail closed unless the result is `app_user`. Also verify the role does not have `rolbypassrls` and does not own tenant tables.
- RLS policies are plain PostgreSQL. `auth.uid()` is not available. Set request-scoped context inside a transaction with `set_config('app.user_id', $1, true)`, then query. Missing/empty context must deny.
- Use transaction-local settings, not session-global `SET`, because pooled connections are reused.
- Never let a client choose the database role, user ID, workspace ID or policy context.
- Migration files are version-controlled SQL. Apply them through a reviewed migration command using `DATABASE_URL_UNPOOLED`; never run destructive schema push against production without the bounded authority and a verified backup/rollback path.

## Groq invariants

- `GROQ_API_KEY` is server-only and never included in client bundles, logs or error reports.
- Requests use the OpenAI-compatible base URL `https://api.groq.com/openai/v1`.
- Analyst requests must use strict JSON schema structured outputs: `additionalProperties: false` and every property listed in `required`.
- Validate the response with Zod and reject/fallback on schema failure. Model output never sets numeric plan fields, evaluates policy or issues a Sentinel verdict.
- Enforce `GROQ_MAX_DAILY_REQUESTS` and a request timeout; no paid overage or unapproved spend.

## Provider and secret invariants

- App startup must fail if `INTERLOCK_EXECUTION_MODE` is not `simulation` in the MVP.
- App startup must fail if `INTERLOCK_ENVIRONMENT=production` and `INTERLOCK_DEMO_BASELINE_ENABLED=true`.
- Do not accept Tatum target or Walrus relayer URL from user input; enforce allowlisted known endpoints.
- Never request a wallet private key/seed phrase.
- Never include Walrus delegate credentials, Tatum keys, Groq keys, Neon URLs/secrets or signing secrets in browser bundles, error reports or logs.
- A secret's presence does not mean the operator authorized cost or production usage.
- Exact values live in the approved secret store or local `.env.local`; document references and validation status, not values.
