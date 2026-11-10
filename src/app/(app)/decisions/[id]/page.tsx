import type { Metadata } from "next";
import { ArrowLeft, Brain, FileSearch, ScrollText, ShieldCheck } from "lucide-react";

import {
  Badge,
  ButtonLink,
  EmptyState,
  PageHeader,
  PlaceholderPanel,
  StatusRow,
} from "@/components/ui";

export const metadata: Metadata = { title: "Decision detail" };

export default async function DecisionDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Decisions / Evidence"
        title="Decision detail"
        description="The evidence-first verdict view. This route does not invent a decision when no persisted, verified record exists."
        actions={
          <>
            <Badge tone="neutral" dot>
              Not evaluated
            </Badge>
            <ButtonLink href="/dashboard" variant="secondary">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to dashboard
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.55fr)_minmax(0,1fr)]">
        <section className="surface p-5">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
                Decision route
              </p>
              <p className="mt-1 break-all font-mono text-sm text-ink">{id}</p>
            </div>
            <Badge tone="warn">HOLD is the default</Badge>
          </div>

          <div className="mt-6">
            <EmptyState
              icon={FileSearch}
              title="No evidence to display"
              description="A decision requires a persisted plan, a complete candidate set, verified Walrus recall and a deterministic Sentinel evaluation. None of those exist in the Phase 1 shell."
            />
          </div>

          <div className="mt-5 grid gap-3 sm:grid-cols-3">
            {[
              { step: "Scout", detail: "Observation + FACT" },
              { step: "Sentinel", detail: "Recall + deterministic rules" },
              { step: "Runner", detail: "Signed simulation only" },
            ].map((item, index) => (
              <div key={item.step} className="rounded-xl border border-line bg-white/[0.02] p-3.5">
                <p className="font-mono text-[10px] text-faint">0{index + 1}</p>
                <p className="mt-1.5 text-xs font-semibold text-ink">{item.step}</p>
                <p className="mt-1 text-[11px] leading-5 text-faint">{item.detail}</p>
                <Badge tone="neutral" className="mt-2">
                  Pending
                </Badge>
              </div>
            ))}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Verdict panel</h2>
            </div>
            <div className="mt-3">
              <StatusRow label="Verdict" value="Not evaluated" tone="neutral" />
              <StatusRow
                label="Rule"
                value="No policy"
                tone="neutral"
                detail="Missing policy always means HOLD, never implicit approval."
              />
              <StatusRow label="Evidence" value="0 records" tone="neutral" />
              <StatusRow label="Plan hash" value="Absent" tone="neutral" />
            </div>
          </section>

          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <Brain className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Memory citations</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Cited FACT, CONSTRAINT and VERDICT records will show author, namespace, blob ID,
              content hash and recall verification here.
            </p>
            <ButtonLink href="/memory" variant="ghost" external={false}>
              Inspect memory ledger
            </ButtonLink>
          </section>

          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <ScrollText className="size-4 text-muted" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Audit</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Audit events are append-only. No mutation occurred for this placeholder route.
            </p>
          </section>
        </aside>
      </div>

      <PlaceholderPanel
        phase="Phase 5"
        title="Runner is not connected"
        description="Only a final APPROVE with a completed, verified and recalled VERDICT memory can mint a short-lived, single-use simulation clearance. No Runner action exists in this shell."
      />
    </div>
  );
}
