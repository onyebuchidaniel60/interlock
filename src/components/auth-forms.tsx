"use client";

import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { ArrowRight, LockKeyhole, Mail, UserPlus } from "lucide-react";

import { authClient } from "@/lib/auth/client";

function Field({
  label,
  name,
  type,
  autoComplete,
  defaultValue,
  minLength,
  icon,
}: {
  label: string;
  name: string;
  type: string;
  autoComplete: string;
  defaultValue?: string;
  minLength?: number;
  icon: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[11px] font-semibold uppercase tracking-[0.14em] text-faint">{label}</span>
      <div className="mt-1.5 flex items-center gap-2 rounded-lg border border-line bg-canvas px-3">
        {icon}
        <input
          name={name}
          type={type}
          required
          minLength={minLength}
          autoComplete={autoComplete}
          defaultValue={defaultValue}
          className="min-h-10 w-full bg-transparent text-sm text-ink outline-none placeholder:text-faint"
        />
      </div>
    </label>
  );
}

function SubmitButton({ pending, label, pendingLabel }: { pending: boolean; label: string; pendingLabel: string }) {
  return (
    <button
      type="submit"
      disabled={pending}
      className="inline-flex min-h-10 w-full items-center justify-center gap-2 rounded-lg border border-accent/70 bg-accent px-4 py-2 text-xs font-bold text-[#04120c] transition-colors hover:bg-emerald-300 disabled:cursor-not-allowed disabled:opacity-60"
    >
      {pending ? pendingLabel : label}
      <ArrowRight className="size-3.5" aria-hidden="true" />
    </button>
  );
}

export function SignInForm({ next }: { next: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const result = await authClient.signIn.email({
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      if (result?.error) {
        setError("Email or password is incorrect.");
        return;
      }
      router.push(next);
      router.refresh();
    } catch {
      setError("The authentication service is unavailable. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {error ? (
        <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        icon={<Mail className="size-3.5 text-faint" aria-hidden="true" />}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        minLength={8}
        icon={<LockKeyhole className="size-3.5 text-faint" aria-hidden="true" />}
      />
      <SubmitButton pending={pending} label="Sign in" pendingLabel="Signing in…" />
    </form>
  );
}

export function SignUpForm({ token, defaultEmail }: { token?: string; defaultEmail?: string }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [pending, setPending] = useState(false);

  async function onSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    const form = new FormData(event.currentTarget);
    try {
      const result = await authClient.signUp.email({
        name: String(form.get("name") ?? ""),
        email: String(form.get("email") ?? ""),
        password: String(form.get("password") ?? ""),
      });
      if (result?.error) {
        setError("Account creation failed. The email may already be registered.");
        return;
      }
      const next = token ? `/setup?token=${encodeURIComponent(token)}` : "/setup";
      router.push(`/login?created=1&next=${encodeURIComponent(next)}`);
      router.refresh();
    } catch {
      setError("The authentication service is unavailable. Try again.");
    } finally {
      setPending(false);
    }
  }

  return (
    <form onSubmit={onSubmit} className="space-y-4">
      {token ? <input type="hidden" name="token" value={token} /> : null}
      {error ? (
        <p role="alert" className="rounded-lg border border-danger/25 bg-danger/10 p-3 text-xs text-danger">
          {error}
        </p>
      ) : null}
      <Field
        label="Name"
        name="name"
        type="text"
        autoComplete="name"
        icon={<UserPlus className="size-3.5 text-faint" aria-hidden="true" />}
      />
      <Field
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        defaultValue={defaultEmail}
        icon={<Mail className="size-3.5 text-faint" aria-hidden="true" />}
      />
      <Field
        label="Password"
        name="password"
        type="password"
        autoComplete="new-password"
        minLength={8}
        icon={<LockKeyhole className="size-3.5 text-faint" aria-hidden="true" />}
      />
      <p className="text-[10px] leading-5 text-faint">
        At least 8 characters. Stored by Neon Managed Better Auth, never in Interlock domain tables.
      </p>
      <SubmitButton pending={pending} label="Create account" pendingLabel="Creating account…" />
    </form>
  );
}
