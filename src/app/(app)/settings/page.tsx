import type { Metadata } from "next";
import { cookies, headers } from "next/headers";
import { Database, KeyRound, MailPlus, ServerCog, ShieldCheck, UsersRound } from "lucide-react";

import { createInviteAction } from "@/app/auth-actions";
import { Badge, PageHeader, PlaceholderPanel, StatusRow } from "@/components/ui";
import { readRuntimeConfig } from "@/lib/config";
import { listPendingInvitations, listWorkspaceMembers, requireWorkspace } from "@/lib/workspace";

export const metadata: Metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

const errorMessages: Record<string, string> = {
  forbidden: "Only the workspace owner can invite members.",
  invite_invalid: "Enter a valid email and role.",
  invite_create: "The invitation could not be created.",
};

function formatDate(value: Date | string | null) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", { dateStyle: "medium", timeStyle: "short", timeZone: "UTC" }).format(
    new Date(value),
  );
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: Promise<{ invited?: string; error?: string }>;
}) {
  const params = await searchParams;
  const { user, workspace } = await requireWorkspace();
  const [members, invitations] = await Promise.all([
    listWorkspaceMembers(user.id, workspace.id),
    listPendingInvitations(user.id, workspace.id),
  ]);

  const cookieStore = await cookies();
  const inviteToken = cookieStore.get("interlock_invite_preview")?.value;
  const headerStore = await headers();
  const proto = headerStore.get("x-forwarded-proto") ?? "http";
  const host = headerStore.get("x-forwarded-host") ?? headerStore.get("host") ?? "localhost:3000";
  const baseUrl = `${proto}://${host}`;
  const inviteUrl = inviteToken ? `${baseUrl}/setup?token=${encodeURIComponent(inviteToken)}` : null;
  const error = params.error ? errorMessages[params.error] : null;
  const config = readRuntimeConfig();

  return (
    <div className="space-y-6">
      <PageHeader
        eyebrow="Operate / Settings"
        title="Workspace settings"
        description="Server-verified membership, roles and provider configuration. Secret values are server-only and never rendered in the browser."
        actions={
          <Badge tone={workspace.role === "OWNER" ? "accent" : "info"} dot>
            {workspace.role}
          </Badge>
        }
      />

      {params.invited && inviteUrl ? (
        <section className="surface border-accent/25 p-5">
          <div className="flex items-center gap-2">
            <MailPlus className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Invitation created</h2>
          </div>
          <p className="mt-2 text-xs leading-5 text-muted">
            Copy this one-time link and send it to the invitee. It expires in 7 days and is shown only in this
            short-lived owner session.
          </p>
          <label className="mt-3 block">
            <span className="sr-only">Invitation link</span>
            <input
              readOnly
              value={inviteUrl}
              className="min-h-10 w-full rounded-lg border border-accent/25 bg-canvas px-3 font-mono text-[11px] text-ink"
            />
          </label>
        </section>
      ) : null}

      {params.invited && !inviteUrl ? (
        <p role="status" className="rounded-lg border border-info/25 bg-info/10 p-3 text-xs text-info">
          Invitation created. The one-time link preview is only available immediately after creation.
        </p>
      ) : null}

      {error ? (
        <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}

      <div className="grid gap-4 lg:grid-cols-2">
        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <UsersRound className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Members</h2>
            <Badge tone="neutral" className="ml-auto">
              {members.length}
            </Badge>
          </div>
          <div className="mt-4 overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="border-b border-line text-[10px] uppercase tracking-[0.14em] text-faint">
                <tr>
                  <th className="pb-2 font-semibold">Member</th>
                  <th className="pb-2 font-semibold">Role</th>
                  <th className="pb-2 font-semibold">Status</th>
                  <th className="pb-2 font-semibold">Joined</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-line">
                {members.map((member) => (
                  <tr key={member.user_id}>
                    <td className="py-3 pr-4">
                      <p className="font-medium text-ink">{member.display_name ?? member.email ?? "Member"}</p>
                      <p className="mt-0.5 font-mono text-[10px] text-faint">{member.email ?? member.user_id}</p>
                    </td>
                    <td className="py-3 pr-4">
                      <Badge tone={member.role === "OWNER" ? "accent" : member.role === "OPERATOR" ? "info" : "neutral"}>
                        {member.role}
                      </Badge>
                    </td>
                    <td className="py-3 pr-4 text-muted">{member.status}</td>
                    <td className="py-3 text-faint">{formatDate(member.accepted_at ?? member.created_at)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <MailPlus className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Invite a member</h2>
          </div>
          {workspace.role === "OWNER" ? (
            <form action={createInviteAction} className="mt-4 space-y-3">
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  autoComplete="email"
                  className="mt-1.5 min-h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none"
                  placeholder="operator@workspace.example"
                />
              </label>
              <label className="block">
                <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">Role</span>
                <select
                  name="role"
                  defaultValue="OBSERVER"
                  className="mt-1.5 min-h-10 w-full rounded-lg border border-line bg-canvas px-3 text-sm text-ink outline-none"
                >
                  <option value="OBSERVER">Observer — read only</option>
                  <option value="OPERATOR">Operator — observations, plans, simulations</option>
                </select>
              </label>
              <button
                type="submit"
                className="inline-flex min-h-9 items-center justify-center rounded-lg border border-accent/70 bg-accent px-4 py-2 text-xs font-bold text-[#04120c] hover:bg-emerald-300"
              >
                Create one-time invite link
              </button>
            </form>
          ) : (
            <p className="mt-2 text-xs leading-5 text-muted">Only the workspace owner can invite members.</p>
          )}

          {invitations.length ? (
            <div className="mt-5 border-t border-line pt-4">
              <p className="text-[10px] font-semibold uppercase tracking-[0.14em] text-faint">Pending invitations</p>
              <ul className="mt-2 space-y-2">
                {invitations.map((invite) => (
                  <li key={invite.id} className="flex items-center justify-between gap-3 rounded-lg border border-line bg-white/[0.02] px-3 py-2">
                    <span className="truncate font-mono text-[10px] text-muted">{invite.email}</span>
                    <Badge tone="warn">{invite.role}</Badge>
                  </li>
                ))}
              </ul>
            </div>
          ) : null}
        </section>

        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <ServerCog className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Runtime guard</h2>
          </div>
          <div className="mt-3">
            <StatusRow label="Environment" value={config.INTERLOCK_ENVIRONMENT} tone="info" />
            <StatusRow label="Execution mode" value={config.INTERLOCK_EXECUTION_MODE} tone="accent" />
            <StatusRow
              label="Demo baseline"
              value={config.INTERLOCK_DEMO_BASELINE_ENABLED ? "Enabled in preview" : "Disabled"}
              tone={config.INTERLOCK_DEMO_BASELINE_ENABLED ? "warn" : "neutral"}
              detail="Production startup fails if the baseline is enabled."
            />
          </div>
        </section>

        <section className="surface p-5">
          <div className="flex items-center gap-2">
            <ShieldCheck className="size-4 text-accent" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Verification providers</h2>
          </div>
          <div className="mt-3">
            <StatusRow label="Neon Postgres" value="Connected" tone="accent" detail="Application role app_user; migrations use a separate owner role." />
            <StatusRow label="Managed Better Auth" value="Connected" tone="accent" detail="Server-verified sessions; invite-only workspace access." />
            <StatusRow label="Row-level security" value="Enforced" tone="accent" detail="Plain PostgreSQL policies; auth.uid() is not used." />
            <StatusRow label="Walrus Memory" value="Adapter pending" tone="accent" detail="Phase 3." />
            <StatusRow label="Tatum Sui gRPC" value="Adapter pending" tone="accent" detail="Phase 3." />
            <StatusRow label="Groq Analyst" value="Phase 3" tone="neutral" detail="No policy authority." />
          </div>
        </section>

        <section className="surface p-5 lg:col-span-2">
          <div className="flex items-center gap-2">
            <KeyRound className="size-4 text-warn" aria-hidden="true" />
            <h2 className="text-sm font-semibold text-ink">Security boundary</h2>
          </div>
          <div className="mt-3 grid gap-3 md:grid-cols-3">
            {[
              { icon: Database, title: "RLS context", body: "Request-scoped app.user_id; missing context denies." },
              { icon: ShieldCheck, title: "Server role", body: "Application queries run as app_user with NOBYPASSRLS." },
              { icon: KeyRound, title: "Secrets", body: "Credentials stay in server-only environment variables." },
            ].map((item) => {
              const Icon = item.icon;
              return (
                <div key={item.title} className="rounded-xl border border-line bg-white/[0.02] p-4">
                  <Icon className="size-4 text-muted" aria-hidden="true" />
                  <p className="mt-2 text-xs font-semibold text-ink">{item.title}</p>
                  <p className="mt-1 text-[11px] leading-5 text-faint">{item.body}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <PlaceholderPanel
        phase="Phase 3"
        title="Provider adapters are not active"
        description="Walrus, Tatum and Groq integrations land in Phase 3. Settings will show verified readiness, not just configured names."
      />
    </div>
  );
}
