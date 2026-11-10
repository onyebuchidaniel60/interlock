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
- `REFERENCE_ASSETS.md` — actual image/asset inventory; currently pending.
- `DEMO_VIDEO_PLAN.md` — 3-minute maximum demo plan.
- `docs/` — setup, config, tests, deployment, API, data model, build log and operator guide.

## Implementation start

Do not start coding until Phase 0 intake is complete. The coding agent must inspect the target repository and existing work, validate credentials and permissions, verify Walrus mainnet write/read and Tatum gRPC method support, verify a UI reference image or explicit generated-image authorization, and record budgets and production authority.

Then execute the exact phase sequence in `IMPLEMENTATION_PLAN.md` without routine approval stops. Preview deployment is separate from production authorization. Production is denied unless explicitly granted.

## Current status

Blueprint only. Target repository, reference images, service credentials, preview access and budget authority remain to be confirmed. No app code, database migration, live integration, test run or deployment is included in this package.

## Authoritative methodology

The project follows the operator-supplied `PROPER_VIBE_CODING_WORKFLOW_AUTONOMOUS.md`: one complete intake, autonomous internal checkpoints, early skeletal preview, end-to-end functionality before final UI refinement, direct reference-image implementation, complete documentation and a reviewed <=180-second demo video.
