# DEPLOYMENT.md — Preview and Release

## Environments

- `development`: local development with local/sandbox DB and provider mocks where appropriate.
- `test`: automated test services and deterministic fixtures.
- `preview`: protected Vercel preview, safe synthetic data and explicitly approved test integrations.
- `production`: disabled until explicit operator authorization.

## Phase 1 preview

Deploy a route-complete skeletal shell as early as practical. Use a dedicated preview Supabase project or isolated schema and dedicated demo Walrus namespace. Do not copy production secrets or customer data. Configure access protection. Record exact preview URL, Git SHA/commit, deploy timestamp and environment in `AI_HANDOFF.md`.

## Migrations

- Use version-controlled Supabase CLI migrations.
- Apply to local/test first.
- Verify RLS and data ownership before preview.
- Never use destructive schema operations against production without explicit authority and verified backup/rollback.
- Do not apply migrations to production merely because preview deploy is authorized.

## Preview safety

- `INTERLOCK_EXECUTION_MODE=simulation`.
- `INTERLOCK_DEMO_BASELINE_ENABLED=true` only if explicitly enabled for protected preview and only after server config guard.
- Only public demo wallet address and synthetic plan data.
- No production secrets, customer records, real payment or irreversible actions.

## Production release

Production release is denied by default. The coding agent must not deploy production, change DNS, publish public pages or execute production migrations unless `OPERATOR_INTAKE.md` contains an explicit bounded authorization for each relevant action.

If production is not authorized, deliver verified preview, exact release commands, required secrets (names only), migration order, rollback instructions and a smoke-test checklist.

## Rollback

Document the Vercel deployment rollback procedure and migration rollback strategy. Prefer forward-fix migrations over destructive rollback where data loss could occur. Do not automatically drop tables/data. If schema changes are irreversible, pause and request operator intervention.

## Release evidence

Record URL, Git commit, environment, migration IDs, smoke tests, E2E/security suite results, known issues, authorization record and rollback steps in `AI_HANDOFF.md` and BUILD_LOG.
