import { commsNow } from "@/lib/mock/communications";

const now = Date.parse(commsNow);

/** "Just now", "25m ago", "3h ago", "Yesterday", "4d ago", or a date. Future times read "in 3d". */
export function relativeTime(iso: string) {
  const diff = now - Date.parse(iso);
  const future = diff < 0;
  const mins = Math.round(Math.abs(diff) / 60000);
  if (mins < 1) return "Just now";
  const unit = mins < 60 ? `${mins}m` : mins < 1440 ? `${Math.round(mins / 60)}h` : `${Math.round(mins / 1440)}d`;
  if (future) return `in ${unit}`;
  if (mins >= 1440 && mins < 2880) return "Yesterday";
  if (mins >= 1440 * 7) return shortDate(iso);
  return `${unit} ago`;
}

export function shortDate(iso: string) {
  return new Date(iso.length === 10 ? `${iso}T00:00:00Z` : iso).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  });
}

export function longDateTime(iso: string) {
  return new Date(iso).toLocaleString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "UTC",
  }) + " GMT";
}

/** Whole days from now until a YYYY-MM-DD date (negative when past). */
export function daysUntil(date: string) {
  const today = Date.parse(commsNow.slice(0, 10) + "T00:00:00Z");
  return Math.round((Date.parse(`${date}T00:00:00Z`) - today) / 86400000);
}

export function dueLabel(date: string) {
  const d = daysUntil(date);
  if (d < 0) return `Overdue by ${-d}d`;
  if (d === 0) return "Due today";
  if (d === 1) return "Due tomorrow";
  return `Due in ${d} days`;
}
