# ARCHITECTURE.md — Interlock System Architecture

## 1. Architecture goals

1. Demonstrate persistent Walrus Memory mainnet changing an actual downstream decision.
2. Ensure no LLM, fuzzy recall result or client-side state can independently authorize Runner.
3. Make every decision reproducible, attributed and inspectable.
4. Keep the MVP small enough to build and verify within the hackathon context.
5. Keep all MVP execution simulated; no custody, signing or movement of funds.
6. Fail closed on missing, stale, conflicting or unverifiable evidence.

## 2. High-level topology

```text
Browser (Next.js UI)
  | Neon Managed Better Auth session cookie
  v
Next.js Route Handlers (Node runtime)
  |-- Auth + workspace membership + Zod validation
  |-- Domain services
  |    |-- Scout -------- Tatum Sui gRPC (read-only)
  |    |                 Walrus Memory (FACT write/verify)
  |    |-- Analyst ------ Groq structured text only; optional
  |    |-- Sentinel ----- PostgreSQL candidate index
  |    |                 Walrus Memory recall + content verification
  |    |                 deterministic policy evaluator
  |    |                 Walrus VERDICT write/verify
  |    |-- Runner ------- one-time clearance verification
  |                      simulated outcome only
  |-- Neon Postgres + RLS (application role app_user, NOBYPASSRLS)
  |-- Walrus Memory mainnet
  |-- Tatum Sui mainnet gRPC
  |-- Groq API (optional)
  v
Vercel protected preview
```

Logical agents are modules in a single application. They do not need independent servers, message brokers or container orchestration for the MVP. Each module is given a distinct server-side capability and Walrus delegate identity where available.

## 3. Trust boundaries

### Browser is untrusted
The client may submit user inputs and display returned evidence. It must never decide that an action is approved, construct an authoritative clearance, or supply trusted workspace membership, role, agent identity or policy outcome.

### Next.js server is the policy enforcement boundary
All workspace authorization, external calls, policy evaluation, memory verification, clearance creation and simulation writes happen server-side. Route Handlers use Node runtime because gRPC and server SDK support are required.

### PostgreSQL is the application state/index, not the canonical memory payload
Postgres stores typed metadata, exact scope tags, status, lifecycle, indexes, content hashes and application state. It allows a deterministic enumeration of expected candidate IDs. Canonical signed/attributed memory payloads are written to Walrus Memory. A Postgres row alone is never sufficient decision evidence.

### Walrus Memory is persistent shared memory
Use a dedicated Interlock account and namespace. Store records with clear type, scope, record ID, author and timestamps. `remember`/`rememberAndWait` job semantics must be respected. `listMemories` is metadata-only and must not be mistaken for content retrieval. `recall` is semantic, not relational; use it within the deterministic candidate boundary and verify exact record identity and content.

### Tatum is an external observation provider
Use only read-only public chain data. No private key, seed phrase, signer, wallet custody or transaction submission. Store exactly what provider response supports; do not invent checkpoint or finality metadata when not returned.

### Groq is an optional language helper
Analyst may use a structured output to draft a concise explanation of a plan. All numerical fields, policy rules and final decision are validated outside the model. The model cannot access secrets, call external tools or authorize Runner. Groq is accessed through its OpenAI-compatible API at `https://api.groq.com/openai/v1` with `GROQ_API_KEY` server-only; the confirmed model is `qwen/qwen3.8-27b`. Structured outputs must use a strict JSON schema with `additionalProperties: false` and every property listed in `required`.

## 4. Core decision architecture

### 4.1 Candidate enumeration
Given `plan.workspaceId`, `plan.scope`, `plan.observationId`, plan created time and current time, query PostgreSQL for all applicable active records:
- CONSTRAINT records matching workspace and scope (e.g. `scope=wallet:<address>` or configured counterparty scope).
- FACT records needed to evaluate each constraint.
- Prior VERDICT records only as historical context; they are not policy authority.
- Exclude revoked, superseded, expired, quarantined or not-yet-valid records.

The candidate query is deterministic and returns an expected record-ID set. Enforce a bounded set; MVP threshold `MAX_EXPECTED_EVIDENCE=90`, with Walrus SDK recall max `limit <= 100`. If the expected candidate set exceeds the verified recall capacity, return HOLD rather than silently truncating.

### 4.2 Walrus recall
Call the Walrus Memory SDK using the Sentinel delegate key, dedicated account and namespace. Query by exact relevant record IDs plus human-readable semantic context. Semantic recall helps retrieve content; it is not used to decide which policies exist. Match returned records to expected IDs. If any required record is omitted or cannot be fetched/verified, HOLD.

Do not assume `listMemories` retrieves decrypted content; it provides metadata. Use SDK `recall` for content and verify its returned record ID, namespace, blob ID and author metadata. Where SDK behavior or metadata shape differs from this contract, pin a typed adapter and prove it with integration tests before relying on it.

### 4.3 Evidence verification
For every record used:
- `recordId` matches expected candidate.
- `workspaceId`, namespace and scope match current plan.
- type is one of allowed values.
- author matches an authorized agent identity for that type.
- timestamps and validity interval are internally consistent.
- content hash matches canonical payload serialization.
- Walrus `blob_id` matches the verified reference.
- payload schema validates with Zod.
- record status is active and not revoked/superseded/expired/quarantined.
- if anchored, chain observation ID, provider, network, address, coin type, amount and observedAt match local immutable observation record; anchor details are not fabricated.

Mismatch means quarantine + audit event + HOLD. Do not use a partially valid memory.

### 4.4 Deterministic evaluator
Implement as a pure function with no network/database dependencies:

```ts
type Verdict = "APPROVE" | "REJECT" | "HOLD";

type SentinelInput = {
  plan: CanonicalActionPlan;
  candidateSetComplete: boolean;
  evidence: VerifiedMemory[];
  now: string;
  rulesVersion: string;
};

type SentinelOutput = {
  verdict: Verdict;
  ruleId: string | null;
  reasonCode: string;
  explanation: string;
  citedRecordIds: string[];
  citedBlobIds: string[];
  evaluationHash: string;
};

function evaluatePlan(input: SentinelInput): SentinelOutput;
```

Decision order:
1. If input invalid, candidate set incomplete, memory missing/unverified, source stale, policy missing or unresolved conflict: `HOLD`.
2. If verified applicable policy is violated: `REJECT`.
3. If every required policy/evidence is present, valid and satisfied: provisional `APPROVE`.
4. Persist decision and write a VERDICT memory to Walrus; wait for completion and verify recall.
5. Only after verified verdict memory can final decision be `APPROVE`. If write/verification fails, final decision is `HOLD`.

Verdict content includes plan hash, rules version, verdict, reason code, concise rationale, cited record IDs/blob IDs, evaluator version, and evaluation timestamp.

### 4.5 Runner clearance
Sentinel creates a cryptographically signed token only after final APPROVE. Token claims:
- `iss=interlock-sentinel`
- `aud=interlock-runner`
- `workspaceId`
- `decisionId`
- `planId`
- `planHash`
- `nonce` (cryptographically random)
- `iat`, `exp` (60 seconds max)
- `mode=simulation`
- unique token/JTI ID

Runner verifies signature and claims server-side, then atomically records consumed JTI/nonce and inserts an execution with a unique constraint on `decisionId`. Only one simulation per decision in MVP. Token cannot be edited by client. Approval for another plan, workspace, decision or environment is invalid.

## 5. Walrus integration lifecycle

1. Compose canonical record envelope.
2. Validate payload schema.
3. Serialize deterministically and compute SHA-256 content hash.
4. Write through `@mysten-incubation/memwal` with dedicated namespace and appropriate delegated key.
5. Track write/job ID as `PENDING`/`SUBMITTED`.
6. Poll/wait with exponential backoff and total timeout; store all provider job state transitions.
7. Require completed status and `blob_id`.
8. Confirm metadata presence using list operation/pagination; metadata is not payload proof.
9. Recall the newly written record, verify identity, namespace, author, blob reference and hash.
10. Mark `ACTIVE` only after all steps succeed. Otherwise `FAILED` or `QUARANTINED`.

Use separate delegate keys/identities for Scout, policy writer, Sentinel and Runner memory role if Walrus supports the required authorization model. Do not assume Walrus delegate separation alone enforces all application roles; enforce capability checks in Interlock too. Store master/delegation credentials in secret storage, not DB rows or browser code.

## 6. Tatum integration

- Gateway default: `sui-mainnet-grpc.gateway.tatum.io`.
- Auth header: `x-api-key`.
- Method target: Sui `StateService.GetBalance`.
- Network: Sui mainnet only.
- Coin default: `0x2::sui::SUI`.
- Unit: MIST; `1 SUI = 1,000,000,000 MIST`.
- Persist balance values as decimal integer strings.
- Use public wallet address only.

**Phase 0 verification:** the exact `StateService.GetBalance` method is supported by Tatum mainnet and was called successfully during Phase 0 using official Sui protobufs pinned at commit `79485a8328e2f58fa047e4ce1327704b412e958a`. The supplied demo address returned `balance="0"` MIST and no checkpoint/finality fields; `ListBalances` was empty. The method/auth is proven; the funded-balance demo path remains pending until the operator funds or replaces `SUI_DEMO_ADDRESS`. Do not silently switch to deprecated JSON-RPC or another provider.

Capture request time and response time, provider name, method, chain, address, coin type, balance/coinBalance/addressBalance if returned, and provider checkpoint/version only if actually present. Never fabricate a checkpoint or finality value. Keep raw response in protected server log only if policy permits; otherwise store a redacted normalized observation.

## 7. Data ownership and storage

- Neon Managed Better Auth owns authentication identities; users, sessions and auth configuration live in the `neon_auth` schema of the Neon database.
- `workspaces` + `workspace_members` define tenant ownership and role.
- Postgres tables own Interlock application state, deterministic metadata index and audit trail.
- Walrus Memory owns durable agent memory payloads; Postgres `memory_entries` point to blob IDs and store the exact filtering metadata/hash.
- Tatum owns chain read API; Interlock stores immutable observed result and source provenance.
- Groq receives only minimum plan context needed for language drafting; no API keys, auth tokens or unrelated user data.

## 8. Database and transaction design

All money-like/chain atomic quantities use `numeric(78,0)` or text validated as unsigned integer string. Use text for externally supplied large integers when driver precision risk exists; convert to BigInt in server domain code. Timestamps are `timestamptz` UTC. Use workspace composite foreign keys where possible to make tenant mismatch harder.

Neon role separation is mandatory: migrations use `DATABASE_URL_UNPOOLED` (`neondb_owner`), while the application uses `DATABASE_URL_APP` (`app_user`, `NOBYPASSRLS`). Application code must never import or use the migration URL. Every request-scoped transaction sets `app.user_id` for RLS; pooled connections must use transaction-local settings, not session-global state.

Use DB transactions for:
- creating plan + associated audit event;
- final decision row + cited decision-evidence rows + audit event;
- consuming clearance nonce/JTI + inserting simulation + audit event;
- superseding policy metadata + recording new policy reference (Walrus write itself is external and therefore a saga, not one SQL transaction).

External calls must never be placed inside a long-held SQL transaction. Use idempotency rows and status transitions to recover from partial failures.

## 9. Authentication and authorization

- Neon Managed Better Auth handles identities and sessions. Server integration uses `createNeonAuth` from `@neon/auth/next/server` with `NEON_AUTH_BASE_URL` and `NEON_AUTH_COOKIE_SECRET` (32+ characters). `@supabase/ssr` and Supabase Auth are removed.
- Sign-up is invite/membership-gated; do not expose public self-service workspace creation. Auth method (for example email/password or magic link) is configured in Neon Auth and must be verified against the current provider capabilities.
- Owner/Operator/Observer membership role checked on every route handler.
- Workspace ID comes from verified server membership/context; do not trust request body `workspaceId`.
- Enable RLS on every workspace-owned table. Plain PostgreSQL policies must use request-scoped `app.user_id` (set with `set_config('app.user_id', $1, true)` inside a transaction) joined to `workspace_members`; `auth.uid()` is not available. A missing or empty setting must deny.
- Application queries run as `app_user`, which has `NOBYPASSRLS` and does not own the tables. Migrations run separately as `neondb_owner` via `DATABASE_URL_UNPOOLED`; `neondb_owner` has `BYPASSRLS` and must never serve application requests. Readiness must verify `SELECT current_user` is `app_user`.
- Do not grant the application role table ownership or `BYPASSRLS`. Use explicit grants for required tables/functions and keep privileged maintenance paths isolated and documented.
- Agents are internal capabilities; no external agent can call privileged routes without a server-side service credential.

## 10. Security threat controls

| Threat | Control |
|---|---|
| IDOR/cross-tenant access | Membership check + RLS + workspace-scoped queries + negative tests |
| RLS bypass through privileged role | App connects only as `app_user` (`NOBYPASSRLS`); migrations use separate `neondb_owner` URL; startup checks `current_user`; tests assert role attributes |
| Client-side approval tampering | Server-side Sentinel and signed claims; never trust UI verdict |
| Prompt injection | Analyst has no tool access or policy authority; treat user/agent content as data; output schema validation |
| Memory poisoning | Agent-specific author allowlist, scope validation, immutable payload hash, provenance, quarantine and audit |
| Semantic recall omission | Deterministic candidate list; completeness check; HOLD on missing expected record |
| Replay | Short token TTL, random nonce/JTI, atomic one-time consume, unique constraint |
| Race condition | DB transaction, locks/unique indexes, idempotency key |
| Tatum SSRF/host manipulation | Hardcoded allowlisted gateway; never accept URL from user; strict address validation |
| Injection | Zod validation, parameterized queries, safe ORM/query builder |
| XSS | React escaping, safe text rendering, avoid arbitrary HTML; sanitize markdown if rendered |
| CSRF | SameSite secure cookies; validate origin/CSRF for state-changing routes as appropriate |
| Brute force/abuse | Neon Auth controls, route rate limits, request size and concurrency caps |
| Secret exposure | Server-only env, hosting secret store, log redaction, no NEXT_PUBLIC secrets |
| Webhook forgery | No webhook dependency in MVP; if added later, verify provider signature + timestamp + replay nonce |
| Financial risk | Simulation-only; no wallet signing, transaction construction or transfer endpoint |
| Supply-chain risk | Pinned dependencies, lockfile, audit, minimal dependency set, skill instruction review |
| Provider outage | Explicit degraded state and HOLD; bounded retries; no stale fallback beyond TTL |

## 11. API and application patterns

- Route Handlers under `/app/api/.../route.ts`; Node runtime for Tatum/Walrus.
- Request bodies validated with Zod; return stable envelope.
- Every mutating request uses authentication + role check + workspace scope + rate limit + idempotency where retry-sensitive.
- Responses never reveal raw credentials, delegate keys, stack traces or hidden workspace identifiers.
- Correlation ID travels from request to integration calls and audit events.
- Use typed integration adapter interfaces so provider SDK types do not leak into domain logic.

## 12. Observability and error handling

Structured logs fields: requestId, workspaceId (opaque internal ID), actorId, agentId, operation, integration, status, durationMs, providerRequestId if safe, memoryRecordId, decisionId. Never log keys, tokens, full auth headers, seed phrases, raw provider authorization details or unnecessary personal data.

Health checks:
- `/api/health`: application process and version only.
- internal readiness checks for database, Walrus and Tatum; access-controlled and redacted.
- distinguish `healthy`, `degraded`, `unavailable`; do not treat a shallow TCP check as credential proof.

## 13. Deployment

- Vercel protected preview for every phase checkpoint; Vercel Authentication enabled; generated `*.vercel.app` URL; no custom domain.
- Preview uses a separate Neon project or branch and the `interlock` Walrus namespace; only synthetic/demo data and the public wallet address.
- Production uses a separate Neon project/branch and the `interlock-prod` Walrus namespace; no preview secrets are copied.
- Memory baseline feature flag must fail startup validation if enabled for production.
- No production secrets copied into preview.
- Production deploy requires the bounded Phase 9 authority recorded in `OPERATOR_INTAKE.md`; any action outside that list remains DENIED.
- Migrations are version-controlled and applied through the migration role (`DATABASE_URL_UNPOOLED`, `neondb_owner`); application runtime uses `DATABASE_URL_APP` (`app_user`). Never use schema push destructively against production without authority. A verified backup/rollback path is required before applying production migrations.

## 14. Fixed stack and version policy

- Next.js 16.x App Router; React 19; TypeScript strict.
- Tailwind CSS 4; shadcn/ui components; Lucide icon set.
- Zod for runtime contracts.
- Neon Postgres + Managed Better Auth + `@neon/auth/next/server` (verify/pin exact package version at implementation); plain PostgreSQL RLS with `app_user` (`NOBYPASSRLS`) and separately privileged migrations.
- Walrus SDK `@mysten-incubation/memwal`; Phase 0 verified `0.1.14`; pin the exact tested version at implementation.
- Tatum Sui gRPC via `@grpc/grpc-js`, `@grpc/proto-loader`, official Sui API protobuf definitions pinned at immutable release/commit.
- Groq OpenAI-compatible API with strict JSON-schema structured outputs for Analyst only; confirmed model `qwen/qwen3.8-27b`; no policy authority.
- Vercel; Vitest, Testing Library, Playwright. Database migrations are version-controlled SQL applied through the Neon migration role; no Supabase CLI.

**Implementation detail — agent may decide:** exact patch versions compatible with the installed ecosystem, file naming, internal component composition and utility package choices. Agent may not change the architecture, major products or trust boundaries without a genuine incompatibility/security blocker and documented operator escalation.
