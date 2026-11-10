import type { Metadata } from "next";
import { ArrowLeft, FlaskConical, LockKeyhole, Split } from "lucide-react";

import { Badge, ButtonLink, EmptyState, PageHeader, PlaceholderPanel } from "@/components/ui";
import { readRuntimeConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Demo compare" };

export default function DemoPage() {
  const config = readRuntimeConfig();
  const available = config.INTERLOCK_ENVIRONMENT !== "production" && config.INTERLOCK_DEMO_BASELINE_ENABLED;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operate / Demo"
        title="Memory OFF / ON comparison"
        description="A preview-only harness will run the same immutable plan through an unguarded baseline and the protected Sentinel path. It is not implemented in the Phase 1 shell."
        actions={
          <>
            <Badge tone={available ? "warn" : "neutral"} dot>
              {available ? "Preview-enabled" : "Disabled"}
            </Badge>
            <ButtonLink href="/dashboard" variant="secondary">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to dashboard
            </ButtonLink>
          </>
        }
      />

      <section className="surface p-5">
        <EmptyState
          icon={available ? FlaskConical : LockKeyhole}
          title={available ? "Demo harness pending" : "Demo baseline is disabled"}
          description={
            available
              ? "The preview flag is enabled, but the baseline and protected runs are intentionally absent. Phase 5 adds the deterministic fixture, plan-hash comparison and real evidence citations."
              : "This route is hidden outside an explicitly enabled preview/test environment. It can never be enabled in production."
          }
        />
      </section>

      <div className="grid gap-4 md:grid-cols-3">
        {[
          { icon: Split, title: "Same plan hash", body: "Both branches must use the exact same immutable plan and observation." },
          { icon: FlaskConical, title: "Baseline only", body: "The unguarded branch exists only in the protected demo harness." },
          { icon: LockKeyhole, title: "Never production", body: "Startup validation rejects the baseline flag in production." },
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
        phase="Phase 5"
        title="No comparison is shown yet"
        description="The demo will use real Walrus memory and a real Tatum observation. It will never fabricate a blocked action or a provider response."
      />
    </div>
  );
}
