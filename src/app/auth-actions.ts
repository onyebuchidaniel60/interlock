"use server";

import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";

import { getSessionUser } from "@/lib/auth/server";
import { queryAsApp, withUser } from "@/lib/db";
import { createInviteToken, hashInviteToken, isInviteToken } from "@/lib/invitations";
import { requireUser, requireWorkspace } from "@/lib/workspace";

const emailSchema = z.string().trim().toLowerCase().email().max(254);
const nameSchema = z.string().trim().min(1).max(80);
const slugSchema = z
  .string()
  .trim()
  .toLowerCase()
  .min(2)
  .max(60)
  .regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/, "Use lowercase letters, numbers and hyphens.");
const roleSchema = z.enum(["OPERATOR", "OBSERVER"]);

function go(path: string, params?: Record<string, string>): never {
  if (!params) redirect(path);
  redirect(`${path}?${new URLSearchParams(params).toString()}`);
}

function tokenParam(formData: FormData) {
  const value = formData.get("token");
  return isInviteToken(value) ? value : undefined;
}

export async function createWorkspaceAction(formData: FormData) {
  const user = await requireUser();
  const parsed = z
    .object({ name: nameSchema.max(120), slug: slugSchema })
    .safeParse({
      name: String(formData.get("name") ?? ""),
      slug: String(formData.get("slug") ?? ""),
    });

  if (!parsed.success) {
    go("/setup", { error: "workspace_invalid" });
  }

  try {
    await withUser(user.id, async (client) => {
      const result = await client.query<{ id: string }>(
        "select public.app_create_workspace($1, $2, $3) as id",
        [parsed.data.name, parsed.data.slug, user.id],
      );
      const workspaceId = result.rows[0]?.id;
      if (!workspaceId) throw new Error("workspace_creation_failed");
      await client.query(
        "update public.workspace_members set email = $1, display_name = $2 where workspace_id = $3 and user_id = $4",
        [user.email, user.name, workspaceId, user.id],
      );
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("workspace_exists")) go("/dashboard");
    if (message.includes("duplicate key")) go("/setup", { error: "slug_taken" });
    go("/setup", { error: "workspace_create" });
  }

  redirect("/dashboard");
}

export async function acceptInviteAction(formData: FormData) {
  const token = tokenParam(formData);
  if (!token) go("/setup", { error: "invite" });

  const user = await getSessionUser();
  if (!user) {
    go("/login", { next: `/setup?token=${encodeURIComponent(token)}` });
  }

  try {
    await withUser(user.id, async (client) => {
      await client.query("select * from public.app_accept_invitation($1, $2, $3)", [
        hashInviteToken(token),
        user.id,
        user.email,
      ]);
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "";
    if (message.includes("already_member")) redirect("/dashboard");
    go("/setup", { error: "invite", token });
  }

  redirect("/dashboard");
}

export async function createInviteAction(formData: FormData) {
  const { user, workspace } = await requireWorkspace();
  if (workspace.role !== "OWNER") {
    go("/settings", { error: "forbidden" });
  }

  const parsed = z
    .object({ email: emailSchema, role: roleSchema.default("OBSERVER") })
    .safeParse({
      email: String(formData.get("email") ?? ""),
      role: String(formData.get("role") ?? "OBSERVER"),
    });

  if (!parsed.success) {
    go("/settings", { error: "invite_invalid" });
  }

  const token = createInviteToken();
  const tokenHash = hashInviteToken(token);

  try {
    await withUser(user.id, async (client) => {
      await client.query(
        `insert into public.workspace_invitations
          (workspace_id, email, role, token_hash, expires_at, created_by)
         values ($1, $2, $3, $4, now() + interval '7 days', $5)`,
        [workspace.id, parsed.data.email, parsed.data.role, tokenHash, user.id],
      );
    });
  } catch {
    go("/settings", { error: "invite_create" });
  }

  const cookieStore = await cookies();
  cookieStore.set("interlock_invite_preview", token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/settings",
    maxAge: 300,
  });

  go("/settings", { invited: "1" });
}

export async function getInvitationForToken(token: string) {
  if (!isInviteToken(token)) return null;
  const result = await queryAsApp<{
    workspace_id: string;
    workspace_name: string;
    email: string;
    role: string;
    expires_at: Date;
    accepted_at: Date | null;
  }>("select * from public.app_get_invitation($1)", [hashInviteToken(token)]);
  return result.rows[0] ?? null;
}
