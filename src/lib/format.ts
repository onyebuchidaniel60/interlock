export function formatMist(value: string | number | null | undefined) {
  if (value === null || value === undefined) return "—";
  const text = String(value);
  if (!/^[0-9]+$/.test(text)) return "—";
  const atomic = BigInt(text);
  const whole = atomic / 1_000_000_000n;
  const fraction = (atomic % 1_000_000_000n).toString().padStart(9, "0").replace(/0+$/, "");
  return `${whole.toString()}${fraction ? `.${fraction}` : ""} SUI`;
}

export function formatBps(value: number | null | undefined) {
  if (value === null || value === undefined) return "—";
  return `${(value / 100).toFixed(2)}%`;
}

export function formatDate(value: Date | string | null | undefined) {
  if (!value) return "—";
  return new Intl.DateTimeFormat("en", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(value));
}

export function shortId(value: string | null | undefined, length = 12) {
  if (!value) return "—";
  return value.length <= length ? value : `${value.slice(0, length)}…`;
}

export function isExpired(value: Date | string) {
  return new Date(value).getTime() < Date.now();
}

export function roleTone(role: string) {
  return role === "OWNER" ? "accent" : role === "OPERATOR" ? "info" : "neutral";
}
