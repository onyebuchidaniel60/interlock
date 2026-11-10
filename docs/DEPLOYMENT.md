# DEPLOYMENT.md — Preview and Release

## Environments

- `development`: local development with disposable/sandbox Neon branch and provider mocks where appropriate.
- `test`: automated test services, disposable Neon branches and deterministic fixtures.
- `preview`: protected Vercel preview, separate Neon project/branch, safe synthetic data, `interlock` Walrus namespace and explicitly approved test integrations.
- `production`: not enabled until Phase 9 and the bounded release authority in `OPERATOR_INTAKE.md`; separate Neon project/branch and `interlock-prod` namespace.

## Phase 1 preview

Deploy a route-complete skeletal shell as early as practical. Use a dedicated preview Neon project/branch (never the production branch) and the `interlock` Walrus namespace. Do not copy production secrets or customer data. Configure Vercel Authentication protection. Record exact preview URL, Git SHA/commit, deploy timestamp and environment in `AI_HANDOFF.md`.

## Migrations

- Use version-controlled SQL migrations applied through the Neon migration role (`DATABASE_URL_UNPOOLED`, `neondb_owner`).
- Application runtime uses `DATABASE_URL_APP` (`app_user`, `NOBYPASSRLS`); never use the migration URL in the app.
- Apply to local/test/preview branches first.
- Verify `current_user`, role attributes, RLS and data ownership before preview.
- Never use destructive schema operations against production without bounded authority and a verified backup/rollback path.
- Do not apply migrations to production merely because preview deploy is authorized.

## Preview safety

- `INTERLOCK_EXECUTION_MODE=simulation`.
- `INTERLOCK_DEMO_BASELINE_ENABLED=true` only if explicitly enabled for protected preview and only after server config guard.
- Only public demo wallet address and synthetic plan data.
- No production secrets, customer records, real payment or irreversible actions.

## Production release

Production release is bounded by `OPERATOR_INTAKE.md`. After Phase 9 passes, the agent may create a Vercel production deployment for `interlock` and apply version-controlled Neon migrations to a production database only after a verified backup/rollback path exists. Production uses a separate Neon project/branch and `interlock-prod` Walrus namespace; no preview secrets are copied. No DNS changes, public marketing beyond the app, or production data import without separate approval. Startup must fail unless `INTERLOCK_EXECUTION_MODE=simulation` and `INTERLOCK_DEMO_BASELINE_ENABLED=false`.

If any production action is outside that bounded authorization, do not perform it. Deliver verified preview, exact release commands, required secret names, migration order, rollback instructions and a smoke-test checklist.

## Rollback

Document the Vercel deployment rollback procedure and migration rollback strategy. Prefer forward-fix migrations over destructive rollback where data loss could occur. Do not automatically drop tables/data. If schema changes are irreversible, pause and request operator intervention.

## Release evidence

Record URL, Git commit, environment, migration IDs, smoke tests, E2E/security suite results, known issues, authorization record and rollback steps in `AI_HANDOFF.md` and BUILD_LOG.
