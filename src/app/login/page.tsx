import type { Metadata } from "next";
import { ArrowRight, LockKeyhole } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { Badge, ButtonLink } from "@/components/ui";

export const metadata: Metadata = { title: "Sign in" };

export default function LoginPage() {
  return (
    <AuthShell
      eyebrow="Preview access"
      title="Sign in"
      description="Application authentication is not wired in the Phase 1 shell. The preview is protected by Vercel Authentication; Neon Managed Better Auth arrives in Phase 2."
    >
      <div className="rounded-xl border border-warn/25 bg-warn/5 p-4">
        <div className="flex items-center gap-2">
          <LockKeyhole className="size-4 text-warn" aria-hidden="true" />
          <Badge tone="warn">Phase 2</Badge>
        </div>
        <p className="mt-2 text-xs leading-5 text-muted">
          No credential form is rendered yet. A non-functional sign-in form would be a dead control.
        </p>
      </div>

      <ButtonLink href="/dashboard" variant="primary">
        Enter preview shell
        <ArrowRight className="size-3.5" aria-hidden="true" />
      </ButtonLink>

      <p className="mt-4 text-[11px] leading-5 text-faint">
        The preview contains only synthetic/demo content and public wallet data. It is not connected
        to production secrets.
      </p>
    </AuthShell>
  );
}
