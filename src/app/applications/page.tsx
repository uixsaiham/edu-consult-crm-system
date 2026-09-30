"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import {
  Archive,
  ArrowDown,
  ArrowUp,
  BookOpen,
  CalendarPlus,
  FileUp,
  ChevronLeft,
  ChevronRight,
  ChevronsUpDown,
  Columns3,
  Copy,
  Eye,
  FileDown,
  MapPin,
  MessageCircle,
  MoreHorizontal,
  NotebookPen,
  Users,
  Plus,
  Rows3,
  SearchX,
  SquareArrowOutUpRight,
  Trash2,
  UserCog,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar } from "@/components/ui/row-selection";
import { AnchoredMenu, MenuDivider, MenuItem, MenuLabel } from "@/components/applications/list/anchored-menu";
import { ApplicationDrawer } from "@/components/applications/list/application-drawer";
import { formatCreated, whatsappLink } from "@/components/applications/list/format";
import { CourseManager } from "@/components/applications/list/course-manager";
import * as courseOps from "@/components/applications/list/course-ops";
import { DocumentRequestModal, FollowUpModal, MeetingModal, NoteModal } from "@/components/applications/list/action-modals";
import {
  applicationStageStyles,
  applicationStages,
  fundingStatuses,
  fundingStyles,
  getApplications,
  saveApplications,
  type ApplicationChannel,
  type ApplicationRow,
  type ApplicationStage,
  type CourseOption,
  type FundingStatus,
} from "@/lib/mock/applications";
import { useRowSelection } from "@/lib/use-row-selection";
import { ArchiveDialog } from "@/components/archive/archive-ui";
import { applicationArchive } from "@/lib/mock/archive";
import { downloadCsv, toCsvRow } from "@/lib/csv";
import { DropdownChevron } from "@/components/ui/dropdown-chevron";
import { cn } from "@/lib/utils";

type ChannelKey = "all" | "direct" | "agent" | "affiliate";
const channelTabs: { key: ChannelKey; label: string; channel?: ApplicationChannel }[] = [
  { key: "all", label: "All" },
  { key: "direct", label: "Direct", channel: "Direct" },
  { key: "agent", label: "Agent", channel: "Agent" },
  { key: "affiliate", label: "Affiliate", channel: "Affiliate" },
];

const optionalColumns = [
  { key: "contact", label: "Contact" },
  { key: "programme", label: "University & course" },
  { key: "campus", label: "Campus" },
  { key: "intake", label: "Intake" },
  { key: "status", label: "App status" },
  { key: "funding", label: "Fees & funding" },
  { key: "owner", label: "Branch & counsellor" },
  { key: "notes", label: "Notes" },
  { key: "studentId", label: "Student ID" },
  { key: "source", label: "Source" },
  { key: "created", label: "Created" },
] as const;
type ColumnKey = (typeof optionalColumns)[number]["key"];

const monthIndex = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const intakeValue = (intake: string) => {
  const [m, y] = intake.split(" ");
  return Number(y) * 12 + monthIndex.indexOf(m.slice(0, 3));
};

type SortKey = "student" | "intake" | "created";

function ApplicationsPageInner() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading applications…</p>}>
      <ApplicationsFromParams />
    </Suspense>
  );
}

function ApplicationsFromParams() {
  const params = useSearchParams();
  const source = params.get("source");
  const channel: ChannelKey = source === "direct" || source === "agent" || source === "affiliate" ? source : "all";
  return <ApplicationsList key={params.get("search") ?? ""} channel={channel} initialSearch={params.get("search") ?? ""} />;
}

function ApplicationsList({ channel, initialSearch }: { channel: ChannelKey; initialSearch: string }) {
  const router = useRouter();
  const { user } = useUser();
  const [apps, setApps] = useState<ApplicationRow[]>(getApplications);
  const [search, setSearch] = useState(initialSearch);
  const [stage, setStage] = useState("");
  const [intake, setIntake] = useState("");
  const [branch, setBranch] = useState("");
  const [counsellor, setCounsellor] = useState("");
  const [university, setUniversity] = useState("");
  const [funding, setFunding] = useState("");
  const [sort, setSort] = useState<{ key: SortKey; dir: "asc" | "desc" }>({ key: "created", dir: "desc" });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(15);
  const [compact, setCompact] = useState(false);
  const [hidden, setHidden] = useState<Set<ColumnKey>>(() => new Set(["studentId"]));
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<string[] | null>(null);
  const [archiving, setArchiving] = useState<string[] | null>(null);
  const [dialog, setDialog] = useState<{ kind: "courses" | "docs" | "followUp" | "meeting" | "note"; id: string } | null>(null);
  const [toast, notify] = useToast();
  useEffect(() => saveApplications(apps), [apps]);

  const channelDef = channelTabs.find((t) => t.key === channel)!;
  const scoped = useMemo(() => apps.filter((a) => !channelDef.channel || a.channel === channelDef.channel), [apps, channelDef]);

  const options = useMemo(() => {
    const uniq = (xs: string[]) => [...new Set(xs)].sort();
    return {
      intakes: [...new Set(scoped.map((a) => a.intake))].sort((a, b) => intakeValue(a) - intakeValue(b)),
      branches: uniq(scoped.map((a) => a.branch)),
      counsellors: uniq(scoped.map((a) => a.counsellor)),
      universities: uniq(scoped.map((a) => a.university)),
    };
  }, [scoped]);
  const allCounsellors = useMemo(() => [...new Set(apps.map((a) => a.counsellor))].sort(), [apps]);

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    const list = scoped.filter(
      (a) =>
        (!stage || a.stage === stage) &&
        (!intake || a.intake === intake) &&
        (!branch || a.branch === branch) &&
        (!counsellor || a.counsellor === counsellor) &&
        (!university || a.university === university) &&
        (!funding || a.funding === funding) &&
        (!q ||
          `${a.applicant} ${a.id} ${a.phone} ${a.email} ${a.university} ${a.course} ${a.studentId} ${a.source} ${a.partner ?? ""}`
            .toLowerCase()
            .includes(q))
    );
    const dir = sort.dir === "asc" ? 1 : -1;
    return [...list].sort((a, b) => {
      if (sort.key === "student") return a.applicant.localeCompare(b.applicant) * dir;
      if (sort.key === "intake") return (intakeValue(a.intake) - intakeValue(b.intake)) * dir;
      return (Date.parse(a.createdAt) - Date.parse(b.createdAt)) * dir;
    });
  }, [scoped, search, stage, intake, branch, counsellor, university, funding, sort]);

  const pageCount = Math.max(1, Math.ceil(filtered.length / pageSize));
  const current = Math.min(page, pageCount);
  const visible = filtered.slice((current - 1) * pageSize, current * pageSize);
  const selection = useRowSelection(visible.map((a) => a.id));
  const selectedApps = apps.filter((a) => selection.isSelected(a.id));
  const viewing = apps.find((a) => a.id === viewingId) ?? null;
  const dialogApp = dialog ? apps.find((a) => a.id === dialog.id) ?? null : null;
  const show = (k: ColumnKey) => !hidden.has(k);
  const hasFilters = !!(search || stage || intake || branch || counsellor || university || funding);
  const pad = compact ? "py-2" : "py-3";

  const count = (s: ApplicationStage[]) => scoped.filter((a) => s.includes(a.stage)).length;
  const withFilter = (fn: () => void) => {
    fn();
    setPage(1);
  };

  const update = (ids: string[], patch: Partial<ApplicationRow>, message: string) => {
    const set = new Set(ids);
    setApps((prev) => prev.map((a) => (set.has(a.id) ? { ...a, ...patch, updatedAt: "2026-09-17" } : a)));
    notify(message);
  };

  const patchApp = (id: string, fn: (a: ApplicationRow) => Partial<ApplicationRow>) =>
    setApps((prev) => prev.map((a) => (a.id === id ? { ...a, ...fn(a), updatedAt: "2026-09-17" } : a)));

  const saveCourse = (appId: string, draft: courseOps.CourseDraft, courseId?: string) => {
    patchApp(appId, (a) => courseOps.saveCourse(a, draft, courseId));
    notify(courseId ? "Course updated" : `Added ${draft.course}`);
  };
  const deleteCourse = (appId: string, courseId: string) => {
    patchApp(appId, (a) => courseOps.deleteCourse(a, courseId));
    notify("Course removed");
  };
  const makeMain = (appId: string, courseId: string) => {
    patchApp(appId, (a) => courseOps.makeMain(a, courseId));
    notify("Main course updated");
  };
  const patchCourse = (appId: string, courseId: string, patch: Partial<Pick<CourseOption, "stage" | "funding">>) =>
    patchApp(appId, (a) => courseOps.patchCourse(a, courseId, patch));

  const addNote = (id: string, text: string) =>
    setApps((prev) =>
      prev.map((a) => (a.id === id ? { ...a, notes: [{ text, author: user.name, at: "2026-09-17T11:00:00Z" }, ...a.notes] } : a))
    );

  const exportRows = (rows: ApplicationRow[], name: string) =>
    downloadCsv(
      name,
      rows.map((a) => ({
        ...toCsvRow(a),
        notes: a.notes.map((n) => n.text).join(" | "),
        createdAt: formatCreated(a.createdAt),
      }))
    );

  const reset = () =>
    withFilter(() => {
      setSearch("");
      setStage("");
      setIntake("");
      setBranch("");
      setCounsellor("");
      setUniversity("");
      setFunding("");
    });

  const sortHeader = (key: SortKey, label: string) => {
    const active = sort.key === key;
    const Icon = active ? (sort.dir === "asc" ? ArrowUp : ArrowDown) : ChevronsUpDown;
    return (
      <button
        type="button"
        onClick={() => setSort((s) => ({ key, dir: s.key === key && s.dir === "desc" ? "asc" : "desc" }))}
        className={cn("inline-flex items-center gap-1 uppercase tracking-wide hover:text-foreground", active && "text-foreground")}
      >
        {label}
        <Icon className={cn("size-3", !active && "opacity-50")} />
      </button>
    );
  };

  const stickyBg = (id: string) =>
    selection.isSelected(id) ? "bg-primary-soft" : "bg-surface group-hover:bg-surface-hover";

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">
            {channel === "all" ? "Applications" : `${channelDef.label} Applications`}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Every student application from submission to enrolment — status, funding, notes and ownership in one place.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportRows(filtered, `applications-${channel}.csv`)} className={buttonSecondary}>
            <FileDown className="size-4 text-muted-foreground" />
            Export
          </button>
          <Link href="/applications/new" className={buttonPrimary}>
            <Plus className="size-4" />
            New application
          </Link>
        </div>
      </header>

      <div role="tablist" aria-label="Application channel" className="inline-flex w-fit max-w-full gap-0.5 self-start overflow-x-auto rounded-full border border-border bg-surface-muted p-0.5">
        {channelTabs.map((t) => {
          const n = t.channel ? apps.filter((a) => a.channel === t.channel).length : apps.length;
          const active = t.key === channel;
          return (
            <button
              key={t.key}
              type="button"
              role="tab"
              aria-selected={active}
              onClick={() => {
                selection.clear();
                setPage(1);
                router.replace(t.key === "all" ? "/applications" : `/applications?source=${t.key}`, { scroll: false });
              }}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors",
                active ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
              )}
            >
              {t.label}
              <span className={cn("rounded-full px-1.5 text-[10px] tabular-nums", active ? "bg-primary-soft text-primary" : "bg-surface-hover")}>{n}</span>
            </button>
          );
        })}
      </div>

      <FilterBar>
        <SearchField value={search} onChange={(v) => withFilter(() => setSearch(v))} placeholder="Name, phone, email, ID, course…" label="Search applications" />
        <SelectFilter
          label="Status"
          value={stage}
          onChange={(v) => withFilter(() => setStage(v))}
          options={applicationStages.map((s) => ({ value: s, label: s, hint: count([s]), dot: applicationStageStyles[s].dot }))}
          allLabel="All statuses"
        />
        <SelectFilter label="Intake" value={intake} onChange={(v) => withFilter(() => setIntake(v))} options={options.intakes} allLabel="All intakes" />
        <SelectFilter label="University" value={university} onChange={(v) => withFilter(() => setUniversity(v))} options={options.universities} allLabel="All universities" width="w-72" />
        <SelectFilter label="Branch" value={branch} onChange={(v) => withFilter(() => setBranch(v))} options={options.branches} allLabel="All branches" />
        <SelectFilter label="Counsellor" value={counsellor} onChange={(v) => withFilter(() => setCounsellor(v))} options={options.counsellors} allLabel="All counsellors" />
        <SelectFilter label="Funding" value={funding} onChange={(v) => withFilter(() => setFunding(v))} options={fundingStatuses} allLabel="Any funding" />
        {hasFilters && <ResetFilters onClick={reset} />}
      </FilterBar>

      <Card className="flex flex-col overflow-hidden">
        <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-4">
          <div>
            <h3 className="text-[15px] font-semibold tracking-tight text-foreground">
              {stage || "All applications"}
            </h3>
            <p className="text-xs text-muted-foreground">
              {filtered.length} of {scoped.length} application{scoped.length === 1 ? "" : "s"}
              {hasFilters && " match your filters"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={() => setCompact((c) => !c)}
              aria-pressed={compact}
              title={compact ? "Comfortable rows" : "Compact rows"}
              className={cn(
                "inline-flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-xs font-medium transition-colors",
                compact ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground"
              )}
            >
              <Rows3 className="size-3.5" />
              Compact
            </button>
            <AnchoredMenu
              label="Show or hide columns"
              align="end"
              width={220}
              triggerClassName="inline-flex h-8 items-center gap-1.5 rounded-lg border border-border px-2.5 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
              trigger={
                <>
                  <Columns3 className="size-3.5" />
                  Columns
                  {hidden.size > 0 && <span className="rounded-full bg-primary-soft px-1.5 text-[10px] font-semibold text-primary">{optionalColumns.length - hidden.size}/{optionalColumns.length}</span>}
                </>
              }
            >
              {() => (
                <>
                  <MenuLabel>Visible columns</MenuLabel>
                  {optionalColumns.map((c) => (
                    <MenuItem
                      key={c.key}
                      selected={show(c.key)}
                      onClick={() =>
                        setHidden((h) => {
                          const next = new Set(h);
                          if (next.has(c.key)) next.delete(c.key);
                          else next.add(c.key);
                          return next;
                        })
                      }
                    >
                      {c.label}
                    </MenuItem>
                  ))}
                  <MenuDivider />
                  <MenuItem onClick={() => setHidden(new Set())}>Show all</MenuItem>
                </>
              )}
            </AnchoredMenu>
          </div>
        </div>

        <SelectionBar selection={selection} noun={["application", "applications"]} onExport={() => exportRows(selectedApps, "applications-selected.csv")} className="mx-4 mb-3 sm:mx-5">
          <AnchoredMenu
            label="Change status of selected"
            align="end"
            triggerClassName="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface pl-3 pr-2.5 text-xs font-semibold text-foreground hover:bg-surface-hover"
            trigger={<>Set status <DropdownChevron /></>}
          >
            {(close) =>
              applicationStages.map((s) => (
                <MenuItem
                  key={s}
                  onClick={() => {
                    update([...selection.selected], { stage: s }, `${selection.count} moved to ${s}`);
                    close();
                  }}
                >
                  {s}
                </MenuItem>
              ))
            }
          </AnchoredMenu>
          <AnchoredMenu
            label="Assign selected to counsellor"
            align="end"
            triggerClassName="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface pl-3 pr-2.5 text-xs font-semibold text-foreground hover:bg-surface-hover"
            trigger={<><UserCog className="size-3.5" /> Assign <DropdownChevron /></>}
          >
            {(close) =>
              allCounsellors.map((c) => (
                <MenuItem
                  key={c}
                  onClick={() => {
                    update([...selection.selected], { counsellor: c }, `${selection.count} assigned to ${c}`);
                    close();
                  }}
                >
                  {c}
                </MenuItem>
              ))
            }
          </AnchoredMenu>
          <BarButton onClick={() => setArchiving([...selection.selected])}>
            <Archive className="size-3.5" />
            Archive
          </BarButton>
          <BarButton tone="danger" onClick={() => setConfirmDelete([...selection.selected])}>
            <Trash2 className="size-3.5" />
            Delete
          </BarButton>
        </SelectionBar>

        {/* Own scroll area: the horizontal scrollbar stays on screen and the header stays pinned. */}
        <div className="max-h-[calc(100vh-11rem)] min-h-[320px] overflow-auto overscroll-contain border-t border-border">
          <table className="w-full min-w-[1200px] border-collapse text-left text-xs">
            <thead>
              <tr className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground [&>th]:shadow-[inset_0_-1px_0_var(--border)]">
                <th className="sticky top-0 z-30 md:left-0 w-10 min-w-10 max-w-10 bg-surface-muted py-2.5 pl-4 pr-0">
                  <HeaderCheckbox selection={selection} label="Select all applications on this page" />
                </th>
                <th className="sticky top-0 z-30 md:left-10 bg-surface-muted py-2.5 pl-3 pr-3 after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border">{sortHeader("student", "Student")}</th>
                {show("contact") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">Contact</th>}
                {show("programme") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">University & course</th>}
                {show("campus") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">Campus</th>}
                {show("intake") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">{sortHeader("intake", "Intake")}</th>}
                {show("status") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">App status</th>}
                {show("funding") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">Fees & funding</th>}
                {show("owner") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">Branch & counsellor</th>}
                {show("notes") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">Notes</th>}
                {show("studentId") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">Student ID</th>}
                {show("source") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">Source</th>}
                {show("created") && <th className="sticky top-0 z-20 bg-surface-muted px-3 py-2.5">{sortHeader("created", "Created")}</th>}
                <th className="sticky top-0 z-30 md:right-0 bg-surface-muted py-2.5 pl-3 pr-5 text-right before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border">Actions</th>
              </tr>
            </thead>
            <tbody>
              {visible.map((a) => {
                const st = applicationStageStyles[a.stage];
                const latest = a.notes[0];
                return (
                  <tr
                    key={a.id}
                    className={cn(
                      "group border-b border-border/70 transition-colors last:border-0",
                      selection.isSelected(a.id) ? "bg-primary-soft" : "hover:bg-surface-hover"
                    )}
                  >
                    <td className={cn("md:sticky md:left-0 z-10 w-10 min-w-10 max-w-10 pl-4 pr-0 align-middle", pad, stickyBg(a.id))}>
                      <RowCheckbox selection={selection} id={a.id} label={`Select ${a.applicant}`} />
                    </td>
                    <td className={cn("md:sticky md:left-10 z-10 pl-3 pr-3 align-middle after:pointer-events-none after:absolute after:inset-y-0 after:right-0 after:w-px after:bg-border", pad, stickyBg(a.id))}>
                      <button type="button" onClick={() => setViewingId(a.id)} className="flex min-w-[190px] max-w-[220px] items-center gap-2.5 text-left">
                        <span className={cn("flex shrink-0 items-center justify-center rounded-full bg-primary-soft font-bold text-primary", compact ? "size-7 text-[10px]" : "size-8 text-[11px]")}>
                          {a.initials}
                        </span>
                        <span className="min-w-0">
                          <span className="block truncate font-semibold text-foreground group-hover:text-primary">{a.applicant}</span>
                          <span className="block truncate font-mono text-[10px] text-muted-foreground">
                            {a.id}
                            {a.partner && <span className="font-sans"> · via {a.partner.replace("Ambassador: ", "")}</span>}
                          </span>
                        </span>
                      </button>
                    </td>

                    {show("contact") && (
                      <td className={cn("px-3 align-middle", pad)}>
                        <div className="flex items-center gap-1.5">
                          <a href={`tel:${a.phone.replace(/[^\d+]/g, "")}`} className="whitespace-nowrap font-medium text-foreground hover:text-primary">
                            {a.phone}
                          </a>
                          <a href={whatsappLink(a.phone)} target="_blank" rel="noreferrer" aria-label={`WhatsApp ${a.applicant}`} className="text-muted-foreground hover:text-success">
                            <MessageCircle className="size-3.5" />
                          </a>
                        </div>
                        {!compact && <p className="max-w-[180px] truncate text-[11px] text-muted-foreground">{a.email}</p>}
                      </td>
                    )}

                    {show("programme") && (
                      <td className={cn("px-3 align-middle", pad)}>
                        <div className="flex items-start gap-2">
                          <div className="min-w-0">
                            <p className="max-w-[240px] truncate font-medium text-foreground" title={a.university}>{a.university}</p>
                            <p className="max-w-[240px] truncate text-[11px] text-muted-foreground" title={a.course}>{a.course}</p>
                          </div>
                          <button
                            type="button"
                            onClick={() => setDialog({ kind: "courses", id: a.id })}
                            aria-label={`Add or manage courses for ${a.applicant}`}
                            title="Add course"
                            className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border border-dashed border-border-strong text-muted-foreground transition-colors hover:border-primary hover:bg-primary-soft hover:text-primary"
                          >
                            <Plus className="size-3" />
                          </button>
                        </div>
                        {a.courseOptions.length > 0 && (
                          <button
                            type="button"
                            onClick={() => setDialog({ kind: "courses", id: a.id })}
                            title={a.courseOptions.map((c) => `${c.course} — ${c.university}`).join("\n")}
                            className="mt-1 inline-flex items-center gap-1 rounded-md bg-primary-soft px-1.5 py-0.5 text-[10px] font-semibold text-primary hover:bg-primary/15"
                          >
                            +{a.courseOptions.length} more course{a.courseOptions.length === 1 ? "" : "s"}
                          </button>
                        )}
                      </td>
                    )}

                    {show("campus") && (
                      <td className={cn("whitespace-nowrap px-3 align-middle text-foreground", pad)}>
                        <span className="inline-flex items-center gap-1">
                          <MapPin className="size-3 text-muted-foreground" />
                          {a.campus}
                        </span>
                      </td>
                    )}

                    {show("intake") && (
                      <td className={cn("px-3 align-middle", pad)}>
                        <span className="whitespace-nowrap rounded-md border border-border px-1.5 py-0.5 font-medium text-foreground">{a.intake}</span>
                      </td>
                    )}

                    {show("status") && (
                      <td className={cn("px-3 align-middle", pad)}>
                        <AnchoredMenu
                          label={`Change status for ${a.applicant}`}
                          triggerClassName={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-2 pr-1.5 text-[11px] font-semibold transition-shadow hover:ring-2 hover:ring-current/15", st.bg, st.text)}
                          trigger={
                            <>
                              <span className={cn("size-1.5 rounded-full", st.dot)} />
                              {a.stage}
                              <DropdownChevron />
                            </>
                          }
                        >
                          {(close) => (
                            <>
                              <MenuLabel>Application status</MenuLabel>
                              {applicationStages.map((s) => (
                                <MenuItem
                                  key={s}
                                  selected={s === a.stage}
                                  onClick={() => {
                                    if (s !== a.stage) update([a.id], { stage: s }, `${a.applicant}: ${s}`);
                                    close();
                                  }}
                                >
                                  <span className="flex items-center gap-2">
                                    <span className={cn("size-1.5 rounded-full", applicationStageStyles[s].dot)} />
                                    {s}
                                  </span>
                                </MenuItem>
                              ))}
                            </>
                          )}
                        </AnchoredMenu>
                      </td>
                    )}

                    {show("funding") && (
                      <td className={cn("px-3 align-middle", pad)}>
                        <AnchoredMenu
                          label={`Change funding for ${a.applicant}`}
                          width={180}
                          triggerClassName={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-md py-1 pl-2 pr-1.5 text-[11px] font-semibold", fundingStyles[a.funding])}
                          trigger={
                            <>
                              {a.funding}
                              <DropdownChevron />
                            </>
                          }
                        >
                          {(close) => (
                            <>
                              <MenuLabel>Fees & funding</MenuLabel>
                              {fundingStatuses.map((f) => (
                                <MenuItem
                                  key={f}
                                  selected={f === a.funding}
                                  onClick={() => {
                                    if (f !== a.funding) update([a.id], { funding: f as FundingStatus }, `${a.applicant}: funding ${f}`);
                                    close();
                                  }}
                                >
                                  {f}
                                </MenuItem>
                              ))}
                            </>
                          )}
                        </AnchoredMenu>
                      </td>
                    )}

                    {show("owner") && (
                      <td className={cn("px-3 align-middle", pad)}>
                        <p className="whitespace-nowrap font-medium text-foreground">{a.branch}</p>
                        <AnchoredMenu
                          label={`Reassign ${a.applicant}`}
                          triggerClassName="inline-flex max-w-[160px] items-center gap-1 truncate text-[11px] text-muted-foreground hover:text-primary"
                          trigger={
                            <>
                              <span className="truncate">{a.counsellor}</span>
                              <DropdownChevron />
                            </>
                          }
                        >
                          {(close) => (
                            <>
                              <MenuLabel>Assign counsellor</MenuLabel>
                              {allCounsellors.map((c) => (
                                <MenuItem
                                  key={c}
                                  selected={c === a.counsellor}
                                  onClick={() => {
                                    if (c !== a.counsellor) update([a.id], { counsellor: c }, `${a.applicant} assigned to ${c}`);
                                    close();
                                  }}
                                >
                                  {c}
                                </MenuItem>
                              ))}
                            </>
                          )}
                        </AnchoredMenu>
                      </td>
                    )}

                    {show("notes") && (
                      <td className={cn("px-3 align-middle", pad)}>
                        <button type="button" onClick={() => setDialog({ kind: "note", id: a.id })} className="group/note flex max-w-[200px] items-start gap-1.5 text-left">
                          {latest ? (
                            <>
                              <span className={cn("text-[11px] text-foreground/80 group-hover/note:text-primary", compact ? "line-clamp-1" : "line-clamp-2")}>{latest.text}</span>
                              {a.notes.length > 1 && (
                                <span className="shrink-0 rounded-full bg-surface-hover px-1.5 text-[10px] font-semibold text-muted-foreground">+{a.notes.length - 1}</span>
                              )}
                            </>
                          ) : (
                            <span className="inline-flex items-center gap-1 whitespace-nowrap text-[11px] text-muted-foreground group-hover/note:text-primary">
                              <Plus className="size-3" />
                              Add note
                            </span>
                          )}
                        </button>
                      </td>
                    )}

                    {show("studentId") && (
                      <td className={cn("px-3 align-middle", pad)}>
                        {a.studentId ? <span className="font-mono text-[11px] text-foreground">{a.studentId}</span> : <span className="text-muted-foreground">—</span>}
                      </td>
                    )}

                    {show("source") && (
                      <td className={cn("px-3 align-middle", pad)}>
                        <p className="max-w-[150px] truncate text-foreground" title={a.source}>{a.source}</p>
                        {a.channel !== "Direct" && (
                          <span className={cn("mt-0.5 inline-flex rounded px-1 text-[10px] font-semibold", a.channel === "Agent" ? "bg-warning-soft text-warning" : "bg-violet-500/10 text-violet-600 dark:text-violet-400")}>
                            {a.channel}
                          </span>
                        )}
                      </td>
                    )}

                    {show("created") && (
                      <td className={cn("whitespace-nowrap px-3 align-middle", pad)}>
                        <p className="text-foreground">{formatCreated(a.createdAt).split(", ")[0]}</p>
                        <p className="text-[11px] text-muted-foreground">{formatCreated(a.createdAt).split(", ")[1]}</p>
                      </td>
                    )}

                    <td className={cn("md:sticky md:right-0 z-10 pl-3 pr-5 text-right align-middle before:pointer-events-none before:absolute before:inset-y-0 before:left-0 before:w-px before:bg-border", pad, stickyBg(a.id))}>
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => setViewingId(a.id)}
                          aria-label={`View ${a.applicant}`}
                          title="Quick view"
                          className="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
                        >
                          <Eye className="size-4" />
                        </button>
                        <AnchoredMenu
                          label={`More actions for ${a.applicant}`}
                          align="end"
                          width={200}
                          triggerClassName="flex size-7 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
                          trigger={<MoreHorizontal className="size-4" />}
                        >
                          {(close) => (
                            <>
                              <MenuItem icon={Eye} onClick={() => { setViewingId(a.id); close(); }}>Quick view</MenuItem>
                              <MenuItem icon={SquareArrowOutUpRight} onClick={() => { router.push(`/applications/${a.id}`); close(); }}>View full details</MenuItem>
                              <MenuItem icon={BookOpen} onClick={() => { setDialog({ kind: "courses", id: a.id }); close(); }}>Courses</MenuItem>
                              <MenuItem icon={NotebookPen} onClick={() => { setDialog({ kind: "note", id: a.id }); close(); }}>Add note</MenuItem>
                              <MenuDivider />
                              <MenuItem icon={FileUp} onClick={() => { setDialog({ kind: "docs", id: a.id }); close(); }}>Request documents</MenuItem>
                              <MenuItem icon={CalendarPlus} onClick={() => { setDialog({ kind: "followUp", id: a.id }); close(); }}>Schedule follow-up</MenuItem>
                              <MenuItem icon={Users} onClick={() => { setDialog({ kind: "meeting", id: a.id }); close(); }}>Book meeting</MenuItem>
                              <MenuItem
                                icon={Copy}
                                onClick={() => {
                                  void navigator.clipboard?.writeText(a.phone);
                                  notify("Phone number copied");
                                  close();
                                }}
                              >
                                Copy phone
                              </MenuItem>
                              <MenuDivider />
                              <MenuItem icon={Archive} onClick={() => { setArchiving([a.id]); close(); }}>Archive application</MenuItem>
                              <MenuItem icon={Trash2} tone="danger" onClick={() => { setConfirmDelete([a.id]); close(); }}>Delete application</MenuItem>
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

          {visible.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">
                <SearchX className="size-5" />
              </span>
              <p className="text-sm font-medium text-foreground">No applications match</p>
              <p className="text-xs text-muted-foreground">Try another status, channel or search.</p>
              {hasFilters && (
                <button type="button" onClick={reset} className="mt-1 text-xs font-semibold text-primary hover:underline">
                  Clear filters
                </button>
              )}
            </div>
          )}
        </div>

        <footer className="flex flex-wrap items-center justify-between gap-3 border-t border-border px-5 py-3 text-xs text-muted-foreground">
          <div className="flex items-center gap-2">
            <span>Rows per page</span>
            <select
              value={pageSize}
              onChange={(e) => {
                setPageSize(Number(e.target.value));
                setPage(1);
              }}
              aria-label="Rows per page"
              className="h-7 rounded-md border border-border bg-surface px-1.5 text-xs text-foreground focus:border-primary focus:outline-none"
            >
              {[15, 30, 50, 100].map((n) => (
                <option key={n}>{n}</option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-3">
            <span className="tabular-nums">
              {filtered.length === 0 ? 0 : (current - 1) * pageSize + 1}–{Math.min(current * pageSize, filtered.length)} of {filtered.length}
            </span>
            <div className="flex gap-1">
              <PageButton disabled={current <= 1} onClick={() => setPage(current - 1)} label="Previous page">
                <ChevronLeft className="size-4" />
              </PageButton>
              <PageButton disabled={current >= pageCount} onClick={() => setPage(current + 1)} label="Next page">
                <ChevronRight className="size-4" />
              </PageButton>
            </div>
          </div>
        </footer>
      </Card>

      {viewing && (
        <ApplicationDrawer
          app={viewing}
          onClose={() => setViewingId(null)}
          onStage={(s) => update([viewing.id], { stage: s }, `${viewing.applicant}: ${s}`)}
          onFunding={(f) => update([viewing.id], { funding: f }, `${viewing.applicant}: funding ${f}`)}
          onAddNote={(text) => {
            addNote(viewing.id, text);
            notify("Note added");
          }}
          onAction={(kind) => setDialog({ kind, id: viewing.id })}
          onToggleFollowUp={(fid) =>
            patchApp(viewing.id, (a) => ({ followUps: a.followUps.map((f) => (f.id === fid ? { ...f, done: !f.done } : f)) }))
          }
          onReceivedDoc={(did) => {
            patchApp(viewing.id, (a) => ({ documentRequests: a.documentRequests.map((d) => (d.id === did ? { ...d, status: "Received" } : d)) }));
            notify("Marked as received");
          }}
        />
      )}

      {dialogApp && dialog?.kind === "courses" && (
        <CourseManager
          app={dialogApp}
          onClose={() => setDialog(null)}
          onSave={(draft, id) => saveCourse(dialogApp.id, draft, id)}
          onDelete={(id) => deleteCourse(dialogApp.id, id)}
          onMakeMain={(id) => makeMain(dialogApp.id, id)}
          onPatch={(id, patch) => patchCourse(dialogApp.id, id, patch)}
        />
      )}
      {dialogApp && dialog?.kind === "docs" && (
        <DocumentRequestModal
          app={dialogApp}
          by={user.name}
          onClose={() => setDialog(null)}
          onSend={(r) => {
            patchApp(dialogApp.id, (a) => ({ documentRequests: [r, ...a.documentRequests] }));
            setDialog(null);
            notify(`Request sent to ${dialogApp.applicant} via ${r.channels.join(" & ")}`);
          }}
        />
      )}
      {dialogApp && dialog?.kind === "note" && (
        <NoteModal
          app={dialogApp}
          onClose={() => setDialog(null)}
          onSave={(text) => {
            addNote(dialogApp.id, text);
            setDialog(null);
            notify(`Note added for ${dialogApp.applicant}`);
          }}
        />
      )}
      {dialogApp && dialog?.kind === "followUp" && (
        <FollowUpModal
          app={dialogApp}
          by={user.name}
          onClose={() => setDialog(null)}
          onSave={(f) => {
            patchApp(dialogApp.id, (a) => ({ followUps: [...a.followUps, f].sort((x, y) => x.at.localeCompare(y.at)) }));
            setDialog(null);
            notify(`Follow-up scheduled for ${formatCreated(f.at)}`);
          }}
        />
      )}
      {dialogApp && dialog?.kind === "meeting" && (
        <MeetingModal
          app={dialogApp}
          counsellors={allCounsellors}
          onClose={() => setDialog(null)}
          onSave={(m) => {
            patchApp(dialogApp.id, (a) => ({ meetings: [...a.meetings, m].sort((x, y) => x.at.localeCompare(y.at)) }));
            setDialog(null);
            notify(`Meeting booked with ${m.counsellor} · ${formatCreated(m.at)}`);
          }}
        />
      )}

      {archiving && (
        <ArchiveDialog
          kind="applications"
          names={apps.filter((a) => archiving.includes(a.id)).map((a) => a.applicant)}
          onClose={() => setArchiving(null)}
          onConfirm={(meta) => {
            const ids = new Set(archiving);
            const rows = apps.filter((a) => ids.has(a.id));
            // Save the latest edits first so the archive keeps the file exactly as it is now.
            saveApplications(apps);
            applicationArchive.archive(rows, { ...meta, archivedBy: user.name });
            setApps((prev) => prev.filter((a) => !ids.has(a.id)));
            selection.retain(apps.filter((a) => !ids.has(a.id) && selection.isSelected(a.id)).map((a) => a.id));
            if (viewingId && ids.has(viewingId)) setViewingId(null);
            notify(rows.length === 1 ? `${rows[0].applicant} moved to Archived Applications` : `${rows.length} applications moved to Archived Applications`);
            setArchiving(null);
          }}
        />
      )}
      {confirmDelete && (
        <ConfirmDialog
          title={`Delete ${confirmDelete.length === 1 ? "this application" : `${confirmDelete.length} applications`}?`}
          body="This removes the application, its notes and status history. The student's lead record is kept."
          onCancel={() => setConfirmDelete(null)}
          onConfirm={() => {
            const ids = new Set(confirmDelete);
            setApps((prev) => prev.filter((a) => !ids.has(a.id)));
            selection.retain(apps.filter((a) => !ids.has(a.id)).map((a) => a.id));
            if (viewingId && ids.has(viewingId)) setViewingId(null);
            notify(`${ids.size} application${ids.size === 1 ? "" : "s"} deleted`);
            setConfirmDelete(null);
          }}
        />
      )}
      {toast}
    </div>
  );
}

function PageButton({ disabled, onClick, label, children }: { disabled: boolean; onClick: () => void; label: string; children: ReactNode }) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      aria-label={label}
      className="flex size-7 items-center justify-center rounded-md border border-border text-foreground transition-colors hover:bg-surface-hover disabled:opacity-40"
    >
      {children}
    </button>
  );
}

function ConfirmDialog({ title, body, onCancel, onConfirm }: { title: string; body: string; onCancel: () => void; onConfirm: () => void }) {
  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center p-4" role="alertdialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 bg-black/40 animate-fade-in" onClick={onCancel} />
      <div className="card-shadow relative w-full max-w-sm rounded-2xl border border-border bg-surface p-5">
        <span className="flex size-10 items-center justify-center rounded-full bg-danger-soft text-danger">
          <Trash2 className="size-5" />
        </span>
        <h3 className="mt-3 text-base font-semibold text-foreground">{title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{body}</p>
        <div className="mt-5 flex justify-end gap-2">
          <button type="button" onClick={onCancel} className={buttonSecondary} autoFocus>
            Cancel
          </button>
          <button type="button" onClick={onConfirm} className={buttonDanger}>
            Delete
          </button>
        </div>
      </div>
    </div>
  );
}

export default function ApplicationsPage() { return <Suspense><ApplicationsPageInner /></Suspense>; }
