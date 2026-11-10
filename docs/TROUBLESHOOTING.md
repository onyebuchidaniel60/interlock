# TROUBLESHOOTING.md — Interlock Operations

## Authentication

### `INVALID_ORIGIN` from Neon Auth
Neon Auth validates the upstream origin. Browser auth calls must go through `/api/auth/[...path]`, which validates the app origin against its allowlist and presents the auth server origin upstream. Do not call the Neon Auth base URL directly from a server action or client.

Allowed app origins come from `APP_BASE_URL`, Vercel deployment envs, and local `localhost`/`127.0.0.1` ports. If a new host is used, add it to the allowlist in the auth route.

### Sign-in works but the app redirects to `/setup`
The authenticated user has no ACTIVE workspace membership. Create a workspace or accept an owner-issued invitation. Membership is server-verified; a client-supplied workspace ID is ignored.

### Invitation link points to the wrong host
Invite links derive from `x-forwarded-host`/`host` and `x-forwarded-proto`. Use the current preview URL. The raw token is shown only once through a short-lived httpOnly cookie; if lost, create a new invitation.

## Database and RLS

### Application sees zero workspaces
The request transaction did not set `app.user_id`, or the user has no ACTIVE membership. Verify `withUser()` was used and `select current_user` is `app_user` with `rolbypassrls=false`.

### `permission denied` on direct insert
Expected: workspace creation and invitation acceptance go through security-definer functions. Direct `workspaces` insert is denied by design (`42501`).

### Migration fails
`npm run db:migrate` must use `DATABASE_URL_UNPOOLED` as `neondb_owner`. Do not use the app URL. Check `schema_migrations` and the exact SQL error. Never run destructive operations on production without a verified backup.

## Tatum

- **`GetBalance` returns zero**: the app records a zero observation safely, but plan creation is blocked. Fund/confirm `SUI_DEMO_ADDRESS`; do not fabricate a non-zero balance.
- **Auth/transport errors**: verify `TATUM_API_KEY`, allowlisted target `sui-mainnet-grpc.gateway.tatum.io`, TLS and official protos under `proto/`.
- **No checkpoint/finality fields**: correct. The provider response only contains what is returned; Interlock does not invent metadata.

## Walrus

- **Write stays pending**: the memory remains PENDING and is never evidence. Check relayer, namespace, delegate key and job status.
- **Metadata exists but recall misses the blob**: HOLD. `listMemories` is metadata only; recall content is required.
- **Hash/author/namespace mismatch**: quarantine/FAILED; do not use.
- **Slow writes**: observation/evaluation pages allow up to 60 seconds. Do not retry blindly; check the job state and database status.

## Sentinel / Runner

- **HOLD with `NO_POLICY`**: create a verified CONSTRAINT. Missing policy is never permission.
- **HOLD with `EVIDENCE_UNVERIFIED`**: at least one expected Walrus record could not be recalled/verified.
- **HOLD with `OBSERVATION_STALE`**: run Scout again; freshness is 300 seconds.
- **Simulation button absent**: only `FINAL_APPROVED` decisions with a verified VERDICT memory can be simulated.
- **`ALREADY_SIMULATED`**: one execution per decision; the unique constraint blocks replay.

## Vercel

- **Preview 404**: confirm the project framework is `nextjs` and Node `22.x`; redeploy after changing project settings.
- **`vercel curl` creates an automation bypass**: disable it after verification with `vercel project protection ... --protection-bypass`; confirm `protectionBypass` is empty.
- **First deployment auto-promoted to production**: remove that deployment and create a new `--environment preview` deployment. Do not use `--prod` before Phase 9.

## Local tests

- Port 3000 may be occupied by another process; Playwright uses `3127`.
- Auth E2E requires `E2E_AUTH_STATE` from a real signed-in context.
- Live comparison requires `E2E_LIVE_DEMO=1`; it writes real synthetic Walrus memories.
- If external integrations are unavailable, tests must be marked skipped/blocked, never passed.
