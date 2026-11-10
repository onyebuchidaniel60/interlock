import type { Metadata } from "next";
import { ArrowLeft, Calculator, FileText, Hash, ShieldAlert } from "lucide-react";

import { Badge, ButtonLink, PageHeader, PlaceholderPanel } from "@/components/ui";

export const metadata: Metadata = { title: "New plan" };

const plannedFields = [
  { label: "Action type", note: "Simulated action category; no real execution endpoint exists." },
  { label: "Amount", note: "Positive atomic integer in MIST, never a floating-point value." },
  {
    label: "Exposure",
    note: "Integer basis points compared against the verified balance snapshot.",
  },
  { label: "Observation", note: "Freshness-bound reference to the Scout observation." },
  { label: "Scope", note: "Workspace and wallet scope used for deterministic policy candidates." },
  { label: "Rationale", note: "Human-entered context; Analyst may only draft explanatory text." },
];

export default function NewPlanPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operate / Plans"
        title="Create a plan"
        description="The plan form is not active in the Phase 1 shell. This page documents the exact input contract so no inert form pretends to create a plan."
        actions={
          <>
            <Badge tone="warn" dot>
              Form pending
            </Badge>
            <ButtonLink href="/plans" variant="secondary">
              <ArrowLeft className="size-3.5" aria-hidden="true" />
              Back to plans
            </ButtonLink>
          </>
        }
      />

      <div className="grid gap-4 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)]">
        <PlaceholderPanel
          phase="Phase 4"
          title="Planned inputs"
          description="These fields will be validated with Zod, persisted immutably and hashed into the canonical plan before any policy check."
        >
          <div className="grid gap-3 sm:grid-cols-2">
            {plannedFields.map((field) => (
              <div key={field.label} className="rounded-xl border border-line bg-white/[0.02] p-4">
                <p className="text-xs font-semibold text-ink">{field.label}</p>
                <p className="mt-1 text-[11px] leading-5 text-faint">{field.note}</p>
              </div>
            ))}
          </div>
        </PlaceholderPanel>

        <div className="space-y-4">
          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <Hash className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Immutable identity</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Every decision-relevant field changes the canonical plan hash. A previous decision or
              Runner clearance becomes invalid when the hash changes.
            </p>
          </div>
          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <Calculator className="size-4 text-accent" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Integer arithmetic</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              MIST and basis points use integer strings/BigInt. No floating-point math participates
              in a policy comparison.
            </p>
          </div>
          <div className="surface p-5">
            <div className="flex items-center gap-2">
              <ShieldAlert className="size-4 text-warn" aria-hidden="true" />
              <h2 className="text-sm font-semibold text-ink">Fail-closed</h2>
            </div>
            <p className="mt-2 text-xs leading-5 text-muted">
              Missing policy, stale observation, incomplete recall or unresolved conflict returns
              HOLD. The UI cannot override a verdict.
            </p>
          </div>
        </div>
      </div>

      <div className="surface flex items-start gap-3 p-4">
        <FileText className="mt-0.5 size-4 shrink-0 text-muted" aria-hidden="true" />
        <p className="text-xs leading-5 text-faint">
          No submit control is rendered here because the server endpoint, authentication and
          database transaction are not implemented yet. A disabled button would be a dead control.
        </p>
      </div>
    </div>
  );
}
