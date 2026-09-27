"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, BookOpen, CalendarDays, CircleAlert, Clock3, Coins, Copy, Languages, MapPin, Plus, Wand2, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useUser } from "@/components/layout/user-context";
import {
  categoryFor,
  courseIntakes,
  currencyFor,
  currencySymbol,
  deliveryModes,
  durationLabel,
  formatFee,
  getCategories,
  getCourses,
  getLevels,
  institutionOptions,
  markCourseChange,
  nextCourseId,
  saveCourses,
  type Course,
  type CourseStatus,
  type DeliveryMode,
} from "@/lib/mock/courses";
import { cn } from "@/lib/utils";
import { CategoryChip, CourseStatusBadge, LevelBadge } from "./course-ui";

interface FormState {
  institution: string;
  campuses: string[];
  name: string;
  code: string;
  level: string;
  categoryId: string;
  description: string;
  duration: string;
  modes: DeliveryMode[];
  intakes: string[];
  deadline: string;
  placement: boolean;
  intlFee: string;
  homeFee: string;
  deposit: string;
  scholarship: string;
  studentFinance: boolean;
  academicRequirement: string;
  ieltsOverall: string;
  ieltsMin: string;
  moiAccepted: boolean;
  workExperience: string;
  documents: string[];
  status: CourseStatus;
  onWebsite: boolean;
  featured: boolean;
}

const ieltsBands = ["4.0", "4.5", "5.0", "5.5", "6.0", "6.5", "7.0", "7.5", "8.0"];
const documentOptions = ["Passport", "SSC and HSC certificates", "SSC and HSC certificates and transcripts", "Bachelor's certificate and transcript", "Master's and bachelor's transcripts", "English test result", "English test or MOI letter", "CV", "Personal statement", "Reference letter", "Two references", "Two academic references", "Research proposal", "Portfolio", "Work experience letters"];

function fromCourse(c: Course): FormState {
  return {
    institution: c.institution, campuses: c.campuses, name: c.name, code: c.code, level: c.level, categoryId: c.categoryId, description: c.description,
    duration: String(c.duration), modes: c.modes, intakes: c.intakes, deadline: c.deadline ?? "", placement: c.placement,
    intlFee: c.intlFee ? String(c.intlFee) : "", homeFee: c.homeFee ? String(c.homeFee) : "", deposit: c.deposit ? String(c.deposit) : "", scholarship: c.scholarship, studentFinance: c.studentFinance,
    academicRequirement: c.academicRequirement, ieltsOverall: c.ieltsOverall, ieltsMin: c.ieltsMin, moiAccepted: c.moiAccepted, workExperience: c.workExperience, documents: c.documents,
    status: c.status, onWebsite: c.onWebsite, featured: c.featured,
  };
}

function blank(): FormState {
  const pg = getLevels().find((l) => l.name === "Postgraduate") ?? getLevels()[0];
  return {
    institution: "", campuses: [], name: "", code: "", level: pg.name, categoryId: "", description: "",
    duration: "12", modes: ["Full time"], intakes: ["Jan 2027", "Sep 2027"], deadline: "", placement: false,
    intlFee: "", homeFee: "", deposit: "", scholarship: "", studentFinance: false,
    academicRequirement: pg.academicRequirement, ieltsOverall: pg.ieltsOverall, ieltsMin: pg.ieltsMin, moiAccepted: false, workExperience: "", documents: pg.documents,
    status: "Published", onWebsite: true, featured: false,
  };
}

export function CourseForm({ course, copyOf }: { course?: Course; copyOf?: Course }) {
  const router = useRouter();
  const { user } = useUser();
  const editing = !!course;
  const [form, setForm] = useState<FormState>(() => (course ? fromCourse(course) : copyOf ? { ...fromCourse(copyOf), name: `${copyOf.name} (copy)`, code: "", status: "Draft" } : blank()));
  const [newCampus, setNewCampus] = useState("");
  const [tried, setTried] = useState(false);
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const toggle = <T,>(list: T[], v: T) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  const institutions = institutionOptions();
  const inst = institutions.find((i) => i.name === form.institution);
  const country = inst?.country ?? course?.country ?? "United Kingdom";
  const currency = currencyFor[country] ?? "GBP";
  const sym = currencySymbol[currency];
  const levels = getLevels();
  // Inactive categories can't be chosen for new courses; a course already in one keeps it.
  const categories = getCategories().filter((c) => c.active || c.id === course?.categoryId);
  const isUK = country === "United Kingdom";
  const all = getCourses();
  const duplicate = all.find((c) => c.id !== course?.id && c.institution === form.institution && c.name.trim().toLowerCase() === form.name.trim().toLowerCase());
  const suggested = form.name.trim() ? categoryFor(form.name, categories.filter((c) => c.active)) : "";

  const errors = (() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.institution) e.institution = "Choose the institution";
    if (form.institution && !form.campuses.length) e.campuses = "Pick at least one campus";
    if (form.name.trim().length < 4) e.name = "Enter the full course title";
    else if (duplicate) e.name = "This institution already has a course with this name";
    if (!form.categoryId) e.categoryId = "Choose a category";
    if (!(Number(form.duration) > 0)) e.duration = "Enter the length in months";
    if (!form.modes.length) e.modes = "Pick at least one study mode";
    if (!form.intakes.length) e.intakes = "Pick at least one intake";
    if (!form.intlFee && !form.homeFee) e.intlFee = "Enter an international or home tuition fee";
    if (form.deposit && form.intlFee && Number(form.deposit) > Number(form.intlFee)) e.deposit = "Deposit can't be more than the tuition fee";
    if (Number(form.ieltsMin) > Number(form.ieltsOverall)) e.ieltsMin = "Minimum band can't exceed the overall score";
    if (!form.academicRequirement.trim()) e.academicRequirement = "Describe the academic entry requirement";
    return e;
  })();
  const show = (k: keyof FormState) => (tried ? errors[k] : undefined);
  const errorCount = Object.keys(errors).length;
  const input = (k: keyof FormState) => ({ "aria-invalid": !!show(k), className: cn(show(k) && "border-danger") });

  const chooseInstitution = (name: string) => {
    const i = institutions.find((x) => x.name === name);
    setForm((f) => ({ ...f, institution: name, campuses: i && i.campuses.length === 1 ? i.campuses : [] }));
  };

  const applyLevel = (name: string) => {
    const l = levels.find((x) => x.name === name);
    if (!l) return set("level", name);
    const months = /(\d+)\s*year/.exec(l.typicalDuration)?.[1];
    setForm((f) => ({
      ...f,
      level: name,
      academicRequirement: l.academicRequirement,
      ieltsOverall: l.ieltsOverall,
      ieltsMin: l.ieltsMin,
      documents: l.documents,
      duration: months ? String(Number(months) * 12) : f.duration,
    }));
  };

  const generateCode = () => {
    const ini = (s: string) => s.replace(/\(.*?\)/g, "").split(/\s+/).filter((w) => /^[A-Z]/.test(w)).map((w) => w[0]).join("").slice(0, 4);
    set("code", `${ini(form.institution)}-${ini(form.name)}`.toUpperCase());
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errorCount) {
      document.querySelector("[aria-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const id = course?.id ?? nextCourseId();
    const record: Course = {
      id,
      code: form.code.trim().toUpperCase() || id,
      name: form.name.trim(),
      institution: form.institution,
      country,
      campuses: form.campuses,
      level: form.level,
      categoryId: form.categoryId,
      duration: Number(form.duration),
      modes: form.modes,
      intakes: [...form.intakes].sort((a, b) => courseIntakes.indexOf(a) - courseIntakes.indexOf(b)),
      deadline: form.deadline || undefined,
      placement: form.placement,
      currency,
      intlFee: Number(form.intlFee) || 0,
      homeFee: isUK ? Number(form.homeFee) || 0 : 0,
      deposit: Number(form.deposit) || 0,
      scholarship: form.scholarship.trim(),
      studentFinance: isUK && form.studentFinance && Number(form.homeFee) > 0,
      academicRequirement: form.academicRequirement.trim(),
      ieltsOverall: form.ieltsOverall,
      ieltsMin: form.ieltsMin,
      moiAccepted: form.moiAccepted,
      workExperience: form.workExperience.trim(),
      documents: form.documents,
      description: form.description.trim(),
      status: form.status,
      onWebsite: form.status === "Published" && form.onWebsite,
      featured: form.featured,
      updatedAt: new Date().toISOString(),
      updatedBy: user.name,
    };
    saveCourses(editing ? all.map((c) => (c.id === id ? record : c)) : [record, ...all]);
    markCourseChange(id, editing ? "updated" : "added");
    router.push("/courses");
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <Link href="/courses" className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> All courses
        </Link>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{editing ? `Edit ${course.name}` : copyOf ? "Duplicate course" : "Add Course"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {editing ? "Changes show straight away in applications and on the website." : "Published courses appear in the application course picker and, if you choose, on the website."} Fields marked <span className="text-danger">*</span> are required.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section index={1} title="Course details" description="What the course is and where it's taught.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Institution" required className="sm:col-span-2">
                <Select value={form.institution} onChange={(e) => chooseInstitution(e.target.value)} placeholder="Choose an institution" {...input("institution")}>
                  {[...new Set(institutions.map((i) => i.country))].sort().map((ctry) => (
                    <optgroup key={ctry} label={ctry}>
                      {institutions.filter((i) => i.country === ctry).map((i) => <option key={i.name} value={i.name}>{i.name}</option>)}
                    </optgroup>
                  ))}
                </Select>
                <Err msg={show("institution")} />
              </Field>
              {form.institution && (
                <Field label="Campuses" required className="sm:col-span-2">
                  <div className="flex flex-wrap items-center gap-1.5" aria-invalid={!!show("campuses")}>
                    {[...new Set([...(inst?.campuses ?? []), ...form.campuses])].map((c) => {
                      const on = form.campuses.includes(c);
                      return (
                        <button key={c} type="button" aria-pressed={on} onClick={() => set("campuses", toggle(form.campuses, c))} className={cn("inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors", on ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                          <MapPin className="size-3" /> {c}
                        </button>
                      );
                    })}
                    <span className="inline-flex items-center gap-1">
                      <input value={newCampus} onChange={(e) => setNewCampus(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter" && newCampus.trim()) { e.preventDefault(); set("campuses", [...form.campuses, newCampus.trim()]); setNewCampus(""); } }} placeholder="Add campus" aria-label="Add a campus" className="h-8 w-28 rounded-full border border-dashed border-border-strong bg-transparent px-3 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
                      {newCampus.trim() && <button type="button" onClick={() => { set("campuses", [...form.campuses, newCampus.trim()]); setNewCampus(""); }} aria-label="Add campus" className="flex size-8 items-center justify-center rounded-full bg-primary-soft text-primary"><Plus className="size-3.5" /></button>}
                    </span>
                  </div>
                  <Err msg={show("campuses")} />
                </Field>
              )}
              <Field label="Course title" required className="sm:col-span-2" hint="As the university writes it, including the award — e.g. MSc Data Science.">
                <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} onBlur={() => !form.categoryId && suggested && set("categoryId", suggested)} placeholder="e.g. MSc International Business" {...input("name")} />
                <Err msg={show("name")} />
                {duplicate && <Link href={`/courses/${duplicate.id}/edit`} className="text-[11px] font-semibold text-primary hover:underline">Edit the existing course instead</Link>}
              </Field>
              <Field label="Course code">
                <div className="flex gap-2">
                  <TextInput value={form.code} onChange={(e) => set("code", e.target.value.toUpperCase())} placeholder="e.g. UH-MSCDS" />
                  <button type="button" onClick={generateCode} disabled={!form.name || !form.institution} title="Generate from the title" aria-label="Generate code" className="flex size-[42px] shrink-0 items-center justify-center rounded-xl border border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground disabled:opacity-40"><Wand2 className="size-4" /></button>
                </div>
              </Field>
              <Field label="Study level" required hint="Changing the level fills in its usual entry requirements.">
                <Select value={form.level} onChange={(e) => applyLevel(e.target.value)}>
                  {levels.map((l) => <option key={l.id} value={l.name}>{l.name}</option>)}
                </Select>
              </Field>
              <Field label="Category" required className="sm:col-span-2">
                <Select value={form.categoryId} onChange={(e) => set("categoryId", e.target.value)} placeholder="Choose a category" {...input("categoryId")}>
                  {categories.map((c) => <option key={c.id} value={c.id}>{c.name}{c.active ? "" : " (inactive)"}</option>)}
                </Select>
                <Err msg={show("categoryId")} />
                {suggested && suggested !== form.categoryId && (
                  <button type="button" onClick={() => set("categoryId", suggested)} className="w-fit text-[11px] font-semibold text-primary hover:underline">
                    Suggested: {categories.find((c) => c.id === suggested)?.name}
                  </button>
                )}
              </Field>
              <Field label="Short description" className="sm:col-span-2" hint="Shown on the website and to counsellors.">
                <Textarea rows={3} value={form.description} onChange={(e) => set("description", e.target.value)} placeholder="Who the course is for, what students learn and career outcomes." />
              </Field>
            </div>
          </Section>

          <Section index={2} title="Study options" description="How long it takes, how it's taught and when students can start.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Duration (months)" required hint={Number(form.duration) > 0 ? durationLabel(Number(form.duration)) : undefined}>
                <TextInput inputMode="numeric" value={form.duration} onChange={(e) => set("duration", e.target.value.replace(/\D/g, "").slice(0, 2))} {...input("duration")} />
                <Err msg={show("duration")} />
              </Field>
              <Field label="Application deadline" hint="For the next intake. Leave empty if rolling.">
                <TextInput type="date" value={form.deadline} onChange={(e) => set("deadline", e.target.value)} />
              </Field>
              <Field label="Study mode" required className="sm:col-span-2">
                <Chips options={deliveryModes} value={form.modes} onToggle={(m) => set("modes", toggle(form.modes, m))} invalid={!!show("modes")} />
                <Err msg={show("modes")} />
              </Field>
              <Field label="Intakes" required className="sm:col-span-2">
                <Chips options={courseIntakes} value={form.intakes} onToggle={(i) => set("intakes", toggle(form.intakes, i))} invalid={!!show("intakes")} />
                <Err msg={show("intakes")} />
              </Field>
              <div className="sm:col-span-2">
                <Checkbox checked={form.placement} onChange={(v) => set("placement", v)} label={<span>Includes a placement or internship year <span className="text-xs text-muted-foreground">(usually adds 12 months)</span></span>} />
              </div>
            </div>
          </Section>

          <Section index={3} title="Fees & funding" description={`Per year, in ${currency} (${country}).`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="International fee" required={!isUK} hint="Leave empty if home students only.">
                <Money sym={sym} value={form.intlFee} onChange={(v) => set("intlFee", v)} invalid={!!show("intlFee")} />
                <Err msg={show("intlFee")} />
              </Field>
              {isUK && (
                <Field label="Home (UK) fee" hint="Leave empty if not offered to home students.">
                  <Money sym={sym} value={form.homeFee} onChange={(v) => set("homeFee", v)} />
                </Field>
              )}
              <Field label="Deposit for CAS / offer">
                <Money sym={sym} value={form.deposit} onChange={(v) => set("deposit", v)} invalid={!!show("deposit")} />
                <Err msg={show("deposit")} />
              </Field>
              <Field label="Scholarship" className="sm:col-span-3">
                <TextInput value={form.scholarship} onChange={(e) => set("scholarship", e.target.value)} placeholder={`e.g. Up to ${sym}3,000 automatic merit award`} />
              </Field>
              {isUK && Number(form.homeFee) > 0 && (
                <div className="sm:col-span-3">
                  <Checkbox checked={form.studentFinance} onChange={(v) => set("studentFinance", v)} label="Eligible for Student Finance England (home students)" />
                </div>
              )}
            </div>
          </Section>

          <Section index={4} title="Entry requirements" description={`Pre-filled from the ${form.level} level — adjust for this course.`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Academic requirement" required className="sm:col-span-2">
                <TextInput value={form.academicRequirement} onChange={(e) => set("academicRequirement", e.target.value)} {...input("academicRequirement")} />
                <Err msg={show("academicRequirement")} />
              </Field>
              <Field label="IELTS overall">
                <Select value={form.ieltsOverall} onChange={(e) => set("ieltsOverall", e.target.value)}>
                  {ieltsBands.map((b) => <option key={b}>{b}</option>)}
                </Select>
              </Field>
              <Field label="Minimum in each band">
                <Select value={form.ieltsMin} onChange={(e) => set("ieltsMin", e.target.value)} {...input("ieltsMin")}>
                  {ieltsBands.map((b) => <option key={b}>{b}</option>)}
                </Select>
                <Err msg={show("ieltsMin")} />
              </Field>
              <Field label="Work experience">
                <TextInput value={form.workExperience} onChange={(e) => set("workExperience", e.target.value)} placeholder="e.g. 2 years' professional experience" />
              </Field>
              <div className="flex items-end pb-2">
                <Checkbox checked={form.moiAccepted} onChange={(v) => set("moiAccepted", v)} label="Accepts an MOI letter instead of IELTS" />
              </div>
              <Field label="Documents to apply" className="sm:col-span-2">
                <Chips options={[...new Set([...documentOptions, ...form.documents])]} value={form.documents} onToggle={(d) => set("documents", toggle(form.documents, d))} />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
          <Card className="p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
            <div className="flex items-start gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"><BookOpen className="size-5" /></span>
              <div className="min-w-0">
                <p className="text-sm font-semibold text-foreground">{form.name || "New course"}</p>
                <p className="truncate text-xs text-muted-foreground">{form.institution || "Institution"}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <LevelBadge name={form.level} />
                  {form.categoryId && <CategoryChip id={form.categoryId} />}
                </div>
              </div>
            </div>
            <ul className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><MapPin className="size-3.5" /> {form.campuses.join(", ") || "—"}</li>
              <li className="flex items-center gap-2"><Clock3 className="size-3.5" /> {Number(form.duration) ? durationLabel(Number(form.duration)) : "—"} · {form.modes.join(", ") || "—"}</li>
              <li className="flex items-center gap-2"><CalendarDays className="size-3.5" /> {form.intakes.join(", ") || "—"}</li>
              <li className="flex items-center gap-2"><Coins className="size-3.5" /> {form.intlFee ? `${formatFee(Number(form.intlFee), currency)} / yr` : form.homeFee ? `Home ${formatFee(Number(form.homeFee), currency)}` : "—"}</li>
              <li className="flex items-center gap-2"><Languages className="size-3.5" /> IELTS {form.ieltsOverall} ({form.ieltsMin}){form.moiAccepted ? " · MOI" : ""}</li>
            </ul>
          </Card>

          <Card className="p-5">
            <Field label="Status">
              <PillGroup<CourseStatus> options={(["Published", "Draft", "Closed"] as CourseStatus[]).map((s) => ({ value: s, label: s }))} value={form.status} onChange={(v) => set("status", v)} />
            </Field>
            <p className="mt-2 text-[11px] text-muted-foreground">
              {form.status === "Published" ? "Counsellors can add it to applications." : form.status === "Draft" ? "Hidden until you publish it." : "Kept for existing applications; no new ones."}
            </p>
            <div className="mt-4 flex flex-col gap-2.5">
              <Checkbox checked={form.onWebsite && form.status === "Published"} onChange={(v) => { set("onWebsite", v); if (v) set("status", "Published"); }} label="Show on the website" />
              <Checkbox checked={form.featured} onChange={(v) => set("featured", v)} label="Feature it for counsellors" />
            </div>
            <div className="mt-3"><CourseStatusBadge status={form.status} /></div>
          </Card>

          {tried && errorCount > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-xs font-medium text-danger">
              <CircleAlert className="size-4 shrink-0" /> Fix {errorCount} field{errorCount > 1 ? "s" : ""} to continue.
            </p>
          )}

          <div className="flex gap-2">
            <Link href="/courses" className={cn(buttonSecondary, "flex-1")}>Cancel</Link>
            <button type="submit" className={cn(buttonPrimary, "flex-1")}>{editing ? "Save changes" : form.status === "Published" ? "Publish course" : "Save course"}</button>
          </div>
          {editing && (
            <Link href={`/courses/new?copy=${course.id}`} className="inline-flex items-center justify-center gap-1.5 text-xs font-semibold text-muted-foreground hover:text-foreground">
              <Copy className="size-3.5" /> Duplicate as a new course
            </Link>
          )}
        </aside>
      </div>
    </form>
  );
}

function Section({ index, title, description, children }: { index: number; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-5 flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{index}</span>
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
          <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
        </div>
      </div>
      {children}
    </Card>
  );
}

function Chips<T extends string>({ options, value, onToggle, invalid }: { options: readonly T[]; value: T[]; onToggle: (v: T) => void; invalid?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5" aria-invalid={invalid}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button key={o} type="button" aria-pressed={on} onClick={() => onToggle(o)} className={cn("inline-flex h-8 items-center gap-1 rounded-full border px-3 text-xs font-medium transition-colors", on ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
            {on && <X className="size-3" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Money({ sym, value, onChange, invalid }: { sym: string; value: string; onChange: (v: string) => void; invalid?: boolean }) {
  return (
    <div className="relative">
      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">{sym}</span>
      <TextInput inputMode="numeric" value={value ? Number(value).toLocaleString() : ""} onChange={(e) => onChange(e.target.value.replace(/\D/g, "").slice(0, 7))} aria-invalid={invalid} className={cn(sym.length > 1 ? "pl-10" : "pl-7", invalid && "border-danger")} placeholder="0" />
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  return msg ? <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-danger"><CircleAlert className="size-3" /> {msg}</span> : null;
}
