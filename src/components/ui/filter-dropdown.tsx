"use client";

import { useRef, useState, type ReactNode } from "react";
import { Check, ChevronDown, RotateCcw, Search, X } from "lucide-react";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

/**
 * Filter button used in the leads toolbar: label + chevron.
 * When a value is set it turns blue, shows the value, and gets a clear (×) button.
 */
export function FilterDropdown({
  label,
  valueLabel,
  activeText,
  onClear,
  children,
  width = "w-56",
}: {
  label: string;
  valueLabel?: string;
  /** Replaces the default "Label: value" text when a value is set. */
  activeText?: string;
  onClear?: () => void;
  children: (close: () => void) => ReactNode;
  width?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const active = !!valueLabel;

  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="relative">
      <div
        className={cn(
          "flex h-9 items-center rounded-lg border bg-surface text-xs font-medium transition-colors",
          active ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-foreground hover:border-border-strong",
          open && !active && "border-border-strong"
        )}
      >
        <button
          type="button"
          aria-haspopup="listbox"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
          className={cn("flex h-full items-center gap-1.5 pl-3.5", active && onClear ? "pr-1.5" : "pr-2.5")}
        >
          <span className="max-w-40 truncate whitespace-nowrap">{active ? (activeText ?? `${label}: ${valueLabel}`) : label}</span>
          {!(active && onClear) && (
            <ChevronDown className={cn("size-3.5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")} />
          )}
        </button>
        {active && onClear && (
          <button
            type="button"
            aria-label={`Clear ${label} filter`}
            onClick={onClear}
            className="mr-1.5 flex size-5 items-center justify-center rounded-md text-primary transition-colors hover:bg-primary/15"
          >
            <X className="size-3.5" />
          </button>
        )}
      </div>

      {open && (
        <div
          className={cn(
            "absolute left-0 top-full z-30 mt-1.5 overflow-hidden rounded-xl border border-border bg-surface p-1 shadow-xl animate-fade-in",
            width
          )}
        >
          {children(() => setOpen(false))}
        </div>
      )}
    </div>
  );
}

/** Single-select list for a FilterDropdown, with a search box for long lists. */
export function FilterOptions({
  options,
  value,
  onSelect,
  allLabel,
  searchable,
}: {
  options: { value: string; label: string; hint?: ReactNode }[];
  value: string;
  onSelect: (value: string) => void;
  allLabel: string;
  searchable?: boolean;
}) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const shown = q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;

  return (
    <div className="flex flex-col">
      {searchable && (
        <div className="relative mb-1">
          <Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" />
          <input
            autoFocus
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search…"
            aria-label="Search options"
            className="h-8 w-full rounded-lg border border-border bg-surface-muted/40 pl-8 pr-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
          />
        </div>
      )}
      <ul role="listbox" className="max-h-64 overflow-y-auto">
        {!q && <Option label={allLabel} selected={value === ""} onClick={() => onSelect("")} />}
        {shown.map((o) => (
          <Option key={o.value} label={o.label} hint={o.hint} selected={value === o.value} onClick={() => onSelect(o.value)} />
        ))}
        {shown.length === 0 && <li className="px-2.5 py-3 text-center text-xs text-muted-foreground">No matches</li>}
      </ul>
    </div>
  );
}

function Option({
  label,
  hint,
  selected,
  onClick,
}: {
  label: string;
  hint?: ReactNode;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <li role="option" aria-selected={selected}>
      <button
        type="button"
        onClick={onClick}
        className={cn(
          "flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-left text-xs transition-colors hover:bg-surface-hover",
          selected ? "font-medium text-primary" : "text-foreground"
        )}
      >
        <span className="min-w-0 flex-1 truncate">{label}</span>
        {hint && <span className="shrink-0 text-[11px] tabular-nums text-muted-foreground">{hint}</span>}
        <Check className={cn("size-3.5 shrink-0", selected ? "opacity-100" : "opacity-0")} />
      </button>
    </li>
  );
}

export type DateRange = { preset: string; from: string; to: string };
export const anyDate: DateRange = { preset: "", from: "", to: "" };

function shiftDate(iso: string, days: number) {
  const d = new Date(`${iso}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

function datePresetsFor(today: string) {
  return [
    { value: "today", label: "Today", from: today, to: today },
    { value: "yesterday", label: "Yesterday", from: shiftDate(today, -1), to: shiftDate(today, -1) },
    { value: "7d", label: "Last 7 days", from: shiftDate(today, -6), to: today },
    { value: "30d", label: "Last 30 days", from: shiftDate(today, -29), to: today },
    { value: "month", label: "This month", from: `${today.slice(0, 8)}01`, to: today },
  ];
}

/** True when an ISO date falls inside the range (open-ended sides allowed). */
export function inDateRange(iso: string, range: DateRange) {
  return (!range.from || iso >= range.from) && (!range.to || iso <= range.to);
}

/** "Date filter" dropdown: presets relative to `today`, plus a custom from–to range. */
export function DateRangeFilter({
  value,
  onChange,
  today,
  label = "Date filter",
}: {
  value: DateRange;
  onChange: (value: DateRange) => void;
  today: string;
  label?: string;
}) {
  const presets = datePresetsFor(today);
  const valueLabel = value.preset
    ? presets.find((p) => p.value === value.preset)?.label
    : value.from || value.to
      ? `${value.from ? shortDate(value.from) : "…"} – ${value.to ? shortDate(value.to) : "…"}`
      : undefined;

  return (
    <FilterDropdown label={label} valueLabel={valueLabel} onClear={() => onChange(anyDate)} width="w-64">
      {(close) => (
        <div className="flex flex-col">
          <FilterOptions
            allLabel="Any date"
            value={value.preset}
            options={presets.map((p) => ({ value: p.value, label: p.label }))}
            onSelect={(v) => {
              const preset = presets.find((p) => p.value === v);
              onChange(preset ? { preset: v, from: preset.from, to: preset.to } : anyDate);
              close();
            }}
          />
          <div className="mt-1 border-t border-border px-2.5 pb-1.5 pt-2.5">
            <p className="mb-2 text-[11px] font-medium text-muted-foreground">Custom range</p>
            <div className="grid grid-cols-2 gap-2">
              {(["from", "to"] as const).map((key) => (
                <label key={key} className="flex flex-col gap-1 text-[11px] text-muted-foreground">
                  {key === "from" ? "From" : "To"}
                  <input
                    type="date"
                    value={value[key]}
                    max={today}
                    onChange={(e) => onChange({ ...value, preset: "", [key]: e.target.value })}
                    className="h-8 w-full rounded-lg border border-border bg-surface px-2 text-xs text-foreground focus:border-primary focus:outline-none"
                  />
                </label>
              ))}
            </div>
          </div>
        </div>
      )}
    </FilterDropdown>
  );
}

/** Toolbar container for a page's search + filter dropdowns. */
export function FilterBar({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div className={cn("flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 card-shadow", className)}>
      {children}
    </div>
  );
}

/** Search box sized to match the filter buttons. */
export function SearchField({
  value,
  onChange,
  placeholder = "Search…",
  label = "Search",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  label?: string;
}) {
  return (
    <div className="relative">
      <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="search"
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="h-9 w-60 rounded-lg border border-border bg-surface pl-9 pr-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
    </div>
  );
}

/** "Reset" link shown at the end of a FilterBar when any filter is set. */
export function ResetFilters({ onClick }: { onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="ml-auto inline-flex h-9 items-center gap-1.5 rounded-lg px-3 text-xs font-medium text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
    >
      <RotateCcw className="size-3.5" />
      Reset
    </button>
  );
}

type OptionInput = string | { value: string; label: string; hint?: ReactNode };

/** One-line filter dropdown for a simple list of options ("" = all). */
export function SelectFilter({
  label,
  value,
  onChange,
  options,
  allLabel,
  searchable,
  width,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: readonly OptionInput[];
  allLabel?: string;
  searchable?: boolean;
  width?: string;
}) {
  const normalised = options.map((o) => (typeof o === "string" ? { value: o, label: o } : o));
  const current = normalised.find((o) => o.value === value);
  return (
    <FilterDropdown label={label} valueLabel={current?.label} onClear={() => onChange("")} width={width}>
      {(close) => (
        <FilterOptions
          searchable={searchable ?? normalised.length > 10}
          allLabel={allLabel ?? `All ${label.toLowerCase()}`}
          value={value}
          options={normalised}
          onSelect={(v) => {
            onChange(v);
            close();
          }}
        />
      )}
    </FilterDropdown>
  );
}
