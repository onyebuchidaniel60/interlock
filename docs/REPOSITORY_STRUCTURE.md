# REPOSITORY_STRUCTURE.md — Recommended Application Repository

The coding agent must inspect the selected repository before imposing this layout. Preserve compatible existing conventions; the structure below is the agreed target shape for a new/clean Next.js App Router repository.

```text
interlock/
├── PROJECT_SPEC.md
├── ARCHITECTURE.md
├── IMPLEMENTATION_PLAN.md
├── AGENTS.md
├── AI_HANDOFF.md
├── OPERATOR_INTAKE.md
├── REFERENCE_ASSETS.md
├── DEMO_VIDEO_PLAN.md
├── README.md
├── PROPER_VIBE_CODING_WORKFLOW_AUTONOMOUS.md
├── package.json
├── lockfile
├── next.config.ts
├── tsconfig.json
├── postcss.config.mjs
├── eslint.config.mjs
├── .env.example
├── .gitignore
├── public/
│   ├── favicon.ico
│   └── approved-original-assets/
├── app/
│   ├── (auth)/login/page.tsx
│   ├── setup/page.tsx
│   ├── (workspace)/layout.tsx
│   ├── (workspace)/dashboard/page.tsx
│   ├── (workspace)/observations/page.tsx
│   ├── (workspace)/memory/page.tsx
│   ├── (workspace)/plans/page.tsx
│   ├── (workspace)/plans/new/page.tsx
│   ├── (workspace)/plans/[id]/page.tsx
│   ├── (workspace)/decisions/[id]/page.tsx
│   ├── (workspace)/audit/page.tsx
│   ├── (workspace)/agents/page.tsx
│   ├── (workspace)/settings/page.tsx
│   ├── (workspace)/demo/page.tsx
│   ├── api/health/route.ts
│   ├── api/workspace/route.ts
│   ├── api/agents/route.ts
│   ├── api/memories/route.ts
│   ├── api/observations/route.ts
│   ├── api/memory-jobs/[id]/route.ts
│   ├── api/constraints/route.ts
│   ├── api/plans/route.ts
│   ├── api/plans/[id]/route.ts
│   ├── api/plans/[id]/check/route.ts
│   ├── api/decisions/[id]/route.ts
│   ├── api/decisions/[id]/simulate/route.ts
│   ├── api/executions/[id]/route.ts
│   ├── api/audit/route.ts
│   └── api/demo/compare/route.ts
├── src/
│   ├── features/
│   │   ├── agents/scout/
│   │   ├── agents/analyst/
│   │   ├── agents/sentinel/
│   │   ├── agents/runner/
│   │   ├── observations/
│   │   ├── memories/
│   │   ├── plans/
│   │   ├── decisions/
│   │   └── executions/
│   ├── integrations/
│   │   ├── walrus/
│   │   ├── tatum/
│   │   ├── groq/
│   │   └── neon/
│   ├── components/
│   ├── hooks/
│   ├── lib/
│   │   ├── auth/
│   │   ├── db/
│   │   ├── security/
│   │   ├── validation/
│   │   ├── crypto/
│   │   ├── observability/
│   │   └── config/
│   └── types/
├── db/
│   ├── migrations/
│   └── seed.sql
├── tests/
│   ├── unit/
│   ├── integration/
│   ├── e2e/
│   ├── security/
│   └── fixtures/
├── scripts/
│   ├── provider-smoke-tests/
│   └── demo/
├── demo/
│   ├── narration.md
│   ├── production-notes.md
│   └── interlock-demo.mp4
└── docs/
    ├── SETUP.md
    ├── CONFIGURATION.md
    ├── TESTING.md
    ├── DEPLOYMENT.md
    ├── TROUBLESHOOTING.md
    ├── DESIGN_NOTES.md
    ├── OPERATOR_GUIDE.md
    ├── API.md
    ├── DATA_MODEL.md
    ├── REPOSITORY_STRUCTURE.md
    └── BUILD_LOG.md
```

## Directory ownership

- `app/`: thin route/page components and HTTP handlers; business logic belongs in feature/service modules.
- `src/features/agents/*`: role-specific orchestration; Sentinel evaluator should be a pure function with isolated tests.
- `src/integrations/*`: provider adapters and SDK normalization; no UI imports.
- `src/lib/auth`, `security`, `crypto`: session/membership enforcement, clearance signing and verification.
- `db/migrations`: version-controlled schema/RLS changes applied through the Neon migration role.
- `tests/`: unit, integration, end-to-end, security tests and deterministic fixtures.
- `scripts/provider-smoke-tests`: explicit, non-destructive Tatum/Walrus checks.
- `demo/`: approved narration and final demo output; apply repo policy for large video files.
- `docs/`: operating documentation; update BUILD_LOG at each checkpoint.

Do not create separate microservices or queues unless a proven requirement appears and the operator approves an architecture change. The MVP should remain a single application with modular domain boundaries.

## Implemented additions (Phases 1–6)

```text
db/migrations/                 versioned schema, RLS, functions
proto/                         pinned official Sui API protobufs
scripts/migrate.mjs            neondb_owner migration runner
src/lib/domain/                canonical hash, Zod schemas, Sentinel, clearance
src/lib/integrations/          Tatum gRPC, Walrus Memory, Groq
src/lib/services/              observation/constraint/plan/decision/simulation
src/lib/queries.ts             tenant-scoped read models
src/app/api/observations/      Scout API
src/app/api/policies/          policy API
src/app/api/plans/             plan + check APIs
src/app/api/decisions/         simulation API
src/app/api/readiness/         session/membership/RLS proof
tests/integration/             Neon RLS, live Tatum, live decision pipeline
tests/e2e/                     public shell, auth, responsive, live demo
```

The application remains one Next.js deployment. No Redis, Kafka, separate vector database, wallet custody or real execution adapter exists.
