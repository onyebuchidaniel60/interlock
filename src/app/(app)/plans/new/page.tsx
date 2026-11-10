import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft, Calculator, Clock3, Hash, ShieldAlert } from "lucide-react";

import { createPlanAction } from "@/app/(app)/actions";
import { SubmitButton } from "@/components/submit-button";
import { ButtonLink, EmptyState, PageHeader, PlaceholderPanel } from "@/components/ui";
import { formatDate, formatMist, shortId } from "@/lib/format";
import { listObservations } from "@/lib/queries";
import { requireWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "New plan" };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  PLAN_INVALID: "Check the amount, exposure and observation.",
  OBSERVATION_STALE: "The selected observation is older than 300 seconds. Run Scout again.",
  ZERO_BALANCE: "A zero balance cannot support an exposure plan.",
  OBSERVATION_NOT_FOUND: "The selected observation was not found.",
  UNEXPECTED: "The plan could not be created.",
};

export default async function NewPlanPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const params = await searchParams;
  const { user, workspace } = await requireWorkspace();
  const observations = await listObservations(user.id, workspace.id);
  const latest = observations[0];
  const error = params.error ? errors[params.error] ?? errors.UNEXPECTED : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operate / Plans"
        title="Create a plan"
        description="The plan is immutable once submitted. All decision-relevant fields are hashed; changing any of them requires a new plan and a new Sentinel evaluation."
        actions={
          <ButtonLink href="/plans" variant="secondary">
            <ArrowLeft className="size-3.5" aria-hidden="true" />
            Back to plans
          </ButtonLink>
        }
      />

      {error ? (
        <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      {observations.length === 0 ? (
        <section className="surface p-5">
          <EmptyState
            icon={Clock3}
            title="A fresh observation is required"
            description="Scout must record a Tatum balance and verify its Walrus FACT before a plan can reference it."
            action={
              <ButtonLink href="/observations" variant="secondary">
                Run Scout first
              </ButtonLink>
            }
          />
        </section>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
          <section className="surface p-5">
            <form action={createPlanAction} className="space-y-4">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Fresh observation</span>
                <select
                  name="observationId"
                  defaultValue={latest?.id}
                  className="mt-1.5 min-h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none"
                >
                  {observations.map((observation) => (
                    <option key={observation.id} value={observation.id}>
                      {shortId(observation.address, 16)} · {formatMist(observation.balance_mist)} · {formatDate(observation.observed_at)}
                    </option>
                  ))}
                </select>
              </label>

              <div className="grid gap-4 sm:grid-cols-2">
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Amount (MIST)</span>
                  <input
                    name="amountMist"
                    type="text"
                    inputMode="numeric"
                    required
                    pattern="[1-9][0-9]*"
                    defaultValue="100000000"
                    className="mt-1.5 min-h-10 w-full rounded-lg border border-line bg-canvas px-3 font-mono text-sm text-ink outline-none"
                  />
                  <span className="mt-1 block text-[10px] text-faint">1 SUI = 1,000,000,000 MIST. Integer strings only.</span>
                </label>
                <label className="block">
                  <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Exposure (basis points)</span>
                  <input
                    name="exposureBps"
                    type="number"
                    min={1}
                    max={10000}
                    required
                    defaultValue={1500}
                    className="mt-1.5 min-h-10 w-full rounded-lg border border-line bg-canvas px-3 font-mono text-sm text-ink outline-none"
                  />
                  <span className="mt-1 block text-[10px] text-faint">1500 bps = 15.00%. The demo policy is 1000 bps (10%).</span>
                </label>
              </div>

              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Rationale (optional)</span>
                <textarea
                  name="rationale"
                  rows={3}
                  maxLength={1000}
                  className="mt-1.5 w-full rounded-lg border border-line bg-canvas px-3 py-2 text-sm text-ink outline-none"
                  placeholder="Why is this simulated action being considered?"
                />
              </label>

              {latest && BigInt(latest.balance_mist) === 0n ? (
                <p className="rounded-lg border border-warn/25 bg-warn/5 p-3 text-xs text-warn">
                  The latest observation has a zero balance. This plan will be blocked until a funded observation is available.
                </p>
              ) : null}

              <div className="flex flex-wrap items-center gap-3">
                <SubmitButton pendingLabel="Creating immutable plan…">Create plan</SubmitButton>
                <Link href="/plans" className="text-[11px] text-muted hover:text-ink">
                  Cancel
                </Link>
              </div>
            </form>
          </section>

          <div className="space-y-4">
            <div className="surface p-5">
              <div className="flex items-center gap-2">
                <Hash className="size-4 text-accent" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-ink">Immutable identity</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                Every decision-relevant field changes the canonical plan hash. A previous decision or Runner clearance becomes invalid when the hash changes.
              </p>
            </div>
            <div className="surface p-5">
              <div className="flex items-center gap-2">
                <Calculator className="size-4 text-accent" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-ink">Integer arithmetic</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                MIST and basis points use integer strings/BigInt. No floating-point math participates in a policy comparison.
              </p>
            </div>
            <div className="surface p-5">
              <div className="flex items-center gap-2">
                <ShieldAlert className="size-4 text-warn" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-ink">Fail-closed</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                Missing policy, stale observation, incomplete recall or unresolved conflict returns HOLD. The UI cannot override a verdict.
              </p>
            </div>
          </div>
        </div>
      )}

      <PlaceholderPanel
        phase="Phase 4"
        title="Analyst explanation is optional"
        description="When authorized, Analyst drafts explanatory text only. It cannot alter amount, exposure, policy or verdict."
      />
    </div>
  );
}
