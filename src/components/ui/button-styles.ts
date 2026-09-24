// Shared sizes for page and form action buttons (matches "New Application").
const base =
  "inline-flex min-h-10 shrink-0 items-center justify-center gap-2 rounded-full px-4 py-2.5 text-xs font-semibold transition-all active:scale-95 disabled:pointer-events-none disabled:opacity-50";

export const buttonPrimary = `${base} bg-primary text-primary-foreground shadow-xs hover:bg-primary-hover`;
export const buttonSecondary = `${base} border border-border bg-surface text-foreground hover:bg-surface-hover`;
export const buttonDanger = `${base} bg-danger text-white shadow-xs hover:bg-danger/90`;
