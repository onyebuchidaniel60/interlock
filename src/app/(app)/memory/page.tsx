import type { Metadata } from "next";
import { Brain, CheckCircle2, Copy, Database, Hash, ShieldCheck } from "lucide-react";

import { Badge, ButtonLink, EmptyState, PageHeader, PlaceholderPanel } from "@/components/ui";

export const metadata: Metadata = { title: "Memory ledger" };

const types = ["FACT", "CONSTRAINT", "VERDICT", "OUTCOME"] as const;

export default function MemoryPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Memory"
        title="Memory ledger"
        description="A deterministic index of typed Walrus memories. The ledger is not the memory system of record: canonical payloads live on Walrus and must be recalled and verified before use."
        actions={
          <>
            <Badge tone="warn" dot>
              Empty index
            </Badge>
            <ButtonLink href="/audit" variant="secondary">
              View audit trail
            </ButtonLink>
          </>
        }
      />

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">
            Type
          </span>
          {types.map((type) => (
            <span
              key={type}
              className="inline-flex items-center rounded-full border border-line bg-white/[0.025] px-2.5 py-1 text-[11px] font-medium text-muted"
            >
              {type}
              <span className="ml-1.5 font-mono text-[10px] text-faint">0</span>
            </span>
          ))}
          <span className="ml-auto text-[11px] text-faint">Namespace: interlock</span>
        </div>

        <div className="hidden grid-cols-[minmax(0,1.5fr)_100px_100px_120px_160px] gap-4 border-b border-line bg-white/[0.015] px-5 py-3 text-[10px] font-semibold uppercase tracking-[0.14em] text-faint md:grid">
          <span>Record</span>
          <span>Type</span>
          <span>Status</span>
          <span>Author</span>
          <span>Walrus blob</span>
        </div>

        <div className="p-5">
          <EmptyState
            icon={Brain}
            title="No indexed memories yet"
            description="Phase 3 writes the first signed synthetic FACT through the Scout delegate, waits for terminal success, verifies recall and only then marks the record active."
            action={
              <ButtonLink href="/observations" variant="secondary">
                Start with observations
              </ButtonLink>
            }
          />
        </div>
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          {
            icon: Database,
            title: "Neon index",
            body: "Typed metadata, scope tags, lifecycle and audit references. A row alone is never evidence.",
          },
          {
            icon: Hash,
            title: "Canonical hash",
            body: "Deterministic JSON is hashed with SHA-256 and checked again after recall.",
          },
          {
            icon: ShieldCheck,
            title: "Verified active",
            body: "A record becomes active only after terminal write, metadata presence and exact-content recall.",
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
        phase="Phase 3"
        title="Evidence detail is intentionally absent"
        description="Once records exist, each row will open a detail panel with the canonical payload, author, namespace, blob ID, hash match and recall result."
      >
        <div className="flex flex-wrap gap-2 text-[11px] text-faint">
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1">
            <Copy className="size-3" aria-hidden="true" /> Copyable blob IDs
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1">
            <CheckCircle2 className="size-3" aria-hidden="true" /> Verified recall required
          </span>
          <span className="inline-flex items-center gap-1.5 rounded-md border border-line px-2 py-1">
            <ShieldCheck className="size-3" aria-hidden="true" /> Pending is not active
          </span>
        </div>
      </PlaceholderPanel>
    </div>
  );
}
