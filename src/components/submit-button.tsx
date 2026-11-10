"use client";

import { useFormStatus } from "react-dom";

export function SubmitButton({
  children,
  pendingLabel,
  variant = "primary",
}: {
  children: string;
  pendingLabel: string;
  variant?: "primary" | "secondary" | "danger";
}) {
  const { pending } = useFormStatus();
  const style = {
    primary:
      "border-accent/70 bg-accent text-[#04120c] hover:bg-emerald-300",
    secondary:
      "border-line-strong bg-white/[0.04] text-ink hover:border-accent/40 hover:bg-white/[0.07]",
    danger: "border-danger/40 bg-danger/10 text-danger hover:bg-danger/20",
  }[variant];

  return (
    <button
      type="submit"
      disabled={pending}
      className={`inline-flex min-h-9 items-center justify-center gap-2 rounded-lg border px-3.5 py-2 text-xs font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-60 ${style}`}
    >
      {pending ? pendingLabel : children}
    </button>
  );
}
