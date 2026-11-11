# SETUP.md — Developer Setup

This repository contains a working Next.js 16 application with Neon Postgres, Managed Better Auth, Tatum gRPC, Walrus Memory and deterministic Sentinel/Runner services.

## Prerequisites

- Node.js 22.x and npm 10+.
- A Neon project/branch with:
  - `DATABASE_URL_UNPOOLED` for `neondb_owner` migrations.
  - `DATABASE_URL_APP` for `app_user` with `NOBYPASSRLS`.
  - Managed Better Auth enabled (`NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`).
- Dedicated Walrus Memory account/namespace and Scout/Policy/Sentinel/Runner delegate keys.
- Tatum Sui mainnet gRPC key and a funded public Sui address.
- Optional Groq key/model for Analyst; deterministic fallback is available.
- Vercel project access for protected preview.

## Local setup

```bash
git clone https://github.com/onyebuchidaniel60/interlock.git
cd interlock
npm install
cp .env.example .env.local
```

Fill `.env.local` from the approved secret store. Never commit it. Notes:

- `DATABASE_URL_UNPOOLED` is migration-only.
- `DATABASE_URL_APP` is used by every application query as `app_user`.
- `NEON_AUTH_COOKIE_SECRET` must be at least 32 characters.
- `INTERLOCK_SIGNING_SECRET` must be a strong random value.
- `INTERLOCK_ENVIRONMENT=preview` and `INTERLOCK_DEMO_BASELINE_ENABLED=true` are valid only for preview/test.

Apply migrations:

```bash
npm run db:migrate
```

This checks `current_user=neondb_owner` before applying `db/migrations/*.sql` and records versions in `schema_migrations`.

Start the app:

```bash
npm run dev
```

Open `http://localhost:3000`. If port 3000 is occupied, use `npm run dev -- --port 3127` and keep the auth/origin allowlist in mind.

## First workspace

1. Open `/setup`.
2. Create an account with email/password.
3. Create the workspace (owner membership and five agent identities are created by a security-definer function).
4. Open `/settings` and record a 1000 bps exposure policy for the funded public address.
5. Open `/observations`, run Scout, then create a plan.

## Verification

```bash
npm run typecheck
npm run lint
npm test
npm run test:integration
npm run build
npm run test:e2e
```

Integration tests load `.env.local`; they skip if required variables are absent. The live pipeline writes synthetic Walrus memories and requires the funded demo address.

For authenticated E2E, create a Playwright storage state after signing in and set `E2E_AUTH_STATE`. Set `E2E_LIVE_DEMO=1` for the live comparison test.

## Common setup failures

- **`current_user` is `neondb_owner` in app requests** — the application is using the wrong URL. Use `DATABASE_URL_APP`.
- **`INVALID_ORIGIN` from Neon Auth** — auth requests must go through `/api/auth/[...path]`; the route validates the browser origin and forwards with the auth server origin.
- **RLS sees zero rows** — `app.user_id` was not set in the transaction or membership is not ACTIVE.
- **Walrus write pending/failed** — memory remains PENDING/FAILED, never ACTIVE. Check namespace/delegate/relayer.

See `TROUBLESHOOTING.md` for more.

## Session behavior and login checks

- Managed Better Auth sessions persist across reloads; the proxy refreshes cached session data from the session token.
- Sign-out is performed through `/api/auth` on the client so the upstream cookie is cleared.
- A cleared/expired session redirects to `/login`; after sign-in the app goes to the requested safe path when it is preserved, otherwise the dashboard. Middleware does not preserve the previous path on expiry by design.
- Invite acceptance requires the signed-in email to match the invitation email; the invited account receives the assigned OPERATOR/OBSERVER role.
- Session, reload, logout, expiry and invited-member checks are in `tests/e2e/session.spec.ts`.
