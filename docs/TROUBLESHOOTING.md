# TROUBLESHOOTING.md — Interlock Operations

| Symptom | Likely cause | Safe response |
|---|---|---|
| Tatum unauthenticated | Missing/invalid `TATUM_API_KEY` or wrong header | Verify secret reference and `x-api-key`; do not print key; no observation created |
| Tatum gRPC UNIMPLEMENTED | Endpoint does not expose `StateService.GetBalance` | Capture method/status; stop provider adapter; do not silently switch to deprecated JSON-RPC |
| Tatum rate limit/timeout | Quota or provider instability | Bounded retry with jitter; respect TTL; show degraded state; Sentinel HOLD |
| Balance is zero | Address has no balance for configured coin type | Display exact zero; do not invent value; prevent exposure plan |
| Walrus job pending | Asynchronous persistence still in progress | Keep memory in PROCESSING; poll boundedly; do not use it as active evidence |
| Walrus job failed/no blob ID | Provider or credential issue | Mark FAILED; retain safe error code; retry idempotently if supported |
| Walrus list shows record but recall does not | Metadata listing is not content retrieval; recall may be incomplete | Treat missing candidate as HOLD; inspect namespace/SDK/record attributes |
| Recall returns fewer candidates than DB expects | Semantic recall not exhaustive | HOLD; reduce active test dataset or improve exact candidate prompting, never silently truncate |
| Hash mismatch | Serialization drift or memory tampering | Quarantine entry; audit; do not edit the historical memory in place |
| Sentinel HOLD | Evidence stale/missing/conflicting or provider unavailable | Show exact reason code and recovery action; refresh evidence or resolve policy conflict |
| Sentinel rejects valid-looking plan | Applicable policy threshold violated or incorrect scope | Inspect cited exact constraint and bps math; do not override manually |
| Runner says already consumed | Clearance replay or duplicate request | Return existing execution or 409; never mint repeated execution for same decision |
| Demo baseline unavailable | Production or preview flag disabled | Expected outside authorized preview; do not enable in production |
| Authentication succeeds but workspace is inaccessible | Invite/membership invalid or RLS mismatch | Check membership role/status and policy; do not bypass RLS with service key |
| Preview deploy blocked | Missing Vercel access/config | Record error; continue safe local work; do not claim preview exists |
| StageShow installation fails | Network/package access/skill registry issue | Log exact error and proceed with standard UI/accessibility practices |
| TTS unavailable/free tier exhausted | Account, region, quota or terms | Use documented genuinely free permitted fallback or approved human narration; no paid use without authority |

## Incident handling

1. Preserve logs/correlation IDs, redact secrets.
2. Stop the affected unsafe operation, not unrelated safe work.
3. Set decision outcome to HOLD when safety evidence is uncertain.
4. Record issue and recovery action in BUILD_LOG and AI_HANDOFF.
5. Never delete historical Walrus records to make the UI appear clean; supersede/quarantine with audit history.
