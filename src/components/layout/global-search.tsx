"use client";

import { useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ClipboardList, Search, Users2 } from "lucide-react";
import { getLeads } from "@/lib/mock/leads";
import { getApplications } from "@/lib/mock/applications";
import { useClickOutside } from "@/lib/use-click-outside";

type Result =
  | { kind: "lead"; id: string; title: string; subtitle: string }
  | { kind: "application"; id: string; title: string; subtitle: string };

const allLeads = getLeads();
const allApplications = getApplications();

export function GlobalSearch() {
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const router = useRouter();

  useClickOutside(ref, () => setOpen(false), open);

  const results = useMemo<Result[]>(() => {
    const q = query.trim().toLowerCase();
    if (q.length < 2) return [];

    const leadMatches: Result[] = allLeads
      .filter(
        (l) =>
          l.name.toLowerCase().includes(q) ||
          l.email.toLowerCase().includes(q) ||
          l.phone.toLowerCase().includes(q) ||
          l.id.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((l) => ({ kind: "lead", id: l.id, title: l.name, subtitle: `${l.email} · ${l.id}` }));

    const applicationMatches: Result[] = allApplications
      .filter(
        (a) =>
          a.applicant.toLowerCase().includes(q) ||
          a.course.toLowerCase().includes(q) ||
          a.university.toLowerCase().includes(q) ||
          a.id.toLowerCase().includes(q)
      )
      .slice(0, 4)
      .map((a) => ({ kind: "application", id: a.id, title: a.applicant, subtitle: `${a.course} · ${a.university}` }));

    return [...leadMatches, ...applicationMatches];
  }, [query]);

  function goTo(result: Result) {
    setOpen(false);
    setQuery("");
    router.push(result.kind === "lead" ? "/leads" : "/applications");
  }

  return (
    <div ref={ref} className="relative hidden lg:block">
      <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
      <input
        type="text"
        aria-label="Search leads and applications"
        placeholder="Search leads, applications..."
        value={query}
        onChange={(e) => {
          setQuery(e.target.value);
          setOpen(true);
        }}
        onFocus={() => setOpen(true)}
        className="w-64 rounded-full border border-border bg-surface-muted py-2.5 pl-10 pr-4 text-sm outline-none placeholder:text-muted-foreground focus:border-primary focus:ring-4 focus:ring-primary/10"
      />

      {open && query.trim().length >= 2 && (
        <div className="absolute left-0 top-full z-30 mt-2 w-96 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl animate-fade-in">
          {results.length === 0 ? (
            <p className="px-4 py-8 text-center text-xs text-muted-foreground">
              No leads or applications match &quot;{query}&quot;
            </p>
          ) : (
            <ul className="max-h-96 divide-y divide-border/70 overflow-y-auto">
              {results.map((r) => (
                <li key={`${r.kind}-${r.id}`}>
                  <button
                    type="button"
                    onClick={() => goTo(r)}
                    className="flex w-full items-center gap-3 px-4 py-2.5 text-left transition-colors hover:bg-surface-muted/60"
                  >
                    <span
                      className={
                        r.kind === "lead"
                          ? "flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary"
                          : "flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent-soft text-accent"
                      }
                    >
                      {r.kind === "lead" ? <Users2 className="size-4" /> : <ClipboardList className="size-4" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="flex items-center gap-1.5">
                        <span className="truncate text-xs font-semibold text-foreground">{r.title}</span>
                        <span className="shrink-0 rounded-full bg-surface-muted px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-muted-foreground">
                          {r.kind}
                        </span>
                      </span>
                      <span className="mt-0.5 block truncate text-[11px] text-muted-foreground">{r.subtitle}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}
