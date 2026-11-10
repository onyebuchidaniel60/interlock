import type { Metadata } from "next";
import { Database, KeyRound, ServerCog, ShieldCheck } from "lucide-react";

import { Badge, PageHeader, PlaceholderPanel, StatusRow } from "@/components/ui";
import { readRuntimeConfig } from "@/lib/config";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  const config = readRuntimeConfig();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operate / Settings"
        title="Workspace settings"
        description="Read-only preview configuration. Secret values are server-only and are never rendered in the browser; authentication and editable workspace settings arrive in Phase 2."
        actions={
          <Badge tone="info" dot>
            Read-only
          </Badge>
        }
      />

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <ServerCog className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Runtime guard</h2>
          </div>
          <div className="mt-3">
            <StatusRow label="Environment" value={config.INTERLOCK_ENVIRONMENT} tone="info" />
            <StatusRow
              label="Execution mode"
              value={config.INTERLOCK_EXECUTION_MODE}
              tone="accent"
            />
            <StatusRow
              label="Demo baseline"
              value={config.INTERLOCK_DEMO_BASELINE_ENABLED ? "Enabled in preview" : "Disabled"}
              tone={config.INTERLOCK_DEMO_BASELINE_ENABLED ? "warn" : "neutral"}
              detail="Production startup fails if the baseline is enabled."
            />
          </div>
          <p className="mt-4 rounded-lg border border-line bg-white/[0.02] p-3 text-[11px] leading-5 text-faint">
            Missing or invalid configuration fails closed. The application cannot start in a
            non-simulation execution mode.
          </p>
        </section>

        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <Database className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Data and auth providers</h2>
          </div>
          <div className="mt-3">
            <StatusRow
              label="Neon Postgres"
              value="Phase 2"
              tone="neutral"
              detail="Application role app_user; migrations use a separate owner role."
            />
            <StatusRow
              label="Managed Better Auth"
              value="Phase 2"
              tone="neutral"
              detail="Invite-only workspace access; no public self-service sign-up."
            />
            <StatusRow
              label="Row-level security"
              value="Planned"
              tone="neutral"
              detail="Plain PostgreSQL policies; auth.uid() is not available."
            />
            <StatusRow
              label="Audit trail"
              value="Planned"
              tone="neutral"
              detail="Append-only application events."
            />
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Verification providers</h2>
          </div>
          <div className="mt-3">
            <StatusRow
              label="Walrus Memory"
              value="Adapter pending"
              tone="accent"
              detail="Namespace interlock · mainnet relayer · Phase 0 signed write/read passed."
            />
            <StatusRow
              label="Tatum Sui gRPC"
              value="Adapter pending"
              tone="accent"
              detail="StateService.GetBalance · mainnet · public address only."
            />
            <StatusRow
              label="Groq Analyst"
              value="Phase 3"
              tone="neutral"
              detail="No policy authority; strict structured output only."
            />
            <StatusRow
              label="Runner"
              value="Simulation only"
              tone="accent"
              detail="No custody, signing, transfers or trades."
            />
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-warn" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Secrets policy</h2>
          </div>
          <ul className="mt-3 space-y-2 text-xs leading-5 text-muted">
            <li>All provider credentials are server-side environment variables.</li>
            <li>
              No secret is prefixed with{" "}
              <code className="font-mono text-[11px] text-ink">NEXT_PUBLIC_</code>.
            </li>
            <li>Logs and error responses redact tokens, auth headers and private identifiers.</li>
            <li>The preview never connects to production secrets or customer data.</li>
          </ul>
        </section>
      </div>

      <PlaceholderPanel
        phase="Phase 2"
        title="Editable settings are not active"
        description="Workspace membership, roles, invite acceptance and provider readiness will be server-verified. Client-supplied workspace IDs or roles are never trusted."
      />
    </div>
  );
}
