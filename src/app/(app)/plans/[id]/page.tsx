import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, ArrowRight, Clock3, Hash, ShieldCheck } from "lucide-react";

import { evaluatePlanAction } from "@/app/(app)/actions";
import { SubmitButton } from "@/components/submit-button";
import { Badge, ButtonLink, PageHeader, StatusRow } from "@/components/ui";
import { formatBps, formatDate, formatMist, isExpired, shortId } from "@/lib/format";
import { getPlanDetail } from "@/lib/queries";
import { requireWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Plan detail" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const errors: Record<string, string> = {
  PLAN_NOT_FOUND: "The plan was not found.",
  OBSERVATION_STALE: "The observation is stale. Run Scout again before evaluating.",
  NO_POLICY: "No applicable policy exists; Sentinel will hold.",
  UNEXPECTED: "The evaluation could not be completed.",
};

export default async function PlanDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ error?: string }>;
}) {
  const { id } = await params;
  const { error: errorCode } = await searchParams;
  const { user, workspace } = await requireWorkspace();
  const detail = await getPlanDetail(user.id, workspace.id, id);
  if (!detail) notFound();
  const { plan, decisions } = detail;
  const error = errorCode ? errors[errorCode] ?? errors.UNEXPECTED : null;
  const expired = isExpired(plan.expires_at);

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operate / Plans"
        title="Plan detail"
        description="The immutable action intent, its observation anchor and every Sentinel attempt. Evaluation re-reads Walrus evidence; it does not trust the browser or a stale index."
        actions={
          <>
            <Badge tone={plan.status === "APPROVED" ? "accent" : plan.status === "REJECTED" ? "danger" : plan.status === "ON_HOLD" ? "warn" : "info"} dot>
              {plan.status}
            </Badge>
            <ButtonLink href="/plans" variant="secondary">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to plans
            </ButtonLink>
          </>
        }
      />

      {error ? (
        <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.45fr)_minmax(0,1fr)]">
        <section className="surface p-5">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Amount</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{formatMist(plan.amount_mist)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Exposure</p>
              <p className="mt-1 text-2xl font-semibold text-ink">{formatBps(plan.exposure_bps)}</p>
            </div>
          </div>
          <div className="mt-5">
            <StatusRow label="Plan ID" value={shortId(plan.id, 18)} tone="neutral" />
            <StatusRow label="Plan hash" value={shortId(plan.plan_hash, 18)} tone="neutral" />
            <StatusRow label="Wallet scope" value={shortId(plan.address, 18)} tone="neutral" />
            <StatusRow label="Observation" value={shortId(plan.observation_id, 18)} tone="neutral" detail={`${formatMist(plan.balance_mist)} observed ${formatDate(plan.observed_at)}`} />
            <StatusRow label="Created" value={formatDate(plan.created_at)} tone="neutral" />
            <StatusRow
              label="Expires"
              value={expired ? "Expired" : formatDate(plan.expires_at)}
              tone={expired ? "danger" : "neutral"}
              detail="Plan freshness is 300 seconds."
            />
          </div>
          {plan.rationale ? (
            <div className="mt-4 rounded-xl border border-line bg-white/[0.02] p-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Operator rationale</p>
              <p className="mt-2 whitespace-pre-wrap text-xs leading-5 text-muted">{plan.rationale}</p>
            </div>
          ) : null}
        </section>

        <aside className="space-y-4">
          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Run Sentinel</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Deterministic candidate enumeration → Walrus recall/content verification → fixed rules → VERDICT memory write and recall.
            </p>
            <form action={evaluatePlanAction} className="mt-4">
              <input type="hidden" name="planId" value={plan.id} />
              <SubmitButton pendingLabel="Verifying evidence + writing VERDICT…">
                {expired ? "Evaluate anyway (expiry will HOLD)" : "Evaluate with Sentinel"}
              </SubmitButton>
            </form>
            <p className="mt-3 text-[10px] leading-5 text-faint">
              A missing policy, stale observation, unverified memory or failed VERDICT write results in HOLD — never approval.
            </p>
          </section>

          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <Clock3 className="size-4 text-muted" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Attempts</h2>
            </div>
            {decisions.length === 0 ? (
              <p className="mt-2 text-xs text-faint">No Sentinel attempt yet.</p>
            ) : (
              <div className="mt-3 space-y-2">
                {decisions.map((decision) => (
                  <Link
                    key={decision.id}
                    href={`/decisions/${decision.id}`}
                    className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-2 hover:border-accent/30"
                  >
                    <div>
                      <p className="text-xs font-semibold text-ink">{decision.verdict}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-faint">{decision.reason_code}</p>
                    </div>
                    <ArrowRight className="size-3.5 text-muted" aria-hidden="true" />
                  </Link>
                ))}
              </div>
            )}
          </section>

          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-muted" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Canonical payload</h2>
            </div>
            <pre className="mt-3 max-h-64 overflow-auto rounded-lg border border-line bg-canvas p-3 font-mono text-[10px] leading-5 text-muted scrollbar-thin">
              {JSON.stringify(plan.canonical_plan, null, 2)}
            </pre>
          </section>
        </aside>
      </div>
    </div>
  );
}
