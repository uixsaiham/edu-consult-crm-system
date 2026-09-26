"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { BookOpen, ChevronDown, CircleAlert, Clock3, GraduationCap, Landmark, MapPin, Pencil, Plus, Star, Trash2, CalendarDays } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { buttonPrimary } from "@/components/ui/button-styles";
import {
  applicationStageStyles,
  applicationStages,
  fundingStatuses,
  fundingStyles,
  type ApplicationRow,
  type CourseOption,
} from "@/lib/mock/applications";
import {
  catalog,
  catalogCountries,
  catalogIntakes,
  courseLevels,
  deliveryModes,
  findUniversity,
  type CourseLevel,
  type DeliveryMode,
} from "@/lib/mock/course-catalog";
import { cn } from "@/lib/utils";
import { AnchoredMenu, MenuItem, MenuLabel } from "./anchored-menu";

export const MAIN = "main";

/** The main course and the alternatives, as one list of cards. */
export function coursesOf(app: ApplicationRow): CourseOption[] {
  return [
    {
      id: MAIN,
      country: app.country,
      university: app.university,
      course: app.course,
      level: app.level,
      mode: app.mode,
      campus: app.campus,
      intake: app.intake,
      stage: app.stage,
      funding: app.funding,
    },
    ...app.courseOptions,
  ];
}

type Draft = Omit<CourseOption, "id" | "stage" | "funding">;
const emptyDraft = (app: ApplicationRow): Draft => ({
  country: app.country,
  university: "",
  course: "",
  level: "Undergraduate",
  mode: "Full time",
  campus: "",
  intake: app.intake,
});

const selectClass =
  "h-10 w-full cursor-pointer appearance-none rounded-xl border border-border bg-surface px-3 pr-8 text-sm text-foreground focus:border-primary focus:outline-none focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:text-muted-foreground";

export function CourseManager({
  app,
  onClose,
  onSave,
  onDelete,
  onMakeMain,
  onPatch,
}: {
  app: ApplicationRow;
  onClose: () => void;
  /** `id` is the course being edited, or undefined to add a new one. */
  onSave: (draft: Draft, id?: string) => void;
  onDelete: (id: string) => void;
  onMakeMain: (id: string) => void;
  onPatch: (id: string, patch: Partial<Pick<CourseOption, "stage" | "funding">>) => void;
}) {
  const courses = coursesOf(app);
  const [draft, setDraft] = useState<Draft>(() => emptyDraft(app));
  const [editingId, setEditingId] = useState<string | undefined>();
  const [tried, setTried] = useState(false);

  const uni = findUniversity(draft.university);
  const universities = catalog.filter((u) => u.country === draft.country);
  const set = <K extends keyof Draft>(k: K, v: Draft[K]) => setDraft((d) => ({ ...d, [k]: v }));

  const duplicate = courses.some(
    (c) => c.id !== editingId && c.university === draft.university && c.course.toLowerCase() === draft.course.trim().toLowerCase()
  );
  const errors: Partial<Record<keyof Draft, string>> = {};
  if (!draft.country) errors.country = "Choose a country";
  if (!draft.university) errors.university = "Choose a university";
  if (!draft.course.trim()) errors.course = "Choose a course";
  else if (duplicate) errors.course = "Already on this application";
  if (!draft.campus.trim()) errors.campus = "Enter a campus";
  const valid = Object.keys(errors).length === 0;
  const err = (k: keyof Draft) => (tried ? errors[k] : undefined);

  const reset = () => {
    setDraft(emptyDraft(app));
    setEditingId(undefined);
    setTried(false);
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!valid) return;
    onSave({ ...draft, course: draft.course.trim(), campus: draft.campus.trim() }, editingId);
    reset();
  };

  const edit = (c: CourseOption) => {
    setEditingId(c.id);
    setDraft({ country: c.country, university: c.university, course: c.course, level: c.level, mode: c.mode, campus: c.campus, intake: c.intake });
    setTried(false);
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="lg"
      icon={BookOpen}
      title="Courses"
      subtitle={`${app.applicant} · ${courses.length} course${courses.length === 1 ? "" : "s"} on this application`}
      footer={
        <div className="flex justify-end">
          <button type="button" onClick={onClose} className={buttonPrimary}>
            Done
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <form onSubmit={submit} noValidate className="rounded-2xl border border-border bg-surface-muted p-4">
          <div className="mb-3 flex items-center justify-between gap-2">
            <p className="text-sm font-semibold text-foreground">{editingId ? "Edit course" : "Add a course"}</p>
            {editingId && (
              <button type="button" onClick={reset} className="text-xs font-medium text-muted-foreground hover:text-foreground">
                Cancel editing
              </button>
            )}
          </div>
          <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            <Labeled label="Country" error={err("country")}>
              <SelectBox
                value={draft.country}
                onChange={(v) => setDraft((d) => ({ ...d, country: v, university: "", course: "", campus: "" }))}
                options={catalogCountries}
                placeholder="Select country"
              />
            </Labeled>
            <Labeled label="University" error={err("university")}>
              <SelectBox
                value={draft.university}
                onChange={(v) => {
                  const u = findUniversity(v);
                  setDraft((d) => ({ ...d, university: v, course: "", campus: u?.campuses.length === 1 ? u.campuses[0] : "" }));
                }}
                options={[...new Set([...universities.map((u) => u.name), ...(draft.university ? [draft.university] : [])])]}
                placeholder={draft.country ? "Select university" : "Choose a country first"}
                disabled={!draft.country}
              />
            </Labeled>
            <Labeled label="Course" error={err("course")}>
              <SelectBox
                value={draft.course}
                onChange={(v) => {
                  const level = uni?.courses.find((c) => c.name === v)?.level;
                  setDraft((d) => ({ ...d, course: v, level: level ?? d.level }));
                }}
                options={[...new Set([...(uni?.courses.map((c) => c.name) ?? []), ...(editingId && draft.course ? [draft.course] : [])])]}
                placeholder={draft.university ? "Select course" : "Choose a university first"}
                disabled={!draft.university}
              />
            </Labeled>
            <Labeled label="Course level">
              <SelectBox value={draft.level} onChange={(v) => set("level", v as CourseLevel)} options={courseLevels} />
            </Labeled>
            <Labeled label="Delivery mode">
              <SelectBox value={draft.mode} onChange={(v) => set("mode", v as DeliveryMode)} options={deliveryModes} />
            </Labeled>
            <Labeled label="Intake">
              <SelectBox value={draft.intake} onChange={(v) => set("intake", v)} options={[...new Set([...catalogIntakes, draft.intake])]} />
            </Labeled>
            <Labeled label="Campus" error={err("campus")} className="sm:col-span-2">
              <input
                list="course-manager-campuses"
                value={draft.campus}
                onChange={(e) => set("campus", e.target.value)}
                placeholder={uni ? `e.g. ${uni.campuses[0]}` : "Type campus name"}
                className={cn(selectClass, "cursor-text", err("campus") && "border-danger")}
              />
              <datalist id="course-manager-campuses">
                {uni?.campuses.map((c) => <option key={c} value={c} />)}
              </datalist>
            </Labeled>
            <div className="flex items-end justify-end">
              <button type="submit" className={cn(buttonPrimary, "w-full sm:w-auto")}>
                {editingId ? <Pencil className="size-4" /> : <Plus className="size-4" />}
                {editingId ? "Save changes" : "Add course"}
              </button>
            </div>
          </div>
        </form>

        <section>
          <h4 className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            Courses on this application · {courses.length}
          </h4>
          <ol className="flex flex-col gap-3">
            {courses.map((c, i) => {
              const st = applicationStageStyles[c.stage];
              const main = c.id === MAIN;
              return (
                <li
                  key={c.id}
                  className={cn(
                    "flex flex-col gap-4 rounded-2xl border p-4 transition-colors lg:flex-row lg:items-center",
                    editingId === c.id ? "border-primary/50 ring-2 ring-primary/15" : "border-border"
                  )}
                >
                  <div className="flex min-w-0 flex-1 gap-3">
                    <span
                      className={cn(
                        "flex size-9 shrink-0 items-center justify-center rounded-xl text-xs font-bold",
                        main ? "bg-primary text-primary-foreground" : "bg-surface-hover text-muted-foreground"
                      )}
                    >
                      {main ? <Star className="size-4" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <p className="truncate text-sm font-semibold text-foreground">{c.course}</p>
                        {main && <span className="rounded bg-primary-soft px-1.5 text-[10px] font-semibold text-primary">Main choice</span>}
                      </div>
                      <p className="mt-0.5 flex items-center gap-1 truncate text-xs text-muted-foreground">
                        <Landmark className="size-3 shrink-0" />
                        {c.university} · {c.country}
                      </p>
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <Meta icon={GraduationCap}>{c.level}</Meta>
                        <Meta icon={Clock3}>{c.mode}</Meta>
                        <Meta icon={CalendarDays}>{c.intake}</Meta>
                        <Meta icon={MapPin}>{c.campus}</Meta>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-wrap items-center gap-2 lg:justify-end">
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Stage</span>
                      <AnchoredMenu
                        label={`Stage for ${c.course}`}
                        triggerClassName={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full py-1 pl-2 pr-1.5 text-[11px] font-semibold", st.bg, st.text)}
                        trigger={<><span className={cn("size-1.5 rounded-full", st.dot)} />{c.stage}<ChevronDown className="size-3 opacity-60" /></>}
                      >
                        {(close) => (
                          <>
                            <MenuLabel>Stage</MenuLabel>
                            {applicationStages.map((s) => (
                              <MenuItem key={s} selected={s === c.stage} onClick={() => { onPatch(c.id, { stage: s }); close(); }}>{s}</MenuItem>
                            ))}
                          </>
                        )}
                      </AnchoredMenu>
                    </div>
                    <div className="flex flex-col gap-1">
                      <span className="text-[10px] font-semibold uppercase tracking-wide text-muted-foreground">Fees & funding</span>
                      <AnchoredMenu
                        label={`Funding for ${c.course}`}
                        width={180}
                        triggerClassName={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-md py-1 pl-2 pr-1.5 text-[11px] font-semibold", fundingStyles[c.funding])}
                        trigger={<>{c.funding}<ChevronDown className="size-3 opacity-60" /></>}
                      >
                        {(close) => (
                          <>
                            <MenuLabel>Fees & funding</MenuLabel>
                            {fundingStatuses.map((f) => (
                              <MenuItem key={f} selected={f === c.funding} onClick={() => { onPatch(c.id, { funding: f }); close(); }}>{f}</MenuItem>
                            ))}
                          </>
                        )}
                      </AnchoredMenu>
                    </div>
                    <div className="ml-auto flex items-center gap-1 self-end lg:ml-2">
                      {!main && (
                        <button type="button" onClick={() => onMakeMain(c.id)} className="h-8 rounded-full px-2.5 text-[11px] font-semibold text-primary hover:bg-primary-soft">
                          Make main
                        </button>
                      )}
                      <IconButton label={`Edit ${c.course}`} onClick={() => edit(c)}>
                        <Pencil className="size-3.5" />
                      </IconButton>
                      <IconButton
                        label={main ? "Make another course the main choice before deleting this one" : `Delete ${c.course}`}
                        onClick={() => onDelete(c.id)}
                        disabled={main}
                        danger
                      >
                        <Trash2 className="size-3.5" />
                      </IconButton>
                    </div>
                  </div>
                </li>
              );
            })}
          </ol>
        </section>
      </div>
    </Modal>
  );
}

function Labeled({ label, error, className, children }: { label: string; error?: string; className?: string; children: ReactNode }) {
  return (
    <label className={cn("flex min-w-0 flex-col gap-1.5 text-xs font-semibold text-foreground", className)}>
      <span>
        {label} <span className="text-danger">*</span>
      </span>
      {children}
      {error && (
        <span className="flex items-center gap-1 text-[11px] font-medium text-danger">
          <CircleAlert className="size-3 shrink-0" />
          {error}
        </span>
      )}
    </label>
  );
}

function SelectBox({
  value,
  onChange,
  options,
  placeholder,
  disabled,
}: {
  value: string;
  onChange: (v: string) => void;
  options: readonly string[];
  placeholder?: string;
  disabled?: boolean;
}) {
  return (
    <div className="relative">
      <select value={value} onChange={(e) => onChange(e.target.value)} disabled={disabled} className={selectClass}>
        {placeholder && <option value="">{placeholder}</option>}
        {options.map((o) => (
          <option key={o}>{o}</option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-2.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

function Meta({ icon: Icon, children }: { icon: typeof MapPin; children: ReactNode }) {
  return (
    <span className="inline-flex items-center gap-1 rounded-md bg-surface-hover px-1.5 py-0.5 text-[11px] font-medium text-foreground">
      <Icon className="size-3 text-muted-foreground" />
      {children}
    </span>
  );
}

function IconButton({
  label,
  onClick,
  disabled,
  danger,
  children,
}: {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  danger?: boolean;
  children: ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className={cn(
        "flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors disabled:cursor-not-allowed disabled:opacity-40",
        danger ? "hover:border-danger/30 hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-hover hover:text-foreground"
      )}
    >
      {children}
    </button>
  );
}

