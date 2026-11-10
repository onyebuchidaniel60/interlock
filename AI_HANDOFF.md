# AI_HANDOFF.md — Interlock Current State

## Current status

- Product: Interlock
- Blueprint: created; product and architecture decisions specified
- Implementation phase: **Phase 0 — consolidated operator intake/readiness**
- Application implementation: **NOT STARTED**
- Repository: **NOT CONFIRMED**
- Reference UI images: **NOT SUPPLIED**
- Walrus account/namespace/delegate credentials: **NOT PROVIDED OR VALIDATED**
- Tatum API key / public demo address / `StateService.GetBalance` support: **NOT PROVIDED OR VALIDATED**
- Supabase project/access: **NOT PROVIDED OR VALIDATED**
- OpenAI account/model/budget: **NOT PROVIDED OR VALIDATED** (optional Analyst integration)
- Deployment access: **NOT PROVIDED OR VALIDATED**
- StageShow UI skill: not installed; installation is required at start of Phase 6
- Tests: none run; no application code exists in this package
- Preview URL: **NONE**
- Deployed commit: **NONE**
- Production authorization: **DENIED BY DEFAULT; not granted**
- Budget: **$0 unapproved spend**
- Demo video: not produced; script/plan documented separately

## Product-critical invariants
1. Walrus Memory mainnet must be core functionality, not decoration.
2. Same immutable plan hash and observation must be used for memory-off baseline and memory-on protected comparison.
3. Memory OFF baseline exists only in local/test/protected preview and only as a simulation; startup must fail if enabled in production.
4. Normal production decision path is fail-closed. Missing policy/evidence, incomplete semantic recall, stale or conflicting evidence => HOLD.
5. Sentinel is deterministic; an LLM cannot approve/reject.
6. Runner accepts only final APPROVE with signed, 60-second, workspace/plan/decision-bound, single-use clearance.
7. All execution is simulated; no wallet custody/signing, trades or transfers.
8. Final APPROVE requires Sentinel VERDICT memory write and recall verification.

## Next task — exact coding-agent start point

Read the complete handoff package and repository instructions. Inspect repository and environment without modifying code. Complete the single consolidated readiness check in `OPERATOR_INTAKE.md`. Verify exact reference images or obtain explicit authorization for generated references; repository access; Supabase project and migration permissions; Walrus mainnet account, namespace and delegated-key signed write/read smoke test; Tatum API key/public address and `StateService.GetBalance` gRPC support; OpenAI access and budget or fallback; preview host access; quotas/rate limits; spend ceiling; production authority; demo audience, redactions and output path. Do not start code while a critical input is missing. After readiness, execute Phase 1 onward autonomously.

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

## Known open decisions / blockers

- Confirm target repository. The Assay repo in the background handoff is a design reference and is not assumed to be the target implementation repository.
- Obtain UI reference image(s), or explicit operator authorization to generate them.
- Provision dedicated Walrus Memory mainnet account, namespace and role-scoped delegate keys. Do not reuse a sample/shared account.
- Prove Tatum gateway supports requested gRPC method `StateService.GetBalance` before build relies on it.
- Confirm Supabase, OpenAI and Vercel access; confirm paid-service limits.
- Confirm whether public GitHub footer link is allowed; omit it if repository is private.
- Confirm demo voice/TTS preferences and approved output storage.

## Do not claim

Do not claim that app code, a live preview, deployed build, real provider integration, tests or demo video exist until produced and verified in the selected repository. This package is a blueprint only.
