"use client";

import { HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv, toCsvRow } from "@/lib/csv";
import { useEffect, useMemo, useState, type FormEvent } from "react";
import { ChevronLeft, ChevronRight, Globe2, Pencil, Plus, Search, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Field, fieldClass } from "@/components/ui/form-controls";
import { SlideOver } from "@/components/ui/slide-over";
import { Tooltip } from "@/components/ui/tooltip";
import { countryList, type CountryListItem } from "@/lib/mock/country-list";
import { mockCountries } from "@/lib/mock/directory";
import { cn } from "@/lib/utils";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

const PAGE_SIZE = 20;
const representedNames = new Set(mockCountries.map((c) => c.name.toLowerCase()));

/** Emoji flag from an ISO alpha-2 code (regional indicator symbols). */
function flagFor(code: string) {
  if (!/^[A-Z]{2}$/.test(code)) return "🏳️";
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

type Scope = "all" | "represented";

export default function CountryManagementPage() {
  const [countries, setCountries] = useState<CountryListItem[]>(countryList);
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState<Scope>("all");
  const [page, setPage] = useState(1);
  const [editing, setEditing] = useState<CountryListItem | "new" | null>(null);
  const [deleting, setDeleting] = useState<CountryListItem | null>(null);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return countries.filter(
      (c) =>
        (scope === "all" || representedNames.has(c.name.toLowerCase())) &&
        (!q || c.name.toLowerCase().includes(q) || c.code.toLowerCase().includes(q))
    );
  }, [countries, search, scope]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, pageCount);
  const visible = filtered.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE);
  const firstIndex = (currentPage - 1) * PAGE_SIZE;

  function save(item: CountryListItem, original?: CountryListItem) {
    setCountries((prev) => {
      const next = original ? prev.map((c) => (c.code === original.code ? item : c)) : [...prev, item];
      return next.sort((a, b) => a.name.localeCompare(b.name, "en"));
    });
    setEditing(null);
  }

  function remove(item: CountryListItem) {
    setCountries((prev) => prev.filter((c) => c.code !== item.code));
    setDeleting(null);
  }

  const selection = useRowSelection(visible.map((row) => row.code));
  const exportSelected = () =>
    downloadCsv(`country-list-selected.csv`, countries.filter((row) => selection.isSelected(row.code)).map(toCsvRow));

  return (
    <div className="flex flex-col gap-4">
      {/* Header */}
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <div className="flex items-center gap-2.5">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Country management</h2>
            <span className="rounded-full bg-primary-soft px-2.5 py-0.5 text-xs font-semibold tabular-nums text-primary">
              {countries.length} countries
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            Master list of countries used across leads, applications and institutions.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setEditing("new")}
          className={cn(buttonPrimary, "self-start sm:self-auto")}
        >
          <Plus className="size-4" />
          Add country
        </button>
      </header>

      <Card className="overflow-hidden rounded-2xl">
        {/* Toolbar */}
        <div className="flex flex-col gap-3 border-b border-border p-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="relative w-full sm:max-w-sm">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input
              type="search"
              aria-label="Search countries"
              value={search}
              onChange={(e) => {
                setSearch(e.target.value);
                setPage(1);
              }}
              placeholder="Search by country or code…"
              className="h-9 w-full rounded-full border border-border bg-surface-muted/40 pl-10 pr-9 text-xs text-foreground placeholder:text-muted-foreground transition-colors focus:border-primary focus:bg-surface focus:outline-none"
            />
            {search && (
              <button
                type="button"
                aria-label="Clear search"
                onClick={() => setSearch("")}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
              >
                <X className="size-3.5" />
              </button>
            )}
          </div>

          <div role="group" aria-label="Show" className="flex h-9 items-center gap-0.5 self-start rounded-full bg-surface-muted p-1 sm:self-auto">
            {([
              { value: "all", label: "All", count: countries.length },
              { value: "represented", label: "Represented", count: countries.filter((c) => representedNames.has(c.name.toLowerCase())).length },
            ] as const).map((opt) => (
              <button
                key={opt.value}
                type="button"
                aria-pressed={scope === opt.value}
                onClick={() => {
                  setScope(opt.value);
                  setPage(1);
                }}
                className={cn(
                  "flex h-7 items-center gap-1.5 rounded-full px-3.5 text-xs font-medium transition-colors",
                  scope === opt.value ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {opt.label}
                <span className={cn("tabular-nums", scope === opt.value ? "text-primary" : "text-muted-foreground/80")}>{opt.count}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Table */}
        <SelectionBar selection={selection} noun={["country", "countries"]} onExport={exportSelected} className="mx-4 mb-3 sm:mx-6" />
        <div className="overflow-x-auto">
          <table className="w-full min-w-[560px] border-collapse text-left text-sm">
            <thead>
              <tr className="border-b border-border bg-surface-muted/40 text-xs text-muted-foreground">
                <th className="w-10 py-2.5 pl-6 pr-0">
                  <HeaderCheckbox selection={selection} />
                </th>
                <th className="w-14 py-2.5 pl-3 pr-3 font-medium">#</th>
                <th className="px-3 py-2.5 font-medium">Country</th>
                <th className="w-24 px-3 py-2.5 font-medium">Code</th>
                <th className="w-36 px-3 py-2.5 font-medium">Status</th>
                <th className="w-28 py-2.5 pl-3 pr-5 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-14 text-center text-sm text-muted-foreground">
                    No countries match “{search}”.
                  </td>
                </tr>
              ) : (
                visible.map((c, i) => {
                  const represented = representedNames.has(c.name.toLowerCase());
                  return (
                    <tr key={c.code} className={cn("border-b border-border/70 transition-colors last:border-0 hover:bg-surface-hover", selectedRowClass(selection, c.code))}>
                      <td className="py-3 pl-6 pr-0 align-middle">
                        <RowCheckbox selection={selection} id={c.code} label={`Select ${c.name}`} />
                      </td>
                      <td className="py-2.5 pl-3 pr-3 text-xs tabular-nums text-muted-foreground">{firstIndex + i + 1}</td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center gap-3">
                          <span className="flex size-8 shrink-0 select-none items-center justify-center rounded-full bg-surface-muted text-base leading-none">
                            {flagFor(c.code)}
                          </span>
                          <span className="truncate font-medium text-foreground">{c.name}</span>
                        </div>
                      </td>
                      <td className="px-3 py-2.5">
                        <span className="rounded-md bg-surface-muted px-2 py-0.5 font-mono text-xs font-medium text-foreground">
                          {c.code}
                        </span>
                      </td>
                      <td className="px-3 py-2.5">
                        {represented ? (
                          <span className="inline-flex items-center gap-1.5 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-medium text-success">
                            <span className="size-1.5 rounded-full bg-success" />
                            Represented
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="py-2.5 pl-3 pr-5">
                        <div className="flex items-center justify-end gap-1.5">
                          <Tooltip label="Edit">
                            <button
                              type="button"
                              aria-label={`Edit ${c.name}`}
                              onClick={() => setEditing(c)}
                              className="group/btn flex size-8 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:border-violet-500 hover:bg-violet-500"
                            >
                              <Pencil className="size-3.5 text-violet-500 transition-colors group-hover/btn:text-white" />
                            </button>
                          </Tooltip>
                          <Tooltip label="Delete" align="end">
                            <button
                              type="button"
                              aria-label={`Delete ${c.name}`}
                              onClick={() => setDeleting(c)}
                              className="group/btn flex size-8 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:border-danger hover:bg-danger"
                            >
                              <Trash2 className="size-3.5 text-danger transition-colors group-hover/btn:text-white" />
                            </button>
                          </Tooltip>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {filtered.length > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>
              Showing <span className="font-medium text-foreground tabular-nums">{firstIndex + 1}–{firstIndex + visible.length}</span> of{" "}
              <span className="font-medium text-foreground tabular-nums">{filtered.length}</span>
            </span>
            <div className="flex items-center gap-1">
              <button
                type="button"
                aria-label="Previous page"
                disabled={currentPage === 1}
                onClick={() => setPage(currentPage - 1)}
                className="flex size-8 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronLeft className="size-4" />
              </button>
              <span className="px-2 tabular-nums">
                Page <span className="font-medium text-foreground">{currentPage}</span> of {pageCount}
              </span>
              <button
                type="button"
                aria-label="Next page"
                disabled={currentPage === pageCount}
                onClick={() => setPage(currentPage + 1)}
                className="flex size-8 items-center justify-center rounded-full border border-border bg-surface transition-colors hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-40"
              >
                <ChevronRight className="size-4" />
              </button>
            </div>
          </div>
        )}
      </Card>

      {editing && (
        <CountryForm
          key={editing === "new" ? "new" : editing.code}
          initial={editing === "new" ? undefined : editing}
          existing={countries}
          onClose={() => setEditing(null)}
          onSave={save}
        />
      )}

      {deleting && <ConfirmDelete country={deleting} onCancel={() => setDeleting(null)} onConfirm={() => remove(deleting)} />}
    </div>
  );
}

function CountryForm({
  initial,
  existing,
  onClose,
  onSave,
}: {
  initial?: CountryListItem;
  existing: CountryListItem[];
  onClose: () => void;
  onSave: (item: CountryListItem, original?: CountryListItem) => void;
}) {
  const [name, setName] = useState(initial?.name ?? "");
  const [code, setCode] = useState(initial?.code ?? "");
  const [error, setError] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    const cleanName = name.trim();
    const cleanCode = code.trim().toUpperCase();
    if (!cleanName) return setError("Enter a country name.");
    if (!/^[A-Z]{2}$/.test(cleanCode)) return setError("Code must be two letters, e.g. GB.");
    const clash = existing.find((c) => c.code === cleanCode && c.code !== initial?.code);
    if (clash) return setError(`${cleanCode} is already used by ${clash.name}.`);
    onSave({ name: cleanName, code: cleanCode }, initial);
  }

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={Globe2}
      title={initial ? "Edit country" : "Add country"}
      subtitle={initial ? initial.name : "Add a country to the master list"}
      footer={
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={onClose}
            className={buttonSecondary}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="country-form"
            className={buttonPrimary}
          >
            {initial ? "Save changes" : "Add country"}
          </button>
        </div>
      }
    >
      <form id="country-form" onSubmit={submit} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 rounded-2xl bg-surface-muted/60 p-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface text-xl leading-none">
            {flagFor(code.trim().toUpperCase())}
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-semibold text-foreground">{name.trim() || "Country name"}</p>
            <p className="font-mono text-xs text-muted-foreground">{code.trim().toUpperCase() || "—"}</p>
          </div>
        </div>
        <Field label="Country name" required>
          <input
            autoFocus
            value={name}
            onChange={(e) => {
              setName(e.target.value);
              setError("");
            }}
            placeholder="e.g. United Kingdom"
            className={fieldClass}
          />
        </Field>
        <Field label="Country code" required hint="Two-letter ISO code, used for the flag.">
          <input
            value={code}
            maxLength={2}
            onChange={(e) => {
              setCode(e.target.value.replace(/[^a-z]/gi, "").toUpperCase());
              setError("");
            }}
            placeholder="GB"
            className={cn(fieldClass, "font-mono uppercase")}
          />
        </Field>
        {error && <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">{error}</p>}
      </form>
    </SlideOver>
  );
}

function ConfirmDelete({
  country,
  onCancel,
  onConfirm,
}: {
  country: CountryListItem;
  onCancel: () => void;
  onConfirm: () => void;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onCancel();
    document.addEventListener("keydown", onKey);
    return () => document.removeEventListener("keydown", onKey);
  }, [onCancel]);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onCancel} />
      <div
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="delete-title"
        className="relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5 shadow-2xl animate-fade-in"
      >
        <span className="flex size-10 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Trash2 className="size-4" />
        </span>
        <h3 id="delete-title" className="mt-3 text-[15px] font-semibold text-foreground">
          Delete {country.name}?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          It will be removed from the master list and won&apos;t be available when adding leads or applications.
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            autoFocus
            onClick={onCancel}
            className={buttonSecondary}
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onConfirm}
            className={buttonDanger}
          >
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}
