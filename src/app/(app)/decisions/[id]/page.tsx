import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft, CheckCircle2, FileSearch, ShieldAlert, ShieldCheck, WalletCards } from "lucide-react";

import { simulateDecisionAction } from "@/app/(app)/actions";
import { CopyValue } from "@/components/copy-value";
import { SubmitButton } from "@/components/submit-button";
import { Badge, ButtonLink, PageHeader, StatusRow } from "@/components/ui";
import { formatBps, formatDate, formatMist, shortId } from "@/lib/format";
import { getDecisionDetail } from "@/lib/queries";
import { requireWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Decision detail" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const errors: Record<string, string> = {
  NOT_APPROVED: "Only a final approved decision can be simulated.",
  VERDICT_MEMORY_MISSING: "The approval has no verified VERDICT memory.",
  VERDICT_MEMORY_UNVERIFIED: "The approval VERDICT memory could not be recalled.",
  ALREADY_SIMULATED: "This decision has already been simulated once.",
  UNEXPECTED: "The simulation could not be completed.",
};

const verdictTone = { APPROVE: "accent", REJECT: "danger", HOLD: "warn" } as const;

export default async function DecisionDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ simulated?: string; error?: string }>;
}) {
  const { id } = await params;
  const query = await searchParams;
  const { user, workspace } = await requireWorkspace();
  const detail = await getDecisionDetail(user.id, workspace.id, id);
  if (!detail) notFound();
  const { decision, evidence } = detail;
  const error = query.error ? errors[query.error] ?? errors.UNEXPECTED : null;
  const canSimulate = decision.status === "FINAL_APPROVED" && !decision.execution_id;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Decisions / Evidence"
        title="Decision detail"
        description="The evidence-first verdict view. Every cited record is a Walrus memory that was recalled and hash-verified before the deterministic evaluation."
        actions={
          <>
            <Badge tone={verdictTone[decision.verdict as keyof typeof verdictTone] ?? "neutral"} dot>
              {decision.verdict}
            </Badge>
            <ButtonLink href={`/plans/${decision.plan_id}`} variant="secondary">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to plan
            </ButtonLink>
          </>
        }
      />

      {query.simulated ? (
        <p role="status" className="rounded-lg border border-accent/25 bg-accent/10 p-3 text-xs text-accent">
          Simulated once. The execution record is immutable; another attempt is blocked by the one-execution constraint.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="surface p-5">
          <div className="flex flex-wrap items-start justify-between gap-4 border-b border-line pb-4">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Verdict</p>
              <p className="mt-1 text-3xl font-semibold text-ink">{decision.verdict}</p>
              <p className="mt-2 max-w-xl text-sm leading-6 text-muted">{decision.explanation}</p>
            </div>
            <Badge tone="neutral">{decision.reason_code}</Badge>
          </div>

          <div className="mt-4 grid gap-4 sm:grid-cols-3">
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Amount</p>
              <p className="mt-1 text-sm font-semibold text-ink">{formatMist(decision.amount_mist)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Exposure</p>
              <p className="mt-1 text-sm font-semibold text-ink">{formatBps(decision.exposure_bps)}</p>
            </div>
            <div>
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Wallet</p>
              <p className="mt-1 font-mono text-xs text-ink">{shortId(decision.address, 18)}</p>
            </div>
          </div>

          <div className="mt-4">
            <StatusRow label="Decision state" value={decision.status} tone={decision.status === "FINAL_APPROVED" ? "accent" : decision.status === "FINAL_REJECTED" ? "danger" : "warn"} />
            <StatusRow label="Finalized" value={formatDate(decision.finalized_at)} tone="neutral" />
          </div>

          <div className="mt-4 rounded-xl border border-line bg-white/[0.02] p-4">
            <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-faint">Provenance</p>
            <div className="mt-2 space-y-2">
              <CopyValue label="plan hash" value={decision.plan_hash} full />
              <CopyValue label="evaluation hash" value={decision.evaluation_hash} full />
              <CopyValue label="VERDICT memory" value={decision.verdict_memory_id} full />
              <CopyValue label="wallet address" value={decision.address} full />
            </div>
          </div>

          <div className="mt-5">
            <div className="flex items-center gap-2">
              <FileSearch className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Cited evidence</h2>
              <Badge tone="neutral" className="ml-auto">
                {evidence.length} records
              </Badge>
            </div>
            {evidence.length === 0 ? (
              <p className="mt-3 rounded-lg border border-warn/25 bg-warn/5 p-3 text-xs text-warn">
                No evidence rows were stored. The decision is fail-closed.
              </p>
            ) : (
              <div className="mt-3 w-full min-w-0 max-w-full overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-faint">
                    <tr>
                      <th className="pb-2 font-semibold">Role</th>
                      <th className="pb-2 font-semibold">Verification</th>
                      <th className="pb-2 font-semibold">Author</th>
                      <th className="pb-2 font-semibold">Blob</th>
                      <th className="pb-2 font-semibold">Hash</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-line">
                    {evidence.map((row) => (
                      <tr key={row.memory_entry_id}>
                        <td className="py-3 pr-4">
                          <Badge tone={row.evidence_role === "CONSTRAINT" ? "warn" : "neutral"}>{row.evidence_role}</Badge>
                          <p className="mt-1 font-mono text-[10px] text-faint">{shortId(row.memory_entry_id, 14)}</p>
                        </td>
                        <td className="py-3 pr-4">
                          <Badge tone={row.verification_status === "VERIFIED" ? "accent" : "danger"} dot>
                            {row.verification_status}
                          </Badge>
                        </td>
                        <td className="py-3 pr-4 text-muted">{row.author_type ?? "—"}</td>
                        <td className="py-3 pr-4">
                          <CopyValue label={`${row.evidence_role} blob`} value={row.blob_id} />
                        </td>
                        <td className="py-3">
                          <CopyValue label={`${row.evidence_role} hash`} value={row.content_hash} />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>

        <aside className="space-y-4">
          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <WalletCards className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Runner simulation</h2>
            </div>
            {decision.execution_id ? (
              <div className="mt-3 rounded-xl border border-accent/25 bg-accent/5 p-4">
                <div className="flex items-center gap-2 text-accent">
                  <CheckCircle2 className="size-4" aria-hidden="true" />
                  <p className="text-xs font-semibold">Simulated once</p>
                </div>
                <p className="mt-2 font-mono text-[10px] text-muted">Execution {shortId(decision.execution_id, 18)}</p>
                <p className="mt-1 text-xs text-muted">{formatDate(decision.execution_at)}</p>
              </div>
            ) : canSimulate ? (
              <form action={simulateDecisionAction} className="mt-3">
                <input type="hidden" name="decisionId" value={decision.id} />
                <div className="mb-3 inline-flex items-center rounded-full border border-line bg-white/[0.03] px-2.5 py-1 text-[10px] font-medium text-muted">
                  Execution: simulated · no funds move
                </div>
                <br />
                <SubmitButton pendingLabel="Consuming clearance…">Simulate once</SubmitButton>
                <p className="mt-2 text-[10px] leading-5 text-faint">
                  The server verifies the VERDICT memory again, mints a 60-second single-use clearance and atomically consumes it. No transaction is submitted.
                </p>
              </form>
            ) : (
              <div className="mt-3 flex items-start gap-2 rounded-lg border border-warn/25 bg-warn/5 p-3 text-xs leading-5 text-warn">
                <ShieldAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
                Runner remains blocked until this decision reaches FINAL_APPROVED with a verified VERDICT memory.
              </div>
            )}
          </section>

          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Tatum anchor</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              The plan&apos;s balance observation is immutable and provider-stamped. No checkpoint or finality field is invented.
            </p>
            <div className="mt-3 space-y-2">
              <StatusRow label="Provider" value={decision.provider} tone="neutral" />
              <StatusRow label="Method" value={decision.method} tone="neutral" />
              <StatusRow label="Balance" value={formatMist(decision.balance_mist)} tone="neutral" />
              <StatusRow label="Observed" value={formatDate(decision.observed_at)} tone="neutral" />
              <CopyValue label="observation ID" value={decision.observation_id} full />
            </div>
          </section>

          <section className="surface p-5">
            <div className="flex items-center gap-2">
              <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Safety boundary</h2>
            </div>
            <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
              <li>Execution simulated. No custody, signing, transfers or trades.</li>
              <li>One execution per decision; the unique constraint blocks replay.</li>
              <li>Missing policy or unverified memory is HOLD, never APPROVE.</li>
            </ul>
            <Link href="/audit" className="mt-4 inline-flex text-[11px] font-semibold text-accent hover:underline">
              View audit trail
            </Link>
          </section>
        </aside>
      </div>
    </div>
  );
}
