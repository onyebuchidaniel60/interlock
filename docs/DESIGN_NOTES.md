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

## Phase 6 implementation notes

- **Skill attempt:** `npx skills add benjitaylor/skills --skill stageshow` installed successfully into `.agents/skills/stageshow`; security assessments reported Safe / 0 Socket alerts / Low Snyk risk. The skill targets authored faux marketing UI and stage illustrations, not a production data console, so its stage kit was not imported. Its restraint, hierarchy, cropping and "one thing happens" guidance was applied to the real console instead.
- **Shell:** persistent left rail, compact workspace/role chip, real user identity and sign-out, top status strip with live workspace label. Desktop sidebar and mobile drawer share the same navigation.
- **Surface hierarchy:** near-black canvas, layered panels, thin borders, restrained shadows, emerald primary/verified accent, red REJECT, amber HOLD, neutral pending.
- **Tables:** wide tables are wrapped in constrained horizontal scroll containers; panel min-width zero prevents grid/flex children from expanding the document. Verified no horizontal overflow at 390, 768 and 1280 px.
- **Evidence-first detail:** decision page leads with verdict, explanation and hashes, then cited evidence with verification status, author, blob and hash. Runner action is separated and one-time.
- **Honesty:** placeholders remain only for still-unbuilt detail drawers; no fake charts, provider data or verdicts.
