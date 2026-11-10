# AI_HANDOFF.md — Interlock Current State

## Current status

- Product: **Interlock** — one agent's verified memory can prevent another agent from executing a policy-violating action.
- Implementation phase: **Phase 1 complete — protected preview shell deployed.**
- Application implementation: **Phase 1 scaffold + placeholder UI only.** No database, auth, provider adapter, decision engine, Runner simulation or demo exists.
- Repository: **CONFIRMED** — `https://github.com/onyebuchidaniel60/interlock`, branch `main`.
- Phase 0 commit: `dbb87f2ebd993aa475986601a09506a56b138a11` (`docs: complete interlock operator readiness`).
- Phase 1 code commit: `f8d5260e11475adc81de7b9b2e3ec5ba4c1b417f` (`feat: establish app shell and protected preview`).
- Preview URL: **https://interlock-ff4vlqtne-uhhh2.vercel.app**
- Vercel deployment ID: `dpl_Dt8W3dj3HRzvvtGLQFQTw8EqSNEe`
- Deployed source commit: **`f8d5260e11475adc81de7b9b2e3ec5ba4c1b417f`**
- Deployment target: **preview**; production deployment removed; no custom domain.
- Preview protection: **Vercel Authentication** (`ssoProtection: all_except_custom_domains`). Public curl receives `302` to Vercel SSO. Automation bypass secret removed after verification.
- Vercel project settings: framework `nextjs`, Node `22.x`.
- Reference UI images: four original WebP images inspected; inventory in `REFERENCE_ASSETS.md`.
- Walrus Memory mainnet: **Phase 0 signed write/read smoke test PASS**; application adapter pending Phase 3.
- Tatum Sui mainnet gRPC: **Phase 0 method/auth PASS**; operator reports the demo address is now funded; independent re-verification scheduled for Phase 3.
- Neon Postgres + Managed Better Auth: **not connected yet**; Phase 2.
- Groq Analyst: **not called yet**; Phase 3.
- Production authorization: **bounded Phase 9 release only**; production deployment currently absent by design.
- Budget: **$0 unapproved spend; free tiers only.**
- Demo video: **not produced.** Kokoro TTS primary, Piper fallback.

## Phase 1 delivered

- Next.js 16.4.6 App Router, React 19.3.1, strict TypeScript, Tailwind CSS 4.3.5, Lucide icons.
- Responsive dark operations shell with desktop sidebar and mobile drawer.
- Routes:
  - `/login`, `/setup`
  - `/dashboard`, `/observations`, `/memory`, `/plans`, `/plans/new`, `/plans/[id]`
  - `/decisions/[id]`, `/audit`, `/agents`, `/settings`, `/demo`
  - `/api/health`
  - `/`, `not-found`, `error`, `loading`
- Reusable `PageHeader`, `KpiCard`, `Badge`, `StatusRow`, `EmptyState`, `AgentCard`, `PlaceholderPanel`, `ButtonLink`, `AuthShell` components.
- Runtime safety guard in `src/lib/config.ts`: rejects non-simulation execution mode and production demo baseline.
- Every unfinished area is labelled with its phase; no fake memories, verdicts, provider responses or form submits.
- Footer links to the real public GitHub README and repository; Documentation destination approved.
- `.env.example` committed with names only; `.env.local` ignored.
- `README.md` now has local commands and the preview URL.

## Phase 1 verification evidence

- `npm run typecheck` — **PASS**.
- `npm run lint` — **PASS**.
- `npm test` — **4/4 PASS** (runtime config guard).
- `npm run build` — **PASS** (Next.js production build, 14 static/dynamic routes).
- `npm run test:e2e` — **34/34 PASS** across Chromium desktop + mobile Chromium:
  - every route returns 200 and renders its h1
  - no `href="#"` dead links
  - login/setup accessible auth shells
  - `/api/health` safe payload
  - primary navigation and `aria-current`
  - real footer destinations
  - mobile drawer open/navigate/close
  - no horizontal overflow on primary routes
- Preview `/api/health` via authenticated Vercel CLI: `{"status":"ok","service":"interlock","phase":"1","mode":"simulation"}`.
- Preview `/dashboard` via authenticated Vercel CLI: `<title>Dashboard · Interlock</title>`.
- Public preview access: `302` to `https://vercel.com/sso-api?...` for `/` and `/api/health`, confirming protection.
- Vercel project protection JSON: `ssoProtection` enabled, `protectionBypass: {}`.
- Vercel deployments list: one `Preview` deployment only; accidental first production deployment removed.

## Phase 1 issues and fixes

- Port 3000 was already occupied by an unrelated Next 14 process. Playwright uses isolated port `3127`; no interference.
- Playwright's iPhone descriptor defaults to WebKit. The mobile project explicitly uses Chromium; browser install and tests pass.
- Next dev blocked HMR from `127.0.0.1`. Added `allowedDevOrigins: ["127.0.0.1"]`.
- Next recommended `data-scroll-behavior="smooth"`; added to `<html>`.
- Vercel's first deployment auto-targeted production. Removed that deployment and created an explicit `--environment preview` deployment; only preview remains.
- Vercel initially had no framework preset and served 404. Set framework `nextjs` and Node `22.x`, then redeployed.
- `vercel curl` created an automation bypass secret. It was disabled; `protectionBypass` is now empty.
- Prettier reformatted existing Markdown during setup. Those unrelated changes were reverted; `*.md` is now excluded from Prettier.

## Product-critical invariants

1. Walrus Memory mainnet must be core functionality, not decoration.
2. Same immutable plan hash and observation must be used for memory-off baseline and memory-on protected comparison.
3. Memory OFF baseline exists only in local/test/protected preview and only as a simulation; startup must fail if enabled in production.
4. Normal production decision path is fail-closed. Missing policy/evidence, incomplete semantic recall, stale or conflicting evidence => HOLD.
5. Sentinel is deterministic; an LLM cannot approve/reject.
6. Runner accepts only final APPROVE with signed, 60-second, workspace/plan/decision-bound, single-use clearance.
7. All execution is simulated; no wallet custody/signing, trades or transfers.
8. Final APPROVE requires a completed, verified Walrus VERDICT memory.
9. Postgres metadata alone is never decision evidence; recall content and provenance must be verified.
10. Production startup must fail unless `INTERLOCK_EXECUTION_MODE=simulation` and `INTERLOCK_DEMO_BASELINE_ENABLED=false`.

## Architecture changes authorized in Phase 0

1. **Supabase → Neon (Lakebase Postgres + Managed Better Auth).**
   - `DATABASE_URL_UNPOOLED` (role `neondb_owner`) is migrations only.
   - `DATABASE_URL_APP` (role `app_user`, `NOBYPASSRLS`) is all application queries.
   - Verify `SELECT current_user` is `app_user`; never run app queries as `neondb_owner`.
   - Auth via `NEON_AUTH_BASE_URL` + `NEON_AUTH_COOKIE_SECRET`; `@neon/auth/next/server`; `@supabase/ssr` removed.
   - RLS is plain PostgreSQL; `auth.uid()` is unavailable. Use request-scoped `app.user_id` plus `workspace_members`.
2. **OpenAI → Groq for Analyst.**
   - `https://api.groq.com/openai/v1`; `GROQ_API_KEY` server-only.
   - Model `qwen/qwen3.8-27b`; strict JSON schema (`additionalProperties: false`, all properties required).
   - Analyst has no policy authority; Sentinel remains deterministic.

## Phase 0 provider evidence

- Walrus: signed synthetic FACT write → terminal success → blob `nOgMyB2p1dHhQT_HwSf6MPsWoGScPXMIStHJdlbnlR8` → metadata → exact recall → SHA-256/namespace/author verified. Namespace `interlock`; SDK `@mysten-incubation/memwal@0.1.14`.
- Tatum: `StateService.GetBalance` succeeded through `sui-mainnet-grpc.gateway.tatum.io:443` with official Sui protos pinned at `79485a8328e2f58fa047e4ce1327704b412e958a`. Phase 0 returned `balance="0"` and no checkpoint/finality fields; the operator reports the address is funded now. Re-verify independently in Phase 3; stop at Phase 5 if it is still zero.

## Next task — Phase 2

Implement the backend, database, authentication and authorization foundation exactly as specified in `IMPLEMENTATION_PLAN.md`:

1. Create/verify the Neon preview project or branch and connection roles; never expose the migration URL to the app.
2. Add version-controlled migrations for workspaces, memberships, agent identities, wallet sources, observations, memories/jobs, plans, decisions/evidence, executions, audit and idempotency.
3. Enable plain PostgreSQL RLS on every tenant-owned table; request-scoped `app.user_id`; no `auth.uid()`.
4. Verify `SELECT current_user=app_user`, `NOBYPASSRLS`, table ownership, and cross-workspace denial.
5. Integrate Neon Managed Better Auth (`@neon/auth/next/server`) with invite-only workspace access and server-verified membership.
6. Add server-side role/membership guards and protect every app route; replace the Phase 1 placeholder login/setup behavior.
7. Add health/readiness checks for database and auth without leaking secrets.
8. Add migration, RLS matrix, auth/session, role and cross-tenant IDOR tests.
9. Update `AI_HANDOFF.md`, `docs/BUILD_LOG.md`, and preview at the Phase 2 checkpoint; commit and continue.

## Authorization boundaries

- **Preview:** Vercel project `interlock`, Vercel Authentication, preview only, generated `*.vercel.app`, no custom domain. Preview URL is protected.
- **Production after Phase 9:** create Vercel production deployment; apply version-controlled Neon migrations after a verified backup/rollback path; separate Neon project/branch and `interlock-prod` Walrus namespace; no preview secrets; no DNS changes; no public marketing; no production data import; flags enforced.
- **Never:** private keys/seed phrases, wallet custody/signing, real transactions/transfers/trades, bypassing auth/RLS/provider scopes, exposing secrets in client bundles/logs/docs, committing `.env` files, unapproved spend.
- **Data:** public Sui address + synthetic data only. No customer or production data.
- **Demo:** hackathon judges; `demo/` output only; no public upload; redact secrets/private URLs/emails/account IDs; truncate wallet addresses if requested.

## Known open issues / blockers

1. **Phase 2 work is next:** no Neon connection, schema, RLS, auth or workspace membership exists yet.
2. **Tatum demo funding:** operator reports funded; independent re-verification required in Phase 3. Stop at Phase 5 if zero.
3. **Groq** model/structured output not yet exercised; free-tier cap required.
4. **Provider adapters** not built; preview is a shell, not a working decision product.
5. **Final UI** is intentionally provisional; reference-led refinement is Phase 6.
6. **Demo video/TTS** not produced.

## Checkpoint template

```text
Current phase:
Completed:
Tests and evidence:
Preview/staging URL:
Deployed commit:
Reference image and UI skill status:
Documentation status:
Demo video status:
Known issues:
Authorization boundaries:
Next task:
Blocked by (if any):
```

## Do not claim

Do not claim that database/auth, Walrus/Tatum/Groq application integration, Sentinel decisions, Runner simulation or the demo video exist until produced and verified. The preview is a Phase 1 shell with labelled placeholders.
