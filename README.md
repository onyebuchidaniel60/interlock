# Interlock

**A shared-memory execution safety layer for multi-agent applications.** Interlock lets one agent's verified discovery prevent another agent from executing an action that violates a known constraint.

> **Status: functional MVP.** Authentication, Neon/RLS, Tatum observations, Walrus Memory writes/recall, deterministic Sentinel decisions, one-time simulated execution and the Memory OFF/ON demo comparison are implemented and tested. The demo video is still pending.

**Protected preview:** <https://interlock-835nkre11-uhhh2.vercel.app> (Vercel Authentication required)

## What it does

- **Scout** reads a public Sui balance from Tatum, persists an immutable observation, writes a typed FACT to Walrus Memory and verifies the recalled payload before activation.
- **Analyst** may draft explanatory text through Groq. It has no policy authority.
- **Sentinel** enumerates applicable evidence deterministically, recalls the exact Walrus records, verifies namespace/author/blob/hash, applies fixed integer rules and writes a VERDICT memory.
- **Runner** accepts only a final APPROVE with a verified VERDICT memory. It mints a short-lived, plan/workspace/decision-bound, single-use clearance and records one simulation. No transaction is submitted.

Walrus Memory mainnet is the memory system of record. Neon Postgres is the deterministic index and application-state store. Tatum provides read-only Sui observations.

## Safety boundary

The MVP is simulation-only. No real trading, transfers, wallet custody, private-key collection, signing or payment execution. Missing, stale, conflicting or unverifiable evidence produces HOLD. The Memory OFF baseline exists only in an explicitly enabled protected preview and startup fails if it is enabled in production.

## Preview journeys

1. Sign in or create an account, then create/join a workspace.
2. Open **Observations** → run Scout with the funded public demo address.
3. Open **Settings** → record a 1000 bps (10%) exposure policy.
4. Open **Plans → Create plan** → enter 1500 bps (15%) and run Sentinel.
5. Open the decision → inspect the cited Walrus evidence and REJECT reason.
6. Run the **Demo compare** route for the same-plan Memory OFF/ON comparison.
7. A 500 bps plan can reach APPROVE and one simulated execution; a second simulation is blocked.

## Local development

```bash
npm install
cp .env.example .env.local       # provider values; never commit this file
npm run db:migrate               # DATABASE_URL_UNPOOLED, neondb_owner only
npm run dev                      # http://localhost:3000
npm run check                    # typecheck + lint + 14 unit tests
npm run test:integration         # Neon RLS + live Tatum + Walrus decision pipeline
npm run build
npm run test:e2e                 # public shell/protection tests (production build, port 3127)
E2E_AUTH_STATE=/path/to/state.json npm run test:e2e -- tests/e2e/auth.spec.ts
E2E_AUTH_STATE=/path/to/state.json E2E_LIVE_DEMO=1 npm run test:e2e -- tests/e2e/live-demo.spec.ts
```

Local `.env.local` is ignored. The preview does not use production secrets or customer data.

## Architecture at a glance

```text
Browser → Neon Managed Better Auth session
       → Next.js 16 Route Handlers / Server Actions
       → Scout: Tatum Sui gRPC + Walrus FACT
       → Sentinel: Neon candidate index + Walrus recall + deterministic rules + VERDICT
       → Runner: signed one-time clearance + simulation record
```

- `DATABASE_URL_UNPOOLED` (`neondb_owner`) is migration-only.
- `DATABASE_URL_APP` (`app_user`, `NOBYPASSRLS`) serves all app queries.
- RLS uses request-scoped `app.user_id`; `auth.uid()` is not available.
- Walrus evidence must pass metadata + exact recall + SHA-256 + author verification.

## API

- `POST /api/observations` — read-only Tatum observation + Scout FACT.
- `POST /api/policies` — owner-only verified CONSTRAINT.
- `POST /api/plans` — immutable plan.
- `POST /api/plans/:id/check` — deterministic Sentinel evaluation + VERDICT.
- `POST /api/decisions/:id/simulate` — one-time simulation.
- `GET /api/health` — process health.
- `GET /api/readiness` — session, membership and `app_user` RLS proof.

All mutations require a verified session, workspace membership and role; client-supplied workspace/role/verdict is never trusted. See `docs/API.md`.

## Documentation

- `docs/SETUP.md` — local setup and migration.
- `docs/CONFIGURATION.md` — environment variables and role boundaries.
- `docs/TESTING.md` — unit/integration/E2E/security test plan.
- `docs/DEPLOYMENT.md` — Vercel preview and production gate.
- `docs/TROUBLESHOOTING.md` — common failures.
- `docs/OPERATOR_GUIDE.md` — demo operator flow.
- `docs/DESIGN_NOTES.md` — reference-led visual decisions.
- `docs/BUILD_LOG.md` — phase-by-phase evidence.
- `AI_HANDOFF.md` — current state, commits and next task.
- `PROJECT_SPEC.md` / `ARCHITECTURE.md` — product and architecture source of truth.

## Current limitations

- Production is not deployed; the release remains gated to Phase 9.
- The demo video is pending Phase 8.
- Analyst is optional and fallback-first; Sentinel never depends on it.
- The interface is reference-led but intentionally functional rather than a marketing site.

## License and assets

The four UI reference images in `design/reference/` are operator-owned originals. The product does not copy third-party logos, trade dress or text. Sui API protobufs are vendored from `MystenLabs/sui-apis` (Apache-2.0).
