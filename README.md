# Interlock

## Quick Start — Try It Now

**Live production:** <https://interlock-recall.vercel.app>

**Demo login:** `demo@interlock.dev` / `InterlockDemo2026!`

**Demo role:** OWNER of **Interlock Demo Workspace** (pre-seeded observation, 10% policy, REJECT and APPROVE examples).

> Use `interlock-recall.vercel.app` for submission. Do **not** use `interlock.vercel.app`, which belongs to an unrelated app. The `/demo` comparison route returns 404 in production; it remains in the protected preview and demo video.

### See the core safety decision in four steps

| Step | Action | Expected outcome |
|---|---|---|
| 1 | Open `/login` and sign in with the demo credentials | **Interlock Demo Workspace** dashboard loads with OWNER role. |
| 2 | Click **New Observation** (runs Scout against the funded public Sui address) | Tatum returns a non-zero balance; a FACT is written to Walrus and verified by recall in about 15–40 seconds. |
| 3 | Open **Plans → New Plan**; amount `100000000` MIST, exposure `1500` bps; submit | An immutable plan hash is created for 15% exposure. |
| 4 | Open the plan → **Request Check** | Deterministic **REJECT** with reason `EXPOSURE_BPS_EXCEEDED`, citing the verified 10% CONSTRAINT and the live FACT. |

On the decision page, open **Cited evidence** to see Walrus blob IDs, SHA-256 hashes, authors, verification status and copy buttons. The **Tatum anchor** panel shows provider, method, balance and observation ID. A compliant `500` bps plan reaches **APPROVE** and exposes **Simulate once**; replay returns `ALREADY_SIMULATED`. Missing policy, stale evidence or failed recall returns **HOLD**. Execution is simulated; no funds move.

## Product summary

Interlock is a decision audit tool that lets one agent's verified Walrus Memory discovery deterministically block another agent from taking a policy-violating action. Tatum supplies a read-only Sui observation, Sentinel verifies every cited Walrus record and returns APPROVE / REJECT / HOLD, and Runner records a simulation only after a final approved decision has a completed, recalled VERDICT memory.

## Architecture

```text
Browser → Neon Managed Better Auth session
       → Next.js 16 Route Handlers / Server Actions
       → Scout: Tatum Sui gRPC + Walrus FACT
       → Sentinel: Neon candidate index + Walrus recall + deterministic integer rules + VERDICT
       → Runner: HMAC-signed 60s one-time clearance + simulation record
```

- **Walrus Memory mainnet is the memory system of record.** Neon is the deterministic index and application state.
- **Sentinel is deterministic.** Groq/Analyst may draft explanatory text only; it has zero policy authority.
- **Fail closed.** Missing/stale/conflicting/unverifiable evidence or missing policy → HOLD.
- **Final APPROVE requires** a completed, verified and recalled VERDICT memory.
- **Runner is simulation-only.** No custody, signing, transactions or transfers.
- `DATABASE_URL_UNPOOLED` (`neondb_owner`) is migration-only; `DATABASE_URL_APP` (`app_user`, `NOBYPASSRLS`) serves all app queries.
- RLS uses request-scoped `app.user_id`; `auth.uid()` is not available.

## Development

```bash
npm install
cp .env.example .env.local       # fill provider values; never commit
npm run db:migrate               # DATABASE_URL_UNPOOLED, neondb_owner only
npm run dev                      # http://localhost:3000
npm run check                    # typecheck + lint + unit tests
npm run build
npm run test:e2e                 # production build, port 3127
```

Authenticated E2E:

```bash
E2E_AUTH_STATE=/path/to/state.json npm run test:e2e -- tests/e2e/auth.spec.ts
E2E_AUTH_STATE=/path/to/state.json npm run test:e2e -- tests/e2e/responsive-auth.spec.ts
E2E_AUTH_STATE=/path/to/state.json E2E_LIVE_DEMO=1 npm run test:e2e -- tests/e2e/live-demo.spec.ts
```

## Configuration

Required server-side values are documented in `docs/CONFIGURATION.md`:

- `DATABASE_URL_UNPOOLED` / `DATABASE_URL_APP`
- `NEON_AUTH_BASE_URL` / `NEON_AUTH_COOKIE_SECRET`
- `MEMWAL_ACCOUNT_ID`, `MEMWAL_NAMESPACE`, `MEMWAL_SERVER_URL`, four delegate keys
- `TATUM_API_KEY`, `TATUM_SUI_GRPC_TARGET`, `SUI_DEMO_ADDRESS`, `SUI_COIN_TYPE`
- `GROQ_API_KEY` / `GROQ_MODEL` (optional Analyst)
- `INTERLOCK_SIGNING_SECRET`
- `INTERLOCK_ENVIRONMENT`, `INTERLOCK_EXECUTION_MODE=simulation`, `INTERLOCK_DEMO_BASELINE_ENABLED`
- `APP_BASE_URL`

No secret is browser-visible. The preview does not use production secrets or customer data.

## Testing

- `npm test` — canonical hashing, Sentinel decisions, clearance signing.
- `npm run test:integration` — Neon RLS, live Tatum, live Walrus pipeline, replay block.
- `npm run test:e2e` — public shell, auth redirects, production-build route tests.
- Authenticated specs cover workspace access, live data, evidence, responsive layouts and the live Memory OFF/ON comparison.

Full strategy: `docs/TESTING.md`. Evidence: `docs/BUILD_LOG.md`.

## Deployment

- **Preview:** Vercel project `interlock`, Vercel Authentication, target `preview`.
- **Production:** `https://interlock-recall.vercel.app`; Vercel project `interlock-recall`; production env is separate from preview `APP_BASE_URL`, `INTERLOCK_ENVIRONMENT=production`, `INTERLOCK_DEMO_BASELINE_ENABLED=false` and a fresh signing secret.
- **Preview-only:** `/demo` returns 404 in production. The Memory OFF/ON comparison remains available in the protected preview and demo video.
- Details and env names: `docs/DEPLOYMENT.md`.

## Troubleshooting

Common failures and root causes: `docs/TROUBLESHOOTING.md`.

- `INVALID_ORIGIN` → use `/api/auth/[...path]`; do not call Neon Auth directly.
- Zero RLS rows → missing `app.user_id` or inactive membership.
- Pending/missing Walrus recall → HOLD; metadata alone is not evidence.
- Simulation absent → decision is not FINAL_APPROVED.
- First Vercel deployment auto-production → remove it and create an explicit `--environment preview` deployment.

## Documentation

- `docs/SETUP.md` — fresh-developer setup and migrations.
- `docs/CONFIGURATION.md` — env variables and role boundaries.
- `docs/TESTING.md` — test matrix and acceptance evidence.
- `docs/DEPLOYMENT.md` — preview/production gate.
- `docs/OPERATOR_GUIDE.md` — operator flow matching this Quick Start.
- `docs/DESIGN_NOTES.md` — reference-led visual decisions.
- `docs/BUILD_LOG.md` — phase-by-phase evidence.
- `docs/AI_HANDOFF.md` — current commit, tests and outstanding blockers.
- `docs/PROJECT_SPEC.md` / `docs/ARCHITECTURE.md` — product and architecture source of truth.

## Demo video

`demo/interlock-demo.mp4` — 109.36 seconds, Kokoro ONNX `af_bella`, captions, real preview data. Production notes: `demo/production-notes.md`.

## Assets and licence

The four UI reference images in `design/reference/` are operator-owned originals. The product does not copy third-party logos, trade dress or text. Sui API protobufs are vendored from `MystenLabs/sui-apis` (Apache-2.0).
