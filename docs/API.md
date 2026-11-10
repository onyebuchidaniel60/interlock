# API.md — Interlock HTTP API Contract

All endpoints are same-origin `/api` Route Handlers using Node runtime where server integrations require it. All user-facing requests require a valid Neon Managed Better Auth session except `/api/health`. Authorization is based on the authenticated user's verified workspace membership. Client-supplied `workspaceId`, role or agent identity is never trusted.

## Standard response envelope

Success:

```json
{
  "ok": true,
  "data": {},
  "requestId": "req_..."
}
```

Failure:

```json
{
  "ok": false,
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "The request could not be validated.",
    "details": [{ "field": "amountMist", "issue": "Must be a positive integer string." }]
  },
  "requestId": "req_..."
}
```

Do not expose stack traces, SQL, provider credentials, keys, raw authorization headers or internal service secrets. Use appropriate HTTP status codes: 400 validation, 401 unauthenticated, 403 forbidden, 404 missing/hidden tenant resource, 409 state conflict/idempotency conflict, 422 semantic validation, 429 rate limit, 502 provider failure, 503 dependency unavailable, 500 unexpected application failure.

## Endpoint conventions

- Request bodies use Zod schemas.
- Authenticated user and workspace are resolved server-side.
- Mutating operations have request size limits, rate limits and idempotency where retries can duplicate work.
- IDs are opaque; queries always include verified workspace scope.
- Async provider actions return a durable job identifier and status; the UI polls GET endpoints with bounded backoff.
- API responses include `requestId` and, where relevant, resource status and `createdAt`.

## Endpoints

### GET `/api/health`
**Purpose:** basic process/version check.  
**Auth:** public, no secrets.  
**Response:** `{ "ok": true, "data": { "status": "healthy", "version": "..." } }`.  
**Side effects:** none. Do not include provider credentials or detailed dependency diagnostics.

### GET `/api/workspace`
**Purpose:** return current authenticated user's active workspace and membership.  
**Auth:** required.  
**Authorization:** active membership.  
**Response fields:** workspace `{id,name,createdAt}`, member `{role,status}` and feature config safe for client.  
**Errors:** 401, 403/404 when not a member, 500.

### PATCH `/api/workspace/settings`
**Purpose:** update allowed workspace configuration.  
**Auth:** required; Owner only.  
**Request:** `{ "name": "...", "exposureLimitBps": 1000 }` (only fields enabled by product spec).  
**Validation:** name length; exposure limit integer within configured safe range. Changes to active policy require creation of new immutable CONSTRAINT memory rather than mutating old memory payload.  
**Side effects:** update workspace settings; append audit event.  
**Errors:** 400, 401, 403, 409, 500.

### GET `/api/agents`
**Purpose:** read logical agent identities and current status.  
**Auth:** required; all workspace roles read.  
**Response:** Scout, Analyst, Sentinel and Runner status, last activity and capability labels; never return delegate keys.  
**Errors:** 401, 403, 500.

### GET `/api/memories`
**Purpose:** list typed memory ledger metadata.  
**Auth:** required; all roles read.  
**Query:** `type?`, `scope?`, `status?`, `cursor?`, `limit?` (1–50).  
**Response:** record ID, type, scope, author, timestamps, lifecycle, blob ID, anchor summary and verification status. Do not return secrets or assume Postgres alone proves payload validity. Detail view must show verified status and fetch/retrieve payload as required.  
**Errors:** 400, 401, 403, 500.

### POST `/api/observations`
**Purpose:** trigger Scout read-only Tatum observation and Walrus FACT persistence.  
**Auth:** required; Owner or Operator.  
**Idempotency:** required `Idempotency-Key`; deduplicate repeated identical user intent within bounded TTL.  
**Request:** `{ "walletSourceId": "...", "coinType": "0x2::sui::SUI" }`. Do not accept a caller-supplied Tatum URL. Address is loaded from a workspace-owned verified `wallet_sources` record; optional flow to create source should separately validate address.  
**Processing:** check role/rate limit → call Tatum read → persist immutable observation → create FACT → submit Walrus write → return tracked job.  
**Response:** `{ "observationId": "...", "memoryJobId": "...", "status": "PROCESSING" }`.  
**Errors:** 400 invalid source, 401, 403, 409 duplicate conflict, 429, 502/503 provider or Walrus failure, 500. Never mark memory active on initial submission alone.

### GET `/api/memory-jobs/:id`
**Purpose:** read async Walrus write job state.  
**Auth:** required; workspace member.  
**Response:** state `PENDING|SUBMITTED|PROCESSING|VERIFIED_ACTIVE|FAILED|QUARANTINED`, safe error code, blob ID if verified, updated time.  
**Errors:** 401, 403, 404, 500.

### POST `/api/constraints`
**Purpose:** create immutable CONSTRAINT record.  
**Auth:** Owner by default; Operator only if an explicit workspace permission is configured.  
**Request example:**

```json
{
  "scope": "wallet:0x...",
  "ruleId": "MAX_EXPOSURE_BPS",
  "maxExposureBps": 1000,
  "validFrom": "2026-11-10T00:00:00Z",
  "expiresAt": null,
  "reason": "Limit simulated exposure to ten percent of verified balance."
}
```

**Validation:** rule allowlist; integer bps; valid scope; dates; only supported MVP rule types.  
**Processing:** create immutable payload/hash → write Walrus using policy delegate → verify completion/recall → set ACTIVE; append audit.  
**Errors:** 400, 401, 403, 409, 429, 502/503. Pending/failed memory is not applicable policy.

### POST `/api/plans`
**Purpose:** create immutable action plan.  
**Auth:** Owner/Operator.  
**Request:**

```json
{
  "walletSourceId": "...",
  "observationId": "...",
  "actionType": "SIMULATED_EXPOSURE",
  "exposureBps": 1500,
  "amountMist": "15000000000",
  "rationale": "Test plan for the demo"
}
```

`amountMist` is an unsigned integer string; do not parse as JS Number. `exposureBps` is integer. Any extra unsupported field is rejected.  
**Processing:** validate owned observation and freshness → canonicalize input → calculate plan hash → persist immutable plan + audit event. Analyst may draft structured text after plan persistence; model cannot alter amount/bps or hash.  
**Response:** plan ID, status, plan hash, expiry.  
**Errors:** 400, 401, 403, 404, 409, 422, 500.

### GET `/api/plans/:id`
**Purpose:** read a workspace-owned plan and lifecycle.  
**Auth:** required; all roles read.  
**Errors:** 401, 403/404, 500.

### POST `/api/plans/:id/check`
**Purpose:** request Sentinel evaluation.  
**Auth:** Owner/Operator.  
**Idempotency:** required. Same plan hash + active decision attempt should return existing in-flight/final decision unless explicit re-evaluation is permitted.  
**Request:** `{ "rulesVersion": "interlock-mvp-1" }`; caller cannot provide a desired verdict or candidate evidence IDs.  
**Processing:** load immutable plan → enumerate exact candidates in DB → recall/verify Walrus content → evaluate deterministically → persist decision/evidence → for provisional approval, write and verify VERDICT memory before final APPROVE.  
**Response:** `{ "decisionId": "...", "status": "CHECKING|APPROVED|REJECTED|ON_HOLD", "verdict": "APPROVE|REJECT|HOLD" }`. Async response can be 202 while checking.  
**Errors:** 401, 403, 404, 409, 422, 429, 502/503, 500. A provider/memory verification failure maps to HOLD where possible.

### GET `/api/decisions/:id`
**Purpose:** read decision, rationale, policy result and evidence citations.  
**Auth:** required; all roles read.  
**Response:** verdict, reason code, plan hash, rules version, evidence list (record ID/type/author/createdAt/blob ID/anchor verification state), created/finalized times.  
**Errors:** 401, 403/404, 500.

### POST `/api/decisions/:id/simulate`
**Purpose:** request Runner simulation.  
**Auth:** Owner/Operator.  
**Request:** optional `{ "idempotencyKey": "..." }`; no action amount or plan mutation.  
**Processing:** Runner loads final decision; verifies APPROVE; verifies Sentinel signature and claims; atomically consumes one-time JTI and inserts one execution; emits OUTCOME memory and audit record. If outcome memory write fails after simulation record, retain execution truth and mark outcome memory pending/failed; do not pretend transaction rollback can undo external memory.  
**Errors:** 401, 403, 404, 409 (not approved/already consumed), 422 invalid/expired clearance, 503, 500. There is no real execution endpoint.

### GET `/api/executions/:id`
**Purpose:** read simulation record and OUTCOME write status.  
**Auth:** required; all roles read.  
**Errors:** 401, 403/404, 500.

### GET `/api/audit`
**Purpose:** paginated workspace audit trail.  
**Auth:** required; all roles read.  
**Query:** `after?`, `limit?` (1–100), `eventType?`.  
**Response:** timestamp, actor, event type, resource ref, safe summary and correlation ID.  
**Errors:** 400, 401, 403, 500.

### POST `/api/demo/compare`
**Purpose:** run the protected-preview memory OFF/ON comparison.  
**Auth:** Owner/Operator; additionally require `INTERLOCK_DEMO_BASELINE_ENABLED=true` and non-production environment.  
**Request:** `{ "planId": "..." }`; server fetches immutable plan/hash/observation.  
**Processing:** baseline branch invokes isolated simulator without Sentinel and labels result UNPROTECTED BASELINE; guarded branch runs normal Sentinel and shows actual citations. Both are non-financial simulations.  
**Errors:** 403/404 in production or feature disabled; 401, 409, 422, 503. Startup config must reject demo feature enabled in production.

### POST `/api/demo/reset`
**Purpose:** reset disposable preview fixture only.  
**Auth:** Owner; preview/test only.  
**Processing:** reset only application-owned disposable fixture rows in a dedicated demo workspace after confirming environment; never delete Walrus blobs as reset mechanism. Prefer create fresh fixture namespace/IDs.  
**Errors:** 403 outside preview/test; 409 if workspace is not marked disposable.

## Rate limits and idempotency

- Observation/Scout calls: per user/workspace and external provider budget; strict daily cap.
- Walrus writes: per agent/workspace; bound concurrency and job polling.
- Plan checks: per user/workspace; coalesce duplicate in-flight same-plan requests.
- Login attempts: rely on Neon Auth controls plus application protections.
- Demo reset: extremely low rate; Owner only.
- Idempotency keys are stored with user/workspace/operation/resource and request hash. Same key + same hash returns original result; same key + different hash returns 409.

## Internal-only services

Scout, Analyst, Sentinel and Runner domain services are not public endpoints. Route Handlers invoke them after user authorization. No browser-provided agent identity is accepted. All service-to-service operations use typed internal interfaces and server-only credentials.
