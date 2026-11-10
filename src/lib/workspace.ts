import { redirect } from "next/navigation";

import { getSessionUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db";

export type WorkspaceRole = "OWNER" | "OPERATOR" | "OBSERVER";

export type WorkspaceContext = {
  id: string;
  name: string;
  slug: string;
  status: string;
  role: WorkspaceRole;
  memberEmail: string | null;
  memberName: string | null;
};

export type SessionUser = {
  id: string;
  email: string;
  name: string | null;
};

export async function requireUser(): Promise<SessionUser> {
  const user = await getSessionUser();
  if (!user?.id || !user.email) {
    redirect("/login");
  }
  return { id: user.id, email: user.email, name: user.name ?? null };
}

export async function getWorkspaceForUser(userId: string): Promise<WorkspaceContext | null> {
  return withUser(userId, async (client) => {
    const result = await client.query<{
      id: string;
      name: string;
      slug: string;
      status: string;
      role: WorkspaceRole;
      member_email: string | null;
      member_name: string | null;
    }>(
      `select w.id, w.name, w.slug, w.status, m.role, m.email as member_email, m.display_name as member_name
       from public.workspace_members m
       join public.workspaces w on w.id = m.workspace_id
       where m.user_id = $1 and m.status = 'ACTIVE' and w.status = 'ACTIVE'
       limit 1`,
      [userId],
    );

    const row = result.rows[0];
    if (!row) return null;
    return {
      id: row.id,
      name: row.name,
      slug: row.slug,
      status: row.status,
      role: row.role,
      memberEmail: row.member_email,
      memberName: row.member_name,
    };
  });
}

export async function requireWorkspace(): Promise<{ user: SessionUser; workspace: WorkspaceContext }> {
  const user = await requireUser();
  const workspace = await getWorkspaceForUser(user.id);
  if (!workspace) {
    redirect("/setup");
  }
  return { user, workspace };
}

export async function listWorkspaceMembers(userId: string, workspaceId: string) {
  return withUser(userId, async (client) => {
    const result = await client.query<{
      user_id: string;
      role: WorkspaceRole;
      status: string;
      email: string | null;
      display_name: string | null;
      created_at: Date;
      accepted_at: Date | null;
    }>(
      `select user_id, role, status, email, display_name, created_at, accepted_at
       from public.workspace_members
       where workspace_id = $1
       order by case role when 'OWNER' then 0 when 'OPERATOR' then 1 else 2 end, created_at`,
      [workspaceId],
    );
    return result.rows;
  });
}

export async function listPendingInvitations(userId: string, workspaceId: string) {
  return withUser(userId, async (client) => {
    const result = await client.query<{
      id: string;
      email: string;
      role: string;
      expires_at: Date;
      created_at: Date;
    }>(
      `select id, email, role, expires_at, created_at
       from public.workspace_invitations
       where workspace_id = $1 and accepted_at is null and expires_at > now()
       order by created_at desc
       limit 20`,
      [workspaceId],
    );
    return result.rows;
  });
}
