import { NextResponse } from "next/server";

import { getSessionUser } from "@/lib/auth/server";
import { withUser } from "@/lib/db";
import { getWorkspaceForUser } from "@/lib/workspace";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

export async function GET() {
  const user = await getSessionUser();
  if (!user?.id) {
    return NextResponse.json({ status: "unauthenticated" }, { status: 401, headers: { "Cache-Control": "no-store" } });
  }

  const workspace = await getWorkspaceForUser(user.id);
  if (!workspace) {
    return NextResponse.json({ status: "no_workspace" }, { status: 403, headers: { "Cache-Control": "no-store" } });
  }

  try {
    const database = await withUser(user.id, async (client) => {
      const result = await client.query<{ current_user: string }>("select current_user");
      return result.rows[0]?.current_user === "app_user";
    });

    return NextResponse.json(
      {
        status: "ok",
        phase: "2",
        auth: "session_verified",
        database: database ? "app_user_rls" : "role_mismatch",
        workspace: "verified_membership",
      },
      { headers: { "Cache-Control": "no-store" } },
    );
  } catch {
    return NextResponse.json(
      { status: "degraded", auth: "session_verified", database: "unavailable" },
      { status: 503, headers: { "Cache-Control": "no-store" } },
    );
  }
}
