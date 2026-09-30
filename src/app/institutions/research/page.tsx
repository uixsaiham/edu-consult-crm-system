"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import { ChevronDown, CircleAlert, ExternalLink, GraduationCap, Loader2, Plus, RotateCcw, Search, Sparkles, Square, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { getInstitutions } from "@/lib/mock/institution-store";
import { researchLevels, type FinderEvent, type FoundCourse, type ResearchFocus } from "@/lib/research/types";
import { addCourses, courseListStore, existingCourseNames, institutionFor, isExisting, type CachedList } from "@/lib/research/import";
import { logAudit } from "@/lib/settings/audit";
import { useSettingsStore } from "@/lib/settings/store";
import { cn } from "@/lib/utils";

interface University {
  name: string;
  country: string;
  domain: string;
  website: string;
}

const host = (url: string) => { try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return url; } };
const keyOf = (u: Pick<University, "name" | "country">) => `${u.name}|${u.country}`.toLowerCase();

export default function CourseFinderPage() {
  const { user } = useUser();
  const cache = useSettingsStore(courseListStore);
  const [uni, setUni] = useState<University | null>(null);
  const [focus, setFocus] = useState<ResearchFocus>("All levels");
  const [configured, setConfigured] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);
  const [steps, setSteps] = useState<FinderEvent[]>([]);
  const [error, setError] = useState("");
  const [started, setStarted] = useState(0);
  const [now, setNow] = useState(0);
  const ctrl = useRef<AbortController | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => {
    let live = true;
    fetch("/api/research/courses", { cache: "no-store" }).then((r) => r.json()).then((d: { configured: boolean }) => live && setConfigured(d.configured)).catch(() => live && setConfigured(false));
    return () => { live = false; };
  }, []);
  useEffect(() => {
    if (!running) return;
    const t = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(t);
  }, [running]);

  const list = uni ? cache.find((c) => keyOf({ name: c.university, country: c.country }) === keyOf(uni)) : undefined;

  const find = async (u: University, f: ResearchFocus) => {
    if (!configured) return;
    ctrl.current?.abort();
    const ac = new AbortController();
    ctrl.current = ac;
    setRunning(true);
    setSteps([]);
    setError("");
    setStarted(Date.now());
    setNow(Date.now());
    try {
      const res = await fetch("/api/research/courses", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ university: u.name, country: u.country, domain: u.domain, focus: f }), signal: ac.signal });
      if (!res.ok || !res.body) throw new Error(((await res.json().catch(() => ({}))) as { error?: string }).error ?? `Request failed (${res.status})`);
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";
      let done = false;
      for (;;) {
        const chunk = await reader.read();
        if (chunk.done) break;
        buffer += decoder.decode(chunk.value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() ?? "";
        for (const line of lines.filter((l) => l.trim())) {
          const e = JSON.parse(line) as FinderEvent;
          setSteps((s) => [...s, e]);
          if (e.type === "result") {
            done = true;
            const entry: CachedList = { university: u.name, country: u.country, domain: u.domain, website: u.website, courses: e.courses, sources: e.sources, focus: f, at: new Date().toISOString() };
            courseListStore.set([entry, ...courseListStore.get().filter((c) => keyOf({ name: c.university, country: c.country }) !== keyOf(u))].slice(0, 40));
          } else if (e.type === "error") {
            done = true;
            setError(e.message);
          }
        }
      }
      if (!done) setError("The connection closed before the search finished.");
    } catch (err) {
      if (!ac.signal.aborted) setError((err as Error).message);
    } finally {
      if (ctrl.current === ac) setRunning(false);
    }
  };

  const choose = (u: University) => {
    setUni(u);
    setError("");
    setSteps([]);
    const cached = cache.some((c) => keyOf({ name: c.university, country: c.country }) === keyOf(u));
    if (!cached) void find(u, focus);
  };
  const clear = () => {
    ctrl.current?.abort();
    setRunning(false);
    setUni(null);
    setSteps([]);
    setError("");
  };

  const last = [...steps].reverse().find((s) => s.type === "search" || s.type === "fetch" || s.type === "status");
  const pages = steps.filter((s) => s.type === "fetch").length;
  const elapsed = Math.max(0, Math.round((now - started) / 1000));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground"><Sparkles className="size-6 text-primary" /> AI Course Finder</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Choose any university in the world. The AI agent reads its official website and lists its courses — pick the ones you want and add them to Courses.</p>
        </div>
        <span className={cn("inline-flex items-center gap-1.5 self-start rounded-full px-3 py-1 text-xs font-medium", configured ? "bg-success-soft text-success" : configured === false ? "bg-warning-soft text-warning" : "bg-surface-muted text-muted-foreground")}>
          <span className={cn("size-2 rounded-full", configured ? "bg-success" : configured === false ? "bg-warning" : "bg-muted-foreground")} />
          {configured ? "AI agent connected" : configured === false ? "Claude API key needed" : "Checking…"}
        </span>
      </header>

      {configured === false && (
        <p className="flex gap-2 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm text-foreground">
          <CircleAlert className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>University search works now. To find courses, add <code className="rounded bg-surface px-1">ANTHROPIC_API_KEY=…</code> to <code className="rounded bg-surface px-1">.env.local</code> on the server and restart. Lists you&apos;ve already found still open.</span>
        </p>
      )}

      <Card className="p-4 sm:p-5">
        <p className="mb-1.5 text-xs font-semibold text-foreground">1. University</p>
        {uni ? (
          <div className="flex flex-wrap items-center gap-3 rounded-2xl border border-primary/30 bg-primary-soft/50 px-4 py-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-xl bg-surface text-primary"><GraduationCap className="size-5" /></span>
            <div className="min-w-0 flex-1">
              <p className="truncate text-sm font-semibold text-foreground">{uni.name}</p>
              <p className="text-xs text-muted-foreground">{uni.country}{uni.domain && <> · <a href={uni.website || `https://${uni.domain}`} target="_blank" rel="noreferrer" className="inline-flex items-center gap-0.5 text-primary hover:underline">{uni.domain} <ExternalLink className="size-3" /></a></>}{institutionFor(uni.name) && " · already in Institutions"}</p>
            </div>
            <button type="button" onClick={clear} className={cn(buttonSecondary, "h-9")}><X className="size-4" /> Change</button>
          </div>
        ) : (
          <UniversityPicker onPick={choose} recent={cache} />
        )}

        {uni && (
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <p className="text-xs font-semibold text-foreground">Level</p>
            <div className="inline-flex rounded-full border border-border bg-surface-muted p-0.5">
              {(["All levels", "Undergraduate", "Postgraduate"] as const).map((f) => (
                <button key={f} type="button" aria-pressed={focus === f} onClick={() => setFocus(f)} className={cn("rounded-full px-3 py-1.5 text-xs font-semibold", focus === f ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:text-foreground")}>{f === "All levels" ? "All" : f}</button>
              ))}
            </div>
            {!running && (
              <button type="button" onClick={() => find(uni, focus)} disabled={!configured} className={cn(list ? buttonSecondary : buttonPrimary, "h-9 disabled:opacity-50")}>
                {list ? <><RotateCcw className="size-4" /> Find again</> : <><Search className="size-4" /> Find courses</>}
              </button>
            )}
            {list && !running && <span className="text-xs text-muted-foreground">Found {formatDay(list.at)} · {list.focus.toLowerCase()}</span>}
          </div>
        )}
      </Card>

      {uni && running && (
        <Card className="flex items-center gap-4 p-5">
          <Loader2 className="size-6 shrink-0 animate-spin text-primary" />
          <div className="min-w-0 flex-1">
            <p className="text-sm font-semibold text-foreground">Finding courses at {uni.name}…</p>
            <p className="truncate text-xs text-muted-foreground">
              {!last ? "Starting" : last.type === "search" ? `Searching “${last.query}”` : last.type === "fetch" ? `Reading ${host(last.url)}${new URL(last.url).pathname}` : last.type === "status" ? last.message : ""}
            </p>
            <p className="mt-0.5 text-[11px] tabular-nums text-muted-foreground">{pages} page{pages === 1 ? "" : "s"} read · {Math.floor(elapsed / 60)}:{String(elapsed % 60).padStart(2, "0")} — usually under two minutes</p>
          </div>
          <button type="button" onClick={() => { ctrl.current?.abort(); setRunning(false); }} className={cn(buttonSecondary, "h-9")}><Square className="size-3.5" /> Stop</button>
        </Card>
      )}

      {uni && error && !running && (
        <p className="flex gap-2 rounded-2xl border border-danger/25 bg-danger-soft px-4 py-3 text-sm text-foreground"><CircleAlert className="mt-0.5 size-4 shrink-0 text-danger" />{error}</p>
      )}

      {uni && list && !running && (
        <CoursePicker
          key={`${keyOf(uni)}-${list.at}`}
          list={list}
          onAdd={(picked) => {
            const out = addCourses(list, picked, user.name);
            logAudit({ actor: user.name, role: user.role, module: "Settings", action: "Created", entity: "Courses", entityId: out.institutionId, summary: `Added ${out.added} course${out.added === 1 ? "" : "s"} for ${list.university} from the course finder${out.createdInstitution ? " (institution created)" : ""}`, severity: "info" });
            notify(`${out.added} course${out.added === 1 ? "" : "s"} added as drafts${out.createdInstitution ? ` · ${list.university} added to Institutions` : ""}`);
          }}
        />
      )}

      {!uni && (
        <Card className="flex flex-col items-center gap-2 px-6 py-14 text-center">
          <span className="flex size-12 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Search className="size-6" /></span>
          <p className="text-sm font-semibold text-foreground">Start by choosing a university</p>
          <p className="max-w-md text-xs text-muted-foreground">Type part of the name — for example “Hertford”, “Toronto” or “Dhaka”. Courses are added as drafts so you can fill in fees and intakes before publishing.</p>
        </Card>
      )}
      {toast}
    </div>
  );
}

/** Searchable dropdown over the worldwide universities directory plus institutions already in the CRM. */
function UniversityPicker({ onPick, recent }: { onPick: (u: University) => void; recent: CachedList[] }) {
  const [q, setQ] = useState("");
  const [items, setItems] = useState<University[]>([]);
  const [loading, setLoading] = useState(false);
  const [open, setOpen] = useState(false);
  const [active, setActive] = useState(0);
  const [warn, setWarn] = useState("");
  const box = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (e: PointerEvent) => { if (box.current && !box.current.contains(e.target as Node)) setOpen(false); };
    document.addEventListener("pointerdown", onDown);
    return () => document.removeEventListener("pointerdown", onDown);
  }, []);

  useEffect(() => {
    const term = q.trim();
    if (term.length < 2) return;
    const ac = new AbortController();
    const t = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/universities?q=${encodeURIComponent(term)}`, { signal: ac.signal });
        const data = (await res.json()) as { items: University[]; error?: string };
        setItems(data.items);
        setWarn(data.error ?? "");
        setActive(0);
      } catch {
        /* superseded */
      } finally {
        if (!ac.signal.aborted) setLoading(false);
      }
    }, 250);
    return () => { clearTimeout(t); ac.abort(); };
  }, [q]);

  const term = q.trim().toLowerCase();
  const local = useMemo(() => (term.length < 2 ? [] : getInstitutions().filter((i) => i.name.toLowerCase().includes(term)).map<University>((i) => ({ name: i.name, country: i.country, domain: i.website ? host(i.website) : "", website: i.website ?? "" }))), [term]);
  const merged = term.length < 2 ? [] : [...local, ...items.filter((it) => !local.some((l) => keyOf(l) === keyOf(it)))].slice(0, 30);
  const typed: University | null = term.length >= 3 && !merged.some((m) => m.name.toLowerCase() === term) ? { name: q.trim(), country: "", domain: "", website: "" } : null;
  const options = typed ? [...merged, typed] : merged;
  const pick = (u: University) => { onPick(u); setOpen(false); setQ(""); };

  return (
    <div ref={box} className="relative">
      <div className={cn("flex h-11 items-center gap-2 rounded-xl border bg-surface px-3.5 transition-shadow", open ? "border-primary ring-4 ring-primary/10" : "border-border")}>
        <Search className="size-4 shrink-0 text-muted-foreground" />
        <input
          value={q}
          onChange={(e) => { setQ(e.target.value); setOpen(true); }}
          onFocus={() => setOpen(true)}
          onKeyDown={(e) => {
            if (e.key === "ArrowDown") { e.preventDefault(); setActive((a) => Math.min(options.length - 1, a + 1)); }
            else if (e.key === "ArrowUp") { e.preventDefault(); setActive((a) => Math.max(0, a - 1)); }
            else if (e.key === "Enter" && options[active]) { e.preventDefault(); pick(options[active]); }
            else if (e.key === "Escape") setOpen(false);
          }}
          placeholder="Search universities worldwide…"
          role="combobox"
          aria-expanded={open}
          aria-controls="uni-options"
          aria-label="Search universities"
          className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
        />
        {loading ? <Loader2 className="size-4 animate-spin text-muted-foreground" /> : <ChevronDown className="size-4 text-muted-foreground" />}
      </div>

      {open && (term.length >= 2 || recent.length > 0) && (
        <ul id="uni-options" role="listbox" className="absolute inset-x-0 top-full z-30 mt-1.5 max-h-80 overflow-y-auto rounded-2xl border border-border bg-surface p-1.5 shadow-2xl">
          {term.length < 2 && (
            <>
              <li className="px-2.5 pb-1 pt-1.5 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">Recently searched</li>
              {recent.slice(0, 6).map((r) => (
                <li key={keyOf({ name: r.university, country: r.country })} role="option" aria-selected={false}>
                  <button type="button" onClick={() => pick({ name: r.university, country: r.country, domain: r.domain, website: r.website })} className="flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left hover:bg-surface-hover">
                    <span className="min-w-0"><span className="block truncate text-sm text-foreground">{r.university}</span><span className="block text-[11px] text-muted-foreground">{r.country} · {r.courses.length} courses found</span></span>
                  </button>
                </li>
              ))}
            </>
          )}
          {options.map((o, i) => {
            const inCrm = !!institutionFor(o.name);
            const isTyped = o === typed;
            return (
              <li key={`${keyOf(o)}-${i}`} role="option" aria-selected={i === active}>
                <button type="button" onMouseEnter={() => setActive(i)} onClick={() => pick(o)} className={cn("flex w-full items-center justify-between gap-3 rounded-xl px-2.5 py-2 text-left", i === active ? "bg-primary-soft" : "hover:bg-surface-hover")}>
                  <span className="min-w-0">
                    <span className="block truncate text-sm text-foreground">{isTyped ? <>Use “<span className="font-semibold">{o.name}</span>”</> : o.name}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{isTyped ? "Not in the directory — search by name" : [o.country, o.domain].filter(Boolean).join(" · ")}</span>
                  </span>
                  {inCrm && <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">In CRM</span>}
                </button>
              </li>
            );
          })}
          {term.length >= 2 && !loading && !options.length && <li className="px-3 py-6 text-center text-xs text-muted-foreground">No universities match.</li>}
          {warn && <li className="px-3 py-2 text-[11px] text-warning">{warn}</li>}
        </ul>
      )}
    </div>
  );
}

/** Tick-list of the found courses; ones already in Courses are marked and can't be added twice. */
function CoursePicker({ list, onAdd }: { list: CachedList; onAdd: (picked: FoundCourse[]) => void }) {
  const [have, setHave] = useState(() => existingCourseNames(list.university));
  const [q, setQ] = useState("");
  const [level, setLevel] = useState("");
  const [picked, setPicked] = useState<Set<string>>(new Set());
  const addable = (c: FoundCourse) => !isExisting(have, c.name);
  const shown = list.courses.filter((c) => (!level || c.level === level) && (!q || c.name.toLowerCase().includes(q.toLowerCase())));
  const shownAddable = shown.filter(addable);
  const allShownPicked = shownAddable.length > 0 && shownAddable.every((c) => picked.has(c.name));
  const toggle = (name: string) => setPicked((p) => { const n = new Set(p); if (n.has(name)) n.delete(name); else n.add(name); return n; });
  const inCrm = list.courses.length - list.courses.filter(addable).length;

  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center gap-2 px-5 pt-5">
        <div className="mr-auto">
          <p className="text-xs font-semibold text-foreground">2. Courses at {list.university}</p>
          <p className="text-[11px] text-muted-foreground">{list.courses.length} found{inCrm ? ` · ${inCrm} already in Courses` : ""}{list.sources[0] && <> · from <a href={list.sources[0]} target="_blank" rel="noreferrer" className="text-primary hover:underline">{host(list.sources[0])}</a></>}</p>
        </div>
        <label className="relative"><Search className="pointer-events-none absolute left-2.5 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground" /><input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter courses" aria-label="Filter courses" className="h-9 w-52 rounded-lg border border-border bg-surface pl-8 pr-2 text-xs focus:border-primary focus:outline-none" /></label>
      </div>
      <div className="mt-3 flex flex-wrap gap-1.5 px-5">
        {["", ...researchLevels.filter((l) => list.courses.some((c) => c.level === l))].map((l) => (
          <button key={l || "all"} type="button" aria-pressed={level === l} onClick={() => setLevel(l)} className={cn("rounded-full border px-3 py-1 text-xs font-medium", level === l ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:bg-surface-hover")}>
            {l || "All"} <span className="opacity-70">{l ? list.courses.filter((c) => c.level === l).length : list.courses.length}</span>
          </button>
        ))}
      </div>

      <div className="mt-3 border-t border-border">
        <label className="flex cursor-pointer items-center gap-3 border-b border-border bg-surface-muted px-5 py-2.5 text-xs font-semibold text-foreground">
          <input type="checkbox" checked={allShownPicked} disabled={!shownAddable.length} onChange={() => setPicked((p) => { const n = new Set(p); shownAddable.forEach((c) => (allShownPicked ? n.delete(c.name) : n.add(c.name))); return n; })} className="size-4 accent-primary" />
          Select all {shownAddable.length} shown
        </label>
        <ul className="max-h-[52vh] divide-y divide-border overflow-y-auto">
          {shown.map((c) => {
            const can = addable(c);
            return (
              <li key={c.name}>
                <label className={cn("flex items-center gap-3 px-5 py-2.5", can ? "cursor-pointer hover:bg-surface-hover/60" : "opacity-60")}>
                  <input type="checkbox" checked={can && picked.has(c.name)} disabled={!can} onChange={() => toggle(c.name)} className="size-4 accent-primary" />
                  <span className="min-w-0 flex-1 truncate text-sm text-foreground">{c.name}</span>
                  <span className="shrink-0 text-[11px] text-muted-foreground">{c.level}</span>
                  {!can && <span className="shrink-0 rounded-full bg-success-soft px-2 py-0.5 text-[10px] font-semibold text-success">In Courses</span>}
                </label>
              </li>
            );
          })}
          {!shown.length && <li className="px-5 py-10 text-center text-xs text-muted-foreground">No courses match.</li>}
        </ul>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-border bg-surface px-5 py-3">
        <span className="text-xs text-muted-foreground">{picked.size} selected · added as drafts</span>
        <div className="flex gap-2">
          <Link href="/courses" className={cn(buttonSecondary, "h-9")}>Open Courses</Link>
          <button
            type="button"
            disabled={!picked.size}
            onClick={() => { onAdd(list.courses.filter((c) => picked.has(c.name))); setHave(existingCourseNames(list.university)); setPicked(new Set()); }}
            className={cn(buttonPrimary, "h-9 disabled:opacity-50")}
          >
            <Plus className="size-4" /> Add {picked.size || ""} course{picked.size === 1 ? "" : "s"}
          </button>
        </div>
      </div>
    </Card>
  );
}
