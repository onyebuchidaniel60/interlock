# Interlock

Interlock is a decision audit tool that lets one agent's verified Walrus Memory discovery deterministically block another agent from taking a policy-violating action. Tatum supplies a read-only Sui observation, Sentinel verifies every cited Walrus record and returns APPROVE / REJECT / HOLD, and Runner records a simulation only after a final approved decision has a completed, recalled VERDICT memory.

## Quick Start — Try It Now

**Protected preview:** <https://interlock-hud4jt7nr-uhhh2.vercel.app>

**Access:** Vercel Authentication is enabled. Request access from the operator with the Vercel account email you will use; there are no public demo credentials in this repository.

> **Production URL status (submission blocker):** `https://interlock.vercel.app` is **not this project** — it currently serves an unrelated Vercel app. Interlock production is not deployed because the operator has not provided a production domain under this Vercel project or a separate production Neon project/branch, Managed Auth configuration and backup/rollback path. Do not submit `interlock.vercel.app` as this product's URL until that is resolved.

### The exact click path (about 2–3 minutes after sign-in)

| Step | Action | Expected outcome |
|---|---|---|
| 1 | Sign in at `/login` | Workspace dashboard loads with the real workspace and role. |
| 2 | Open **Observations** → **Run Scout** with the funded public SUI address prefilled | Tatum returns a non-zero balance; a FACT is written to Walrus and verified by recall. |
| 3 | Open **Settings** → **Exposure policy**; keep/record `1000` bps and submit | A verified `MAX_EXPOSURE_BPS` CONSTRAINT appears as active. |
| 4 | Open **Plans → Create plan**; amount `100000000` MIST, exposure `1500` bps, submit | An immutable plan hash is created. |
| 5 | Open the plan → **Evaluate with Sentinel** | The decision returns **REJECT** with reason `EXPOSURE_BPS_EXCEEDED`. |
| 6 | Open the decision → **Cited evidence** | The FACT and CONSTRAINT are marked VERIFIED with Walrus blob IDs, hashes and authors. |
| 7 | Copy a blob/hash or open the **Tatum anchor** panel | Provenance labels show the exact observation, provider, method, balance and timestamp. |
| 8 | Open **Demo compare** → **Run comparison** | Same plan hash: unguarded baseline says WOULD PASS; protected path says REJECT with real citations. |

A compliant `500` bps plan reaches **APPROVE** and exposes **Simulate once**; after one simulation the control is replaced by the execution record and replay returns `ALREADY_SIMULATED`. A missing policy, stale observation, incomplete recall or unverified record returns **HOLD**.

If you do not have preview access, run the local flow in **Development** below. The product is simulation-only: no funds move, no wallet is connected and no transaction is submitted.

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
- **Production:** blocked pending a domain under this project and separate production Neon/Walrus credentials plus a verified backup/rollback path. No production deployment or migration has been performed.
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
- `AI_HANDOFF.md` — current commit, tests and outstanding blockers.
- `PROJECT_SPEC.md` / `ARCHITECTURE.md` — product and architecture source of truth.

## Demo video

`demo/interlock-demo.mp4` — 109.36 seconds, Kokoro ONNX `af_bella`, captions, real preview data. Production notes: `demo/production-notes.md`.

## Assets and licence

The four UI reference images in `design/reference/` are operator-owned originals. The product does not copy third-party logos, trade dress or text. Sui API protobufs are vendored from `MystenLabs/sui-apis` (Apache-2.0).
