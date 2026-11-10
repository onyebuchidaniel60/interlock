"use client";

import { Check, Copy } from "lucide-react";
import { useState } from "react";

import { shortId } from "@/lib/format";

export function CopyValue({
  value,
  display,
  label,
  full = false,
}: {
  value: string | null | undefined;
  display?: string;
  label: string;
  full?: boolean;
}) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    if (!value) return;
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1400);
    } catch {
      setCopied(false);
    }
  }

  return (
    <div className="flex min-w-0 items-center gap-1.5">
      <code className={full ? "break-all font-mono text-[10px] text-ink" : "truncate font-mono text-[10px] text-ink"}>
        {display ?? shortId(value, 18)}
      </code>
      <button
        type="button"
        onClick={copy}
        disabled={!value}
        className="grid size-6 shrink-0 place-items-center rounded-md border border-line text-faint hover:bg-white/[0.05] hover:text-ink disabled:opacity-40"
        aria-label={`Copy ${label}`}
        title={`Copy ${label}`}
      >
        {copied ? <Check className="size-3 text-accent" aria-hidden="true" /> : <Copy className="size-3" aria-hidden="true" />}
      </button>
    </div>
  );
}
