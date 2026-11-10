import type { LucideIcon } from "lucide-react";
import type { ReactNode } from "react";

import { cn } from "@/lib/utils";

export type Tone = "neutral" | "accent" | "warn" | "danger" | "info";

const toneStyles: Record<Tone, string> = {
  neutral: "border-line-strong bg-white/[0.035] text-muted",
  accent: "border-accent/30 bg-accent/10 text-accent",
  warn: "border-warn/30 bg-warn/10 text-warn",
  danger: "border-danger/30 bg-danger/10 text-danger",
  info: "border-info/30 bg-info/10 text-info",
};

export function Badge({
  children,
  tone = "neutral",
  dot = false,
  className,
}: {
  children: ReactNode;
  tone?: Tone;
  dot?: boolean;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-semibold tracking-wide",
        toneStyles[tone],
        className,
      )}
    >
      {dot ? <span className="size-1.5 rounded-full bg-current" aria-hidden="true" /> : null}
      {children}
    </span>
  );
}

export function PageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow: string;
  title: string;
  description: string;
  actions?: ReactNode;
}) {
  return (
    <header className="flex flex-col gap-5 border-b border-line pb-6 md:flex-row md:items-end md:justify-between">
      <div className="max-w-3xl">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
          {eyebrow}
        </p>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight text-ink md:text-4xl">{title}</h1>
        <p className="mt-3 max-w-2xl text-sm leading-6 text-muted">{description}</p>
      </div>
      {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </header>
  );
}

export function KpiCard({
  label,
  value,
  detail,
  icon: Icon,
  tone = "neutral",
}: {
  label: string;
  value: string;
  detail: string;
  icon: LucideIcon;
  tone?: Tone;
}) {
  const iconTone = {
    neutral: "text-muted",
    accent: "text-accent",
    warn: "text-warn",
    danger: "text-danger",
    info: "text-info",
  }[tone];

  return (
    <div className="surface p-5">
      <div className="flex items-start justify-between gap-4">
        <p className="text-xs font-medium text-muted">{label}</p>
        <Icon className={cn("size-4", iconTone)} aria-hidden="true" />
      </div>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-ink">{value}</p>
      <p className="mt-2 text-xs leading-5 text-faint">{detail}</p>
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-wrap items-start justify-between gap-3">
      <div>
        <h2 className="text-sm font-semibold tracking-tight text-ink">{title}</h2>
        {description ? <p className="mt-1 text-xs leading-5 text-faint">{description}</p> : null}
      </div>
      {action}
    </div>
  );
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: LucideIcon;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex min-h-56 flex-col items-center justify-center rounded-xl border border-line bg-white/[0.012] px-6 py-10 text-center">
      <span className="grid size-11 place-items-center rounded-full border border-line bg-white/[0.03] text-muted">
        <Icon className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-4 text-sm font-semibold text-ink">{title}</p>
      <p className="mt-2 max-w-md text-xs leading-5 text-faint">{description}</p>
      {action ? <div className="mt-5">{action}</div> : null}
    </div>
  );
}

export function StatusRow({
  label,
  value,
  tone = "neutral",
  detail,
}: {
  label: string;
  value: string;
  tone?: Tone;
  detail?: string;
}) {
  return (
    <div className="flex items-start justify-between gap-4 border-b border-line py-3 last:border-b-0">
      <div>
        <p className="text-xs font-medium text-ink">{label}</p>
        {detail ? <p className="mt-1 text-[11px] leading-5 text-faint">{detail}</p> : null}
      </div>
      <Badge tone={tone} dot>
        {value}
      </Badge>
    </div>
  );
}

export function AgentCard({
  name,
  role,
  description,
  icon: Icon,
}: {
  name: string;
  role: string;
  description: string;
  icon: LucideIcon;
}) {
  return (
    <div className="surface p-5">
      <div className="flex items-center justify-between gap-3">
        <span className="grid size-9 place-items-center rounded-lg border border-line-strong bg-white/[0.03] text-muted">
          <Icon className="size-4" aria-hidden="true" />
        </span>
        <Badge tone="accent" dot>
          Wired
        </Badge>
      </div>
      <p className="mt-4 text-sm font-semibold text-ink">{name}</p>
      <p className="text-[11px] font-medium uppercase tracking-[0.14em] text-faint">{role}</p>
      <p className="mt-3 text-xs leading-5 text-muted">{description}</p>
    </div>
  );
}

export function PlaceholderPanel({
  phase,
  title,
  description,
  children,
}: {
  phase: string;
  title: string;
  description: string;
  children?: ReactNode;
}) {
  return (
    <section className="surface overflow-hidden">
      <div className="border-b border-line bg-white/[0.015] px-5 py-4">
        <div className="flex flex-wrap items-center gap-2">
          <Badge tone="info">{phase}</Badge>
          <h2 className="text-sm font-semibold text-ink">{title}</h2>
        </div>
        <p className="mt-2 max-w-2xl text-xs leading-5 text-faint">{description}</p>
      </div>
      {children ? <div className="p-5">{children}</div> : null}
    </section>
  );
}

export function ButtonLink({
  href,
  children,
  variant = "primary",
  external = false,
}: {
  href: string;
  children: ReactNode;
  variant?: "primary" | "secondary" | "ghost";
  external?: boolean;
}) {
  const styles = {
    primary: "border-accent/70 bg-accent text-[#04120c] hover:bg-emerald-300",
    secondary:
      "border-line-strong bg-white/[0.04] text-ink hover:border-accent/40 hover:bg-white/[0.07]",
    ghost: "border-transparent bg-transparent text-muted hover:bg-white/[0.04] hover:text-ink",
  }[variant];

  return (
    <a
      href={href}
      {...(external ? { target: "_blank", rel: "noreferrer" } : {})}
      className={cn(
        "inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors",
        styles,
      )}
    >
      {children}
    </a>
  );
}
