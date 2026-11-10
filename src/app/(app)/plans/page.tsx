import type { Metadata } from "next";
import { ArrowRight, ClipboardList, WalletCards } from "lucide-react";

import { Badge, ButtonLink, EmptyState, PageHeader } from "@/components/ui";
import { formatBps, formatDate, formatMist, shortId } from "@/lib/format";
import { listPlans } from "@/lib/queries";
import { requireWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Plans" };
export const dynamic = "force-dynamic";

const statusTone = {
  APPROVED: "accent",
  REJECTED: "danger",
  ON_HOLD: "warn",
  DRAFT: "neutral",
  READY_FOR_CHECK: "info",
  CHECKING: "warn",
  EXPIRED: "neutral",
} as const;

export default async function PlansPage() {
  const { user, workspace } = await requireWorkspace();
  const plans = await listPlans(user.id, workspace.id);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operate"
        title="Action plans"
        description="Immutable, hash-bound simulated action intents. Sentinel evaluates the same plan hash against fresh, verified Walrus evidence."
        actions={
          <>
            <Badge tone="neutral" dot>
              {plans.length} plans
            </Badge>
            <ButtonLink href="/plans/new">
              Create plan <ArrowRight className="size-3.5" aria-hidden="true" />
            </ButtonLink>
          </>
        }
      />

      {plans.length === 0 ? (
        <section className="surface p-5">
          <EmptyState
            icon={WalletCards}
            title="No action plans yet"
            description="Create a plan from a fresh observation. The 10% policy demo rejects a 15% request with cited Walrus evidence; a compliant plan can proceed to one simulated execution."
            action={
              <ButtonLink href="/plans/new" variant="secondary">
                Create the first plan <ArrowRight className="size-3.5" aria-hidden="true" />
              </ButtonLink>
            }
          />
        </section>
      ) : (
        <section className="surface overflow-hidden">
          <div className="w-full min-w-0 max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-white/[0.015] text-[10px] uppercase tracking-[0.14em] text-faint">
                <tr>
                  <th className="px-5 py-3 font-semibold">Plan</th>
                  <th className="px-5 py-3 font-semibold">Amount</th>
                  <th className="px-5 py-3 font-semibold">Exposure</th>
                  <th className="px-5 py-3 font-semibold">Status</th>
                  <th className="px-5 py-3 font-semibold">Verdict</th>
                  <th className="px-5 py-3 font-semibold">Created</th>
                  <th className="px-5 py-3 font-semibold" />
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {plans.map((plan) => (
                  <tr key={plan.id}>
                    <td className="px-5 py-3">
                      <p className="font-mono text-[11px] text-ink">{shortId(plan.id, 16)}</p>
                      <p className="mt-1 font-mono text-[10px] text-faint">{shortId(plan.plan_hash, 16)}</p>
                    </td>
                    <td className="px-5 py-3 font-mono text-ink">{formatMist(plan.amount_mist)}</td>
                    <td className="px-5 py-3 text-muted">{formatBps(plan.exposure_bps)}</td>
                    <td className="px-5 py-3">
                      <Badge tone={statusTone[plan.status as keyof typeof statusTone] ?? "neutral"} dot>
                        {plan.status}
                      </Badge>
                    </td>
                    <td className="px-5 py-3">
                      {plan.decision_verdict ? (
                        <Badge tone={plan.decision_verdict === "APPROVE" ? "accent" : plan.decision_verdict === "REJECT" ? "danger" : "warn"}>
                          {plan.decision_verdict}
                        </Badge>
                      ) : (
                        <span className="text-faint">Not checked</span>
                      )}
                    </td>
                    <td className="px-5 py-3 text-faint">{formatDate(plan.created_at)}</td>
                    <td className="px-5 py-3 text-right">
                      <ButtonLink href={`/plans/${plan.id}`} variant="ghost">
                        Open <ArrowRight className="size-3.5" aria-hidden="true" />
                      </ButtonLink>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      )}

      <section className="surface flex items-start gap-3 p-5">
        <ClipboardList className="mt-0.5 size-4 shrink-0 text-accent" aria-hidden="true" />
        <p className="text-xs leading-5 text-muted">
          A plan cannot be approved by the browser. The server recomputes the deterministic candidate set, verifies recalled Walrus payloads and writes a VERDICT memory before any approval can reach Runner.
        </p>
      </section>
    </div>
  );
}
