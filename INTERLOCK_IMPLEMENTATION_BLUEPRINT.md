# Interlock — Implementation-Ready Project Blueprint

**Event:** Tatum × Walrus Total Recall 2026  
**Blueprint status:** Product and architecture design completed; implementation not started  
**Current implementation phase:** Phase 0 — operator intake/readiness  
**Product name:** Interlock  
**Primary track recommendation:** Smart Agents for Real Life  

## Source-of-truth and precedence

1. `PROJECT_SPEC.md` — product behavior, scope, requirements and acceptance criteria.
2. `ARCHITECTURE.md` — fixed system boundaries, data flow, technology and security design.
3. `IMPLEMENTATION_PLAN.md` — autonomous sequence, tests and phase gates.
4. `AGENTS.md` — persistent implementation-agent instructions.
5. `OPERATOR_INTAKE.md` — one-time inputs and bounded authorization.
6. `REFERENCE_ASSETS.md` — actual UI asset inventory; currently pending operator intake.
7. `AI_HANDOFF.md` and `docs/BUILD_LOG.md` — live implementation state and evidence.
8. `docs/API.md`, `docs/DATA_MODEL.md` — endpoint and persistence contracts.

The uploaded `PROPER_VIBE_CODING_WORKFLOW_AUTONOMOUS.md` is the governing methodology. The implementation agent must preserve its order: **complete intake → early skeletal preview → core functionality → end-to-end verification → reference-image-led UI → frontend/docs completeness → demo video → final regression and authorized release**.

## 1. Product definition

Interlock is an auditable execution-safety system for multi-agent applications. Agents share durable, typed memories. Before a proposed action can execute, Sentinel evaluates it against applicable constraints and evidence from that shared memory. Runner can execute only after Sentinel issues a valid, short-lived, single-use clearance.

**Core proposition:** Agent A's discovery can prevent Agent B from making a costly mistake.

**Product boundary:** MVP decisions and execution are simulations only. No real trade, token transfer, wallet custody, transaction signing or movement of funds is permitted.

## 2. Core causal demonstration

Use the same plan, plan hash, wallet address and immutable balance observation in both runs:

1. Scout performs a real read-only Sui mainnet balance observation through Tatum.
2. Scout writes a typed FACT to Walrus Memory mainnet and the app verifies that the write completed and can be recalled.
3. A CONSTRAINT states that the proposed exposure must not exceed 10% of the observed balance.
4. Analyst proposes a 15% simulated exposure.
5. **Memory OFF baseline:** a separately labelled, preview-only unprotected simulation path illustrates the outcome without Sentinel. It must not be available in production and must never move funds.
6. **Memory ON:** Sentinel retrieves and validates the constraint and fact, then rejects the identical plan. The UI cites the Walrus blob, author, timestamp and Tatum observation.
7. Sentinel writes a VERDICT memory. A subsequent evaluation can cite the prior verdict as historical context.

The baseline is not a production mode or a Sentinel bypass. In normal Interlock operation, unavailable, incomplete, stale or unverifiable required memory produces `HOLD`, never an automatic approval.

## 3. Fixed MVP decisions

- Four logical agents: Scout, Analyst, Sentinel and Runner.
- One Next.js application and one backend deployment; agents are modules, not microservices.
- Walrus Memory mainnet is the persistent memory system of record.
- PostgreSQL stores deterministic metadata/indexes, application state and audit records; it is not a substitute for Walrus memory.
- Tatum Sui mainnet gRPC is the preferred source for a read-only balance observation.
- Sentinel is deterministic. An LLM never makes the final approve/reject decision.
- Runner supports simulation only.
- Supabase Auth + PostgreSQL/RLS for invite-only workspace access.
- No x402/MPP payments in the MVP.
- No Redis, Kafka, separate vector database, wallet custody or real execution adapter.

## 4. MVP feature checklist

### Must have
- Invite-only workspace authentication and Owner/Operator/Observer roles.
- Four logical agent identities with server-side capabilities.
- Tatum read-only Sui balance observation.
- Walrus Memory mainnet write, completion verification and recall.
- FACT, CONSTRAINT and VERDICT records; OUTCOME record for simulated execution.
- Deterministic constraint candidate filtering and evidence-backed semantic recall.
- Sentinel `APPROVE`, `REJECT` and `HOLD` outcomes.
- Hard Runner gate with a short-lived, plan-bound, one-time clearance.
- Evidence panel with memory/blob IDs, author, timestamp and Tatum observation.
- Memory OFF versus ON demo comparison, disabled outside safe preview/test mode.
- Unit, integration, E2E and security tests.

### Should have
- Memory expiration and supersession visibility.
- Decision and audit history.
- Minimal owner settings and agent activity views.
- Recovery and retry visibility for asynchronous Walrus writes.

### Nice to have
- Downloadable decision report; simple filters; decision metrics.

### Future
- Other chains/providers; real execution adapters; on-chain enforcement; agent payments; advanced quarantine and governance; multi-workspace Walrus account provisioning.

### Explicitly excluded
- Trading, wallet creation/custody, private-key or seed-phrase input, real payments, transfers, DEX integration, live counterparties, arbitrary agent tools, multi-chain support, 3D office, public memory marketplace.

## 5. Roles

| Role | Capabilities | Restrictions |
|---|---|---|
| Owner | Workspace configuration, members, policy creation/supersession, all read views | Cannot manually convert a Sentinel rejection into approval |
| Operator | Run Scout, create plans, request checks, run permitted simulation | Cannot manage members or alter protected system settings |
| Observer | Read dashboard, evidence, decisions and audit trail | Cannot mutate or trigger agent actions |
| Agent identity | Server-side capability-scoped internal operations | No human login; no public service credentials; Sentinel alone issues clearance |

## 6. Primary flows

Detailed preconditions, writes, failure modes, permissions and acceptance criteria are in `PROJECT_SPEC.md`; process contracts are in `docs/API.md` and `docs/DATA_MODEL.md`.

### Observe and remember
Operator → Scout → Tatum gRPC read → normalize exact integer balance → persist observation → submit FACT to Walrus → wait for completed job/blob ID → list metadata → recall/verify content → mark memory active.

### Create a plan
Operator → Analyst UI → structured plan inputs → Zod validation → store immutable plan and hash → plan becomes `READY_FOR_CHECK`.

### Evaluate and block
Operator → Sentinel → load exact-scope active constraints/facts from PostgreSQL index → recall corresponding Walrus entries → verify completeness, provenance, hashes, validity and Tatum anchor → deterministic evaluator → `REJECT` when constraint violated, `HOLD` when evidence is missing/uncertain, or provisional `APPROVE` when all checks pass → persist verdict → write/verify VERDICT memory → finalize decision.

### Simulate execution
Runner receives only final APPROVE clearance → verify signature, workspace, plan hash, expiry and nonce → atomically consume clearance → create one simulation record → write OUTCOME memory/audit record. Any non-APPROVE or failed check blocks it.

## 7. Business rules and safety defaults

- Exposure threshold default: **1,000 basis points (10%)** of observed balance.
- Demo plan: **1,500 basis points (15%)**.
- FACT freshness TTL: **300 seconds** for the balance-dependent MVP rule.
- Plan freshness TTL: **300 seconds**.
- Approval clearance TTL: **60 seconds**, one use only.
- Amounts are integer MIST/BigInt; `1 SUI = 1,000,000,000 MIST`.
- Do not use floating-point arithmetic for balances, limits or exposure.
- Conflicting applicable constraints: apply most restrictive only where ordering is unambiguous; otherwise `HOLD`.
- No applicable constraint for a protected action: `HOLD` (policy absence is not permission).
- Stale or changed evidence: `HOLD` pending fresh observation.
- Missing Walrus candidate, failed recall, mismatch or uncertain attribution: `HOLD`.
- Rejected decision cannot be overridden. Owner must create a new superseding/revoking policy record and request a new check.
- Memory entries are append-only; corrections create a new record referencing the superseded record.

## 8. Architecture in one paragraph

A Next.js App Router application runs on Node.js. Supabase provides Auth, PostgreSQL and row-level security. Server-only integration modules call the Walrus Memory TypeScript SDK, Tatum Sui gRPC and OpenAI Responses API. Scout uses deterministic provider data; Analyst may use OpenAI only to draft a schema-constrained rationale; Sentinel is a pure deterministic policy evaluator using PostgreSQL metadata filters plus verified Walrus recall; Runner is a simulation-only service that enforces a signed, short-lived, one-time Sentinel clearance. Vercel hosts a protected preview. No queue broker is introduced; asynchronous Walrus jobs are tracked in PostgreSQL and polled with bounded backoff.

## 9. Fixed stack

- Next.js 16.x App Router, React 19, TypeScript strict mode.
- Tailwind CSS 4; shadcn/ui primitives; Lucide icons.
- Zod schemas shared across UI and server contracts.
- Next.js Route Handlers, Node runtime for server integrations.
- Supabase PostgreSQL + Supabase Auth; `@supabase/ssr`; RLS.
- Walrus Memory TypeScript SDK: `@mysten-incubation/memwal` (confirm current package/version and SDK compatibility in intake; pin exact tested version in lockfile).
- Tatum Sui mainnet gRPC; `@grpc/grpc-js`, `@grpc/proto-loader`, official Sui API protobuf definitions pinned to a reviewed commit/package.
- OpenAI Responses API with Structured Outputs for Analyst only; default model setting `gpt-6-astra` only if account access is confirmed, else choose a currently available approved model during intake and document it.
- Vercel protected preview; production deploy requires explicit authorization.
- Vitest, Testing Library, Playwright; Supabase CLI migrations.

## 10. Architecture constraints

- PostgreSQL indexes only metadata/tags needed for exact scope and lifecycle filtering. Canonical memory content remains Walrus-backed.
- Never treat semantic recall as a complete SQL query. The DB candidate set defines what must be present; Walrus recall and blob verification establish the content used in the decision.
- Walrus write is asynchronous. A queued write is not active memory. Require successful job completion, blob ID, metadata confirmation and recall verification before setting `ACTIVE`.
- `listMemories` is metadata discovery, not content retrieval. Do not expect it to return decrypted payloads.
- If Walrus cannot be read, candidate coverage cannot be demonstrated, or verification fails, Sentinel returns `HOLD`.
- Keep Tatum and Walrus secrets server-side. Never collect wallet private keys or seed phrases.
- Runtime must not depend on Supabase `service_role` for ordinary user operations; privileged maintenance tasks are tightly scoped and server-only.

## 11. Required screens

`/login`, `/setup`, `/dashboard`, `/observations`, `/memory`, `/plans`, `/plans/new`, `/plans/[id]`, `/decisions/[id]`, `/audit`, `/agents`, `/settings`, `/demo`.

All routes need permission-aware navigation and appropriate loading, empty, validation, success, error, denied and not-found states. Full screen inventory and behaviors are in `PROJECT_SPEC.md`. No reference UI image has been provided yet; see `REFERENCE_ASSETS.md` and Phase 0 intake.

## 12. Integration inventory

| Integration | MVP use | Required access | Mandatory? |
|---|---|---|---|
| Walrus Memory mainnet | Persistent writes and recall | Dedicated account ID, namespace, delegated agent keys | Yes |
| Tatum Sui gRPC mainnet | Read-only SUI balance observation | API key; public address | Yes |
| Supabase | Auth, Postgres, RLS | Project and migration access | Yes |
| OpenAI | Structured Analyst text only | API key, approved model, budget ceiling | Optional for the smallest functional core; deterministic fixture fallback for tests only |
| Vercel | Protected frontend preview | Project/deploy access | Required for early deployed preview unless operator selects an equally safe host |
| TTS provider | Demo narration | Free tier and quota verification | Optional; free permitted fallback required |

## 13. Security posture

MVP is simulation-only and fail-closed. No real execution endpoint or wallet signing exists. Enforce Supabase RLS and server-side workspace authorization; validate all external and user inputs; constrain outbound network access; verify Walrus provenance and content hashes; enforce exact policy semantics; rate-limit expensive operations; redact secrets; make memory and audit changes append-only; protect Runner with one-time signed clearances and atomic DB consumption. See `ARCHITECTURE.md` and `docs/TESTING.md` for the threat controls and test cases.

## 14. Autonomous implementation sequence

1. Phase 0: inspect repo and complete one consolidated operator intake; validate essential assets, credentials, permissions, budgets and service smoke tests. No coding while critical intake blockers remain.
2. Phase 1: repository/platform foundation; responsive route shell; early protected preview with labelled placeholders and safe data.
3. Phase 2: Supabase schema, migrations, auth, RLS, domain persistence and health checks.
4. Phase 3: Walrus/Tatum/Analyst integrations, Sentinel evaluator, APIs and Runner gate.
5. Phase 4: connect all routes to real application behavior.
6. Phase 5: full end-to-end functionality and failure-path gate.
7. Phase 6: inspect supplied reference images and implement final UI directly; attempt required StageShow skill.
8. Phase 7: responsive/accessibility completeness, docs, footer, metadata and verified links.
9. Phase 8: capture and edit <=180-second demo video; review the rendered file.
10. Phase 9: final regression/security; release only within explicit authority.

No routine phase approval stops. Each checkpoint is test → inspect → fix → commit → update `AI_HANDOFF.md` and `docs/BUILD_LOG.md` → continue. Stop only for a genuine blocker or an action outside exact authority.

## 15. Unresolved operator intake items

The following are deliberately not invented:
- Target repository and access; the Assay repository is only a reference blueprint and is not automatically the target.
- At least one UI reference image or explicit authorization for the coding agent to generate one.
- Supabase project access and Auth configuration.
- Dedicated Walrus account ID, namespace and delegated keys, with signed mainnet write/read smoke test.
- Tatum key and public Sui demo address; prove `StateService.GetBalance` works on the specified Tatum gateway.
- OpenAI access/model/cost ceiling, or authorization to use the deterministic Analyst fallback.
- Vercel preview access and protected-preview settings.
- Maximum spend (default recommendation: **$0 unapproved spend**).
- Explicit production-release authorization (default: **DENIED**).
- Demo audience, pronunciation, redactions and approved output path.

These are consolidated in `OPERATOR_INTAKE.md`. The coding agent must not ask one question at a time or repeat information already in the repository or this package.

## 16. Coding agent start point

**Exact first task:** Read this entire handoff package and the repository's own agent instructions; inspect the repository without modifying it; complete the consolidated `OPERATOR_INTAKE.md` readiness check; verify actual reference images; validate credentials, account permissions/scopes, service quotas, Tatum gRPC method support, Walrus mainnet write/read, deployment access and budget limits; record exact production authority. Do not begin implementation while a critical input is missing. Once readiness passes, execute Phase 1 onward autonomously without routine approval requests.

## 17. Current completion status

Product/architecture blueprint: drafted.  
Application code: **not started**.  
Repository: **not confirmed**.  
UI reference image: **not supplied**.  
Credentials and external service access: **not validated**.  
Preview URL / deployed commit: **none**.  
Tests: **not run**.  
Production authorization: **not granted**.  


## 18. Recommended repository structure

See `docs/REPOSITORY_STRUCTURE.md` for the full proposed Next.js/Supabase tree. Preserve existing repository conventions when compatible; keep the MVP as one modular application, not separate microservices.

## 19. Environment configuration

See `docs/CONFIGURATION.md` and `docs/CONFIGURATION_ENV_TEMPLATE.md`. Client-safe variables are limited to Supabase public URL/publishable key and any genuinely public monitoring DSN. Walrus delegate keys, Tatum/OpenAI keys, signing secrets and Supabase privileged keys remain server-only.

## 20. Final pre-implementation audit

- [x] Product, differentiator, audience, roles, boundaries and MVP scope are defined.
- [x] Primary and secondary flows include success/failure behavior and permissions.
- [x] Functional requirements and testable acceptance criteria are specified in `PROJECT_SPEC.md`.
- [x] States, transitions, TTLs, conflicts, immutability and cancellation/supersession rules are explicit.
- [x] Data entities, relationships, indexes, ownership and sensitive fields are specified in `docs/DATA_MODEL.md`.
- [x] Architecture, trust boundaries, technology stack and integration failure behavior are fixed in `ARCHITECTURE.md`.
- [x] API endpoints, auth, request/response and error semantics are specified in `docs/API.md`.
- [x] Authentication, RLS, permissions, Runner clearance and threat mitigations are specified.
- [x] UI routes and states are specified; no separate mockup/approval phase.
- [ ] Actual UI reference image(s) inspected — pending Phase 0; none supplied yet.
- [x] Required StageShow skill installation/use is assigned to Phase 6.
- [x] External integrations and mandatory/optional boundaries are identified.
- [x] No LLM authority over decisions; final evaluator deterministic.
- [x] MVP is simulation-only; no payments or real execution.
- [x] Operator intake consolidates credentials, access, budget, deployment and demo questions.
- [x] Production authorization explicitly defaults to DENIED.
- [x] Phase order preserves intake → early preview → core functionality → E2E gate → final UI → docs → demo → authorized release.
- [x] Autonomous checkpoints, commits, AI_HANDOFF and build log updates are required.
- [x] README/docs/footer/link/accessibility requirements are included.
- [x] Demo video is capped at 180 seconds and requires capture, TTS verification, synchronization, redaction and review.
- [ ] Target repository and all required credentials/provider smoke tests validated — pending Phase 0.

No coding agent should interpret this blueprint as permission to begin before critical Phase 0 inputs are validated. The pending items are intentional operator-intake blockers, not decisions pushed downstream.

## 21. CODING AGENT START POINT

**Exact first task:** Read the handoff package and repository instructions; inspect the target repository without modifying code; complete the consolidated Operator Intake/Readiness Check in `OPERATOR_INTAKE.md`; inspect and record real reference images; verify credentials, access permissions, scopes, quotas, Tatum gRPC method support, Walrus mainnet write/read, Supabase migrations/RLS, protected preview access and budget limits; record exact production-release authority. Do not implement while critical inputs are missing. When ready, execute Phase 1 onward autonomously, following `IMPLEMENTATION_PLAN.md`, without routine approval stops.
