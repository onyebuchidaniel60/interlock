# Interlock

**A shared-memory execution safety layer for multi-agent applications.** Interlock lets one agent's verified discovery prevent another agent from executing an action that violates a known constraint.

> This repository is a blueprint/handoff package at present. It does not contain an implemented application. Do not claim that the app, integrations, preview or demo are live until those are built and verified.

## Product concept

- **Scout** observes facts and records evidence.
- **Analyst** drafts a structured action plan.
- **Sentinel** retrieves and verifies shared memory, then deterministically returns APPROVE, REJECT or HOLD.
- **Runner** can only perform a simulated action after a signed, short-lived, single-use Sentinel approval.

Walrus Memory mainnet is the persistent memory layer. PostgreSQL stores deterministic typed metadata and application state. Tatum provides read-only Sui observations. An LLM may help Analyst explain a plan but cannot decide policy or authorize execution.

## Safety boundary

The MVP is simulation-only. No real trading, transfers, wallet custody, private-key collection, signing or payment execution. Missing, stale, conflicting or unverifiable evidence produces HOLD. The Memory OFF comparison is restricted to a protected preview/test baseline and must be impossible in production.

## Handoff documents

- `INTERLOCK_IMPLEMENTATION_BLUEPRINT.md` — consolidated blueprint and unresolved inputs.
- `PROJECT_SPEC.md` — product, scope, workflows, rules, functional requirements and acceptance criteria.
- `ARCHITECTURE.md` — technical architecture, integration boundaries and security.
- `IMPLEMENTATION_PLAN.md` — phase-by-phase autonomous plan.
- `AGENTS.md` — persistent coding agent instructions.
- `AI_HANDOFF.md` — current state and exact next task.
- `OPERATOR_INTAKE.md` — one consolidated readiness check.
- `REFERENCE_ASSETS.md` — inventory of the four supplied reference images and design observations.
- `DEMO_VIDEO_PLAN.md` — 3-minute maximum demo plan.
- `design/reference/` — operator-supplied UI reference images.
- `docs/` — setup, config, tests, deployment, API, data model, build log and operator guide.

## Implementation start

Phase 0 intake is complete. Wait for the operator's explicit “begin Phase 1” message before starting application code. Phase 1 begins with the Next.js foundation, responsive route shell and protected Vercel preview. See `AI_HANDOFF.md` for the exact start point and `OPERATOR_INTAKE.md` for authority boundaries.

Then execute the exact phase sequence in `IMPLEMENTATION_PLAN.md` without routine approval stops. Preview deployment is separate from production authorization. Production is bounded to the Phase 9 actions recorded in `OPERATOR_INTAKE.md`.

## Current status

Phase 0 complete; application code **not started**. The target repository, four reference images, Walrus mainnet signed write/read, Tatum gRPC method and Neon/Groq architecture decisions are recorded. No app code, database migration, deployed preview or application test exists yet. `SUI_DEMO_ADDRESS` currently returns a zero balance and must be funded or replaced before the funded-balance demo.

## Authoritative methodology

The project follows the operator-supplied `PROPER_VIBE_CODING_WORKFLOW_AUTONOMOUS.md`: one complete intake, autonomous internal checkpoints, early skeletal preview, end-to-end functionality before final UI refinement, direct reference-image implementation, complete documentation and a reviewed <=180-second demo video.
