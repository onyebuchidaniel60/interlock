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
import { formatDate, formatMist, shortId } from "@/lib/format";
import { getWorkspaceOverview } from "@/lib/queries";
import { requireWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Dashboard" };
export const dynamic = "force-dynamic";

const agents = [
  { name: "Scout", role: "Observation", status: "Live" },
  { name: "Analyst", role: "Explanation only", status: "Fallback ready" },
  { name: "Sentinel", role: "Deterministic gate", status: "Live" },
  { name: "Runner", role: "Simulation only", status: "Live" },
];

export default async function DashboardPage() {
  const { user, workspace } = await requireWorkspace();
  const { counts, recent } = await getWorkspaceOverview(user.id, workspace.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor"
        title="Operations console"
        description={`${workspace.name} · Scout records Tatum observations, Sentinel verifies Walrus evidence deterministically, and Runner consumes a single-use simulation clearance only after final approval.`}
        actions={
          <>
            <Badge tone="accent" dot>
              Live workspace
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
          value={String(counts?.memories ?? 0)}
          detail="Active Walrus-backed records"
          icon={Brain}
          tone="accent"
        />
        <KpiCard
          label="Active policies"
          value={String(counts?.policies ?? 0)}
          detail="Verified CONSTRAINT records"
          icon={ShieldCheck}
        />
        <KpiCard
          label="Decisions"
          value={String(counts?.decisions ?? 0)}
          detail={`${counts?.holds ?? 0} HOLD · ${counts?.executions ?? 0} simulated`}
          icon={Activity}
        />
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
            description="Every verdict cites the exact Walrus record and chain observation it used."
            action={<Badge tone="neutral">{recent.length} recent</Badge>}
          />
          <div className="mt-5">
            {recent.length === 0 ? (
              <EmptyState
                icon={ShieldAlert}
                title="No decision records yet"
                description="Create a plan from a fresh observation and run Sentinel. Missing policy, unverified memory or a failed VERDICT write results in HOLD."
                action={
                  <ButtonLink href="/plans/new" variant="secondary">
                    Create a plan
                    <ArrowRight className="size-3.5" aria-hidden="true" />
                  </ButtonLink>
                }
              />
            ) : (
              <div className="divide-y divide-line">
                {recent.map((decision) => (
                  <a
                    key={decision.id}
                    href={`/decisions/${decision.id}`}
                    className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0"
                  >
                    <Badge
                      tone={decision.verdict === "APPROVE" ? "accent" : decision.verdict === "REJECT" ? "danger" : "warn"}
                      dot
                    >
                      {decision.verdict}
                    </Badge>
                    <div className="min-w-0">
                      <p className="text-xs font-medium text-ink">{decision.reason_code}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-faint">
                        {shortId(decision.id, 14)} · {formatMist(decision.amount_mist)} · {formatDate(decision.created_at)}
                      </p>
                    </div>
                    <ArrowRight className="ml-auto size-3.5 text-muted" aria-hidden="true" />
                  </a>
                ))}
              </div>
            )}
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
            action={<Badge tone="info">Phase 2</Badge>}
          />
          <div className="mt-3">
            <StatusRow
              label="Neon Postgres + Managed Better Auth"
              value="Connected"
              tone="accent"
              detail="Sessions verified server-side; app_user queries with RLS."
            />
            <StatusRow
              label="Walrus Memory mainnet"
              value="Live"
              tone="accent"
              detail="Signed writes, metadata listing and verified recall are wired."
            />
            <StatusRow
              label="Tatum Sui gRPC"
              value="Live"
              tone="accent"
              detail="Non-zero funded demo observation verified in Phase 3."
            />
            <StatusRow
              label="Groq Analyst"
              value="Fallback ready"
              tone="neutral"
              detail="Analyst text only; deterministic fallback; no policy authority."
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
