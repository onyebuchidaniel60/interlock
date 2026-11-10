# CONFIGURATION.md — Environment Variables and Secret Handling

Never commit real values. `.env.example` contains names and safe placeholders only. All secrets are server-only. Any variable prefixed `NEXT_PUBLIC_` is browser-visible and may contain only public Supabase URL/key.

| Variable | Required | Scope | Purpose |
|---|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | Yes | Client-safe | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Yes | Client-safe | Supabase publishable/anon key; RLS remains mandatory |
| `SUPABASE_PROJECT_REF` | CLI optional | Server/CI secret or config | Supabase CLI project reference |
| `SUPABASE_ACCESS_TOKEN` | CI/deploy optional | Server/CI secret | Supabase CLI access; never browser |
| `SUPABASE_SERVICE_ROLE_KEY` | Avoid in normal app | Server-only, privileged | Only if a narrowly justified maintenance path requires it; never client and never used to bypass user auth |
| `MEMWAL_ACCOUNT_ID` | Yes | Server-only | Dedicated Interlock Walrus Memory account ID |
| `MEMWAL_NAMESPACE` | Yes | Server-only | Dedicated Interlock namespace |
| `MEMWAL_SERVER_URL` | Yes | Server-only | Mainnet relayer; default `https://relayer.memory.walrus.xyz` |
| `MEMWAL_SCOUT_DELEGATE_KEY` | Yes | Server-only secret | Scout Walrus delegate credential |
| `MEMWAL_POLICY_DELEGATE_KEY` | Yes | Server-only secret | Policy writer delegate credential |
| `MEMWAL_SENTINEL_DELEGATE_KEY` | Yes | Server-only secret | Sentinel delegate credential |
| `MEMWAL_RUNNER_DELEGATE_KEY` | Optional | Server-only secret | Runner OUTCOME memory credential if required |
| `TATUM_API_KEY` | Yes | Server-only secret | Tatum gRPC authentication header `x-api-key` |
| `TATUM_SUI_GRPC_TARGET` | Yes | Server-only | Approved target; expected `sui-mainnet-grpc.gateway.tatum.io` |
| `SUI_DEMO_ADDRESS` | Yes for demo | Server-only config | Public Sui address for read-only observation |
| `SUI_COIN_TYPE` | Yes | Server-only config | Default `0x2::sui::SUI` |
| `OPENAI_API_KEY` | Optional | Server-only secret | Analyst language helper only |
| `OPENAI_MODEL` | Optional | Server-only config | Model confirmed during intake; do not assume availability |
| `OPENAI_MAX_OUTPUT_TOKENS` | Optional | Server-only config | Strict output bound |
| `OPENAI_MAX_DAILY_REQUESTS` | Optional | Server-only config | Cost/abuse limit |
| `OPENAI_MAX_ESTIMATED_DAILY_USD` | Optional | Server-only config | Application-level soft/hard budget cap; provider billing remains authoritative |
| `INTERLOCK_SIGNING_SECRET` | Yes | Server-only secret | Signs Runner approval clearance; use strong random secret or asymmetric key design |
| `INTERLOCK_ENVIRONMENT` | Yes | Server-only config | `development|test|preview|production` |
| `INTERLOCK_EXECUTION_MODE` | Yes | Server-only config | MVP must be `simulation` |
| `INTERLOCK_DEMO_BASELINE_ENABLED` | Yes | Server-only config | `true` only in local/test/protected preview; must be false in production |
| `APP_BASE_URL` | Yes | Server-only config | Canonical app URL for redirects and links |
| `SENTRY_DSN` | Optional | Client-safe only if configured as public DSN | Error monitoring; only add after approval |

## Configuration invariants

- App startup must fail if `INTERLOCK_EXECUTION_MODE` is not `simulation` in the MVP.
- App startup must fail if `INTERLOCK_ENVIRONMENT=production` and `INTERLOCK_DEMO_BASELINE_ENABLED=true`.
- Do not accept Tatum target or Walrus relayer URL from user input; enforce allowlisted known endpoints.
- Never request a wallet private key/seed phrase.
- Never include Walrus delegate credentials or Tatum/OpenAI keys in browser bundles, error reports or logs.
- A secret's presence does not mean the operator authorized cost or production usage.
- Exact keys/secret names and values are configured during Phase 0 in the chosen deployment secret store; document references, not values.
