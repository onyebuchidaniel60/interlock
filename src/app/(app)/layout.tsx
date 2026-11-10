import type { ReactNode } from "react";

import { AppShell } from "@/components/app-shell";
import { readRuntimeConfig } from "@/lib/config";

export default function AppLayout({ children }: { children: ReactNode }) {
  readRuntimeConfig();
  return <AppShell>{children}</AppShell>;
}
