import type { ReactNode } from "react";
import { ArrowUpRight, BookOpen, ShieldCheck } from "lucide-react";

export function AuthShell({
  eyebrow,
  title,
  description,
  children,
}: {
  eyebrow: string;
  title: string;
  description: string;
  children: ReactNode;
}) {
  return (
    <main className="relative min-h-dvh overflow-hidden">
      <div className="relative mx-auto grid min-h-dvh w-full max-w-6xl items-center gap-10 px-5 py-10 lg:grid-cols-[minmax(0,1fr)_420px] lg:px-8">
        <section className="hidden lg:block">
          <div className="inline-flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl border border-accent/30 bg-accent/10 text-accent">
              <svg viewBox="0 0 24 24" className="size-5" fill="none" aria-hidden="true">
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
            <span className="text-sm font-semibold tracking-[0.12em] text-ink">INTERLOCK</span>
          </div>

          <p className="mt-10 max-w-xl text-4xl font-semibold leading-[1.05] tracking-tight text-ink xl:text-5xl">
            Verified memory.
            <br />
            <span className="font-serif font-normal italic text-accent">Enforced decisions.</span>
          </p>
          <p className="mt-5 max-w-lg text-sm leading-6 text-muted">
            Interlock is an execution safety layer for multi-agent systems. One agent&rsquo;s
            verified discovery can stop another agent from taking a policy-violating action.
          </p>

          <div className="mt-8 grid max-w-lg gap-3 sm:grid-cols-2">
            {[
              "Walrus-backed evidence",
              "Deterministic Sentinel",
              "Fail-closed HOLD states",
              "Simulation-only Runner",
            ].map((item) => (
              <div
                key={item}
                className="flex items-center gap-2 rounded-lg border border-line bg-white/[0.02] px-3 py-2.5 text-xs text-muted"
              >
                <ShieldCheck className="size-3.5 shrink-0 text-accent" aria-hidden="true" />
                {item}
              </div>
            ))}
          </div>

          <div className="mt-10 flex flex-wrap items-center gap-4 text-[11px] text-faint">
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
            <span>Execution simulated · no funds move</span>
          </div>
        </section>

        <section className="surface-raised w-full p-6 sm:p-8">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">
            {eyebrow}
          </p>
          <h1 className="mt-2 text-2xl font-semibold tracking-tight text-ink">{title}</h1>
          <p className="mt-2 text-sm leading-6 text-muted">{description}</p>
          <div className="mt-6">{children}</div>
        </section>
      </div>
    </main>
  );
}
