# AI_HANDOFF.md — Interlock Current State

## Current status

- Product: **Interlock** — one agent's verified memory can prevent another agent from executing a policy-violating action.
- Implementation phase: **Phase 2 complete — auth, Neon schema, RLS and workspace membership deployed.**
- Application: protected operations console with real authentication and workspace access.
- Repository: **CONFIRMED** — `https://github.com/onyebuchidaniel60/interlock`, branch `main`.
- Phase 0 commit: `dbb87f2ebd993aa475986601a09506a56b138a11`.
- Phase 1 commit: `f8d5260e11475adc81de7b9b2e3ec5ba4c1b417f`.
- Phase 2 commits: `3a8a1b0` (`feat: implement workspace auth and isolated data model`), `14140ca` (`feat: expose verified readiness probe`).
- Preview URL: **https://interlock-8t77zyu5r-uhhh2.vercel.app**
- Deployed source commit: **`14140ca`** (deployment target: preview).
- Preview protection: **Vercel Authentication** (`ssoProtection: all_except_custom_domains`); no automation bypass; public requests return `302` to Vercel SSO.
- Neon: preview database reachable; application role `app_user` with `NOBYPASSRLS`; migrations applied through `DATABASE_URL_UNPOOLED` (`neondb_owner`) only.
- Managed Better Auth: connected; sign-up/sign-in/sign-out, server sessions, invite links and member roles work.
- Walrus Memory mainnet: Phase 0 signed write/read smoke test passed; application adapter pending Phase 3.
- Tatum Sui mainnet gRPC: Phase 0 method/auth passed; operator reports the demo address is funded. **Re-verify independently at Phase 3.** If zero at Phase 5, stop.
- Groq Analyst: not called yet; Phase 3.
- Production authorization: bounded Phase 9 release only; no production deployment or migration.
- Budget: **$0 unapproved spend; free tiers only.**
- Demo video: not produced; Kokoro TTS primary, Piper fallback.

## Phase 2 delivered

### Database

- `db/migrations/001_foundation.sql` and `002_member_labels.sql` applied to the preview Neon database.
- Versioned migration runner: `scripts/migrate.mjs`; `npm run db:migrate`.
- Tables: `workspaces`, `workspace_members`, `workspace_invitations`, `agent_identities`, `wallet_sources`, `chain_observations`, `memory_entries`, `memory_write_jobs`, `action_plans`, `decision_records`, `decision_evidence`, `execution_records`, `audit_events`, `idempotency_records`, `schema_migrations`.
- Constraints: role/status/type checks, positive integer MIST/bps checks, one active owner per workspace, one active workspace per user, unique invitation token hash, unique blob per workspace, unique decision/execution bindings.
- Indexes for candidate memory filtering, tenant reads, audit, idempotency expiry and retry scheduling.
- Immutable-ish grants: updates/deletes revoked on observations, evidence, executions, audit; deletes revoked on plans, memories, decisions, memberships and invitations.

### Roles, RLS and functions

- Application queries use `DATABASE_URL_APP` as `app_user`; startup asserts `current_user=app_user` and `rolbypassrls=false`.
- `withUser()` begins a transaction, sets `app.user_id` with `set_config(..., true)`, and releases the connection after commit/rollback.
- Plain PostgreSQL RLS on every tenant-owned table; no `auth.uid()`.
- Helpers: `app_current_user_id()`, `app_is_workspace_member(uuid)`, `app_workspace_role(uuid)`, `app_get_invitation(token_hash)`.
- Security-definer functions: `app_create_workspace(name, slug, user_id)` (creates owner membership + four agent identities + audit), `app_accept_invitation(token_hash, user_id, email)` (validates token/email/expiry, inserts active membership + audit).
- Direct workspace insert denied; cross-tenant reads and writes denied; missing `app.user_id` yields zero visible workspaces.

### Authentication and membership

- Neon Managed Better Auth via `@neon/auth/next/server` and `@neon/auth/next`; `@supabase/ssr` absent.
- `/api/auth/[...path]` proxies to Neon Auth. The route validates the browser `Origin` against an exact app allowlist and presents the auth server's own origin upstream.
- `src/proxy.ts` protects all app routes; `/login`, `/setup`, `/api/health` are public.
- `/login` has a real email/password form; `/setup` handles sign-up, workspace creation and invitation acceptance.
- Owner can create a one-time invitation link (7-day expiry); link is shown once through a short-lived httpOnly cookie, token hash stored in the DB.
- Roles: OWNER, OPERATOR, OBSERVER; member labels/email denormalized for the settings view.
- Sidebar shows real workspace, role, user and a working client-side sign-out through the auth proxy.
- `/api/readiness` returns session/membership/app_user-RLS status for authenticated members; no secrets.

## Verification evidence

- `npm run typecheck` — **PASS**.
- `npm run lint` — **PASS**.
- `npm test` — **4/4 PASS** (runtime config guard).
- `npm run test:integration` — **3/3 PASS**:
  - application connection is `app_user` with `bypassrls=false`
  - workspace bootstrap creates one owner + four agents
  - cross-tenant workspace read is invisible
  - direct workspace insert denied (`42501`)
  - cross-tenant wallet insert denied (`42501`)
  - no request identity yields zero visible workspaces
- `npm run test:e2e -- tests/e2e/shell.spec.ts` — **10/10 PASS** (public shell, auth redirects, health, mobile overflow).
- `npm run test:e2e -- tests/e2e/auth.spec.ts` with a real storage state — **4/4 PASS**:
  - real workspace + OWNER role
  - members list and owner-only invite control
  - navigation with a real session
  - `/api/readiness` proves session, membership and `app_user_rls`
- `npm run build` — **PASS**; 14 app routes plus proxy and auth/readiness APIs.
- Preview `/api/health` via authenticated CLI: `{"status":"ok","service":"interlock","phase":"2","mode":"simulation"}`.
- Preview `/api/auth/sign-up/email` via the proxy returned a Better Auth user token (synthetic test account), proving deployed auth wiring.
- Public preview `/api/health` → `302` to Vercel SSO.
- Migration runner verified `current_user=neondb_owner` before applying; application role verified `app_user`.

## Phase 2 issues and fixes

- Neon Auth rejected app-origin requests (`INVALID_ORIGIN`) because it only trusted its own origin/localhost. Added an allowlisted server proxy that validates the browser origin then presents the auth server origin upstream. This prevents arbitrary-origin auth calls while enabling preview auth.
- Server-action sign-out used the app origin and failed. Moved sign-out to the client auth proxy.
- Invite link initially used `APP_BASE_URL` (localhost:3000) and pointed at the wrong port in local tests. It now derives the origin from trusted request headers.
- Sign-up via server actions could not set/refresh the cross-origin auth cookies reliably. Auth forms now use the documented client SDK through the proxied `/api/auth` route.
- First sign-up redirect lost the invitation token. Login now preserves a validated `/setup?token=...` target.
- RLS integration test needed savepoints after expected `42501` failures to avoid aborting the transaction; fixed.
- Auth E2E initially signed in for every test and hit timing/rate pressure. It now uses a Playwright storage state (`E2E_AUTH_STATE`) and serial desktop coverage.
- Settings page can take several seconds on a cold Neon connection; its E2E wait is 20 seconds.

## Next task — Phase 3

Implement the core domain and provider adapters:

1. Tatum gRPC adapter using the exact verified `StateService.GetBalance` method, official pinned protos, integer MIST strings, no fabricated checkpoint/finality fields. **Independently re-verify `SUI_DEMO_ADDRESS` is non-zero. If zero, stop and report.**
2. Walrus Memory adapter using role-scoped delegate keys, namespace `interlock`, `remember`/`waitForRememberJob`, metadata listing, recall and content/hash/author verification.
3. Canonical JSON/hash utilities and Zod schemas for FACT, CONSTRAINT, VERDICT, OUTCOME.
4. Memory write lifecycle and `memory_entries`/`memory_write_jobs` persistence; active only after verified recall.
5. Groq Analyst adapter with strict JSON schema and deterministic fallback; zero policy authority.
6. Deterministic candidate query + Sentinel evaluator + final VERDICT memory requirement.
7. Runner signed, short-lived, single-use simulation clearance.
8. API contracts, idempotency and failure handling.
9. Tests: adapter contract tests, 10%/15% decision scenario, missing/stale/conflict HOLD, clearance replay/concurrency.
10. Update AI_HANDOFF/BUILD_LOG, commit `feat: implement core decision pipeline`, deploy preview, continue.

## Authorization boundaries

- Preview only; production gated to Phase 9.
- No private keys/seed phrases; Tatum public address only; Runner simulation only.
- No real transactions, transfers, trades or custody.
- Secrets server-only; `.env.local` ignored; preview env contains only preview values.
- No production DB migration until a verified backup/rollback path exists.
- No DNS, public marketing or production data import.

## Known open issues

1. Tatum funded-balance re-check is required in Phase 3 (stop if zero).
2. Provider adapters and decision pipeline are not implemented yet.
3. Groq has not been called.
4. Final reference-led UI is Phase 6.
5. Demo video/TTS is Phase 8.
6. No production deployment/migration.
