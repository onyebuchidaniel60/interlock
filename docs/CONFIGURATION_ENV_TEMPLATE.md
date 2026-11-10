# `.env.example` variable template (names only)

```dotenv
# Neon Postgres / Managed Better Auth
DATABASE_URL_UNPOOLED=
DATABASE_URL_APP=
NEON_AUTH_BASE_URL=
NEON_AUTH_COOKIE_SECRET=

# Walrus Memory (server-only)
MEMWAL_ACCOUNT_ID=
MEMWAL_NAMESPACE=interlock
MEMWAL_SERVER_URL=https://relayer.memory.walrus.xyz
MEMWAL_SCOUT_DELEGATE_KEY=
MEMWAL_POLICY_DELEGATE_KEY=
MEMWAL_SENTINEL_DELEGATE_KEY=
MEMWAL_RUNNER_DELEGATE_KEY=

# Tatum / Sui (server-only)
TATUM_API_KEY=
TATUM_SUI_GRPC_TARGET=sui-mainnet-grpc.gateway.tatum.io
SUI_DEMO_ADDRESS=
SUI_COIN_TYPE=0x2::sui::SUI

# Groq Analyst (server-only)
GROQ_API_KEY=
GROQ_BASE_URL=https://api.groq.com/openai/v1
GROQ_MODEL=qwen/qwen3.8-27b
GROQ_MAX_DAILY_REQUESTS=20
GROQ_MAX_OUTPUT_TOKENS=500

# Application signing/config
INTERLOCK_SIGNING_SECRET=
INTERLOCK_ENVIRONMENT=development
INTERLOCK_EXECUTION_MODE=simulation
INTERLOCK_DEMO_BASELINE_ENABLED=false
APP_BASE_URL=http://localhost:3000

# Optional public monitoring
SENTRY_DSN=
```

This is a variable-name inventory, not an authorization to create paid accounts or incur usage. `DATABASE_URL_UNPOOLED` is for migrations only; `DATABASE_URL_APP` is for application queries as `app_user` (`NOBYPASSRLS`). Never expose server-only values. Remove unused variables during implementation.
