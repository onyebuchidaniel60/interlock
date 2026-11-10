import type { Metadata } from "next";
import { ClipboardList, History, LockKeyhole, ScrollText } from "lucide-react";

import { Badge, EmptyState, PageHeader, PlaceholderPanel } from "@/components/ui";

export const metadata: Metadata = { title: "Audit trail" };

export default function AuditPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Memory / Audit"
        title="Audit trail"
        description="Append-only records of decisions, memory lifecycle events, provider failures and simulation consumption. No audit events exist in the Phase 1 shell."
        actions={
          <Badge tone="neutral" dot>
            0 events
          </Badge>
        }
      />

      <section className="surface p-5">
        <EmptyState
          icon={ClipboardList}
          title="No audit events yet"
          description="The audit trail starts when the first observation, memory write or decision is persisted. This preview does not fabricate events to fill the page."
        />
      </section>

      <PlaceholderPanel
        phase="Phase 5"
        title="Append-only event contract"
        description="Decision, evidence, memory lifecycle, clearance and execution events will share a correlation ID and a stable actor/workspace reference."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            {
              icon: History,
              title: "Lifecycle",
              body: "Memory pending → active → quarantined/superseded.",
            },
            {
              icon: LockKeyhole,
              title: "Security",
              body: "Denied access, invalid clearance and replay attempts.",
            },
            {
              icon: ScrollText,
              title: "Decision",
              body: "Verdict, cited records, rule version and evaluation hash.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border border-line bg-white/[0.02] p-4">
                <Icon className="size-4 text-muted" aria-hidden="true" />
                <p className="mt-3 text-xs font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-[11px] leading-5 text-faint">{item.body}</p>
              </div>
            );
          })}
        </div>
      </PlaceholderPanel>
    </div>
  );
}
