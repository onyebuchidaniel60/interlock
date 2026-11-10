# DEPLOYMENT.md — Preview and Release

## Environments

- `development`: local Next.js with the preview Neon branch, real Tatum/Walrus sandbox-equivalent calls and synthetic data.
- `test`: disposable Neon branch and deterministic fixtures; provider tests are skipped unless explicitly configured.
- `preview`: protected Vercel preview with the `interlock` Walrus namespace, preview Neon branch and Vercel Authentication.
- `production`: not deployed yet. Bounded release only after Phase 9.

## Current preview

- URL: `https://interlock-835nkre11-uhhh2.vercel.app`
- Project: `interlock` under the active Vercel scope.
- Protection: Vercel Authentication (`ssoProtection: all_except_custom_domains`); public requests return `302` to Vercel SSO.
- Target: `preview`; no production deployment or custom domain.
- Environment names: `DATABASE_URL_APP`, `NEON_AUTH_BASE_URL`, `NEON_AUTH_COOKIE_SECRET`, `INTERLOCK_SIGNING_SECRET`, `INTERLOCK_ENVIRONMENT=preview`, `INTERLOCK_EXECUTION_MODE=simulation`, `INTERLOCK_DEMO_BASELINE_ENABLED=true`.
- `DATABASE_URL_UNPOOLED` must **not** be added to Vercel preview runtime.

Deploy:

```bash
SHA=$(git rev-parse HEAD)
vercel deploy --environment preview --yes \
  --meta githubCommitSha="$SHA" --meta githubCommitRef=main
```

Never use `--prod` before Phase 9. The first deployment of a brand-new Vercel project may be auto-promoted to production by the platform; delete that deployment and create an explicit preview.

## Migrations

```bash
# DATABASE_URL_UNPOOLED must point to the preview branch; role must be neondb_owner
npm run db:migrate
```

- Application runtime uses `DATABASE_URL_APP` (`app_user`, `NOBYPASSRLS`).
- Verify `select current_user` and `rolbypassrls` after deployment.
- Never apply preview migrations to production merely because a preview is authorized.

## Production release gate (Phase 9)

Production is allowed only after every Phase 9 condition passes:

1. Final regression/security suite green.
2. Separate Neon production project/branch provisioned and a verified backup/rollback path exists.
3. Separate `interlock-prod` Walrus namespace and production-only secrets.
4. `INTERLOCK_DEMO_BASELINE_ENABLED=false` and `INTERLOCK_EXECUTION_MODE=simulation`; startup fails otherwise.
5. Version-controlled migrations applied through `DATABASE_URL_UNPOOLED` as `neondb_owner`.
6. Vercel production deployment for `interlock`; no DNS changes, no public marketing, no production data import.
7. If any production Neon credential or backup path is missing, stop and report; never reuse preview secrets.

## Rollback

- Vercel: promote the previous deployment; no custom domain.
- Database: prefer forward-fix migrations; restore from the verified Neon branch/backup for destructive failures.
- Walrus: never delete memory records; supersede with a new record and audit event.

## Release evidence

Record URL, commit, environment, migration versions, smoke tests, security results, known issues and rollback steps in `AI_HANDOFF.md` and `docs/BUILD_LOG.md`.
