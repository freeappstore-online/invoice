import type { RecurrenceCadence } from "../types/invoice";

/** Today as YYYY-MM-DD in the user's local timezone. */
export function todayIso(): string {
  const d = new Date();
  return toIsoDate(d);
}

/** Default due date: today + 14 days. */
export function defaultDueDate(): string {
  const d = new Date();
  d.setDate(d.getDate() + 14);
  return toIsoDate(d);
}

export function toIsoDate(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function parseIsoDate(s: string): Date | null {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return null;
  const parts = s.split("-");
  const y = Number(parts[0]);
  const m = Number(parts[1]);
  const day = Number(parts[2]);
  if (!y || !m || !day) return null;
  const d = new Date(y, m - 1, day);
  if (isNaN(d.getTime())) return null;
  return d;
}

export function formatDateLong(iso: string): string {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  return d.toLocaleDateString(undefined, {
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

export function addRecurrence(iso: string, cadence: RecurrenceCadence): string {
  const d = parseIsoDate(iso);
  if (!d) return iso;
  switch (cadence) {
    case "monthly":
      d.setMonth(d.getMonth() + 1);
      break;
    case "quarterly":
      d.setMonth(d.getMonth() + 3);
      break;
    case "yearly":
      d.setFullYear(d.getFullYear() + 1);
      break;
    case "none":
    default:
      break;
  }
  return toIsoDate(d);
}

export function isOverdue(dueDate: string): boolean {
  const due = parseIsoDate(dueDate);
  if (!due) return false;
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return due.getTime() < today.getTime();
}

export function isCurrentMonth(iso: string): boolean {
  const d = parseIsoDate(iso);
  if (!d) return false;
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()
  );
}
