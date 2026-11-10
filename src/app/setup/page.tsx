import type { Metadata } from "next";
import { ArrowRight, UsersRound } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Workspace setup" };

export default function SetupPage() {
  return (
    <AuthShell
      eyebrow="Workspace"
      title="Accept an invite"
      description="Invite-only workspace access is implemented with Neon Managed Better Auth and server-verified membership in Phase 2."
    >
      <div className="rounded-xl border border-info/25 bg-info/5 p-4">
        <div className="flex items-center gap-2">
          <UsersRound className="size-4 text-info" aria-hidden="true" />
          <Badge tone="info">Phase 2</Badge>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">
          Invite acceptance, duplicate handling and role assignment are not active in this shell. No
          workspace is created by visiting this route.
        </p>
      </div>

      <ButtonLink href="/dashboard" variant="secondary">
        Continue to preview shell
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </ButtonLink>

      <p className="mt-4 text-[11px] leading-5 text-faint">
        Workspace context will come from verified server membership, never from a client-supplied
        role or workspace ID.
      </p>
    </AuthShell>
  );
}
