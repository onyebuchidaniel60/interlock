import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";
import { ArrowRight, Building2, CheckCircle2, ShieldAlert } from "lucide-react";

import { acceptInviteAction, createWorkspaceAction, getInvitationForToken } from "@/app/auth-actions";
import { AuthShell } from "@/components/auth-shell";
import { SignUpForm } from "@/components/auth-forms";
import { Badge } from "@/components/ui";
import { getSessionUser } from "@/lib/auth/server";
import { isInvitationActive } from "@/lib/invitations";
import { getWorkspaceForUser } from "@/lib/workspace";

export const metadata: Metadata = { title: "Workspace setup" };
export const dynamic = "force-dynamic";

const errors: Record<string, string> = {
  invalid: "Check the form fields and try again.",
  signup: "Account creation failed. The email may already be registered, or email verification may be required.",
  workspace_invalid: "Enter a workspace name and a lowercase slug.",
  workspace_create: "The workspace could not be created. Try again.",
  slug_taken: "That workspace slug is already in use.",
  invite: "This invitation is invalid, expired or already accepted.",
  invite_invalid: "Enter a valid invitation email.",
  invite_create: "The invitation could not be created.",
  forbidden: "Only the workspace owner can invite members.",
};

function first(value: string | string[] | undefined) {
  return Array.isArray(value) ? value[0] : value;
}

export default async function SetupPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string; error?: string }>;
}) {
  const params = await searchParams;
  const token = first(params.token);
  const invitation = token ? await getInvitationForToken(token) : null;
  const user = await getSessionUser();

  if (user) {
    const workspace = await getWorkspaceForUser(user.id);
    if (workspace) redirect("/dashboard");
  }

  const inviteValid = Boolean(
    invitation && isInvitationActive(invitation.expires_at, invitation.accepted_at),
  );
  const emailMatches = Boolean(user && invitation && invitation.email.toLowerCase() === user.email?.toLowerCase());
  const error = params.error ? errors[params.error] : null;
  const loginHref = token ? `/login?next=${encodeURIComponent(`/setup?token=${token}`)}` : "/login";

  const title = user
    ? inviteValid
      ? "Join workspace"
      : "Create a workspace"
    : inviteValid
      ? "Accept invitation"
      : "Create your account";

  const description = user
    ? inviteValid
      ? `You are signed in as ${user.email}. Accept the invitation to join ${invitation?.workspace_name}.`
      : "Create the workspace you will own. You can invite operators and observers afterward."
    : inviteValid
      ? `Create an account with ${invitation?.email} to join ${invitation?.workspace_name}, or sign in if you already have one.`
      : "Create an account, then create or join a workspace. Workspace access is membership-gated.";

  return (
    <AuthShell eyebrow="Workspace access" title={title} description={description}>
      {error ? (
        <p role="alert" className="mb-4 rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      {token && !invitation ? (
        <p role="alert" className="mb-4 rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          This invitation link is not recognized. Ask the workspace owner for a new link.
        </p>
      ) : null}

      {invitation && !inviteValid ? (
        <p role="alert" className="mb-4 rounded-lg border border-warn/25 bg-warn/10 p-3 text-xs text-warn">
          This invitation has expired or has already been accepted.
        </p>
      ) : null}

      {!user ? (
        <div className="space-y-4">
          {invitation && inviteValid ? (
            <div className="rounded-lg border border-info/25 bg-info/5 p-3 text-xs leading-5 text-muted">
              <div className="flex items-center gap-2">
                <Building2 className="size-3.5 text-info" aria-hidden="true" />
                <span className="font-semibold text-ink">{invitation.workspace_name}</span>
                <Badge tone="info">{invitation.role}</Badge>
              </div>
              <p className="mt-1.5">
                Invitation for <span className="font-mono text-ink">{invitation.email}</span>. Sign up with that email.
              </p>
            </div>
          ) : null}
          <SignUpForm token={token} defaultEmail={invitation?.email} />
        </div>
      ) : inviteValid && emailMatches ? (
        <form action={acceptInviteAction} className="space-y-4">
          <input type="hidden" name="token" value={token} />
          <div className="rounded-lg border border-accent/25 bg-accent/5 p-3 text-xs leading-5 text-muted">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="size-3.5 text-accent" aria-hidden="true" />
              <span className="font-semibold text-ink">Invitation ready</span>
            </div>
            <p className="mt-1.5">
              You will join as <span className="font-semibold text-ink">{invitation?.role}</span> using{" "}
              <span className="font-mono text-ink">{invitation?.email}</span>.
            </p>
          </div>
          <button
            type="submit"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-accent/70 bg-accent px-4 py-2 text-xs font-bold text-[#04120c] transition-colors hover:bg-emerald-300"
          >
            Accept invitation
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </form>
      ) : user && inviteValid && !emailMatches ? (
        <div className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs leading-5 text-danger">
          <div className="flex items-center gap-2">
            <ShieldAlert className="size-3.5" aria-hidden="true" />
            <span className="font-semibold">Email mismatch</span>
          </div>
          <p className="mt-1.5">
            This invitation is for {invitation?.email}, but you are signed in as {user.email}. Sign out and use the
            invited account.
          </p>
          <Link href="/login" className="mt-2 inline-block font-semibold underline">
            Sign in with another account
          </Link>
        </div>
      ) : (
        <form action={createWorkspaceAction} className="space-y-4">
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Workspace name</span>
            <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-canvas px-3">
              <Building2 className="size-3.5 text-faint" aria-hidden="true" />
              <input
                name="name"
                type="text"
                required
                maxLength={120}
                className="min-h-10 w-full bg-transparent text-sm text-ink outline-none"
                placeholder="Interlock demo workspace"
              />
            </div>
          </label>
          <label className="block">
            <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Workspace slug</span>
            <input
              name="slug"
              type="text"
              required
              minLength={2}
              maxLength={60}
              pattern="[a-z0-9]+(?:-[a-z0-9]+)*"
              className="mt-1.5 min-h-10 w-full rounded-lg border border-line bg-canvas px-3 font-mono text-sm text-ink outline-none"
              placeholder="interlock-demo"
            />
            <span className="mt-1 block text-[10px] text-faint">Lowercase letters, numbers and hyphens. Used in workspace references.</span>
          </label>
          <button
            type="submit"
            className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-accent/70 bg-accent px-4 py-2 text-xs font-bold text-[#04120c] transition-colors hover:bg-emerald-300"
          >
            Create workspace
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </button>
        </form>
      )}

      <div className="mt-5 flex flex-wrap items-center justify-between gap-3 text-[11px]">
        {user ? (
          <Link href="/dashboard" className="text-muted hover:text-ink">
            Back to console
          </Link>
        ) : (
          <Link href={loginHref} className="text-muted hover:text-ink">
            Already have an account? Sign in
          </Link>
        )}
        <span className="inline-flex items-center gap-1.5 text-faint">
          <CheckCircle2 className="size-3.5 text-accent" aria-hidden="true" />
          Server-verified membership
        </span>
      </div>
    </AuthShell>
  );
}
