import Link from "next/link";
import { SearchX } from "lucide-react";

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-line bg-white/[0.03] text-muted">
        <SearchX className="size-5" aria-hidden="true" />
      </span>
      <p className="mt-5 text-[11px] font-semibold uppercase tracking-[0.18em] text-faint">404</p>
      <h1 className="mt-2 text-2xl font-semibold text-ink">Route not found</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        This preview does not have that screen. Return to the operations console to continue.
      </p>
      <Link
        href="/dashboard"
        className="mt-6 inline-flex min-h-9 items-center rounded-lg border border-accent/70 bg-accent px-4 py-2 text-xs font-semibold text-[#04120c]"
      >
        Return to dashboard
      </Link>
    </main>
  );
}
