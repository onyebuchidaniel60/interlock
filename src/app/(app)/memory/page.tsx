import type { Metadata } from "next";
import { Brain, Database, Hash, ShieldCheck } from "lucide-react";

import { Badge, EmptyState, PageHeader } from "@/components/ui";
import { formatDate, shortId } from "@/lib/format";
import { listMemories } from "@/lib/queries";
import { requireWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Memory ledger" };
export const dynamic = "force-dynamic";

const statusTone = {
  ACTIVE: "accent",
  PENDING_MEMORY: "warn",
  VERIFIED_ACTIVE: "accent",
  FAILED: "danger",
  QUARANTINED: "danger",
  SUPERSEDED: "neutral",
  REVOKED: "neutral",
} as const;

export default async function MemoryPage() {
  const { user, workspace } = await requireWorkspace();
  const memories = await listMemories(user.id, workspace.id);
  const active = memories.filter((memory) => memory.status === "ACTIVE").length;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Memory"
        title="Memory ledger"
        description="A deterministic index of typed Walrus memories. The ledger is not the memory system of record: canonical payloads live on Walrus and must be recalled and verified before use."
        actions={
          <>
            <Badge tone={active ? "accent" : "warn"} dot>
              {active} active
            </Badge>
            <Badge tone="neutral">{memories.length} indexed</Badge>
          </>
        }
      />

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center gap-2 border-b border-line px-5 py-4">
          <span className="mr-2 text-[11px] font-semibold uppercase tracking-[0.16em] text-faint">Namespace</span>
          <span className="inline-flex items-center rounded-full border border-line bg-white/[0.025] px-2.5 py-1 font-mono text-[11px] text-muted">
            interlock
          </span>
          <span className="ml-auto text-[11px] text-faint">Walrus is the source of record</span>
        </div>

        {memories.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Brain}
              title="No indexed memories yet"
              description="Run Scout and create an exposure policy. Each record stays PENDING until Walrus completes, metadata is listed and the exact recalled payload matches its canonical hash."
            />
          </div>
        ) : (
          <div className="w-full min-w-0 max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-white/[0.015] text-[10px] uppercase tracking-[0.14em] text-faint">
                <tr>
                  <th className="px-5 py-3 font-semibold">Record</th>
                  <th className="px-5 py-3 font-semibold">Type</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Author</th>
                  <th className="px-5 py-3 font-semibold">Scope</th>
                  <th className="px-5 py-3 font-semibold">Walrus blob</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {memories.map((memory) => (
                  <tr key={memory.id} className="align-top">
                    <td className="px-5 py-3">
                      <p className="font-mono text-[11px] text-ink">{shortId(memory.id, 16)}</p>
                      <p className="mt-1 font-mono text-[10px] text-faint">{shortId(memory.content_hash, 16)}</p>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={memory.record_type === "VERDICT" ? "info" : memory.record_type === "CONSTRAINT" ? "warn" : "neutral"}>
                        {memory.record_type}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone[memory.status as keyof typeof statusTone] ?? "neutral"} dot>
                        {memory.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3 text-muted">{memory.author_type}</td>
                    <td className="px-5 py-3 font-mono text-[10px] text-muted">{memory.scope}</td>
                    <td className="px-5 py-3">
                      <p className="max-w-[220px] break-all font-mono text-[10px] text-accent">
                        {memory.walrus_blob_id ?? "pending"}
                      </p>
                      {memory.verified_at ? <p className="mt-1 text-[10px] text-faint">verified {formatDate(memory.verified_at)}</p> : null}
                    </td>
                    <td className="px-5 py-3 text-faint">{formatDate(memory.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-3">
        {[
          { icon: Database, title: "Neon index", body: "Typed metadata, scope tags, lifecycle and audit references. A row alone is never evidence." },
          { icon: Hash, title: "Canonical hash", body: "Deterministic JSON is hashed with SHA-256 and checked again after recall." },
          { icon: ShieldCheck, title: "Verified active", body: "A record becomes active only after terminal write, metadata presence and exact-content recall." },
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

      <section className="surface p-5">
        <h2 className="text-sm font-semibold text-ink">Provenance discipline</h2>
        <p className="mt-2 max-w-3xl text-xs leading-5 text-muted">
          A ledger row is a pointer, never proof. Canonical content lives on Walrus; Sentinel verifies record ID, namespace, author, blob, content hash and recall before citing it.
        </p>
      </section>
    </div>
  );
}
