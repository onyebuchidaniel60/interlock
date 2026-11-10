# PROJECT_SPEC.md — Interlock Product and Functional Specification

## 1. Product definition

**Product:** Interlock  
**Description:** A shared-memory agent execution-safety system that lets one agent's verified discovery block another agent's unsafe proposed action.  
**Primary user:** Developers/operators of multi-agent automation systems.  
**Core outcome:** A specific action is rejected because Sentinel retrieves and verifies a memory written by another agent.  

### Problem and alternatives
Agents often make decisions using incomplete or isolated context. Chat histories, shared-memory products, local rules and human review may help, but they do not necessarily create an enforceable execution gate where another agent's discovery blocks the proposed action. Interlock combines persistent agent memory, deterministic policy checks and an execution boundary.

### Value and differentiator
The value is not memory storage by itself; it is a verifiable refusal at the point of execution. Every rejection cites the actual memory and, where applicable, the chain observation that grounded it.

### Product boundaries
MVP is a simulation and audit product. It does not trade, submit transactions, custody assets, sign transactions, provide financial advice, or guarantee the truth of external observations. It is not a generic chatbot, memory marketplace, DEX, wallet or autonomous fund manager.

## 2. User roles

- **Owner:** creates/configures workspace, invites members, sets policy, supersedes/revokes policy records, views all records.
- **Operator:** runs observations, creates plans, requests evaluations and triggers permitted simulations.
- **Observer:** read-only access to dashboard, memory evidence, decisions and audit history.
- **Agent identities:** server-side logical actors with narrowly scoped capabilities; not human accounts.

No user or agent can manually transform a Sentinel `REJECT`/`HOLD` into `APPROVE`.

## 3. MVP scope

### MUST HAVE
1. Invite-only workspace auth and three human roles.
2. Four logical agents: Scout, Analyst, Sentinel, Runner.
3. Tatum Sui mainnet balance observation from a public address.
4. Walrus Memory mainnet FACT write, job completion, blob ID, metadata and recall verification.
5. Typed FACT, CONSTRAINT, VERDICT and OUTCOME entries.
6. PostgreSQL metadata index for exact deterministic tag filtering.
7. Sentinel `APPROVE` / `REJECT` / `HOLD` decision with evidence citations.
8. Runner hard-gated by a signed, expiring, single-use approval.
9. Simulation-only execution record.
10. Memory OFF/ON demo baseline, preview/test-only.
11. Audit history and legible evidence panel.
12. Unit, integration, E2E and security tests.

### SHOULD HAVE
Policy supersession, memory expiry status, retry visibility, decision history, agent activity and owner settings.

### NICE TO HAVE
Downloadable decision report, basic filters and simple analytics.

### FUTURE
Additional chains/providers, production execution adapters, smart-contract enforcement, agent payments, advanced memory governance and workspace-specific account provisioning.

### OUT OF SCOPE
Real trades, transfers, wallet custody/creation, private keys, seed phrases, payment products, multi-chain, counterparties, DEX integration, arbitrary agent tools, public memory marketplace and 3D office.

## 4. Domain vocabulary and records

Each Walrus-backed memory is a typed immutable record:

- `FACT`: observed condition, with source evidence and validity window.
- `CONSTRAINT`: policy rule that limits plans.
- `VERDICT`: Sentinel's completed decision and the facts/constraints cited.
- `OUTCOME`: what happened in a simulation after an allowed action.

Required common fields: `recordId`, `workspaceId`, `type`, `scope`, `authorAgentId`, `createdAt`, `validFrom`, optional `expiresAt`, `status`, `payload`, `contentHash`, `walrusBlobId`, `walrusNamespace`, optional `anchor`, `supersedesRecordId`.

The PostgreSQL row is a deterministic index and lifecycle record. The full canonical memory payload is written to Walrus Memory. Sentinel must retrieve and verify the Walrus content before using it as decision evidence.

## 5. Primary user flows

### Flow A — Workspace setup
**Entry:** `/setup`.  
**Preconditions:** authenticated invitee; workspace invitation valid.  
**Action:** accept invitation or create the first workspace (only if the account's onboarding policy allows).  
**System:** validate invitation, create/attach membership, assign role, initialize default agent identities and demo policy template.  
**State:** `workspace_members` row and `agent_identities` rows.  
**Validation:** invitation expiry, duplicate membership, allowed role.  
**Success:** dashboard.  
**Failure:** expired/invalid invitation; retry by requesting a new invitation.  
**Permissions:** Owner manages membership; invitee accepts.  
**Exit:** dashboard or access denied.

### Flow B — Scout obtains and stores observation
**Entry:** Dashboard action or `/observations`.  
**Preconditions:** Operator/Owner; valid configured public Sui address and coin type; Tatum key and Walrus account configured.  
**Action:** request a fresh observation.  
**System:** validate address and allowlisted mainnet target; call Tatum gRPC `StateService.GetBalance`; normalize balance as integer MIST; store immutable `chain_observations`; create FACT payload; hash canonical JSON; submit through Scout's Walrus delegate key; track asynchronous job; wait/poll boundedly; require completed status and `blob_id`; list memory metadata; recall and verify the new record; mark `ACTIVE`.  
**State:** observation row, memory row and memory job row.  
**Validation:** chain/network, address, coin type, provider response, nonnegative integer, observation freshness.  
**Success:** memory detail displays observation and clickable Walrus blob ID.  
**Failure:** provider unavailable/unauthorized/rate-limited; Walrus write pending/failed; blob unavailable; content mismatch. Never mark unverified memory active.  
**Edge cases:** duplicate requests, stale observation, zero balance, provider response with unsupported fields.  
**Permissions:** Owner/Operator.  
**Exit:** active fact or actionable error state.

### Flow C — Create an action plan
**Entry:** `/plans/new`.  
**Preconditions:** Owner/Operator; active observation; user understands this is simulated.  
**Action:** choose observed wallet, set action type, amount/exposure basis points and rationale.  
**System:** validate and create immutable plan; calculate canonical hash; store numeric values as integer strings/BigInt. Analyst may generate a schema-constrained explanation but cannot alter operator-entered numeric fields.  
**State:** plan `DRAFT` then `READY_FOR_CHECK`.  
**Validation:** amount positive integer; valid wallet/scope; bounded exposure; plan hash stable.  
**Success:** plan detail with request-check action.  
**Failure:** invalid/expired evidence; AI unavailable; schema failure. Deterministic fallback rationale may be used; no automatic approval.  
**Permissions:** Owner/Operator.  
**Exit:** ready plan or validation error.

### Flow D — Sentinel evaluates plan
**Entry:** `POST /api/plans/:id/check`.  
**Preconditions:** authenticated Owner/Operator; plan exists, belongs to workspace and is unexpired; protected policy path enabled.  
**Action:** request evaluation.  
**System:** load plan and hash; load exact-scope candidate constraints/facts from PostgreSQL where active/current; query Walrus recall constrained by namespace and relevant tags/record identifiers; retrieve expected records; validate author, IDs, hash, schema, scope, time window, blob ID and anchor; detect missing expected evidence; run deterministic rules; persist decision. If provisional APPROVE, write a VERDICT to Walrus and verify it before finalizing APPROVE.  
**State:** `CHECKING` → `APPROVED` / `REJECTED` / `ON_HOLD`.  
**Validation:** complete candidate set, all evidence verifiable, no unresolved conflict, fact freshness.  
**Success:** decision page with verdict, rule explanation and cited evidence.  
**Failure:** Walrus unavailable, semantic result incomplete, hash mismatch, stale fact, chain anchor mismatch, provider outage, DB outage. Return `HOLD` or technical error; never fail open.  
**Permissions:** Owner/Operator can request; Observer reads.  
**Exit:** final decision.

### Flow E — Runner simulates
**Entry:** Decision page `Simulate` action.  
**Preconditions:** decision is final APPROVED; preview/test simulation enabled; clearance valid.  
**Action:** execute simulated action.  
**System:** verify signed clearance, scope, plan hash, decision ID, expiry, nonce and mode; consume clearance and create execution in one DB transaction; produce deterministic simulated result; append OUTCOME and audit record.  
**State:** `NOT_STARTED` → `SIMULATED` or `FAILED`.  
**Validation:** one-time nonce, unique execution per decision for the MVP, no altered plan.  
**Success:** simulation outcome shown; no external funds move.  
**Failure:** rejected/held decision, expired/replayed token, DB transaction failure.  
**Permissions:** Owner/Operator.  
**Exit:** execution receipt or blocked status.

### Flow F — Demo compare
**Entry:** `/demo`; feature flag enabled only in local/test or protected preview.  
**Preconditions:** deterministic dataset and verified observation/memory already prepared.  
**Action:** select the same plan for both comparison branches.  
**System:** compute one immutable `planHash`; run isolated baseline simulation that omits Sentinel only in demo harness; run protected Interlock check with memory enabled; show difference and evidence. No real action or money movement.  
**Success:** baseline illustrates unguarded pass; protected path returns REJECT and citations.  
**Failure:** if evidence unavailable, demo displays HOLD/error rather than inventing a block.  
**Permissions:** demo access only to authorized workspace members; route inaccessible in production unless a read-only demo presentation is explicitly configured.  
**Exit:** comparison with reproducible run IDs.

## 6. Business rules and state machines

### Exposure rule
MVP policy: proposed exposure must be <= 1,000 bps (10%) of the verified SUI balance snapshot. Demo plan: 1,500 bps (15%). Amounts use integer MIST. Threshold and plan exposure are integer basis points. No floats.

### Freshness
- Chain observation FACT expires 300 seconds after `observedAt` for the balance-dependent policy.
- Action plan expires 300 seconds after creation.
- Approval clearance expires after 60 seconds and is single-use.
- A stale observation causes HOLD and requires Scout to refresh it.

### Decision semantics
- `REJECT`: verified evidence demonstrates a policy violation.
- `HOLD`: the system cannot safely determine an outcome (missing/invalid/stale/ambiguous evidence, provider outage, unresolved policy conflict, missing policy).
- `APPROVE`: all applicable required evidence is complete and valid, no constraint is violated, Sentinel's VERDICT memory write has completed and been verified.

No `UNKNOWN` is coerced into `APPROVE`. No absence of policy is interpreted as permission.

### Agent state
`IDLE` → `RUNNING` → `SUCCEEDED` | `FAILED` | `WAITING_EXTERNAL`.

### Memory write state
`PENDING` → `SUBMITTED` → `PROCESSING` → `VERIFIED_ACTIVE` | `FAILED` | `QUARANTINED`.

### Plan state
`DRAFT` → `READY_FOR_CHECK` → `CHECKING` → `APPROVED` | `REJECTED` | `ON_HOLD` | `EXPIRED`.

### Decision state
`REQUESTED` → `EVIDENCE_LOADING` → `EVALUATED` → `VERDICT_MEMORY_PENDING` → `FINAL_APPROVED` | `FINAL_REJECTED` | `FINAL_HOLD`.

### Execution state
`NOT_STARTED` → `CLEARANCE_VALIDATING` → `SIMULATED` | `BLOCKED` | `FAILED`.

### Constraint lifecycle
`DRAFT` → `PENDING_MEMORY` → `ACTIVE` → `SUPERSEDED` | `REVOKED` | `EXPIRED` | `QUARANTINED`.

Constraints are append-only. Superseding creates a new record with `supersedesRecordId`; old evidence remains auditable. If multiple applicable constraints conflict and the strictest cannot be determined safely, HOLD.

## 7. Functional requirements and acceptance criteria

### FR-01 Authentication and workspace isolation
- Authenticated users must have an active workspace membership for every protected operation.
- API must derive workspace authorization from server-verified membership, not client-supplied workspace ID alone.
- RLS must prevent cross-workspace reads/writes.
- **Acceptance:** user A cannot access user B's workspace, plan, evidence, decision or execution by changing IDs; server tests and RLS tests pass.

### FR-02 Scout chain observation
- Scout reads only the allowlisted Sui mainnet endpoint and public address.
- Store provider, network, method, address, coin type, atomic balance, observation time and available provider checkpoint/reference.
- **Acceptance:** integration test performs a real read with supplied credential and address; amount is exact integer string; no private key is requested or stored.

### FR-03 Walrus FACT persistence
- Submit the complete typed FACT using Scout delegate key; track asynchronous write; require job completion, blob ID, metadata presence and recall verification.
- **Acceptance:** verified FACT is discoverable and has matching canonical payload/hash; pending write cannot be used by Sentinel.

### FR-04 Constraint management
- Owner can create, supersede and revoke policy entries. Operator may be given create permission only if explicitly configured; default Owner-only for policy changes.
- **Acceptance:** policy write immutable, audited, verified in Walrus; superseded policy remains visible but no longer active.

### FR-05 Plan creation
- Plan has immutable inputs, workspace, observation reference, scope, plan hash and expiry.
- Numeric values are integer strings; Analyst explanation cannot mutate numerical intent.
- **Acceptance:** changing any decision-relevant field changes plan hash and invalidates previous decision/clearance.

### FR-06 Sentinel evaluation
- Query DB index deterministically by workspace, scope, type, status, validity and time.
- Retrieve expected candidate memories from Walrus and verify payloads/provenance/anchors.
- Apply deterministic exposure rule and freshness checks.
- **Acceptance:** same plan and evidence yields same deterministic verdict; 15% against 10% rule is REJECT; missing required memory or Walrus outage is HOLD; final APPROVE requires verified VERDICT memory.

### FR-07 Runner gate
- Runner accepts only valid final APPROVE clearance, matching workspace, plan hash, decision, expiry and one-time nonce.
- **Acceptance:** reject/hold/expired/replayed/tampered/other-workspace clearance cannot create execution; concurrency test yields at most one execution.

### FR-08 Audit/evidence UI
- Display verdict, timestamp, plan hash, applicable policy, cited FACT/CONSTRAINT/VERDICT, author, Walrus blob ID and chain observation details.
- **Acceptance:** each evidence link resolves to verified memory detail or clearly reports unavailable; UI never labels an unverified reference verified.

### FR-09 Demo comparison
- Same immutable plan and observation used in both branches; baseline branch runs only in safe demo harness; protected path uses Sentinel.
- **Acceptance:** baseline and protected runs share plan hash; Memory ON rejection cites actual memory blob; demo mode is impossible in production config.

### FR-10 Operational safety
- Health checks must distinguish app health, database health, Walrus readiness and Tatum readiness; no secrets in health output.
- **Acceptance:** external outage gives explicit degraded state and causes safe HOLD; no fail-open behavior.

## 8. Edge-case matrix

| Feature | Edge case | Required behavior |
|---|---|---|
| Tatum | 401/403 | Do not retry indefinitely; alert configuration error; no FACT; Sentinel HOLD |
| Tatum | 429/timeout | Bounded retry with jitter; no stale data reuse beyond TTL; HOLD |
| Tatum | Zero balance | Display zero; prohibit exposure plan; HOLD/validation block |
| Tatum | Wrong network/coin type | Reject observation; do not write active FACT |
| Walrus | Write accepted but still pending | Keep `PROCESSING`; do not use memory |
| Walrus | Failed write/no blob ID | Mark failed; retry only with safe idempotency semantics |
| Walrus | `listMemories` shows metadata but recall content missing | HOLD; metadata alone is not evidence |
| Walrus | Recall returns partial candidates | HOLD if expected candidate set not complete |
| Memory | Hash/schema/author/scope mismatch | Quarantine record, audit, HOLD |
| Policy | Conflicting constraints | Apply unambiguously stricter rule; else HOLD |
| Policy | No policy exists | HOLD; never implicit approval |
| Plan | Invalid/negative/overflow amount | Reject input; do not persist ready plan |
| Plan | Plan changed after check | New hash; old decision/clearance invalid |
| Runner | Replay/concurrent requests | Atomic one-time consume; unique execution constraint |
| DB | Transaction failure | Roll back; no success state or clearance consumption ambiguity |
| Analyst | Timeout/invalid schema output | Deterministic explanation fallback; no policy effect |
| Auth | Cross-tenant identifier | 404 or 403 consistently; no data leak |
| Demo | Baseline invoked outside preview | 404/403; startup config validation fails if demo flag enabled in production |
| Demo | Required evidence unavailable | Show HOLD/error; never fabricate comparison outcome |

## 9. Non-functional requirements

- Security: fail closed; RLS; server-only secrets; no wallet signing/custody.
- Reliability: idempotent external write jobs; bounded retries; durable job state.
- Auditability: append-only decision and event trail; every verdict has evidence references.
- Performance: normal cached UI navigation should feel immediate; provider calls may show honest progress/loading; do not fake instant verification.
- Accessibility: semantic HTML, keyboard navigation, focus visibility, labels, adequate contrast, reduced-motion support.
- Responsive: phone, tablet, desktop; table content must have a mobile-friendly presentation.
- Observability: structured logs with correlation/request IDs; redact secrets and user-sensitive fields.
- Cost: no unapproved paid add-ons; default unapproved spend ceiling is $0.

## 10. Screen inventory

| Route | Purpose | Main role | Critical states/actions |
|---|---|---|---|
| `/login` | Sign in | All members | OTP sent, expired link, invalid account |
| `/setup` | Accept invite/create workspace | Owner/member | Invite expired, duplicate membership, success |
| `/dashboard` | Overview and next actions | All | Health/degraded, no memories, recent verdicts |
| `/observations` | Tatum observations | Owner/Operator | fetch, pending, success, stale, provider failure |
| `/memory` | Typed shared ledger | All; mutation gated | type/scope/status filters, pending, quarantined, unavailable |
| `/plans` | List plans | All read; mutation gated | empty, filters, expired, status |
| `/plans/new` | Create plan | Owner/Operator | validation, evidence freshness, simulation label |
| `/plans/[id]` | Plan detail | All read | hash, evidence snapshot, evaluate action |
| `/decisions/[id]` | Explain verdict | All read | approve/reject/hold, citations, simulation control |
| `/audit` | Audit history | All read | pagination, event detail, no results |
| `/agents` | Agent status | All read | idle/running/failed/waiting; no direct privileged controls |
| `/settings` | Workspace config | Owner | members, thresholds, integrations readiness; secrets masked |
| `/demo` | Comparison journey | Protected preview/test only | baseline vs guarded, reset test fixture |

## 11. Acceptance gate for MVP completion

MVP is complete only when all of the following evidence exists:
1. A real Sui mainnet balance was fetched through the approved Tatum gRPC method.
2. Scout wrote a FACT to Walrus Memory mainnet and verified completed write + recall.
3. A stored CONSTRAINT is recalled and validated by Sentinel.
4. A 15% plan against a 10% exposure cap is rejected.
5. Rejection cites actual Walrus blob(s), author, timestamps and Tatum observation.
6. The same plan hash baseline demo passes only in the isolated simulation harness and protected run rejects.
7. Runner rejects rejected, held, expired, replayed and mismatched clearance.
8. A final approval path (e.g., compliant 5% plan) can be approved only with all evidence valid, and Runner can simulate it exactly once.
9. Automated tests and deployed-preview E2E flows pass.
10. No critical/high security defect remains.
11. Reference-led UI and documentation complete.
12. Reviewed demo video is <=180 seconds.
