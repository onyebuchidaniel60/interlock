import type { Metadata } from "next";
import { ClipboardList, History, LockKeyhole, ScrollText } from "lucide-react";

import { Badge, EmptyState, PageHeader, PlaceholderPanel } from "@/components/ui";
import { formatDate, shortId } from "@/lib/format";
import { listAuditEvents } from "@/lib/queries";
import { requireWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Audit trail" };
export const dynamic = "force-dynamic";

const eventTone = (eventType: string) => {
  if (eventType.includes("FAILED") || eventType.includes("FORBIDDEN")) return "danger" as const;
  if (eventType.includes("HELD") || eventType.includes("HOLD")) return "warn" as const;
  if (eventType.includes("SIMULATION") || eventType.includes("DECISION")) return "accent" as const;
  return "neutral" as const;
};

export default async function AuditPage() {
  const { user, workspace } = await requireWorkspace();
  const events = await listAuditEvents(user.id, workspace.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Memory / Audit"
        title="Audit trail"
        description="Append-only records of decisions, memory lifecycle events, provider failures and simulation consumption. Members can read; no member can edit or delete audit history."
        actions={<Badge tone="neutral" dot>{events.length} events</Badge>}
      />

      {events.length === 0 ? (
        <section className="surface p-5">
          <EmptyState
            icon={ClipboardList}
            title="No audit events yet"
            description="The audit trail starts when the first observation, memory write or decision is persisted. This view does not fabricate events."
          />
        </section>
      ) : (
        <section className="surface overflow-hidden">
          <div className="w-full min-w-0 max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-white/[0.015] text-[10px] uppercase tracking-[0.14em] text-faint">
                <tr>
                  <th className="px-5 py-3 font-semibold">Event</th>
                  <th className="px-5 py-3 font-semibold">Resource</th>
                  <th className="px-5 py-3 font-semibold">Summary</th>
                  <th className="px-5 py-3 font-semibold">Time</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {events.map((event) => (
                  <tr key={event.id}>
                    <td className="px-5 py-3">
                      <Badge tone={eventTone(event.event_type)}>{event.event_type}</Badge>
                    </td>
                    <td className="px-5 py-3">
                      <p className="text-muted">{event.resource_type ?? "—"}</p>
                      <p className="mt-1 font-mono text-[10px] text-faint">{shortId(event.resource_id, 16)}</p>
                    </td>
                    <td className="px-5 py-3 text-muted">{event.summary}</td>
                    <td className="px-5 py-3 text-faint">{formatDate(event.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <PlaceholderPanel
        phase="Phase 7"
        title="Event detail drawer"
        description="The final interface will open a redacted event detail panel with correlation IDs and resource links. No secrets or private provider headers are stored in audit metadata."
      >
        <div className="grid gap-3 sm:grid-cols-3">
          {[
            { icon: History, title: "Lifecycle", body: "Memory pending → active → quarantined/superseded." },
            { icon: LockKeyhole, title: "Security", body: "Denied access, invalid clearance and replay attempts." },
            { icon: ScrollText, title: "Decision", body: "Verdict, cited records, rule version and evaluation hash." },
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
