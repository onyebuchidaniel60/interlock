# REFERENCE_ASSETS.md — Reference Image and Asset Inventory

## Current status

**No UI reference image was supplied with the Interlock handoff or workflow document.** The uploaded workflow file is methodology text, not a UI reference image. Do not claim that a visual reference exists. Reference image(s) are a critical Phase 0 intake input.

## Required Phase 0 action

Ask the operator once, during consolidated intake, to attach at least one reference image (or a small set) and identify source/ownership and intended use. If none can be supplied, ask whether the operator explicitly authorizes the agent to generate reference imagery. Do not create a mockup/prototype approval phase. The agent uses the actual reference image(s) directly to implement the UI.

## Asset inventory

| Exact path/filename | Asset type | Source/ownership | Intended use | Status |
|---|---|---|---|---|
| None supplied | UI reference image | Not applicable | Reference-led UI implementation | PENDING operator intake |
| None supplied | Logo/product icon | Not applicable | Branding/favicon | Optional; can create simple original icon treatment if approved |
| None supplied | Product screenshots | Not applicable | Demo/marketing | Not required before real app exists |

## Inspection requirements

For each supplied asset, record its exact repository path, original filename, format, dimensions, source and ownership/licence, intended route(s), design observations and any exclusions. Extract composition, hierarchy, spacing, typography, color, density, component treatment, navigation and interaction patterns. Adapt the principles to Interlock; do not copy protected logos, proprietary images, distinctive third-party trade dress or text.

## UI skill

At the start of Phase 6 attempt:

```bash
npx skills add benjitaylor/skills --skill stageshow
```

Inspect installed instructions and apply relevant guidance. If installation fails, log exact error and proceed with strong design system, responsive, usability and accessibility practices. Other relevant UI skills may be considered only after trust/relevance review.
