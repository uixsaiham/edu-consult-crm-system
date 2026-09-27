"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { ArrowDown, ArrowRight, ArrowUp, BookOpen, Clock3, FileCheck2, GraduationCap, Languages, Layers, PencilLine, Plus, Trash2, X } from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { applicationCounts, formatFee, getCourses, getLevels, saveCourses, saveLevels, type Course, type StudyLevel } from "@/lib/mock/courses";
import { cn } from "@/lib/utils";

const colors = ["bg-teal-500", "bg-primary", "bg-amber-500", "bg-violet-500", "bg-rose-500", "bg-sky-500", "bg-emerald-500", "bg-slate-500"];
const bands = ["4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0"];

export default function CourseLevelsPage() {
  const { user } = useUser();
  const [levels, setLevels] = useState<StudyLevel[]>(getLevels);
  const [courses, setCourses] = useState<Course[]>(getCourses);
  const [editing, setEditing] = useState<StudyLevel | "new" | null>(null);
  const [deleting, setDeleting] = useState<StudyLevel | null>(null);
  const [toast, notify] = useToast();
  const counts = useMemo(() => applicationCounts(), []);

  useEffect(() => saveLevels(levels), [levels]);
  useEffect(() => saveCourses(courses), [courses]);

  const stats = (name: string) => {
    const list = courses.filter((c) => c.level === name);
    const gbp = list.filter((c) => c.currency === "GBP" && c.intlFee);
    return {
      courses: list,
      live: list.filter((c) => c.status === "Published").length,
      apps: list.reduce((n, c) => n + counts(c).total, 0),
      enrolled: list.reduce((n, c) => n + counts(c).enrolled, 0),
      avgFee: gbp.length ? Math.round(gbp.reduce((n, c) => n + c.intlFee, 0) / gbp.length / 50) * 50 : 0,
      institutions: new Set(list.map((c) => c.institution)).size,
    };
  };
  const busiest = [...levels].sort((a, b) => stats(b.name).apps - stats(a.name).apps)[0];

  const move = (i: number, dir: -1 | 1) => {
    const next = [...levels];
    [next[i], next[i + dir]] = [next[i + dir], next[i]];
    setLevels(next);
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Course Levels</h2>
          <p className="mt-1 text-sm text-muted-foreground">Study levels and their standard entry requirements. New courses start with these requirements, so counsellors quote the same rules.</p>
        </div>
        <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}><Plus className="size-4" /> Add level</button>
      </header>

      <StatGrid>
        <StatCard icon={Layers} label="Study levels" value={levels.length} />
        <StatCard icon={BookOpen} tone="primary" label="Courses" value={courses.length} note={`${courses.filter((c) => c.status === "Published").length} live`} />
        <StatCard icon={GraduationCap} tone="success" label={busiest ? `Busiest level · ${stats(busiest.name).apps} apps` : "Busiest level"} value={busiest?.name ?? "—"} />
        <StatCard icon={Languages} tone="violet" label="IELTS range" value={levels.length ? `${Math.min(...levels.map((l) => Number(l.ieltsOverall))).toFixed(1)}–${Math.max(...levels.map((l) => Number(l.ieltsOverall))).toFixed(1)}` : "—"} />
      </StatGrid>

      <Card className="p-5">
        <p className="mb-3 text-xs font-semibold text-foreground">Progression pathway</p>
        <div className="no-scrollbar flex items-center gap-2 overflow-x-auto pb-1">
          {levels.map((l, i) => (
            <div key={l.id} className="flex shrink-0 items-center gap-2">
              <a href={`#level-${l.id}`} className="flex items-center gap-2 rounded-2xl border border-border bg-surface px-3.5 py-2.5 transition-colors hover:border-border-strong">
                <span className={cn("flex size-8 items-center justify-center rounded-xl text-[11px] font-bold text-white", l.color)}>{l.short}</span>
                <span>
                  <span className="block text-xs font-semibold text-foreground">{l.name}</span>
                  <span className="block text-[11px] text-muted-foreground">{l.typicalDuration} · IELTS {l.ieltsOverall}</span>
                </span>
              </a>
              {i < levels.length - 1 && <ArrowRight className="size-4 shrink-0 text-muted-foreground" />}
            </div>
          ))}
        </div>
      </Card>

      <div className="flex flex-col gap-3">
        {levels.map((l, i) => {
          const s = stats(l.name);
          return (
            <Card key={l.id} className="scroll-mt-4 overflow-hidden">
              <article id={`level-${l.id}`} className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_300px]">
                <div className="flex flex-col gap-4 p-5">
                  <div className="flex items-start gap-3">
                    <span className={cn("flex size-11 shrink-0 items-center justify-center rounded-2xl text-xs font-bold text-white", l.color)}>{l.short}</span>
                    <div className="min-w-0 flex-1">
                      <h3 className="text-[15px] font-semibold text-foreground">{l.name}</h3>
                      <p className="mt-0.5 text-xs text-muted-foreground">{l.description}</p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <IconBtn label="Move up" disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp className="size-4" /></IconBtn>
                      <IconBtn label="Move down" disabled={i === levels.length - 1} onClick={() => move(i, 1)}><ArrowDown className="size-4" /></IconBtn>
                      <IconBtn label={`Edit ${l.name}`} onClick={() => setEditing(l)}><PencilLine className="size-4" /></IconBtn>
                      <IconBtn label={`Delete ${l.name}`} danger onClick={() => setDeleting(l)}><Trash2 className="size-4" /></IconBtn>
                    </div>
                  </div>
                  <dl className="grid grid-cols-1 gap-3 text-xs sm:grid-cols-3">
                    <Req icon={Clock3} label="Typical length">{l.typicalDuration}</Req>
                    <Req icon={GraduationCap} label="Academic entry">{l.academicRequirement}</Req>
                    <Req icon={Languages} label="English">IELTS {l.ieltsOverall} overall, {l.ieltsMin} in each band</Req>
                  </dl>
                  <div>
                    <p className="mb-1.5 flex items-center gap-1.5 text-[11px] font-semibold text-muted-foreground"><FileCheck2 className="size-3.5" /> Documents students need</p>
                    <div className="flex flex-wrap gap-1.5">{l.documents.map((d) => <span key={d} className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] text-foreground">{d}</span>)}</div>
                  </div>
                </div>
                <div className="flex flex-col gap-3 border-t border-border bg-surface-muted/60 p-5 lg:border-l lg:border-t-0">
                  <div className="grid grid-cols-2 gap-2">
                    {[
                      ["Courses", `${s.courses.length}`, `${s.live} live · ${s.institutions} inst.`],
                      ["Applications", `${s.apps}`, `${s.enrolled} enrolled`],
                      ["Conversion", s.apps ? `${Math.round((s.enrolled / s.apps) * 100)}%` : "—", "applied → enrolled"],
                      ["Avg UK fee", s.avgFee ? formatFee(s.avgFee, "GBP") : "—", "international / yr"],
                    ].map(([l1, v, note]) => (
                      <div key={l1} className="rounded-xl bg-surface px-3 py-2">
                        <p className="truncate text-base font-bold tabular-nums text-foreground">{v}</p>
                        <p className="truncate text-[11px] text-muted-foreground">{l1}</p>
                        <p className="truncate text-[10px] text-muted-foreground/80">{note}</p>
                      </div>
                    ))}
                  </div>
                  <Link href={`/courses?level=${encodeURIComponent(l.name)}`} className="mt-auto inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">
                    View {l.name.toLowerCase()} courses <ArrowRight className="size-3.5" />
                  </Link>
                </div>
              </article>
            </Card>
          );
        })}
      </div>

      <Card>
        <CardHeader icon={BookOpen} title="Courses whose requirements differ from their level" subtitle="Worth a check — they may be out of date." />
        <DifferingCourses courses={courses} levels={levels} />
      </Card>

      {editing && (
        <LevelDialog
          key={editing === "new" ? "new" : editing.id}
          level={editing === "new" ? undefined : editing}
          existing={levels}
          courseCount={editing === "new" ? 0 : stats(editing.name).courses.length}
          onClose={() => setEditing(null)}
          onSave={(l, applyToCourses) => {
            const prev = editing === "new" ? undefined : editing;
            setLevels((ls) => (prev ? ls.map((x) => (x.id === l.id ? l : x)) : [...ls, l]));
            if (prev) {
              const at = new Date().toISOString();
              setCourses((cs) =>
                cs.map((c) =>
                  c.level !== prev.name
                    ? c
                    : {
                        ...c,
                        level: l.name,
                        ...(applyToCourses ? { academicRequirement: l.academicRequirement, ieltsOverall: l.ieltsOverall, ieltsMin: l.ieltsMin, documents: l.documents, updatedAt: at, updatedBy: user.name } : {}),
                      }
                )
              );
            }
            notify(prev ? (applyToCourses ? `${l.name} saved and applied to its courses` : `${l.name} saved`) : `${l.name} added`);
            setEditing(null);
          }}
        />
      )}

      {deleting && (
        <DeleteDialog
          level={deleting}
          courseCount={stats(deleting.name).courses.length}
          others={levels.filter((l) => l.id !== deleting.id)}
          onClose={() => setDeleting(null)}
          onDelete={(moveTo) => {
            if (moveTo) setCourses((cs) => cs.map((c) => (c.level === deleting.name ? { ...c, level: moveTo } : c)));
            setLevels((ls) => ls.filter((l) => l.id !== deleting.id));
            notify(moveTo ? `${deleting.name} deleted — courses moved to ${moveTo}` : `${deleting.name} deleted`);
            setDeleting(null);
          }}
        />
      )}
      {toast}
    </div>
  );
}

function DifferingCourses({ courses, levels }: { courses: Course[]; levels: StudyLevel[] }) {
  const rows = courses
    .map((c) => ({ c, l: levels.find((l) => l.name === c.level) }))
    .filter(({ c, l }) => l && c.status !== "Closed" && (Number(c.ieltsOverall) !== Number(l.ieltsOverall) || Number(c.ieltsMin) !== Number(l.ieltsMin)))
    .slice(0, 8);
  if (!rows.length) return <p className="px-6 pb-6 pt-3 text-xs text-muted-foreground">Every course matches its level&apos;s English requirement.</p>;
  return (
    <ul className="mt-3 divide-y divide-border border-t border-border">
      {rows.map(({ c, l }) => (
        <li key={c.id} className="flex flex-wrap items-center gap-3 px-6 py-3 text-xs">
          <span className="min-w-0 flex-1">
            <span className="block truncate font-semibold text-foreground">{c.name}</span>
            <span className="block truncate text-[11px] text-muted-foreground">{c.institution} · {c.level}</span>
          </span>
          <span className="text-muted-foreground">IELTS <span className="font-semibold text-foreground">{c.ieltsOverall} ({c.ieltsMin})</span> vs level {l!.ieltsOverall} ({l!.ieltsMin})</span>
          <Link href={`/courses/${c.id}/edit`} className="font-semibold text-primary hover:underline">Review</Link>
        </li>
      ))}
    </ul>
  );
}

function IconBtn({ label, onClick, disabled, danger, children }: { label: string; onClick: () => void; disabled?: boolean; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} aria-label={label} title={label} className={cn("flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors disabled:pointer-events-none disabled:opacity-30", danger ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-hover hover:text-foreground")}>
      {children}
    </button>
  );
}

function Req({ icon: Icon, label, children }: { icon: typeof Clock3; label: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-border px-3 py-2.5">
      <dt className="flex items-center gap-1.5 text-[11px] text-muted-foreground"><Icon className="size-3.5" /> {label}</dt>
      <dd className="mt-0.5 font-medium text-foreground">{children}</dd>
    </div>
  );
}

function LevelDialog({ level, existing, courseCount, onClose, onSave }: { level?: StudyLevel; existing: StudyLevel[]; courseCount: number; onClose: () => void; onSave: (l: StudyLevel, applyToCourses: boolean) => void }) {
  const [f, setF] = useState<StudyLevel>(() => level ?? { id: "", name: "", short: "", description: "", typicalDuration: "1 year", academicRequirement: "", ieltsOverall: "6.0", ieltsMin: "5.5", documents: ["Passport", "English test result"], color: colors[existing.length % colors.length] });
  const [doc, setDoc] = useState("");
  const [apply, setApply] = useState(false);
  const [tried, setTried] = useState(false);
  const set = <K extends keyof StudyLevel>(k: K, v: StudyLevel[K]) => setF((x) => ({ ...x, [k]: v }));
  const errors: Record<string, string> = {};
  if (!f.name.trim()) errors.name = "Enter a name";
  else if (existing.some((l) => l.id !== f.id && l.name.toLowerCase() === f.name.trim().toLowerCase())) errors.name = "This level already exists";
  if (!f.short.trim()) errors.short = "Add a short code";
  if (!f.academicRequirement.trim()) errors.academic = "Describe the academic entry requirement";
  if (Number(f.ieltsMin) > Number(f.ieltsOverall)) errors.ieltsMin = "Can't exceed the overall score";
  const err = (k: string) => (tried ? errors[k] : undefined);
  const addDoc = () => {
    if (doc.trim() && !f.documents.includes(doc.trim())) set("documents", [...f.documents, doc.trim()]);
    setDoc("");
  };
  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    const id = f.id || f.name.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || `lvl-${Date.now()}`;
    onSave({ ...f, id, name: f.name.trim(), short: f.short.trim().toUpperCase().slice(0, 4), description: f.description.trim(), academicRequirement: f.academicRequirement.trim() }, apply);
  };
  return (
    <Modal open onClose={onClose} icon={Layers} size="lg" title={level ? `Edit ${level.name}` : "Add study level"} subtitle="These requirements pre-fill every new course at this level."
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" onClick={save} className={buttonPrimary}>{level ? "Save level" : "Add level"}</button></div>}
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <Field label="Name" required className="sm:col-span-2">
          <TextInput value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Top-up Degree" aria-invalid={!!err("name")} className={cn(err("name") && "border-danger")} />
          {err("name") && <span className="text-[11px] font-medium text-danger">{err("name")}</span>}
        </Field>
        <Field label="Short code" required>
          <TextInput value={f.short} onChange={(e) => set("short", e.target.value.toUpperCase().slice(0, 4))} placeholder="e.g. TU" aria-invalid={!!err("short")} className={cn(err("short") && "border-danger")} />
          {err("short") && <span className="text-[11px] font-medium text-danger">{err("short")}</span>}
        </Field>
        <Field label="Description" className="sm:col-span-3">
          <Textarea rows={2} value={f.description} onChange={(e) => set("description", e.target.value)} placeholder="What this level is and who it's for." />
        </Field>
        <Field label="Typical length">
          <TextInput value={f.typicalDuration} onChange={(e) => set("typicalDuration", e.target.value)} placeholder="e.g. 1 year" />
        </Field>
        <Field label="IELTS overall">
          <Select value={f.ieltsOverall} onChange={(e) => set("ieltsOverall", e.target.value)}>{bands.map((b) => <option key={b}>{b}</option>)}</Select>
        </Field>
        <Field label="Minimum per band">
          <Select value={f.ieltsMin} onChange={(e) => set("ieltsMin", e.target.value)} aria-invalid={!!err("ieltsMin")} className={cn(err("ieltsMin") && "border-danger")}>{bands.map((b) => <option key={b}>{b}</option>)}</Select>
          {err("ieltsMin") && <span className="text-[11px] font-medium text-danger">{err("ieltsMin")}</span>}
        </Field>
        <Field label="Academic entry requirement" required className="sm:col-span-3">
          <TextInput value={f.academicRequirement} onChange={(e) => set("academicRequirement", e.target.value)} placeholder="e.g. HND or 2 years of a bachelor's degree" aria-invalid={!!err("academic")} className={cn(err("academic") && "border-danger")} />
          {err("academic") && <span className="text-[11px] font-medium text-danger">{err("academic")}</span>}
        </Field>
        <Field label="Documents students need" className="sm:col-span-3" hint="Press Enter to add.">
          <div className="flex flex-wrap items-center gap-1.5 rounded-xl border border-border p-2">
            {f.documents.map((d) => (
              <span key={d} className="inline-flex items-center gap-1 rounded-full bg-surface-muted py-1 pl-2.5 pr-1 text-xs text-foreground">
                {d}
                <button type="button" onClick={() => set("documents", f.documents.filter((x) => x !== d))} aria-label={`Remove ${d}`} className="rounded-full p-0.5 text-muted-foreground hover:bg-surface-hover hover:text-foreground"><X className="size-3" /></button>
              </span>
            ))}
            <input value={doc} onChange={(e) => setDoc(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addDoc(); } }} onBlur={addDoc} placeholder="Add a document…" aria-label="Add document" className="h-7 min-w-32 flex-1 bg-transparent px-1 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none" />
          </div>
        </Field>
        <Field label="Colour" className="sm:col-span-3">
          <div className="flex flex-wrap gap-2">
            {colors.map((c) => <button key={c} type="button" aria-label={c.replace("bg-", "")} aria-pressed={f.color === c} onClick={() => set("color", c)} className={cn("size-7 rounded-full ring-offset-2 ring-offset-surface", c, f.color === c && "ring-2 ring-foreground")} />)}
          </div>
        </Field>
        {level && courseCount > 0 && (
          <div className="rounded-2xl bg-surface-muted p-3.5 sm:col-span-3">
            <Checkbox checked={apply} onChange={setApply} label={<span><span className="font-semibold">Also update its {courseCount} course{courseCount === 1 ? "" : "s"}</span><span className="block text-xs text-muted-foreground">Replaces their academic, English and document requirements with these. Leave unticked to change only new courses.</span></span>} />
          </div>
        )}
      </div>
    </Modal>
  );
}

function DeleteDialog({ level, courseCount, others, onClose, onDelete }: { level: StudyLevel; courseCount: number; others: StudyLevel[]; onClose: () => void; onDelete: (moveTo: string) => void }) {
  const [moveTo, setMoveTo] = useState(others[0]?.name ?? "");
  const needsMove = courseCount > 0;
  return (
    <Modal open onClose={onClose} icon={Trash2} size="sm" title={`Delete ${level.name}?`} subtitle={needsMove ? `${courseCount} course${courseCount === 1 ? " is" : "s are"} at this level.` : "No courses use it."}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={needsMove && !moveTo} onClick={() => onDelete(needsMove ? moveTo : "")} className={buttonDanger}>Delete level</button></div>}
    >
      {needsMove ? (
        <Field label="Move its courses to">
          <Select value={moveTo} onChange={(e) => setMoveTo(e.target.value)}>
            {others.map((l) => <option key={l.id}>{l.name}</option>)}
          </Select>
        </Field>
      ) : (
        <p className="text-sm text-muted-foreground">Nothing else is affected.</p>
      )}
    </Modal>
  );
}
