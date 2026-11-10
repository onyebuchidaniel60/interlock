import type { Metadata } from "next";
import { Activity, BrainCircuit, GitBranch, Radar, ShieldCheck, WalletCards } from "lucide-react";

import { AgentCard, Badge, PageHeader, PlaceholderPanel } from "@/components/ui";

export const metadata: Metadata = { title: "Agents" };

export default function AgentsPage() {
  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Monitor / Agents"
        title="Agent modules"
        description="Four logical capabilities inside one application. None is a separate microservice, and none can bypass the deterministic Sentinel or the simulation-only Runner."
        actions={
          <Badge tone="neutral" dot>
            Not wired
          </Badge>
        }
      />

      <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <AgentCard
          name="Scout"
          role="Observation"
          icon={Radar}
          description="Reads the allowlisted Sui mainnet balance, writes a typed FACT to Walrus, then verifies recall before activation."
        />
        <AgentCard
          name="Analyst"
          role="Explanation only"
          icon={BrainCircuit}
          description="May draft a schema-constrained explanation through Groq. It cannot set numeric fields, invoke tools or issue a verdict."
        />
        <AgentCard
          name="Sentinel"
          role="Deterministic gate"
          icon={ShieldCheck}
          description="Enumerates applicable evidence, verifies recalled content and returns APPROVE, REJECT or HOLD without an LLM decision."
        />
        <AgentCard
          name="Runner"
          role="Simulation only"
          icon={WalletCards}
          description="Accepts only a signed, short-lived, single-use clearance for a final APPROVE. It never signs or submits a transaction."
        />
      </div>

      <section className="surface p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <h2 className="text-sm font-semibold text-ink">Decision path</h2>
          <Badge tone="info">Phase 1 structure</Badge>
        </div>
        <div className="mt-5 grid gap-3 md:grid-cols-4">
          {[
            { icon: Activity, label: "Observe", detail: "Public chain read" },
            { icon: GitBranch, label: "Recall", detail: "Verified Walrus evidence" },
            { icon: ShieldCheck, label: "Decide", detail: "Deterministic rules" },
            { icon: WalletCards, label: "Simulate", detail: "Signed clearance only" },
          ].map((item, index) => {
            const Icon = item.icon;
            return (
              <div
                key={item.label}
                className="relative rounded-xl border border-line bg-white/[0.02] p-4"
              >
                <p className="font-mono text-[10px] text-faint">0{index + 1}</p>
                <Icon className="mt-3 size-4 text-accent" aria-hidden="true" />
                <p className="mt-2 text-xs font-semibold text-ink">{item.label}</p>
                <p className="mt-1 text-[11px] leading-5 text-faint">{item.detail}</p>
              </div>
            );
          })}
        </div>
      </section>

      <PlaceholderPanel
        phase="Phase 3–5"
        title="Agent runtime is not active"
        description="Each module gets a server-side capability and a scoped Walrus delegate identity where available. The application must not expose a privileged agent route to the browser."
      />
    </div>
  );
}
