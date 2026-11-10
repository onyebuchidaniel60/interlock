import type { Metadata } from "next";
import { Activity, ArrowRight, Database, ExternalLink, Radio } from "lucide-react";

import {
  Badge,
  ButtonLink,
  EmptyState,
  PageHeader,
  PlaceholderPanel,
  StatusRow,
} from "@/components/ui";

export const metadata: Metadata = { title: "Observations" };

export default function ObservationsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor / Scout"
        title="Chain observations"
        description="Read-only Sui mainnet balance observations from the allowlisted Tatum gRPC provider. The application adapter is built in Phase 3."
        actions={
          <>
            <Badge tone="neutral" dot>
              Adapter pending
            </Badge>
            <ButtonLink href="/dashboard" variant="secondary">
              Back to dashboard
              <ArrowRight className="size-3.5" aria-hidden="true" />
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.5fr)_minmax(0,1fr)]">
        <section className="surface p-5">
          <EmptyState
            icon={Activity}
            title="No observations recorded"
            description="Phase 0 verified Tatum StateService.GetBalance against mainnet. Phase 3 adds the typed adapter, persistence, freshness checks and the read-only observation timeline."
            action={
              <ButtonLink href="/settings" variant="secondary">
                Review provider configuration
                <ArrowRight className="size-3.5" aria-hidden="true" />
              </ButtonLink>
            }
          />
        </section>

        <section className="surface p-5">
          <div className="flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-ink">Observation contract</h2>
            <Badge tone="info">Phase 3</Badge>
          </div>
          <div className="mt-3">
            <StatusRow
              label="Provider"
              value="Tatum gRPC"
              tone="accent"
              detail="Allowlisted mainnet endpoint."
            />
            <StatusRow
              label="Method"
              value="GetBalance"
              tone="accent"
              detail="Official Sui API protobufs."
            />
            <StatusRow
              label="Address"
              value="Public only"
              tone="neutral"
              detail="No private key or seed phrase is ever requested."
            />
            <StatusRow
              label="Freshness"
              value="Planned"
              tone="neutral"
              detail="Stale evidence will force Sentinel to HOLD."
            />
          </div>
        </section>
      </div>

      <PlaceholderPanel
        phase="Phase 3"
        title="What this screen will contain"
        description="A real observation row will include the public address, coin type, atomic MIST balance, provider, method, observation time and only the provider fields actually returned."
      >
        <div className="grid gap-3 md:grid-cols-3">
          {[
            {
              icon: Radio,
              title: "Request",
              body: "Operator requests a fresh read-only observation.",
            },
            {
              icon: Database,
              title: "Persist",
              body: "Immutable observation row with exact integer strings.",
            },
            {
              icon: ExternalLink,
              title: "Anchor",
              body: "The resulting FACT links to the Walrus record and blob.",
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
