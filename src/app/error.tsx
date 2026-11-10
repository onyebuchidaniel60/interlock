"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <main className="mx-auto flex min-h-[60vh] max-w-xl flex-col items-center justify-center px-6 text-center">
      <span className="grid size-12 place-items-center rounded-full border border-danger/30 bg-danger/10 text-danger">
        <TriangleAlert className="size-5" aria-hidden="true" />
      </span>
      <h1 className="mt-5 text-2xl font-semibold text-ink">Something went wrong</h1>
      <p className="mt-2 text-sm leading-6 text-muted">
        The console could not render this view. No decision or execution state was changed.
      </p>
      <button
        type="button"
        onClick={reset}
        className="mt-6 inline-flex items-center gap-2 rounded-lg border border-accent bg-accent px-4 py-2 text-sm font-semibold text-[#04120c]"
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Try again
      </button>
    </main>
  );
}
