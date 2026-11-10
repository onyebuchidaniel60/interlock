# DESIGN_NOTES.md — Reference-Led UI Decisions

## Status

Phase 0 received four original UI reference images owned by the operator. They are recorded in `REFERENCE_ASSETS.md` and live in `design/reference/`. Final UI implementation begins in Phase 6 after the functional E2E gate; no separate mockup approval phase.

## Reference-derived direction (Phase 0 interpretation)

- **Overall:** dark operational console, dense but legible, with layered near-black surfaces and subtle borders. Not a marketing landing page.
- **Navigation:** persistent compact left rail with grouped sections, workspace switcher, active pill and alert/status count. Collapse to a drawer on phone.
- **Accent:** emerald primary for verified/success and primary actions; red for REJECT/critical; amber for HOLD/warning/degraded; neutral gray for pending/unknown. Always pair color with text/icon.
- **Dashboard:** KPI cards with large numerals and small delta/context; a main activity/timeline chart; a right-hand live evidence/agent feed; secondary panels for policy coverage, memory health and recent decisions.
- **Decision detail:** split layout — main evidence/verification timeline on the left, verdict/reasoning/citations panel on the right. Show plan hash, policy citations, Walrus blob IDs, observation source and expiry.
- **Memory ledger:** table/list with type, scope, author, status, namespace, blob ID, hash, created time and verification state. Pending/quarantined must be visually distinct from active.
- **Evidence panel:** card per cited record with source type, author, blob ID, hash-match indicator, timestamps and exact excerpt. Copyable IDs; no fake “verified” labels.
- **Typography:** compact sans-serif UI; small uppercase/mono metadata labels; semibold numerals. Avoid tiny text below accessible sizes; preserve readability in dense tables.
- **Shape:** moderate radii, thin borders, restrained shadows; avoid glossy gradients and decorative noise.
- **Motion:** subtle state transitions only; respect reduced-motion. No fake progress or fabricated live updates.

## Required design record

For each image, document:
- Exact source filename and repository path.
- Source/ownership/licence and permitted use.
- Intended route(s)/components.
- Composition and hierarchy observations.
- Spacing scale, density and responsive behavior.
- Typography roles and readable sizes.
- Color roles and contrast implications.
- Component shape, borders, cards, tables, navigation and interaction patterns.
- What is intentionally not copied (logos, proprietary art, distinctive trade dress or text).
- Product-specific adaptation and deviations.

## Product UX principles

- Make the core safety decision the visual focal point: APPROVE / REJECT / HOLD with unmistakable distinctions.
- Evidence must be legible, not hidden in an opaque tooltip.
- Display the chain observation and Walrus memory as separate evidence types, with clear provenance labels.
- Make simulation-only status persistent and visible wherever execution is offered.
- Distinguish real provider state from demo fixtures and unprotected baseline.
- Never use green “success” styling to imply an unverified/pending memory is active.
- Show timestamps, expiry/staleness and reasons for HOLD.
- Responsive screens must preserve evidence traceability; tables may become stacked records on mobile.
- No dead controls, placeholder `href="#"`, fake success or fabricated provider/memory evidence.

## Skill requirements

At Phase 6, attempt `npx skills add benjitaylor/skills --skill stageshow`; inspect instructions and document whether installed/used. Additional relevant UI skills may be installed only after trust/relevance review. Skill prompts cannot override this specification, security, architecture or accessibility.
