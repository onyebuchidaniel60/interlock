# SETUP.md — Developer Setup (for implementation phase)

This blueprint package contains no runnable application yet. This document defines the intended setup after a target repository has been selected and Phase 0 intake is complete.

## Prerequisites

- Node.js version supported by the selected pinned Next.js release.
- Package manager chosen based on existing repository; preserve existing lockfile if repo has one.
- Neon project/branch and the `app_user` application role; `DATABASE_URL_UNPOOLED` migration access and `DATABASE_URL_APP` application access.
- Neon Managed Better Auth configured with `NEON_AUTH_BASE_URL` and a 32+ character `NEON_AUTH_COOKIE_SECRET`.
- Access to dedicated Walrus Memory account/namespace and delegate keys.
- Tatum API key and public Sui address for gRPC smoke testing.
- Groq API key/model within the free-tier guard; deterministic Analyst fallback available.
- Vercel project access for protected preview.

## Setup sequence

1. Clone/open the operator-confirmed repository and inspect its instructions.
2. Install dependencies using the existing lockfile's package manager.
3. Copy `.env.example` to local environment file and configure secret values through a secure local secret store. Never commit local env files.
4. Connect to the approved Neon development/test branch; use `DATABASE_URL_UNPOOLED` only for migrations and `DATABASE_URL_APP` for the app.
5. Apply version-controlled migrations through the migration role; verify `SELECT current_user` reports `app_user` from the application connection.
6. Seed only the synthetic local/test workspace and demo data.
7. Configure Neon Managed Better Auth and verify session creation/expiry.
8. Run typecheck, lint and unit tests.
9. Start the Next.js dev server.
10. Run `/api/health`; test authentication and workspace isolation.
11. Run provider smoke tests using the dedicated Walrus account and Tatum gRPC key/address. Do not execute against production customer data.

## Commands

The coding agent must add scripts consistent with the repo's package manager. Expected script equivalents:

```bash
<pm> install
<pm> run dev
<pm> run lint
<pm> run typecheck
<pm> run test
<pm> run test:integration
<pm> run test:e2e
```

Do not invent exact commands before inspecting the actual package scripts. Record selected commands in README and BUILD_LOG.

## Setup acceptance

A new developer can reproduce local startup from docs without access to production secrets. Missing provider credentials must produce honest “integration not configured” state and must not cause the app to fake a successful observation, memory write or approval.
