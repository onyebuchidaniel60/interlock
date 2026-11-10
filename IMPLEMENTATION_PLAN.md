# IMPLEMENTATION_PLAN.md — Autonomous Build Sequence

## Operating contract

The coding agent is an implementation executor. Product behavior, architecture, trust boundaries and MVP scope are fixed in `PROJECT_SPEC.md` and `ARCHITECTURE.md`. Phase boundaries are internal engineering checkpoints, not operator approval gates. At every checkpoint: **implement → test → inspect → fix → commit → update `AI_HANDOFF.md` + `docs/BUILD_LOG.md` → continue**.

Do not begin implementation until Phase 0 confirms all critical inputs and required reference images are available or the operator has expressly authorized generated reference imagery. A blocked external integration does not justify abandoning unaffected safe work, but never fake a real integration result.

## Phase 0 — One consolidated operator intake/readiness

**Objective:** Establish one complete source-of-truth for repository, assets, credentials, access, costs and authority before code changes.

**Tasks:**
1. Read this package, repository instructions and all existing project docs.
2. Inspect repo structure, branch, Git status, manifests, lockfiles, code, migrations, tests, CI, deploy configuration and env variable names; never print secret values.
3. Complete `OPERATOR_INTAKE.md` in one pass. Ask all remaining critical questions together; do not repeat known information.
4. Inspect every supplied UI reference asset; record exact path, source/ownership and intended screens. If absent, ask for one/small set or explicit authorization to generate image references.
5. Verify target repo/write permissions, Node/package manager, Git identity, preview host access and protection.
6. Validate Neon project/branch access, migration role and application role boundaries, and Managed Better Auth approach.
7. Validate Walrus dedicated mainnet account ID/namespace/delegate keys via signed write→job completion→metadata→recall smoke test. Confirm no shared/sample account is being reused.
8. Validate Tatum key and `StateService.GetBalance` through the exact Tatum Sui mainnet gRPC gateway using a public demo address. Record method support and response fields. Do not switch providers or use deprecated JSON-RPC without explicit operator decision.
9. Confirm Groq account/model/quota/cost ceiling or choose deterministic Analyst fallback.
10. Confirm budget ceiling and paid-service restrictions. Default: no spend without explicit amount authorization.
11. Confirm production deployment authority; default DENIED. Confirm demo audience, voice/TTS preferences, output path and redactions.
12. Record readiness status and blockers. Do not start implementation with critical inputs missing.

**Expected files:** completed `OPERATOR_INTAKE.md`, verified `REFERENCE_ASSETS.md`, initial `AI_HANDOFF.md`, initial `docs/BUILD_LOG.md`.

**Acceptance:** every critical field marked verified or explicitly blocked; bounded authority documented; no secrets copied into docs; reference image status truthful; Tatum and Walrus required smoke tests evidenced.

**Git checkpoint:** `docs: complete interlock operator readiness` (only if changes are committed to the selected repo).

## Phase 1 — Repository/platform foundation + early skeletal frontend

**Objective:** Deploy a navigable, responsive shell as early as practical using safe data and labelled placeholders.

**Tasks:** establish/confirm Next.js App Router app and strict TypeScript; lint/format/test scripts; routes `/login`, `/setup`, `/dashboard`, `/observations`, `/memory`, `/plans`, `/plans/new`, `/plans/[id]`, `/decisions/[id]`, `/audit`, `/agents`, `/settings`, `/demo`; basic navigation; temporary consistent visual tokens; global error/not-found/loading; favicon placeholder only if no approved icon asset; responsive shell; protected Vercel preview; safe synthetic records only; baseline demo route hidden/disabled unless preview config allows.

**Expected files:** app skeleton, package manifest/lockfile, environment example without secrets, basic components, deployment config, `AI_HANDOFF.md` and BUILD_LOG update.

**Tests:** TypeScript, lint, smoke route tests, Playwright route navigation/responsive shell tests.

**Acceptance:** all planned routes render with clearly labelled unfinished states; no inert controls pretending to work; preview is protected; exact URL and deployed commit are recorded. If host access blocks preview, record exact error and continue local safe work.

**Git checkpoint:** `feat: establish app shell and protected preview`.

## Phase 2 — Backend, database, authentication and authorization foundation

**Objective:** Build secure tenant foundation and schema before core integrations.

**Tasks:** Neon migrations for workspaces, memberships, agent identities, wallet sources, observations, memories/jobs, plans, decisions/evidence, executions, audit and idempotency; RLS for every tenant-owned table using request-scoped `app.user_id`; invite-only Managed Better Auth; role/membership helper; server-side auth client; protected route helper; workspace resolution; health endpoint; migration/test setup; seed safe demo workspace only in preview/test. Verify application connections use `app_user` (`NOBYPASSRLS`) and migrations use `neondb_owner` via `DATABASE_URL_UNPOOLED`.

**Expected files:** `db/migrations/*`, `src/lib/auth`, `src/lib/db`, validation schemas, tests, docs updates.

**Tests:** migration apply/reset, RLS matrix, role matrix, cross-tenant IDOR, session expiry, unauthorized mutation.

**Acceptance:** no cross-workspace access through UI or API; all user-scoped DB operations respect RLS; no service-role secret in client bundle; health response leaks no secrets.

**Git checkpoint:** `feat: implement workspace auth and isolated data model`.

## Phase 3 — Core domain logic, integrations and APIs

**Objective:** Implement Scout, Analyst, Sentinel and Runner services and domain contracts.

**Tasks:**
- Implement Tatum gRPC adapter using only Phase 0 verified method and allowlisted mainnet target.
- Implement Walrus adapter for signed role-scoped writes, job polling, metadata listing and recall; version-pin SDK and normalize actual SDK structures.
- Implement canonical JSON/hash utilities and Zod schemas for each memory type.
- Implement memory-write lifecycle; ensure only fully verified writes become ACTIVE.
- Implement deterministic candidate query and Sentinel evidence-completeness validation.
- Implement pure evaluator and rules version; test 10%/15% demo scenario, 5% compliant scenario, stale/absent/conflicting policy scenarios.
- Implement final VERDICT memory write/verification before final APPROVE.
- Implement Analyst Groq structured output only if authorized; model output never mutates numeric plan data and never issues verdict.
- Implement Runner signed clearance and atomic one-time simulation.
- Implement all API contracts in `docs/API.md` with consistent errors, idempotency and rate controls.

**Tests:** unit/pure business logic; adapter contract tests; local mock servers; signed Walrus/Tatum integration tests; DB transaction/concurrency tests; failure injection.

**Acceptance:** 15% plan rejects due to recalled 10% constraint; missing memory/provider errors HOLD; final approval requires verified VERDICT memory; Runner denies invalid/replayed clearance; no real transaction APIs exist.

**Git checkpoint:** `feat: implement memory-backed sentinel and gated simulation`.

## Phase 4 — Functional frontend integration

**Objective:** Connect all routes to real APIs and complete the functional MVP using a temporary coherent visual system.

**Tasks:** auth/setup, dashboard health and activity, observations, memory list/detail, constraints, plan creation/detail, decision/evidence page, simulation, audit, agents and owner settings. Add polling for asynchronous memory writes and clear progress/retry/cancel behavior. Keep controls honest; feature-flag demo baseline.

**Tests:** component tests, route-level integration, role-visibility tests, API error-to-UI states.

**Acceptance:** every primary flow works against dev/test services; user can observe a real memory lifecycle and decision state; no dead buttons or fake success banners.

**Git checkpoint:** `feat: connect interlock MVP journeys to backend`.

## Phase 5 — End-to-end functionality gate

**Objective:** Prove product behavior before final visual refinement.

**Required E2E:**
1. Operator logs in and selects workspace.
2. Scout calls Tatum and stores a real observation.
3. FACT write to Walrus completes and can be recalled/verified.
4. Active CONSTRAINT is visible and verified.
5. Analyst/operator creates identical immutable plan.
6. Baseline simulation is clearly labelled and isolated; same plan hash.
7. Sentinel recalls evidence and returns REJECT with evidence.
8. Clicking evidence reveals blob and Tatum source observation.
9. Sentinel writes verified VERDICT memory.
10. A compliant plan can be APPROVED only when required memories are complete and fresh; Runner simulates once.
11. Rejected/HOLD/expired/replay/cross-tenant attempts cannot execute.

**Acceptance:** unit/integration/E2E tests pass; no unresolved critical/high severity issue; preview URL, deployed commit, test results and known limitations recorded. Failure triggers diagnose → fix → retest; no approval request.

**Git checkpoint:** `test: verify interlock end-to-end safety flows`.

## Phase 6 — Reference-image-led final UI + UI skills

**Objective:** Implement actual final UI directly from operator-supplied reference images without a mockup phase.

**Tasks:** attempt `npx skills add benjitaylor/skills --skill stageshow`; inspect skill README/instructions and apply relevant guidance. If installation fails, record command/output and proceed with strong design-system/accessibility practices. At discretion, discover other relevant trustworthy UI skills; assess provenance and instructions; reject conflicting or unsafe instructions. Inspect exact reference image(s), extract composition, hierarchy, density, type scale, color, spacing, component and interaction language. Translate into original Interlock UI; do not copy third-party logos/assets/trade dress/text. Record interpretation and intentional deviations in `docs/DESIGN_NOTES.md`.

**Tests:** visual regression/screenshot review where feasible, responsive tests, keyboard/focus, contrast, reduced motion, interactive-state tests.

**Acceptance:** reference images identified correctly; every route has consistent real product UI; no mockup approval cycle; no third-party assets copied improperly.

**Git checkpoint:** `feat: implement reference-led interlock interface`.

## Phase 7 — Frontend and documentation completion

**Objective:** Finish production-quality UX and operator docs.

**Tasks:** desktop/tablet/mobile; semantic/accessibility audit; loading/empty/validation/success/error/denied/not-found; metadata and product icon; real footer/navigation links; verified Documentation link; GitHub link only if repo is public and approved; support/contact/privacy/terms only where actual destinations exist; README and all docs; troubleshooting; deployment instructions; build log.

**Tests:** link checker, route crawl, Playwright responsive/a11y smoke, keyboard tests, no `href="#"`, no inert controls, metadata checks.

**Acceptance:** no broken/dead links or deceptive placeholders; documentation setup is reproducible; all required UI states complete.

**Git checkpoint:** `docs: complete operator and product documentation`.

## Phase 8 — Demo video <=180 seconds

**Objective:** Produce a short, reviewed, evidence-backed demo.

**Tasks:** use deterministic demo account/data in clean browser session; Playwright record real flows; script for 90–150 seconds; check current Google AI voice/TTS free-tier availability, terms, quotas and credentials; do not incur costs; use genuinely free permitted local TTS fallback if Google option unavailable; edit and synchronize speech with visible actions; captions where feasible; redact personal data, keys, private URLs and account identifiers; render/review end-to-end playback/audio/duration; save script and production notes.

**Expected files:** `demo/interlock-demo.mp4` or agreed output path, `demo/narration.md`, `demo/production-notes.md`, capture scripts.

**Acceptance:** <=180 seconds; real UI; all narration matches visible actions; no long silent gaps or clipped voice; playback verified; secrets redacted.

**Git checkpoint:** `docs: add reviewed interlock demo production artifacts` (video size may make Git LFS/external artifact delivery preferable; decide during intake).

## Phase 9 — Final regression, security and authorized release

**Objective:** Confirm release quality and deploy only within recorded authority.

**Tasks:** run all test suites; audit dependencies; review RLS/auth/IDOR/XSS/CSRF/SSRF/rate limits/secret handling/replay/races/tenant isolation; verify simulation-only boundary; inspect build output for secrets; smoke test preview; verify backup/rollback path; document exact deployment commands and migration order. Production release only when `OPERATOR_INTAKE.md` explicitly says authorized.

**Acceptance:** no critical/high issue; all acceptance checks passed; handoff includes preview URL/commit, test evidence, current deployment, remaining issues, docs and video. If production authority is absent, stop after staging and supply release instructions.

**Git checkpoint:** `chore: final regression and release readiness`.

## Required checkpoint report format

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

## Stop conditions

Stop only for indispensable missing input/credential/permission with no safe fallback; unavailable dependency with no approved fallback; serious security/data-loss risk; scope/cost excess; or an action outside exact authorization. Report blocker evidence, completed and unaffected work, and minimum operator action. Do not stop just because a phase ended or routine feedback would be convenient.
