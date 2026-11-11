# REFERENCE_ASSETS.md — Reference Image and Asset Inventory

## Current status

Four UI reference images were supplied by the operator on 2026-11-10 and inspected directly. The operator states they are original and owned by the operator. They are the visual reference for Phase 6; no separate mockup/prototype approval phase is required.

**Exclusions:** The images contain visible third-party product names, account labels and sample text. Those are reference content only. Interlock must not copy third-party logos, brand names, trade dress, proprietary assets or text. Use the composition, density, hierarchy and interaction principles, and replace all content with original Interlock material.

## Asset inventory

| Exact path | Format / dimensions | SHA-256 | Source / ownership | Intended screen(s) | Status |
|---|---|---|---|---|---|
| `design/reference/int-reference1.webp` | WebP, 2048×1536, RGB | `3f39fdc1dcf8475ebc6ce8289755a7af09ecfd8b0b4b24e75836b4a2a4a7417d` | Original, owned by operator | Dashboard; cost/usage analytics panel | Inspected |
| `design/reference/int-reference2.webp` | WebP, 2048×1536, RGB | `2358af442118a57133dc5aa7ff1fb8e54129497045e56ed443d35f1bd1177891` | Original, owned by operator | Dashboard; overview + live activity + memory/ledger summary | Inspected |
| `design/reference/int-reference3.webp` | WebP, 2048×1536, RGB | `4ced824ecd721bb02794dd755b7b04db3ec0e202b5fd610fdab1b3a16a796a8c` | Original, owned by operator | Decision detail; alerts/incident + evidence panel | Inspected |
| `design/reference/int-reference4.webp` | WebP, 2048×1536, RGB | `b1165020913043b0ae20006e920b894213443cdcf7c84cf39a2d4b8c8884e6f8` | Original, owned by operator | Decision detail; evidence panel; execution timeline | Inspected |

No logo, icon, font file, illustration or product screenshot was supplied. Create an original simple wordmark/icon treatment if needed; do not reproduce the reference product's branding.

## Design observations

### `int-reference1.webp` — costs/analytics dashboard

- Near-black page shell with a slightly lighter main canvas and layered charcoal cards.
- Persistent left rail: compact wordmark, workspace switcher, grouped navigation (“Monitor”, “Analyze”, “Operate”), active item as a soft filled pill, alert count badge.
- Top bar: page title, wide search field, secondary “Export” button, primary emerald “Set Budget” button.
- KPI row: four large numeric cards with delta indicators and thin sparkline/progress accents.
- Main chart: stacked bar chart with a small, distinct categorical palette; legend above; axis labels in muted gray.
- Dense table below with small status dots/pills, right-aligned numerics, trend sparklines and row-level actions.
- Typography: compact sans-serif for UI, larger semibold numerals; small uppercase/label text with generous letter spacing.
- Primary accent is emerald/green. Surfaces rely on subtle borders, not heavy shadows. Corner radii are moderate (roughly 12–16 px).
- Interaction cues: clear hover/active states, filters as compact selects, repeated “filter/more” affordances.

### `int-reference2.webp` — overview/live monitoring

- Same shell and rail as reference 1; good template for Interlock’s persistent app navigation.
- KPI cards combine large values, delta text and tiny sparklines with semantic green/red tints.
- Central multi-line time-series chart with a legend and a vertical hover marker.
- Right-hand live-activity feed: stacked rows with status dot, entity name, latency/timestamp and secondary metadata; fault rows use amber/red labels.
- Lower row of three compact panels: ranked tool usage bars, model-split proportions, and recent changes/deploy history.
- High information density without visual noise; tiny metadata is deliberately muted.
- Good pattern for Interlock: dashboard KPIs (verified memories, active policies, decisions, holds) plus a live agent/evidence feed.

### `int-reference3.webp` — alerts/incident detail

- Split layout: rule list on the left, incident feed on the right.
- Severity is encoded with text + color + a small dot (Critical red, Warning amber, Info gray) — never color alone.
- Rule rows show a plain-language condition and last-fired time; toggles are compact and clearly on/off.
- Incident card includes a title, affected entity, a trend chart with threshold line, primary “Acknowledge” action, secondary actions and incident metadata.
- Top KPI strip: firing count, triggered count, MTTA, enabled rules.
- Excellent reference for Interlock decision/evidence layouts: verdict card + cited evidence + threshold/rule context + audit metadata.
- Avoid copying the exact alert terminology; adapt to policy violations, holds, memory verification and provider degradation.

### `int-reference4.webp` — run trace/decision detail

- Breadcrumb header with entity ID and status pill; primary “Open Trace” action; secondary “Replay”.
- Summary strip: started time, trigger, caller, duration, token/cost metadata.
- Large execution timeline: each step is a row with icon, name, description, duration bar, timing scale and token count. Retries and warnings are marked inline.
- Retry step uses amber; completed steps use green; failed/degraded steps use red. Timeline bars make relative duration legible.
- Right-side “Decisions” panel: a compact strategy graph, ranked alternative cards, the selected option highlighted with an emerald border, and a “Selected Reasoning” text block.
- Excellent reference for Interlock’s decision detail: Scout → Analyst → Sentinel → Runner timeline, evidence verification states, cited policy cards and selected reasoning.
- Adopt the timeline/evidence split; do not reproduce the reference’s specific agent names, URLs or copy.

## UI interpretation for Interlock

- Build a dark, dense operational console rather than a marketing landing page.
- Persistent left navigation with grouped sections: Monitor (Dashboard, Observations, Decisions), Memory (Ledger, Evidence), Operate (Plans, Agents, Audit, Settings), with demo access clearly separated.
- Use emerald as the primary action/verified accent; red for REJECT/critical; amber for HOLD/degraded; neutral gray for pending/unknown.
- Use large numeric KPI cards for verified memories, active constraints, decisions, holds and provider health.
- Use split layouts for detail pages: main evidence/timeline column + right-hand verdict/citation panel.
- Keep metadata small and muted; make blob IDs, hashes and timestamps copyable and legible in a mono font.
- Use status text and icons in addition to color. Ensure keyboard focus, contrast and responsive collapse.
- All values shown in the demo must be real or clearly labelled synthetic fixtures; no fabricated provider or memory evidence.

## Asset handling

- Commit the four reference images under `design/reference/` as supplied.
- Do not alter the originals. Derived crops may be created for design study only and must not be shipped as product assets.
- Record any additional operator-supplied asset here before use.
- At Phase 6, attempt `npx skills add benjitaylor/skills --skill stageshow`, inspect the guidance, and record the result in `BUILD_LOG.md`. If it fails, continue with the design system and accessibility practices above.
