import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/server";
import { getWorkspaceForUser, type WorkspaceRole } from "@/lib/workspace";

export type ApiActor = { userId: string; workspaceId: string; role: WorkspaceRole };

export function apiError(code: string, message: string, status = 400) {
  return NextResponse.json({ error: { code, message } }, { status, headers: { "Cache-Control": "no-store" } });
}

export function sameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;
  try {
    return new URL(origin).host === request.headers.get("host");
  } catch {
    return false;
  }
}

export async function requireApiActor(): Promise<
  { actor: ApiActor; response?: never } | { actor?: never; response: NextResponse }
> {
  const user = await getSessionUser();
  if (!user?.id) return { response: apiError("UNAUTHENTICATED", "Sign in is required.", 401) };
  const workspace = await getWorkspaceForUser(user.id);
  if (!workspace) return { response: apiError("NO_WORKSPACE", "Workspace membership is required.", 403) };
  return { actor: { userId: user.id, workspaceId: workspace.id, role: workspace.role } };
}
