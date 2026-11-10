import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { readRuntimeConfig } from "@/lib/config";
import { requireWorkspace } from "@/lib/workspace";

export const dynamic = "force-dynamic";

export default async function AppLayout({ children }: { children: ReactNode }) {
  readRuntimeConfig();
  const { user, workspace } = await requireWorkspace();
  return (
    <AppShell
      workspaceName={workspace.name}
      workspaceRole={workspace.role}
      userName={user.name ?? user.email}
      userEmail={user.email}
    >
      {children}
    </AppShell>
  );
}
