import type { Metadata } from "next";
import {
  Activity,
  ArrowRight,
  Brain,
  CheckCircle2,
  Database,
  GitBranch,
  ShieldAlert,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

import {
  Badge,
  ButtonLink,
  EmptyState,
  KpiCard,
  PageHeader,
  SectionHeading,
  StatusRow,
} from "@/components/ui";

export const metadata: Metadata = { title: "Dashboard" };

const agents = [
  { name: "Scout", role: "Observation", status: "Awaiting Phase 3" },
  { name: "Analyst", role: "Explanation only", status: "Awaiting Phase 3" },
  { name: "Sentinel", role: "Deterministic gate", status: "Awaiting Phase 3" },
  { name: "Runner", role: "Simulation only", status: "Awaiting Phase 5" },
];

export default function DashboardPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor"
        title="Operations console"
        description="A navigable preview of the verified-memory execution gate. Provider adapters, authentication and decision flows are labelled as unfinished until their phases land."
        actions={
          <>
            <Badge tone="warn" dot>
              Preview shell
            </Badge>
            <ButtonLink href="/observations" variant="secondary">
              Inspect observations
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </ButtonLink>
          </>
        }
      />

      <section aria-label="Key metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard
          label="Verified memories"
          value="0"
          detail="No Walrus-backed records yet"
          icon={Brain}
        />
        <KpiCard
          label="Active policies"
          value="0"
          detail="Policy authoring arrives in Phase 4"
          icon={ShieldCheck}
        />
        <KpiCard label="Decisions" value="0" detail="Sentinel is not wired yet" icon={Activity} />
        <KpiCard
          label="Execution mode"
          value="Simulation"
          detail="No custody, signing, transfers or trades"
          icon={WalletCards}
          tone="accent"
        />
      </section>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.65fr)_minmax(0,1fr)]">
        <section className="surface p-5">
          <SectionHeading
            title="Decision activity"
            description="Every verdict will cite the exact Walrus record and chain observation it used."
            action={<Badge tone="neutral">No decisions</Badge>}
          />
          <div className="mt-5">
            <EmptyState
              icon={ShieldAlert}
              title="No decision records yet"
              description="The deterministic Sentinel, its evidence panel and the signed Runner clearance are implemented in later phases. This shell does not display fabricated verdicts."
              action={
                <ButtonLink href="/memory" variant="secondary">
                  Open memory ledger
                  <ArrowRight className="size-3.5" aria-hidden="true" />
                </ButtonLink>
              }
            />
          </div>
        </section>

        <section className="surface p-5">
          <SectionHeading
            title="Memory pipeline"
            description="Walrus is the memory system of record; Neon is only the deterministic index."
          />
          <ol className="mt-5 space-y-3">
            {[
              { step: "01", label: "Scout writes FACT", note: "Observation + provenance" },
              { step: "02", label: "Policy writes CONSTRAINT", note: "Immutable, scoped rule" },
              { step: "03", label: "Sentinel writes VERDICT", note: "Required for final APPROVE" },
            ].map((item) => (
              <li
                key={item.step}
                className="flex items-start gap-3 rounded-xl border border-line bg-white/[0.02] p-3.5"
              >
                <span className="mt-0.5 font-mono text-[10px] text-faint">{item.step}</span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink">{item.label}</p>
                  <p className="mt-1 text-[11px] text-faint">{item.note}</p>
                </div>
                <Badge tone="neutral" className="ml-auto shrink-0">
                  Pending
                </Badge>
              </li>
            ))}
          </ol>
          <p className="mt-4 border-t border-line pt-3 text-[11px] leading-5 text-faint">
            A pending or metadata-only memory is never active evidence. Recall and content
            verification are required.
          </p>
        </section>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <SectionHeading
            title="Agent modules"
            description="One application, four server-side capabilities."
            action={
              <ButtonLink href="/agents" variant="ghost">
                View agents
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </ButtonLink>
            }
          />
          <div className="mt-4 divide-y divide-line">
            {agents.map((agent) => (
              <div key={agent.name} className="flex items-center gap-3 py-3 first:pt-1 last:pb-1">
                <span className="grid size-8 place-items-center rounded-lg border border-line bg-white/[0.03] text-muted">
                  {agent.name === "Sentinel" ? (
                    <ShieldCheck className="size-3.5" aria-hidden="true" />
                  ) : agent.name === "Runner" ? (
                    <WalletCards className="size-3.5" aria-hidden="true" />
                  ) : agent.name === "Scout" ? (
                    <Activity className="size-3.5" aria-hidden="true" />
                  ) : (
                    <GitBranch className="size-3.5" aria-hidden="true" />
                  )}
                </span>
                <div className="min-w-0">
                  <p className="text-xs font-medium text-ink">{agent.name}</p>
                  <p className="text-[11px] text-faint">{agent.role}</p>
                </div>
                <Badge tone="neutral" className="ml-auto shrink-0">
                  {agent.status}
                </Badge>
              </div>
            ))}
          </div>
        </section>

        <section className="surface p-5">
          <SectionHeading
            title="Provider readiness"
            description="Credentials are server-only. This panel never prints secret values."
            action={<Badge tone="info">Phase 1</Badge>}
          />
          <div className="mt-3">
            <StatusRow
              label="Neon Postgres + Managed Better Auth"
              value="Phase 2"
              tone="neutral"
              detail="Database, roles, RLS and sessions are not wired in this shell."
            />
            <StatusRow
              label="Walrus Memory mainnet"
              value="Adapter pending"
              tone="accent"
              detail="Phase 0 signed write/read smoke test passed; the application adapter is Phase 3."
            />
            <StatusRow
              label="Tatum Sui gRPC"
              value="Adapter pending"
              tone="accent"
              detail="Phase 0 StateService.GetBalance method verified; the funded demo observation is re-checked in Phase 3."
            />
            <StatusRow
              label="Groq Analyst"
              value="Phase 3"
              tone="neutral"
              detail="No model call is made by the preview shell. Analyst can never authorize an action."
            />
          </div>
        </section>
      </div>

      <section className="surface p-5">
        <SectionHeading
          title="Preview safety boundary"
          description="The console is intentionally boring where evidence does not exist."
        />
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {[
            {
              icon: ShieldCheck,
              title: "Fail closed",
              body: "Missing or unverifiable evidence produces HOLD.",
            },
            {
              icon: CheckCircle2,
              title: "Simulation only",
              body: "No wallet custody, signing or transaction submission.",
            },
            {
              icon: Database,
              title: "Index ≠ memory",
              body: "Neon stores metadata; Walrus stores the memory payload.",
            },
            {
              icon: GitBranch,
              title: "Deterministic Sentinel",
              body: "No LLM output can approve or reject a plan.",
            },
          ].map((item) => {
            const Icon = item.icon;
            return (
              <div key={item.title} className="rounded-xl border border-line bg-white/[0.02] p-4">
                <Icon className="size-4 text-accent" aria-hidden="true" />
                <p className="mt-3 text-xs font-semibold text-ink">{item.title}</p>
                <p className="mt-1 text-[11px] leading-5 text-faint">{item.body}</p>
              </div>
            );
          })}
        </div>
      </section>
    </div>
  );
}
