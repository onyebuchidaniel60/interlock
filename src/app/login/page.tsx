import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ShieldCheck } from "lucide-react";

import { AuthShell } from "@/components/auth-shell";
import { SignInForm } from "@/components/auth-forms";
import { Badge } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/server";
import { getWorkspaceForUser } from "@/lib/workspace";

export const metadata: Metadata = { title: "Sign in" };
export const dynamic = "force-dynamic";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string; created?: string; next?: string }>;
}) {
  const params = await searchParams;
  const next = params.next?.startsWith("/") && !params.next.startsWith("//") ? params.next : "/dashboard";
  const user = await getSessionUser();
  if (user) {
    const workspace = await getWorkspaceForUser(user.id);
    redirect(workspace ? next : next.startsWith("/setup") ? next : "/setup");
  }

  const signupHref = next.startsWith("/setup") ? next : "/setup";

  return (
    <AuthShell
      eyebrow="Preview access"
      title="Sign in"
      description="Use your workspace account. This preview is also protected by Vercel Authentication."
    >
      {params.created ? (
        <p role="status" className="mb-4 rounded-lg border border-accent/25 bg-accent/10 p-3 text-xs text-accent">
          Account created. Sign in to continue.
        </p>
      ) : null}
      {params.error ? (
        <p role="alert" className="mb-4 rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {params.error === "session" ? "Your session could not be established. Try again." : "Sign-in failed. Try again."}
        </p>
      ) : null}

      <SignInForm next={next} />

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[11px]">
        <Link href={signupHref} className="text-muted hover:text-ink">
          Need an account? Create one
        </Link>
        <span className="inline-flex items-center gap-1.5 text-faint">
          <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
          Invite-only workspace access
        </span>
      </div>

      <p className="mt-5 border-t border-line pt-4 text-[11px] leading-5 text-faint">
        <Badge tone="accent">Verified session</Badge> Sessions are managed by Neon. Workspace data is protected by
        PostgreSQL RLS and a dedicated <code className="font-mono text-ink">app_user</code> role.
      </p>
    </AuthShell>
  );
}
