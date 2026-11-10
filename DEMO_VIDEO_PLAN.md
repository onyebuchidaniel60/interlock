# DEMO_VIDEO_PLAN.md — Interlock Demo Production Plan

## Output target

- Duration: **90–150 seconds preferred; hard maximum 180 seconds**.
- Format: MP4, 1080p where feasible, readable UI, clear voiceover and optional captions.
- Capture: Playwright or equivalent browser automation using deterministic test/demo data and a clean browser context.
- Output directory: `demo/` unless operator intake specifies another approved location.
- Never include API keys, delegate keys, tokens, personal email, private URLs or private account details.

## Story

**Thesis:** “Without shared memory, an agent can act on a plan that another agent already knows is unsafe. Interlock makes that discovery enforceable.”

### Proposed timed script (~125 seconds)

| Time | On-screen action | Narration / message |
|---|---|---|
| 0–8s | Interlock dashboard; four agents shown | “Interlock is a safety layer for teams of AI agents. One agent's discovery can stop another agent from making a costly mistake.” |
| 8–25s | Scout runs a Sui balance observation; Tatum source details appear | “Scout checks a public Sui address through Tatum. The observation is recorded with its source and timestamp.” |
| 25–40s | FACT and CONSTRAINT cards appear; Walrus blob references visible | “That fact and the applicable constraint are stored in Walrus Memory. This is persistent shared memory, not a chat transcript.” |
| 40–55s | Analyst displays a 15% simulated plan against 10% cap | “Analyst proposes a fifteen-percent exposure. The configured limit is ten percent.” |
| 55–70s | Baseline preview simulation succeeds; visible label says UNPROTECTED BASELINE — SIMULATION ONLY | “Without the memory-backed gate, the demo baseline shows how the same plan would pass an unprotected simulation. No funds move.” |
| 70–92s | Memory ON; Sentinel evaluates; REJECT appears with constraint/fact citations | “With Interlock enabled, Sentinel retrieves the shared memory, verifies its evidence and blocks the same plan.” |
| 92–108s | Click citation; show blob ID, author, timestamp, Tatum observation | “The decision is auditable. You can inspect the exact memory and the chain observation behind the block.” |
| 108–120s | VERDICT memory confirmation / audit trail | “Sentinel records its verdict back to shared memory, so the decision itself becomes part of the ledger.” |
| 120–130s | Product mark and core line | “Deterministic gate. Portable memory. Auditable refusal. Without that shared memory, money would have moved.” |

Timing can be tightened after actual recording; narration must describe only what is visibly happening.

## Technical capture requirements

1. Prepare deterministic demo fixture with a public address and a verified mainnet observation. Never invent a provider response or fabricate Walrus IDs.
2. Use one fixed plan and one immutable `planHash` for both baseline and protected comparison.
3. Baseline is isolated preview/test simulation only; no real transaction calls exist. Show explicit label.
4. Use fresh browser context; hide browser devtools unless intentionally demonstrating APIs.
5. Ensure all visible identifiers are demo-safe; redact or truncate where needed.
6. Record genuine UI flows with Playwright; keep cursor movement deliberate and navigation concise.
7. Capture exact evidence click-through and final verdict memory state.

## Voice/TTS

Use **Kokoro TTS** (Apache 2.0, local, high-quality) as the preferred narration engine. If Kokoro cannot run in the approved environment, fall back to **Piper TTS**. Record the exact engine, version, voice model and any licence/attribution notes in `demo/production-notes.md`. Do not use paid TTS or incur charges without explicit authorization. Verify local availability, output quality and synchronization before final render.

## Editing and review

- Synchronize voiceover against visible events; no narration should describe hidden/unshown results.
- Remove long silences, rushed sections, clipping, awkward gaps and irrelevant page loads.
- Balance voice and any background audio; no copyrighted music without rights.
- Add readable captions where feasible.
- Verify output duration <=180 seconds.
- Play the entire rendered video, checking beginning/middle/end, audio, legibility and redactions.
- Save narration script, capture script, editing notes and output checksum/duration.

## Required output files

```text
demo/
  interlock-demo.mp4
  narration.md
  production-notes.md
  playwright-capture.*
```

If video file is too large for repository policy, store it in the operator-approved artifact location and place its verified destination in `AI_HANDOFF.md`; do not publish it publicly without authorization.

## Current status

Not produced. No app, preview, test fixture, voice availability or approved output path has yet been validated. Production occurs only in Phase 8.
