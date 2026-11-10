# OPERATOR_GUIDE.md — Interlock MVP Operator Guide

This guide describes intended product operation after implementation; it is not evidence that the application currently exists.

## Before running a check

1. Confirm workspace and role. Owner manages members/policies; Operator runs observations/plans; Observer is read-only.
2. Confirm a public Sui wallet source and native SUI coin type.
3. Obtain a fresh Scout observation. Check the provider, address, amount, timestamp and network.
4. Wait until the FACT memory lifecycle is `VERIFIED_ACTIVE`. A pending job or metadata-only entry is not usable evidence.
5. Confirm the relevant constraint is active, in scope and not expired/revoked/superseded.

## Create and evaluate a plan

1. Create a new immutable plan linked to the observation.
2. Inspect plan hash, amount/exposure and expiry.
3. Request Sentinel check.
4. Review `APPROVE`, `REJECT` or `HOLD` and all cited memories.
5. Open the cited memory and Tatum observation; compare author, timestamp, blob ID and content.
6. Treat HOLD as “insufficient evidence to proceed,” not as a recommendation to bypass the control.

## Simulation

Only a final APPROVE may produce a simulation, and only through Runner's clearance gate. All MVP execution is simulated; no SUI, token or other asset moves. A rejected or held decision cannot be overridden. If policy must change, an Owner creates a new superseding/revoking record, and a fresh evaluation is required.

## Demo baseline

The Memory OFF baseline is an isolated, protected-preview demonstration of an unguarded simulation. It is not a production mode and must never be used with real execution. A baseline result must always be labelled as unprotected simulation.

## When something goes wrong

If Tatum or Walrus is unavailable, memory cannot be verified, a constraint conflicts, or evidence is stale, Sentinel should HOLD. Refresh observation, correct configuration or resolve the policy conflict. Never manually change a verdict or ask an agent to ignore evidence.
