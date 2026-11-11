# OPERATOR_GUIDE.md — Interlock MVP Operator Guide

The MVP is a simulation and audit product. It never moves funds or submits a transaction. This guide reflects the implemented production flows. Use the production demo account `demo@interlock.dev` / `InterlockDemo2026!` (OWNER of Interlock Demo Workspace).

## Roles

- **Owner:** workspace setup, membership/invites, policy records, all operator actions.
- **Operator:** observations, plans, Sentinel checks and simulations.
- **Observer:** read-only across dashboard, memory, plans, decisions and audit.

A client-supplied role or workspace ID is never trusted. The server derives both from verified membership.

## 1. Run a fresh observation

1. Open `/observations`.
2. Enter the funded public Sui address (no private key/seed phrase) and an optional label.
3. Run Scout. It reads Tatum `StateService.GetBalance`, stores the exact atomic MIST balance, writes a FACT through the Scout Walrus delegate, and verifies metadata + recall + SHA-256 before marking it ACTIVE.
4. If it returns zero, the observation is safe but no funded plan can be created. Fund the address and run again.

## 2. Record a policy

1. Open `/settings` as Owner.
2. Set the wallet scope, max exposure basis points (demo: `1000` = 10%) and description.
3. Record the policy. It is written to Walrus by the policy delegate and verified before activation.
4. Missing/expired/unverifiable policy means HOLD; never implicit approval.

## 3. Create a plan

1. Open `/plans/new`.
2. Select a fresh observation (300-second window).
3. Enter amount in integer MIST (`1 SUI = 1,000,000,000 MIST`) and exposure basis points.
4. Submit. The canonical plan and hash are immutable; changing a field requires a new plan.

Demo rejection: amount `100000000`, exposure `1500` (15%) against a verified `1000` bps policy.

## 4. Run Sentinel

1. Open the plan and select **Evaluate with Sentinel**.
2. Sentinel enumerates applicable FACT/CONSTRAINT records, recalls each Walrus payload, verifies namespace/author/blob/hash, applies fixed integer rules and writes a VERDICT memory.
3. If any expected record is missing/mismatched, the result is HOLD. If the VERDICT write cannot be verified, final APPROVE is downgraded to HOLD.
4. Open the decision detail to inspect the verdict, reason code, hashes and every cited evidence row.

## 5. Simulate once

Only a `FINAL_APPROVED` decision with a verified VERDICT memory shows **Simulate once**. The server re-verifies the VERDICT, mints a 60-second HMAC clearance and consumes it atomically. The execution record is simulation-only. A second attempt returns `ALREADY_SIMULATED`.

## 6. Demo comparison

Open `/demo` in an explicitly enabled preview. The harness:
- creates one fresh observation,
- creates a verified 10% policy,
- creates one 15% immutable plan,
- shows the unguarded baseline as `WOULD PASS` (illustrative, no decision/clearance),
- runs the protected branch to `REJECT` with real citations.

Both branches use the same plan hash. The baseline is never available in production.

## When something goes wrong

- **Provider outage / missing memory / stale observation / conflict:** HOLD. Do not override.
- **Need a different policy:** Owner creates a new record; prior decisions remain historical.
- **Invite issues:** create a new one-time link; raw token is shown once.
- **Audit:** `/audit` is append-only; no member can edit or delete events.

Never ask an agent to ignore evidence, manually edit a verdict, or reuse a clearance.
