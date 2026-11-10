import type { Metadata } from "next";
import { ArrowLeft, Clock3, Hash, ShieldAlert } from "lucide-react";

import { Badge, ButtonLink, PageHeader, PlaceholderPanel } from "@/components/ui";

export const metadata: Metadata = { title: "Plan detail" };

export default async function PlanDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operate / Plans"
        title="Plan detail"
        description="This route is a structural placeholder. The immutable plan, its evidence snapshot and its decision are displayed only after the server pipeline exists."
        actions={
          <>
            <Badge tone="neutral" dot>
              Not persisted
            </Badge>
            <ButtonLink href="/plans" variant="secondary">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to plans
            </ButtonLink>
          </>
        }
      />

      <div className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">
              Route parameter
            </p>
            <p className="mt-1 break-all font-mono text-sm text-ink">{id}</p>
          </div>
          <Badge tone="warn">Placeholder route</Badge>
        </div>
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: Hash,
            title: "Canonical hash",
            body: "The persisted plan hash will be shown here and invalidated when any decision-relevant field changes.",
          },
          {
            icon: Clock3,
            title: "Freshness",
            body: "Observation and plan expiry will be explicit; stale evidence forces HOLD.",
          },
          {
            icon: ShieldAlert,
            title: "Verdict",
            body: "APPROVE, REJECT or HOLD with cited evidence; no client-side override exists.",
          },
        ].map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.title} className="surface p-5">
              <Icon className="size-4 text-accent" aria-hidden="true" />
              <p className="mt-3 text-sm font-semibold text-ink">{item.title}</p>
              <p className="mt-1.5 text-xs leading-5 text-muted">{item.body}</p>
            </div>
          );
        })}
      </div>

      <PlaceholderPanel
        phase="Phase 4"
        title="No plan record exists for this route"
        description="A real plan page will show immutable inputs, the observation reference, the plan hash and a request-check action. It will never display a fabricated decision."
      />
    </div>
  );
}
