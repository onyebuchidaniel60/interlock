# Interlock

**A shared-memory execution safety layer for multi-agent applications.** Interlock lets one agent's verified discovery prevent another agent from executing an action that violates a known constraint.

> **Status: Phase 1 preview shell.** The application is a navigable, protected preview with clearly labelled placeholders. Provider adapters, authentication, deterministic decision logic and the demo are not implemented yet. Do not claim otherwise.

**Protected preview:** <https://interlock-ff4vlqtne-uhhh2.vercel.app> (Vercel Authentication required)

## Product concept

- **Scout** observes facts and records evidence.
- **Analyst** drafts a structured explanation; it never decides policy.
- **Sentinel** retrieves and verifies shared memory, then deterministically returns APPROVE, REJECT or HOLD.
- **Runner** can only perform a simulated action after a signed, short-lived, single-use Sentinel approval.

Walrus Memory mainnet is the persistent memory layer. Neon Postgres stores deterministic typed metadata and application state. Tatum provides read-only Sui observations. Groq may help Analyst explain a plan but cannot approve, reject or authorize execution.

## Safety boundary

The MVP is simulation-only. No real trading, transfers, wallet custody, private-key collection, signing or payment execution. Missing, stale, conflicting or unverifiable evidence produces HOLD. The Memory OFF comparison is restricted to a protected preview/test baseline and must be impossible in production.

## Local development

```bash
npm install
cp .env.example .env.local   # fill only the providers you are testing; never commit it
npm run dev                  # http://localhost:3000
npm run check                # typecheck + lint + unit tests
npm run build                # production build
npm run test:e2e             # Playwright route/responsive tests (uses port 3127)
```

The current preview shell does not require provider credentials. Phase 2 adds Neon Postgres, Managed Better Auth and RLS; Phase 3 adds the Walrus, Tatum and Groq adapters.

## Handoff documents

- `INTERLOCK_IMPLEMENTATION_BLUEPRINT.md` — consolidated blueprint.
- `PROJECT_SPEC.md` — product, scope, workflows, rules, functional requirements and acceptance criteria.
- `ARCHITECTURE.md` — technical architecture, integration boundaries and security.
- `IMPLEMENTATION_PLAN.md` — phase-by-phase autonomous plan.
- `AGENTS.md` — persistent coding agent instructions.
- `AI_HANDOFF.md` — current state and exact next task.
- `OPERATOR_INTAKE.md` — readiness check and authority boundaries.
- `REFERENCE_ASSETS.md` — four supplied reference images and design observations.
- `DEMO_VIDEO_PLAN.md` — 3-minute maximum demo plan.
- `design/reference/` — operator-supplied UI reference images.
- `docs/` — setup, config, tests, deployment, API, data model, build log and operator guide.

## Current status

Phase 0 complete; **Phase 1 complete** with a protected Vercel preview and a responsive route shell. No database, authentication, provider adapter, decision engine or demo exists yet. Production remains gated to Phase 9. The operator reports `SUI_DEMO_ADDRESS` is now funded; independent Tatum re-verification is scheduled for Phase 3.

## Authoritative methodology

The project follows the operator-supplied `PROPER_VIBE_CODING_WORKFLOW_AUTONOMOUS.md`: one complete intake, autonomous internal checkpoints, early skeletal preview, end-to-end functionality before final UI refinement, direct reference-image implementation, complete documentation and a reviewed <=180-second demo video.
