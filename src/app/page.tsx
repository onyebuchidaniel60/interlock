import type { Metadata } from "next";
import { ArrowRight, ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = {
  title: "Interlock — verified memory execution gate",
  description:
    "Interlock lets verified Walrus Memory evidence deterministically block a policy-violating agent action. Simulation only; no funds move.",
};

export default function HomePage() {
  return (
    <AuthShell
      eyebrow="Interlock"
      title="Verified memory. Enforced decisions."
      description="A decision audit tool for multi-agent systems. Scout observes, Sentinel verifies Walrus evidence deterministically, and Runner simulates only after a verified final approval."
    >
      <div className="space-y-3">
        <div className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-xs text-muted">
          <ShieldCheck className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
          Walrus-backed evidence · deterministic Sentinel · fail-closed HOLD
        </div>
        <div className="flex flex-wrap gap-2">
          <ButtonLink href="/login">
            Sign in <ArrowRight className="size-3.5" aria-hidden="true" />
          </ButtonLink>
          <ButtonLink href="/setup" variant="secondary">
            Create an account
          </ButtonLink>
        </div>
        <p className="text-[11px] leading-5 text-faint">
          Execution is simulated. No custody, signing, transfers or trades. Workspace access is membership-gated.
        </p>
        <Badge tone="neutral">Production · simulation only</Badge>
      </div>
    </AuthShell>
  );
}
