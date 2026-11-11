import type { Metadata } from "next";
import Link from "next/link";
import { Activity, CheckCircle2, ExternalLink, ShieldAlert, ShieldCheck } from "lucide-react";

import { runObservationAction } from "@/app/(app)/actions";
import { SubmitButton } from "@/components/submit-button";
import { Badge, ButtonLink, EmptyState, PageHeader, StatusRow } from "@/components/ui";
import { formatBps, formatDate, formatMist, shortId } from "@/lib/format";
import { listActiveConstraints, listObservations } from "@/lib/queries";
import { requireWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Observations" };
export const dynamic = "force-dynamic";
export const maxDuration = 60;

const errors: Record<string, string> = {
  INVALID_ADDRESS: "Enter a valid public Sui mainnet address.",
  ZERO_BALANCE: "The address returned a zero balance; a funded plan cannot be created.",
  TATUM: "Tatum could not return a balance. Check the provider configuration.",
  MEMORY_WRITE_FAILED: "The observation was stored, but Walrus FACT verification failed. Do not use it as active evidence.",
  UNEXPECTED: "The observation could not be completed.",
};

export default async function ObservationsPage({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user, workspace } = await requireWorkspace();
  const [observations, constraints] = await Promise.all([
    listObservations(user.id, workspace.id),
    listActiveConstraints(user.id, workspace.id),
  ]);
  const defaultAddress = process.env.SUI_DEMO_ADDRESS ?? "";
  const error = params.error ? errors[params.error] ?? errors.UNEXPECTED : null;

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor / Scout"
        title="Chain observations"
        description="Read-only Sui mainnet balance observations from the allowlisted Tatum gRPC provider. Each observation becomes a Walrus FACT only after terminal write, metadata listing and recall verification."
        actions={
          <>
            <Badge tone="accent" dot>
              Tatum mainnet
            </Badge>
            <ButtonLink href="/settings" variant="secondary">
              Policy controls
            </ButtonLink>
          </>
        }
      />

      {params.ok ? (
        <p role="status" className="rounded-lg border border-accent/25 bg-accent/10 p-3 text-xs text-accent">
          Observation recorded and its Walrus FACT verified.
        </p>
      ) : null}
      {error ? (
        <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.25fr)_minmax(0,1fr)]">
        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <Activity className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Request a fresh observation</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">
            Public address only. Scout calls Tatum <code className="font-mono text-ink">StateService.GetBalance</code>,
            stores an immutable observation, writes a FACT through the Scout Walrus delegate, and verifies the recalled payload before marking it ACTIVE.
          </p>
          <form action={runObservationAction} className="mt-4 space-y-3">
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Public Sui address</span>
              <input
                name="address"
                type="text"
                required
                pattern="0x[a-fA-F0-9]{64}"
                defaultValue={defaultAddress}
                className="mt-1.5 min-h-10 w-full rounded-lg border border-line bg-canvas px-3 font-mono text-xs text-ink outline-none"
                placeholder="0x…"
              />
            </label>
            <label className="block">
              <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Label (optional)</span>
              <input
                name="label"
                type="text"
                maxLength={80}
                className="mt-1.5 min-h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none"
                placeholder="Demo treasury"
              />
            </label>
            <div className="flex flex-wrap items-center gap-3">
              <SubmitButton pendingLabel="Reading Tatum + verifying Walrus…">New Observation</SubmitButton>
              <span className="text-[10px] text-faint">This can take several seconds while Walrus completes.</span>
            </div>
          </form>
        </section>

        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Observation contract</h2>
          </div>
          <div className="mt-3">
            <StatusRow label="Provider" value="Tatum gRPC" tone="accent" detail="Allowlisted mainnet endpoint." />
            <StatusRow label="Method" value="GetBalance" tone="accent" detail="Official Sui API protobufs." />
            <StatusRow label="Address" value="Public only" tone="neutral" detail="No private key or seed phrase is ever requested." />
            <StatusRow label="Freshness" value="300s" tone="neutral" detail="Stale evidence forces Sentinel to HOLD." />
          </div>
          <p className="mt-4 border-t border-line pt-3 text-[11px] leading-5 text-faint">
            The FACT carries the exact atomic MIST balance and the provider fields actually returned. No checkpoint or finality value is invented.
          </p>
        </section>
      </div>

      <section className="surface overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-line px-5 py-4">
          <div>
            <h2 className="text-sm font-semibold text-ink">Observation history</h2>
            <p className="mt-1 text-[11px] text-faint">Newest first · {observations.length} records</p>
          </div>
          <Badge tone={observations.length ? "accent" : "neutral"}>{observations.length ? "Live data" : "Empty"}</Badge>
        </div>
        {observations.length === 0 ? (
          <div className="p-5">
            <EmptyState
              icon={Activity}
              title="No observations recorded"
              description="Use New Observation with the funded public demo address to create the first verified FACT. A zero balance will be recorded safely but cannot support an exposure plan."
            />
          </div>
        ) : (
          <div className="w-full min-w-0 max-w-full overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line bg-white/[0.015] text-[10px] uppercase tracking-[0.14em] text-faint">
                <tr>
                  <th className="px-5 py-3 font-semibold">Address</th>
                  <th className="px-5 py-3 font-semibold">Balance</th>
                  <th className="px-5 py-3 font-semibold">Provider</th>
                  <th className="px-5 py-3 font-semibold">Observed</th>
                  <th className="px-5 py-3 font-semibold">Memory</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {observations.map((observation) => (
                  <tr key={observation.id}>
                    <td className="px-5 py-3">
                      <p className="font-mono text-[11px] text-ink">{shortId(observation.address, 18)}</p>
                      <p className="mt-1 text-[10px] text-faint">
                        <Link href={`/observations#${observation.id}`} className="hover:text-muted">
                          {observation.label ?? "Public Sui wallet"}
                        </Link>
                      </p>
                    </td>
                    <td className="px-5 py-3 font-mono text-ink">{formatMist(observation.balance_mist)}</td>
                    <td className="px-5 py-3 text-muted">
                      {observation.provider}
                      <span className="block text-[10px] text-faint">{observation.method}</span>
                    </td>
                    <td className="px-5 py-3 text-muted">{formatDate(observation.observed_at)}</td>
                    <td className="px-5 py-3">
                      <Link href="/memory" className="inline-flex items-center gap-1.5 text-accent hover:underline">
                        View ledger <ExternalLink className="size-3" aria-hidden="true" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      <section className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-4 text-warn" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Active exposure policies</h2>
          </div>
          <Badge tone={constraints.length ? "accent" : "neutral"}>{constraints.length} active</Badge>
        </div>
        {constraints.length === 0 ? (
          <p className="mt-3 rounded-lg border border-warn/25 bg-warn/5 p-3 text-xs leading-5 text-warn">
            No policy is active. Sentinel will return HOLD until the owner records a verified CONSTRAINT.{" "}
            <Link href="/settings" className="font-semibold underline">
              Create a policy
            </Link>
          </p>
        ) : (
          <div className="mt-3 divide-y divide-line">
            {constraints.map((constraint) => {
              const bps = typeof constraint.payload_index?.maxExposureBps === "number" ? constraint.payload_index.maxExposureBps : null;
              return (
                <div key={constraint.id} className="flex flex-wrap items-center justify-between gap-3 py-3 first:pt-0 last:pb-0">
                  <div>
                    <p className="text-xs font-medium text-ink">MAX_EXPOSURE_BPS · {bps === null ? "unknown" : formatBps(bps)}</p>
                    <p className="mt-1 break-all font-mono text-[10px] text-faint">{constraint.scope} · {shortId(constraint.walrus_blob_id, 16)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge tone="accent" dot>
                      Verified
                    </Badge>
                    <CheckCircle2 className="size-3.5 text-accent" aria-hidden="true" />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
