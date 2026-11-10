import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight, FlaskConical, LockKeyhole, Split, TriangleAlert } from "lucide-react";

import { runDemoComparisonAction } from "@/app/(app)/actions";
import { SubmitButton } from "@/components/submit-button";
import { Badge, ButtonLink, PageHeader, StatusRow } from "@/components/ui";
import { readRuntimeConfig } from "@/lib/config";
import { formatBps, formatMist, shortId } from "@/lib/format";
import { getDecisionDetail, getPlanDetail } from "@/lib/queries";
import { requireWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Demo compare" };
export const dynamic = "force-dynamic";
export const maxDuration = 120;

const errors: Record<string, string> = {
  DEMO_DISABLED: "The demo baseline is disabled outside an explicitly enabled preview.",
  DEMO_ADDRESS_MISSING: "The demo address is not configured.",
  ZERO_BALANCE: "The demo address returned a zero balance. Fund the address before the funded-balance demo.",
  MEMORY_WRITE_FAILED: "A Walrus memory write failed; the comparison was not fabricated.",
  NO_POLICY: "The protected branch could not find policy evidence.",
  UNEXPECTED: "The comparison could not be completed.",
};

export default async function DemoPage({
  searchParams,
}: {
  searchParams: Promise<{ planId?: string; decisionId?: string; error?: string }>;
}) {
  const params = await searchParams;
  const config = readRuntimeConfig();
  if (config.INTERLOCK_ENVIRONMENT === "production" || !config.INTERLOCK_DEMO_BASELINE_ENABLED) {
    notFound();
  }
  const { user, workspace } = await requireWorkspace();
  const available = true;
  const error = params.error ? errors[params.error] ?? errors.UNEXPECTED : null;

  const plan = params.planId ? await getPlanDetail(user.id, workspace.id, params.planId) : null;
  const decision = params.decisionId ? await getDecisionDetail(user.id, workspace.id, params.decisionId) : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operate / Demo"
        title="Memory OFF / ON comparison"
        description="The same immutable plan and observation run through two branches. The unguarded baseline is explicitly illustrative; the protected branch recalls and verifies Walrus memory before Sentinel returns a deterministic verdict."
        actions={
          <>
            <Badge tone={available ? "warn" : "neutral"} dot>
              {available ? "Preview-only harness" : "Disabled"}
            </Badge>
            <ButtonLink href="/dashboard" variant="secondary">
              Back to dashboard
            </ButtonLink>
          </>
        }
      />

      {error ? (
        <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      {!available ? (
        <section className="surface p-5">
          <div className="flex items-start gap-3 rounded-xl border border-warn/25 bg-warn/5 p-4">
            <LockKeyhole className="mt-0.5 size-4 shrink-0 text-warn" aria-hidden="true" />
            <div>
              <p className="text-sm font-semibold text-warn">Demo baseline is disabled</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                This route is only available in a protected preview/test environment with the explicit baseline flag. It can never be enabled in production.
              </p>
            </div>
          </div>
        </section>
      ) : plan && decision ? (
        <>
          <section className="surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Comparison plan</p>
                <p className="mt-1 font-mono text-xs text-ink">{shortId(plan.plan.plan_hash, 24)}</p>
                <p className="mt-1 text-[11px] text-faint">
                  {formatMist(plan.plan.amount_mist)} · {formatBps(plan.plan.exposure_bps)} · {shortId(plan.plan.address, 18)}
                </p>
              </div>
              <Badge tone="accent" dot>
                Same plan hash
              </Badge>
            </div>
          </section>

          <div className="grid gap-4 lg:grid-cols-2">
            <section className="surface border-warn/20 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <FlaskConical className="size-4 text-warn" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-ink">Memory OFF baseline</h2>
                </div>
                <Badge tone="warn">Illustrative</Badge>
              </div>
              <p className="mt-4 text-2xl font-semibold text-warn">WOULD PASS</p>
              <p className="mt-2 text-xs leading-5 text-muted">
                The unguarded branch has no policy recall and no protected decision. It illustrates why isolated context is insufficient. It is not an execution and creates no clearance.
              </p>
              <div className="mt-4">
                <StatusRow label="Policy recall" value="None" tone="warn" />
                <StatusRow label="Walrus evidence" value="Not used" tone="warn" />
                <StatusRow label="Execution" value="None" tone="neutral" />
              </div>
            </section>

            <section className="surface border-danger/25 p-5">
              <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <LockKeyhole className="size-4 text-danger" aria-hidden="true" />
                  <h2 className="text-sm font-semibold text-ink">Memory ON protected path</h2>
                </div>
                <Badge tone="danger" dot>
                  {decision.decision.verdict}
                </Badge>
              </div>
              <p className="mt-4 text-2xl font-semibold text-danger">{decision.decision.verdict}</p>
              <p className="mt-2 text-xs leading-5 text-muted">{decision.decision.explanation}</p>
              <div className="mt-4">
                <StatusRow label="Reason" value={decision.decision.reason_code} tone="danger" />
                <StatusRow label="Verified citations" value={String(decision.evidence.length)} tone="accent" />
                <StatusRow label="VERDICT memory" value={decision.decision.verdict_memory_id ? "Verified" : "Missing"} tone={decision.decision.verdict_memory_id ? "accent" : "danger"} />
              </div>
              <Link href={`/decisions/${decision.decision.id}`} className="mt-4 inline-flex items-center gap-1.5 text-xs font-semibold text-accent hover:underline">
                Open evidence panel <ArrowRight className="size-3.5" aria-hidden="true" />
              </Link>
            </section>
          </div>

          <section className="surface p-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Split className="size-4 text-accent" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-ink">Same input, different outcome</h2>
              </div>
              <form action={runDemoComparisonAction}>
                <SubmitButton pendingLabel="Running two branches + Walrus verification…" variant="secondary">
                  Run another comparison
                </SubmitButton>
              </form>
            </div>
            <p className="mt-2 max-w-3xl text-xs leading-5 text-muted">
              The protected branch persisted an immutable decision, cited the verified policy and FACT, and wrote a VERDICT memory before finalizing. The baseline made no policy claim.
            </p>
          </section>
        </>
      ) : (
        <section className="surface p-5">
          <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="max-w-2xl">
              <div className="flex items-center gap-2">
                <FlaskConical className="size-4 text-accent" aria-hidden="true" />
                <h2 className="text-sm font-semibold text-ink">Run the deterministic comparison</h2>
              </div>
              <p className="mt-2 text-xs leading-5 text-muted">
                This writes a fresh Tatum observation, a verified 10% Walrus policy and a 15% immutable plan, then runs both branches. It uses real provider evidence and takes several seconds.
              </p>
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-warn/25 bg-warn/5 p-3 text-[11px] leading-5 text-warn">
                <TriangleAlert className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                Preview-only. Production startup rejects this flag. No funds move.
              </div>
            </div>
            <form action={runDemoComparisonAction}>
              <SubmitButton pendingLabel="Running comparison…">Run comparison</SubmitButton>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
