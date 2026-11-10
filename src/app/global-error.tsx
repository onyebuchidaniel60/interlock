"use client";

import { RotateCcw, TriangleAlert } from "lucide-react";

export default function GlobalError({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <html lang="en">
      <body className="min-h-dvh bg-[#06080a] text-[#e7eef2]">
        <main className="mx-auto flex min-h-dvh max-w-xl flex-col items-center justify-center px-6 text-center">
          <span className="grid size-12 place-items-center rounded-full border border-[#f2777a]/30 bg-[#2a1416] text-[#f2777a]">
            <TriangleAlert className="size-5" aria-hidden="true" />
          </span>
          <h1 className="mt-5 text-2xl font-semibold">Something went wrong</h1>
          <p className="mt-2 text-sm leading-6 text-[#8c9aa4]">
            The console could not render this view. No decision or execution state was changed.
          </p>
          <button
            type="button"
            onClick={reset}
            className="mt-6 inline-flex items-center gap-2 rounded-lg border border-[#34d399] bg-[#34d399] px-4 py-2 text-sm font-semibold text-[#04120c]"
          >
            <RotateCcw className="size-4" aria-hidden="true" />
            Try again
          </button>
        </main>
      </body>
    </html>
  );
}
