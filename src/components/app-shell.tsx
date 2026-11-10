"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import {
  Activity,
  ArrowUpRight,
  BookOpen,
  Brain,
  ClipboardList,
  FileSearch,
  Gauge,
  GitBranch,
  LayoutDashboard,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  UserRound,
  WalletCards,
  X,
  type LucideIcon,
} from "lucide-react";
import { useEffect, useState, type ReactNode } from "react";

import { authClient } from "@/lib/auth/client";
import { Badge } from "@/components/ui";
import { cn } from "@/lib/utils";

type NavItem = {
  href: string;
  label: string;
  icon: LucideIcon;
};

type NavGroup = {
  label: string;
  items: NavItem[];
};

const navGroups: NavGroup[] = [
  {
    label: "Monitor",
    items: [
      { href: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
      { href: "/observations", label: "Observations", icon: Activity },
      { href: "/agents", label: "Agents", icon: GitBranch },
    ],
  },
  {
    label: "Memory",
    items: [
      { href: "/memory", label: "Memory ledger", icon: Brain },
      { href: "/audit", label: "Audit trail", icon: ClipboardList },
    ],
  },
  {
    label: "Operate",
    items: [
      { href: "/plans", label: "Plans", icon: WalletCards },
      { href: "/demo", label: "Demo compare", icon: FileSearch },
      { href: "/settings", label: "Settings", icon: Settings },
    ],
  },
];

function isActive(pathname: string, href: string) {
  return pathname === href || pathname.startsWith(`${href}/`);
}

function BrandMark() {
  return (
    <span className="relative grid size-8 place-items-center rounded-lg border border-accent/30 bg-accent/10 text-accent">
      <svg viewBox="0 0 24 24" className="size-4" fill="none" aria-hidden="true">
        <path
          d="M8.2 7.4h3.3a4.6 4.6 0 1 1 0 9.2H9.7a4.6 4.6 0 0 1-4.5-3.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
        />
        <path
          d="M15.8 16.6h-3.3a4.6 4.6 0 1 1 0-9.2h1.8a4.6 4.6 0 0 1 4.5 3.8"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          opacity=".55"
        />
      </svg>
    </span>
  );
}

function Navigation({ pathname, onNavigate }: { pathname: string; onNavigate?: () => void }) {
  return (
    <nav
      aria-label="Primary navigation"
      className="flex flex-1 flex-col gap-7 overflow-y-auto px-3 py-5 scrollbar-thin"
    >
      {navGroups.map((group) => (
        <div key={group.label}>
          <p className="px-3 text-[10px] font-semibold uppercase tracking-[0.2em] text-faint">
            {group.label}
          </p>
          <ul className="mt-2 space-y-1">
            {group.items.map((item) => {
              const active = isActive(pathname, item.href);
              const Icon = item.icon;
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    onClick={onNavigate}
                    aria-current={active ? "page" : undefined}
                    className={cn(
                      "group flex min-h-9 items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-medium transition-colors",
                      active
                        ? "bg-white/[0.07] text-ink"
                        : "text-muted hover:bg-white/[0.035] hover:text-ink",
                    )}
                  >
                    <Icon
                      className={cn(
                        "size-4 shrink-0",
                        active ? "text-accent" : "text-faint group-hover:text-muted",
                      )}
                      aria-hidden="true"
                    />
                    <span>{item.label}</span>
                    {active ? (
                      <span
                        className="ml-auto size-1.5 rounded-full bg-accent"
                        aria-hidden="true"
                      />
                    ) : null}
                  </Link>
                </li>
              );
            })}
          </ul>
        </div>
      ))}
    </nav>
  );
}

function SidebarFooter({
  userName,
  userEmail,
  workspaceRole,
  onSignOut,
  signingOut,
}: {
  userName: string;
  userEmail: string;
  workspaceRole: string;
  onSignOut: () => void;
  signingOut: boolean;
}) {
  const initials = userName
    .split(/\s+/)
    .map((part) => part[0])
    .join("")
    .slice(0, 2)
    .toUpperCase();

  return (
    <div className="border-t border-line p-3">
      <div className="rounded-xl border border-line bg-white/[0.02] p-3">
        <div className="flex items-center gap-2">
          <ShieldCheck className="size-3.5 text-accent" aria-hidden="true" />
          <p className="text-[11px] font-semibold text-ink">Simulation only</p>
        </div>
        <p className="mt-1.5 text-[10px] leading-4 text-faint">
          No custody, signing or transaction submission. Verification is fail-closed.
        </p>
      </div>

      <div className="mt-3 rounded-xl border border-line bg-white/[0.02] p-3">
        <div className="flex items-center gap-2">
          <span className="grid size-8 shrink-0 place-items-center rounded-full border border-accent/25 bg-accent/10 text-[10px] font-bold text-accent">
            {initials || <UserRound className="size-3.5" aria-hidden="true" />}
          </span>
          <div className="min-w-0">
            <p className="truncate text-[11px] font-semibold text-ink">{userName}</p>
            <p className="truncate text-[10px] text-faint">{userEmail}</p>
          </div>
          <button
            type="button"
            onClick={onSignOut}
            disabled={signingOut}
            className="ml-auto grid size-7 place-items-center rounded-md border border-line text-faint hover:bg-white/[0.05] hover:text-ink disabled:opacity-50"
            aria-label="Sign out"
            title="Sign out"
          >
            <LogOut className="size-3.5" aria-hidden="true" />
          </button>
        </div>
        <p className="mt-2 text-[10px] text-faint">
          Role: <span className="font-semibold text-muted">{workspaceRole}</span>
        </p>
      </div>
      <p className="px-1 pt-3 text-[10px] text-faint">Interlock · Phase 2 auth</p>
    </div>
  );
}

export function AppShell({
  children,
  workspaceName,
  workspaceRole,
  userName,
  userEmail,
}: {
  children: ReactNode;
  workspaceName: string;
  workspaceRole: string;
  userName: string;
  userEmail: string;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [signingOut, setSigningOut] = useState(false);

  async function handleSignOut() {
    setSigningOut(true);
    try {
      await authClient.signOut();
      router.push("/login");
      router.refresh();
    } finally {
      setSigningOut(false);
    }
  }

  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <div className="min-h-dvh">
      <a href="#main-content" className="skip-link">
        Skip to content
      </a>

      <div className="mx-auto flex min-h-dvh w-full max-w-[1700px]">
        <aside className="sticky top-0 hidden h-dvh w-64 shrink-0 flex-col border-r border-line bg-[#080b0e]/80 backdrop-blur lg:flex">
          <div className="border-b border-line p-4">
            <Link href="/dashboard" className="flex items-center gap-2.5 rounded-lg">
              <BrandMark />
              <span>
                <span className="block text-sm font-semibold tracking-[0.08em] text-ink">
                  INTERLOCK
                </span>
                <span className="block text-[10px] text-faint">verified memory gate</span>
              </span>
            </Link>
            <div className="mt-4 rounded-lg border border-line bg-white/[0.02] px-3 py-2">
              <p className="text-[10px] uppercase tracking-[0.16em] text-faint">Workspace</p>
              <div className="mt-1 flex items-center justify-between gap-2">
                <span className="truncate text-xs font-medium text-ink" title={workspaceName}>
                  {workspaceName}
                </span>
                <Badge tone={workspaceRole === "OWNER" ? "accent" : workspaceRole === "OPERATOR" ? "info" : "neutral"}>
                  {workspaceRole}
                </Badge>
              </div>
            </div>
          </div>
          <Navigation pathname={pathname} />
          <SidebarFooter
            userName={userName}
            userEmail={userEmail}
            workspaceRole={workspaceRole}
            onSignOut={handleSignOut}
            signingOut={signingOut}
          />
        </aside>

        {open ? (
          <div className="fixed inset-0 z-50 lg:hidden">
            <button
              type="button"
              aria-label="Close navigation"
              className="absolute inset-0 bg-black/70 backdrop-blur-sm"
              onClick={() => setOpen(false)}
            />
            <aside
              id="mobile-navigation"
              className="relative flex h-full w-[min(19rem,88vw)] flex-col border-r border-line bg-[#080b0e] shadow-2xl"
            >
              <div className="flex items-center justify-between border-b border-line p-4">
                <Link
                  href="/dashboard"
                  className="flex items-center gap-2.5"
                  onClick={() => setOpen(false)}
                >
                  <BrandMark />
                  <span className="text-sm font-semibold tracking-[0.08em] text-ink">
                    INTERLOCK
                  </span>
                </Link>
                <button
                  type="button"
                  onClick={() => setOpen(false)}
                  className="grid size-9 place-items-center rounded-lg border border-line text-muted hover:bg-white/[0.05] hover:text-ink"
                  aria-label="Close navigation"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
              <Navigation pathname={pathname} onNavigate={() => setOpen(false)} />
              <SidebarFooter
                userName={userName}
                userEmail={userEmail}
                workspaceRole={workspaceRole}
                onSignOut={handleSignOut}
                signingOut={signingOut}
              />
            </aside>
          </div>
        ) : null}

        <div className="flex min-w-0 flex-1 flex-col">
          <header className="sticky top-0 z-30 border-b border-line bg-[#06080a]/80 backdrop-blur">
            <div className="flex min-h-16 items-center gap-3 px-4 md:px-8">
              <button
                type="button"
                onClick={() => setOpen(true)}
                className="grid size-9 place-items-center rounded-lg border border-line text-muted hover:bg-white/[0.05] hover:text-ink lg:hidden"
                aria-label="Open navigation"
                aria-expanded={open}
                aria-controls="mobile-navigation"
              >
                <Menu className="size-4" aria-hidden="true" />
              </button>
              <div className="flex min-w-0 items-center gap-2 text-xs text-faint">
                <Gauge className="size-3.5 shrink-0" aria-hidden="true" />
                <span className="truncate">Operations console</span>
                <span className="text-line-strong" aria-hidden="true">
                  /
                </span>
                <span className="truncate text-muted">Preview shell</span>
              </div>
              <div className="ml-auto flex items-center gap-2">
                <Badge tone="warn" dot className="hidden sm:inline-flex">
                  Simulation only
                </Badge>
                <Badge tone="accent" dot>
                  Preview
                </Badge>
              </div>
            </div>
          </header>

          <main
            id="main-content"
            className="mx-auto w-full max-w-[1500px] flex-1 px-4 py-6 md:px-8 md:py-8"
          >
            {children}
          </main>

          <footer className="border-t border-line px-4 py-5 md:px-8">
            <div className="mx-auto flex w-full max-w-[1500px] flex-col gap-3 text-[11px] text-faint sm:flex-row sm:items-center sm:justify-between">
              <p>Interlock preview shell · Phase 2 · simulation only</p>
              <div className="flex flex-wrap items-center gap-4">
                <a
                  href="https://github.com/onyebuchidaniel60/interlock#readme"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
                >
                  <BookOpen className="size-3.5" aria-hidden="true" />
                  Documentation
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </a>
                <a
                  href="https://github.com/onyebuchidaniel60/interlock"
                  target="_blank"
                  rel="noreferrer"
                  className="inline-flex items-center gap-1.5 text-muted hover:text-ink"
                >
                  GitHub
                  <ArrowUpRight className="size-3" aria-hidden="true" />
                </a>
              </div>
            </div>
          </footer>
        </div>
      </div>
    </div>
  );
}
