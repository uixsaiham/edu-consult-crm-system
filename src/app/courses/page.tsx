"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  BookOpen,
  CalendarCheck,
  ChevronLeft,
  ChevronRight,
  Columns3,
  Copy,
  Download,
  FileText,
  Landmark,
  MoreHorizontal,
  Plus,
  SearchX,
  Sparkles,
  Trash2,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { Modal } from "@/components/ui/modal";
import { useToast } from "@/components/ui/toast";
import { RowActions, WebsiteToggle } from "@/components/institutions/row-actions";
import { AnchoredMenu, MenuDivider, MenuItem } from "@/components/applications/list/anchored-menu";
import { Tabs } from "@/components/office/office-ui";
import { CategoryChip, CourseDetail, CourseStatusBadge, LevelBadge, courseStatusDot } from "@/components/courses/course-ui";
import { useUser } from "@/components/layout/user-context";
import {
  applicationCounts,
  clearCourseChange,
  courseIntakes,
  durationLabel,
  formatFee,
  getCategories,
  getCourseChange,
  getCourses,
  getLevels,
  openIntakes,
  saveCourses,
  type Course,
  type CourseStatus,
} from "@/lib/mock/courses";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

type Tab = "All" | CourseStatus;
type Sort = "" | "name" | "fee" | "updated";
const PAGE = 15;

function AllCoursesPageInner() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading courses…</p>}>
      <CoursesFromParams />
    </Suspense>
  );
}

function CoursesFromParams() {
  const p = useSearchParams();
  return <CourseList key={p.toString()} initial={{ category: p.get("category") ?? "", level: p.get("level") ?? "", institution: p.get("institution") ?? "" }} />;
}

function CourseList({ initial }: { initial: { category: string; level: string; institution: string } }) {
  const { user } = useUser();
  const [courses, setCourses] = useState<Course[]>(getCourses);
  const [tab, setTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [institution, setInstitution] = useState(initial.institution);
  const [level, setLevel] = useState(initial.level);
  const [category, setCategory] = useState(initial.category);
  const [intake, setIntake] = useState("");
  const [sort, setSort] = useState<Sort>("");
  const [page, setPage] = useState(1);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [comparing, setComparing] = useState<Course[] | null>(null);
  const [deleting, setDeleting] = useState<Course[] | null>(null);
  const [lastChange] = useState(getCourseChange);
  const [toast, notify] = useToast();
  const counts = useMemo(() => applicationCounts(), []);
  const categories = getCategories();
  const levels = getLevels();

  useEffect(() => saveCourses(courses), [courses]);
  useEffect(() => {
    if (!lastChange) return;
    clearCourseChange();
    const c = getCourses().find((x) => x.id === lastChange.id);
    notify(lastChange.verb === "added" ? `${c?.name ?? "Course"} added` : `${c?.name ?? "Course"} saved`);
  }, [lastChange, notify]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = courses.filter(
      (c) =>
        (tab === "All" || c.status === tab) &&
        (!country || c.country === country) &&
        (!institution || c.institution === institution) &&
        (!level || c.level === level) &&
        (!category || c.categoryId === category) &&
        (!intake || c.intakes.includes(intake)) &&
        (!q || `${c.name} ${c.code} ${c.institution} ${c.campuses.join(" ")} ${c.country}`.toLowerCase().includes(q))
    );
    return list.sort((a, b) =>
      sort === "name" ? a.name.localeCompare(b.name) : sort === "fee" ? (a.intlFee || a.homeFee) - (b.intlFee || b.homeFee) : sort === "updated" ? b.updatedAt.localeCompare(a.updatedAt) : counts(b).total - counts(a).total || a.name.localeCompare(b.name)
    );
  }, [courses, tab, country, institution, level, category, intake, search, sort, counts]);

  const pages = Math.max(1, Math.ceil(filtered.length / PAGE));
  const current = Math.min(page, pages);
  const shown = filtered.slice((current - 1) * PAGE, current * PAGE);
  const selection = useRowSelection(shown.map((c) => c.id));
  const selected = courses.filter((c) => selection.isSelected(c.id));
  const published = courses.filter((c) => c.status === "Published");
  const hasFilters = !!(search || country || institution || level || category || intake);
  const count = (t: Tab) => (t === "All" ? courses.length : courses.filter((c) => c.status === t).length);
  const reset = () => { setSearch(""); setCountry(""); setInstitution(""); setLevel(""); setCategory(""); setIntake(""); setPage(1); };

  const patch = (ids: string[], p: Partial<Course>) => {
    const set = new Set(ids);
    const at = new Date().toISOString();
    setCourses((prev) => prev.map((c) => (set.has(c.id) ? { ...c, ...p, onWebsite: p.status && p.status !== "Published" ? false : (p.onWebsite ?? c.onWebsite), updatedAt: at, updatedBy: user.name } : c)));
  };
  const setStatus = (list: Course[], status: CourseStatus) => {
    patch(list.map((c) => c.id), { status });
    const verb = status === "Published" ? "published" : status === "Draft" ? "moved to drafts" : "closed";
    notify(list.length === 1 ? `${list[0].name} ${verb}` : `${list.length} courses ${verb}`);
  };

  const exportRows = (rows: Course[], name: string) =>
    downloadCsv(
      name,
      rows.map((c) => ({
        id: c.id, code: c.code, course: c.name, institution: c.institution, country: c.country, campuses: c.campuses.join("; "), level: c.level,
        category: categories.find((x) => x.id === c.categoryId)?.name ?? "", duration: durationLabel(c.duration), modes: c.modes.join("; "), intakes: c.intakes.join("; "),
        currency: c.currency, internationalFee: c.intlFee, homeFee: c.homeFee, deposit: c.deposit, scholarship: c.scholarship, ielts: `${c.ieltsOverall} (${c.ieltsMin})`,
        academic: c.academicRequirement, applications: counts(c).total, enrolled: counts(c).enrolled, status: c.status, website: c.onWebsite ? "Yes" : "No",
      }))
    );

  const viewing = courses.find((c) => c.id === viewingId);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Courses</h2>
          <p className="mt-1 text-sm text-muted-foreground">Every course BHE recruits for — fees, intakes and entry requirements counsellors quote to students.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportRows(filtered, "courses.csv")} className={buttonSecondary}><Download className="size-4" /> Export</button>
          <Link href="/courses/new" className={buttonPrimary}><Plus className="size-4" /> Add course</Link>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={BookOpen} label="Published courses" value={published.length} note={`${count("Draft")} draft`} onClick={() => setTab("Published")} />
        <StatCard icon={Landmark} tone="primary" label="Institutions" value={new Set(published.map((c) => c.institution)).size} note={`${new Set(published.map((c) => c.country)).size} countries`} />
        <StatCard icon={CalendarCheck} tone="violet" label="Open for Jan 2027" value={published.filter((c) => c.intakes.includes("Jan 2027")).length} onClick={() => { setIntake("Jan 2027"); setTab("Published"); setPage(1); }} />
        <StatCard icon={FileText} tone="success" label="Applications to these" value={courses.reduce((n, c) => n + counts(c).total, 0)} note={`${courses.reduce((n, c) => n + counts(c).enrolled, 0)} enrolled`} />
      </StatGrid>

      <Tabs<Tab> label="Status" value={tab} onChange={(t) => { setTab(t); setPage(1); }} options={(["All", "Published", "Draft", "Closed"] as Tab[]).map((t) => ({ value: t, label: t, count: count(t), dot: t === "All" ? undefined : courseStatusDot[t] }))} />

      <FilterBar>
        <SearchField value={search} onChange={(v) => { setSearch(v); setPage(1); }} placeholder="Course, code, institution, campus…" label="Search courses" />
        <SelectFilter label="Country" value={country} onChange={(v) => { setCountry(v); setInstitution(""); setPage(1); }} allLabel="All countries" options={[...new Set(courses.map((c) => c.country))].sort().map((c) => ({ value: c, label: c, hint: courses.filter((x) => x.country === c).length }))} />
        <SelectFilter label="University" value={institution} onChange={(v) => { setInstitution(v); setPage(1); }} allLabel="All universities" width="w-72" searchable options={[...new Set(courses.filter((c) => !country || c.country === country).map((c) => c.institution))].sort().map((i) => ({ value: i, label: i, hint: courses.filter((c) => c.institution === i).length }))} />
        <SelectFilter label="Course Level" value={level} onChange={(v) => { setLevel(v); setPage(1); }} allLabel="All levels" options={levels.map((l) => ({ value: l.name, label: l.name, dot: l.color, hint: courses.filter((c) => c.level === l.name).length }))} />
        <SelectFilter label="Course Category" value={category} onChange={(v) => { setCategory(v); setPage(1); }} allLabel="All categories" width="w-64" options={categories.map((c) => ({ value: c.id, label: c.active ? c.name : `${c.name} (inactive)`, dot: c.color, hint: courses.filter((x) => x.categoryId === c.id).length }))} />
        {hasFilters && <ResetFilters onClick={reset} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Course catalogue</h3>
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {courses.length} courses
              {search && <> matching &ldquo;<span className="font-medium text-foreground">{search}</span>&rdquo;</>}
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SelectFilter label="Intake" value={intake} onChange={(v) => { setIntake(v); setPage(1); }} allLabel="Any intake" options={courseIntakes} />
            <SelectFilter label="Sort" value={sort} onChange={(v) => setSort(v as Sort)} allLabel="Most applications" options={[{ value: "name", label: "Name A–Z" }, { value: "fee", label: "Lowest fee" }, { value: "updated", label: "Recently updated" }]} />
          </div>
        </div>
        <SelectionBar selection={selection} noun={["course", "courses"]} onExport={() => exportRows(selected, "courses-selected.csv")} className="mx-5 mt-3">
          {selected.length >= 2 && selected.length <= 4 && <BarButton onClick={() => setComparing(selected)}><Columns3 className="size-3.5" /> Compare</BarButton>}
          <BarButton onClick={() => { setStatus(selected, "Published"); selection.clear(); }}>Publish</BarButton>
          <BarButton onClick={() => { setStatus(selected, "Draft"); selection.clear(); }}>Move to draft</BarButton>
          <BarButton onClick={() => { setStatus(selected, "Closed"); selection.clear(); }} tone="danger">Close</BarButton>
        </SelectionBar>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1180px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} /></th>
                <th className="py-2.5 pl-3 pr-3">Course</th>
                <th className="px-3 py-2.5">Institution</th>
                <th className="px-3 py-2.5">Level & length</th>
                <th className="px-3 py-2.5">Tuition / yr</th>
                <th className="px-3 py-2.5">English</th>
                <th className="px-3 py-2.5">Next intake</th>
                <th className="px-3 py-2.5">Applications</th>
                <th className="px-3 py-2.5">Website</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {shown.map((c) => {
                const n = counts(c);
                const next = openIntakes(c);
                return (
                  <tr key={c.id} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, c.id), c.status === "Closed" && "opacity-60")}>
                    <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={c.id} label={`Select ${c.name}`} /></td>
                    <td className="max-w-[280px] py-3 pl-3 pr-3">
                      <button type="button" onClick={() => setViewingId(c.id)} className="block max-w-full text-left">
                        <span className="flex items-center gap-1.5">
                          <span className="truncate text-sm font-semibold text-foreground hover:text-primary">{c.name}</span>
                          {c.featured && <Sparkles className="size-3.5 shrink-0 text-amber-500" aria-label="Featured" />}
                        </span>
                        <span className="mt-0.5 flex items-center gap-1.5">
                          <span className="font-mono text-[10px] text-muted-foreground">{c.code}</span>
                          <CategoryChip id={c.categoryId} />
                        </span>
                      </button>
                    </td>
                    <td className="max-w-[220px] px-3 py-3">
                      <button type="button" onClick={() => { setInstitution(c.institution); setPage(1); }} className="block max-w-full truncate text-left font-medium text-foreground hover:text-primary" title={`Show all ${c.institution} courses`}>{c.institution}</button>
                      <p className="truncate text-[11px] text-muted-foreground">{c.country} · {c.campuses.join(", ")}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <LevelBadge name={c.level} />
                      <p className="mt-1 text-[11px] text-muted-foreground">{durationLabel(c.duration)} · {c.modes[0]}{c.modes.length > 1 ? ` +${c.modes.length - 1}` : ""}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-semibold tabular-nums text-foreground">{c.intlFee ? formatFee(c.intlFee, c.currency) : <span className="font-normal text-muted-foreground">{c.homeFee ? "Home only" : "Fee to add"}</span>}</p>
                      <p className="text-[11px] text-muted-foreground">{c.homeFee ? `Home ${formatFee(c.homeFee, c.currency)}${c.studentFinance ? " · SFE" : ""}` : c.deposit ? `Deposit ${formatFee(c.deposit, c.currency)}` : " "}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="font-medium text-foreground">IELTS {c.ieltsOverall}</p>
                      <p className="text-[11px] text-muted-foreground">{c.ieltsMin} each{c.moiAccepted ? " · MOI ok" : ""}</p>
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {next.length ? (
                        <>
                          <p className="font-medium text-foreground">{next[0]}</p>
                          <p className="text-[11px] text-muted-foreground">{next.length > 1 ? `+${next.length - 1} more` : "Only intake"}</p>
                        </>
                      ) : (
                        <span className="text-muted-foreground">None open</span>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      {n.total ? (
                        <Link href={`/applications?search=${encodeURIComponent(c.name)}`} className="group">
                          <span className="font-semibold tabular-nums text-foreground group-hover:text-primary">{n.total}</span>
                          <span className="block text-[11px] text-muted-foreground">{n.enrolled} enrolled · {n.open} open</span>
                        </Link>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      <WebsiteToggle live={c.onWebsite && c.status === "Published"} disabled={c.status !== "Published"} ariaLabel={`Show ${c.name} on the website`} onChange={(live) => { patch([c.id], { onWebsite: live }); notify(live ? `${c.name} is live on the website` : `${c.name} hidden from the website`); }} />
                    </td>
                    <td className="px-3 py-3">
                      <AnchoredMenu label={`Change status of ${c.name}`} width={170} trigger={<><CourseStatusBadge status={c.status} /></>} triggerClassName="rounded-full transition-shadow hover:ring-2 hover:ring-border">
                        {(close) => (["Published", "Draft", "Closed"] as CourseStatus[]).map((s) => (
                          <MenuItem key={s} selected={c.status === s} onClick={() => { close(); if (s !== c.status) setStatus([c], s); }}>
                            <span className="inline-flex items-center gap-2"><span className={cn("size-1.5 rounded-full", courseStatusDot[s])} />{s}</span>
                          </MenuItem>
                        ))}
                      </AnchoredMenu>
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <RowActions onView={() => setViewingId(c.id)} editHref={`/courses/${c.id}/edit`} name={c.name} editLabel="Edit course" />
                        <AnchoredMenu label={`More actions for ${c.name}`} align="end" width={180} trigger={<MoreHorizontal className="size-4" />} triggerClassName="flex size-8 items-center justify-center rounded-lg border border-border bg-surface text-muted-foreground shadow-xs transition-colors hover:bg-primary-soft hover:text-primary">
                          {(close) => (
                            <>
                              <Link href={`/courses/new?copy=${c.id}`} role="menuitem" className="flex w-full items-center gap-2 rounded-lg px-2.5 py-2 text-xs font-medium text-foreground hover:bg-surface-hover"><Copy className="size-3.5 text-muted-foreground" /> Duplicate</Link>
                              <MenuItem icon={Sparkles} onClick={() => { close(); patch([c.id], { featured: !c.featured }); notify(c.featured ? "No longer featured" : `${c.name} featured`); }}>{c.featured ? "Unfeature" : "Feature"}</MenuItem>
                              <MenuDivider />
                              <MenuItem icon={Trash2} tone="danger" onClick={() => { close(); setDeleting([c]); }}>Delete</MenuItem>
                            </>
                          )}
                        </AnchoredMenu>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground"><SearchX className="size-5" /></span>
              <p className="text-sm font-medium text-foreground">No courses match</p>
              <p className="text-xs text-muted-foreground">Try other filters, or add the course if it&apos;s missing.</p>
              <div className="mt-2 flex gap-2">
                {hasFilters && <button type="button" onClick={reset} className={buttonSecondary}>Clear filters</button>}
                <Link href="/courses/new" className={buttonPrimary}><Plus className="size-4" /> Add course</Link>
              </div>
            </div>
          )}
        </div>

        {filtered.length > PAGE && (
          <footer className="flex items-center justify-between border-t border-border px-5 py-3 text-xs text-muted-foreground">
            <span>{(current - 1) * PAGE + 1}–{Math.min(current * PAGE, filtered.length)} of {filtered.length}</span>
            <div className="flex items-center gap-1">
              <button type="button" disabled={current === 1} onClick={() => setPage(current - 1)} aria-label="Previous page" className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-surface-hover disabled:opacity-40"><ChevronLeft className="size-4" /></button>
              <span className="px-2 tabular-nums">Page {current} of {pages}</span>
              <button type="button" disabled={current === pages} onClick={() => setPage(current + 1)} aria-label="Next page" className="flex size-8 items-center justify-center rounded-lg border border-border hover:bg-surface-hover disabled:opacity-40"><ChevronRight className="size-4" /></button>
            </div>
          </footer>
        )}
      </Card>

      {viewing && <CourseDetail course={viewing} onClose={() => setViewingId(null)} />}
      {comparing && <CompareDialog courses={comparing} counts={counts} onClose={() => setComparing(null)} />}

      <Modal
        open={!!deleting}
        onClose={() => setDeleting(null)}
        icon={Trash2}
        size="sm"
        title={deleting?.length === 1 ? `Delete ${deleting[0].name}?` : `Delete ${deleting?.length} courses?`}
        subtitle="This can't be undone."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={() => { const ids = new Set(deleting!.map((c) => c.id)); setCourses((prev) => prev.filter((c) => !ids.has(c.id))); selection.clear(); notify(deleting!.length === 1 ? `${deleting![0].name} deleted` : `${deleting!.length} courses deleted`); setDeleting(null); }} className={buttonDanger}>Delete</button>
          </div>
        }
      >
        {(() => {
          const apps = deleting?.reduce((n, c) => n + counts(c).total, 0) ?? 0;
          return (
            <p className="text-sm text-muted-foreground">
              {apps ? `${apps} application${apps === 1 ? "" : "s"} use this course. They keep the course name, but it can't be chosen for new applications. Closing the course does the same and keeps its details — ` : "It disappears from the course picker and the website. "}
              {apps ? <button type="button" className="font-semibold text-primary hover:underline" onClick={() => { setStatus(deleting!, "Closed"); setDeleting(null); }}>close it instead</button> : null}
            </p>
          );
        })()}
      </Modal>
      {toast}
    </div>
  );
}

function CompareDialog({ courses, counts, onClose }: { courses: Course[]; counts: ReturnType<typeof applicationCounts>; onClose: () => void }) {
  const rows: [string, (c: Course) => string][] = [
    ["Institution", (c) => c.institution],
    ["Country · campus", (c) => `${c.country} · ${c.campuses.join(", ")}`],
    ["Level", (c) => c.level],
    ["Duration", (c) => `${durationLabel(c.duration)}${c.placement ? " + placement" : ""}`],
    ["Study mode", (c) => c.modes.join(", ")],
    ["Intakes", (c) => c.intakes.join(", ")],
    ["International fee", (c) => (c.intlFee ? formatFee(c.intlFee, c.currency) : "Home only")],
    ["Home fee", (c) => (c.homeFee ? formatFee(c.homeFee, c.currency) : "—")],
    ["Deposit", (c) => (c.deposit ? formatFee(c.deposit, c.currency) : "—")],
    ["Scholarship", (c) => c.scholarship || "—"],
    ["Academic", (c) => c.academicRequirement],
    ["IELTS", (c) => `${c.ieltsOverall} (${c.ieltsMin} each)${c.moiAccepted ? " · MOI ok" : ""}`],
    ["Work experience", (c) => c.workExperience || "—"],
    ["Applications", (c) => `${counts(c).total} (${counts(c).enrolled} enrolled)`],
  ];
  const differs = (fn: (c: Course) => string) => new Set(courses.map(fn)).size > 1;
  return (
    <Modal open onClose={onClose} icon={Columns3} size="lg" title={`Compare ${courses.length} courses`} subtitle="Differences are highlighted — useful when a student is choosing between offers.">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[560px] text-left text-xs">
          <thead>
            <tr>
              <th className="w-32" />
              {courses.map((c) => <th key={c.id} className="px-3 pb-3 align-bottom text-sm font-semibold text-foreground">{c.name}</th>)}
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {rows.map(([label, fn]) => (
              <tr key={label} className={cn(differs(fn) && "bg-primary-soft/40")}>
                <th className="py-2.5 pr-3 text-[11px] font-semibold text-muted-foreground">{label}</th>
                {courses.map((c) => <td key={c.id} className="px-3 py-2.5 text-foreground">{fn(c)}</td>)}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Modal>
  );
}

export default function AllCoursesPage() { return <Suspense><AllCoursesPageInner /></Suspense>; }
