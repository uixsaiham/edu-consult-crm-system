"use client";

import { useRef, useState, type FormEvent } from "react";
import {
  AlertTriangle,
  BookOpen,
  Briefcase,
  CalendarClock,
  CalendarPlus,
  Check,
  CheckCircle2,
  ChevronDown,
  CircleDot,
  Eye,
  FileCheck2,
  FileText,
  FileUp,
  Flag,
  GraduationCap,
  Home,
  IdCard,
  Languages,
  Mail,
  MapPin,
  MessageCircle,
  NotebookPen,
  Pencil,
  Phone,
  Plane,
  ScrollText,
  SendHorizontal,
  ShieldCheck,
  Upload,
  UserRound,
  Users,
  Video,
  XCircle,
} from "lucide-react";
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import {
  applicationStageStyles,
  applicationStages,
  fundingStatuses,
  fundingStyles,
  operationsSnapshotDate,
  type ApplicationRow,
  type ApplicationStage,
  type FundingStatus,
} from "@/lib/mock/applications";
import { completeness, type Address, type ApplicationProfile, type DocumentStatus, type PersonalProfile, type SentEmail } from "@/lib/mock/application-profile";
import { cn, initialsFor } from "@/lib/utils";
import { AnchoredMenu, MenuItem, MenuLabel } from "../list/anchored-menu";
import { coursesOf, MAIN } from "../list/course-manager";
import { formatCreated, whatsappLink } from "../list/format";
import { Empty, fmtDate, Group, Info, InfoGrid, Panel, smallButton, smallPrimary, Tag } from "./ui";

export type SectionKey =
  | "personal"
  | "courses"
  | "academic"
  | "work"
  | "language"
  | "declaration"
  | "overview"
  | "documents"
  | "requests"
  | "status"
  | "notes"
  | "followups"
  | "meetings"
  | "contact"
  | "activities";

const NOW = "2026-09-17T11:00:00Z";
const ageOn = (dob: string) => {
  if (!dob) return null;
  const [y, m, d] = dob.split("-").map(Number);
  const [ny, nm, nd] = [2026, 9, 17];
  return ny - y - (nm < m || (nm === m && nd < d) ? 1 : 0);
};

// --- Stage and funding pickers --------------------------------------------

export function StagePicker({ value, onChange, size = "md" }: { value: ApplicationStage; onChange: (s: ApplicationStage) => void; size?: "sm" | "md" }) {
  const st = applicationStageStyles[value];
  return (
    <AnchoredMenu
      label="Change application status"
      width={200}
      triggerClassName={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full font-semibold", size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs", st.bg, st.text)}
      trigger={
        <>
          <span className={cn("size-1.5 rounded-full", st.dot)} />
          {value}
          <ChevronDown className="size-3 opacity-70" />
        </>
      }
    >
      {(close) => (
        <>
          <MenuLabel>Application status</MenuLabel>
          {applicationStages.map((s) => (
            <MenuItem key={s} selected={s === value} onClick={() => { if (s !== value) onChange(s); close(); }}>
              <span className="inline-flex items-center gap-2">
                <span className={cn("size-2 rounded-full", applicationStageStyles[s].dot)} />
                {s}
              </span>
            </MenuItem>
          ))}
        </>
      )}
    </AnchoredMenu>
  );
}

export function FundingPicker({ value, onChange, size = "md" }: { value: FundingStatus; onChange: (f: FundingStatus) => void; size?: "sm" | "md" }) {
  return (
    <AnchoredMenu
      label="Change fees and funding"
      width={190}
      triggerClassName={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full font-semibold", size === "sm" ? "px-2 py-0.5 text-[11px]" : "px-2.5 py-1 text-xs", fundingStyles[value])}
      trigger={
        <>
          {value === "N/A" ? "Funding: N/A" : value}
          <ChevronDown className="size-3 opacity-70" />
        </>
      }
    >
      {(close) => (
        <>
          <MenuLabel>Fees & funding</MenuLabel>
          {fundingStatuses.map((f) => (
            <MenuItem key={f} selected={f === value} onClick={() => { if (f !== value) onChange(f); close(); }}>
              {f}
            </MenuItem>
          ))}
        </>
      )}
    </AnchoredMenu>
  );
}

// --- Personal details -----------------------------------------------------

type PersonalDraft = { personal: PersonalProfile; phone: string; email: string; present: Address; permanent: Address; same: boolean };

const personalFields: { key: keyof PersonalProfile; label: string; type?: "date"; options?: string[] }[] = [
  { key: "title", label: "Title", options: ["Mr", "Ms", "Mrs", "Mx", "Dr"] },
  { key: "fullName", label: "Full name" },
  { key: "gender", label: "Gender", options: ["Female", "Male", "Other", "Prefer not to say"] },
  { key: "dob", label: "Date of birth", type: "date" },
  { key: "nationality", label: "Nationality" },
  { key: "ethnicOrigin", label: "Ethnic origin" },
  { key: "firstLanguage", label: "First language" },
  { key: "maritalStatus", label: "Marital status", options: ["Single", "Married", "Divorced", "Widowed"] },
  { key: "residentialStatus", label: "Residential status" },
  { key: "ukEntryDate", label: "Date of entry to the UK", type: "date" },
  { key: "shareCode", label: "Share code" },
  { key: "passportNo", label: "Passport / ID number" },
  { key: "passportIssue", label: "Passport issue date", type: "date" },
  { key: "passportExpiry", label: "Passport expiry date", type: "date" },
];

export function PersonalSection({
  app,
  profile,
  onSave,
}: {
  app: ApplicationRow;
  profile: ApplicationProfile;
  onSave: (d: PersonalDraft) => void;
}) {
  const [draft, setDraft] = useState<PersonalDraft | null>(null);
  const p = profile.personal;
  const age = ageOn(p.dob);
  const expiresSoon = p.passportExpiry && p.passportExpiry < "2027-09-01";
  const needsShareCode = !!p.ukEntryDate;

  const start = () =>
    setDraft({ personal: { ...p }, phone: app.phone, email: app.email, present: { ...profile.presentAddress }, permanent: { ...profile.permanentAddress }, same: profile.sameAddress });

  if (draft) {
    const setP = (k: keyof PersonalProfile, v: string) => setDraft({ ...draft, personal: { ...draft.personal, [k]: v } });
    const invalid = !draft.personal.fullName.trim() || !draft.phone.trim() || !/^\S+@\S+\.\S+$/.test(draft.email);
    const submit = (e: FormEvent) => {
      e.preventDefault();
      if (invalid) return;
      onSave(draft);
      setDraft(null);
    };
    return (
      <Panel
        title="Edit personal details"
        description="Changes are saved to this application and the student's lead record."
        action={
          <>
            <button type="button" onClick={() => setDraft(null)} className={smallButton}>Cancel</button>
            <button type="submit" form="personal-form" disabled={invalid} className={smallPrimary}><Check className="size-3.5" /> Save changes</button>
          </>
        }
      >
        <form id="personal-form" onSubmit={submit} className="flex flex-col gap-6">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <Field label="Phone" required>
              <TextInput value={draft.phone} onChange={(e) => setDraft({ ...draft, phone: e.target.value })} />
            </Field>
            <Field label="Email" required>
              <TextInput type="email" value={draft.email} onChange={(e) => setDraft({ ...draft, email: e.target.value })} />
            </Field>
            {personalFields.map((f) => (
              <Field key={f.key} label={f.label} required={f.key === "fullName"}>
                {f.options ? (
                  <Select value={draft.personal[f.key]} onChange={(e) => setP(f.key, e.target.value)}>
                    {f.options.map((o) => <option key={o}>{o}</option>)}
                  </Select>
                ) : (
                  <TextInput type={f.type ?? "text"} value={draft.personal[f.key]} onChange={(e) => setP(f.key, e.target.value)} />
                )}
              </Field>
            ))}
          </div>
          <AddressFields title="Present address" value={draft.present} onChange={(present) => setDraft({ ...draft, present, permanent: draft.same ? present : draft.permanent })} />
          <label className="flex items-center gap-2 text-xs font-medium text-foreground">
            <input type="checkbox" checked={draft.same} onChange={(e) => setDraft({ ...draft, same: e.target.checked, permanent: e.target.checked ? draft.present : draft.permanent })} className="size-4 accent-[var(--color-primary)]" />
            Permanent address is the same as present address
          </label>
          {!draft.same && <AddressFields title="Permanent address" value={draft.permanent} onChange={(permanent) => setDraft({ ...draft, permanent })} />}
        </form>
      </Panel>
    );
  }

  return (
    <Panel
      title="Personal details"
      description="Identity, residency and passport information as supplied by the student."
      action={<button type="button" onClick={start} className={smallButton}><Pencil className="size-3.5" /> Edit</button>}
    >
      <div className="flex flex-col gap-7">
        <Group title="Identity" icon={UserRound}>
          <InfoGrid>
            <Info label="Full name" value={`${p.title} ${p.fullName}`} />
            <Info label="Phone" value={app.phone} />
            <Info label="Email" value={app.email} />
            <Info label="Gender" value={p.gender} />
            <Info label="Date of birth" value={fmtDate(p.dob)} hint={age !== null && <Tag>{age} yrs</Tag>} />
            <Info label="Marital status" value={p.maritalStatus} />
            <Info label="Nationality" value={p.nationality} />
            <Info label="Ethnic origin" value={p.ethnicOrigin} />
            <Info label="First language" value={p.firstLanguage} />
          </InfoGrid>
        </Group>
        <Group title="Residency" icon={Home}>
          <InfoGrid>
            <Info label="Application type" value={profile.applicationType} />
            <Info label="Residential status" value={p.residentialStatus} />
            <Info label="Date of entry to the UK" value={p.ukEntryDate ? fmtDate(p.ukEntryDate) : "Not applicable"} />
            <Info label="Share code" value={p.shareCode || (needsShareCode ? "" : "Not required")}>
              {p.shareCode ? <span className="font-mono tracking-wider">{p.shareCode}</span> : undefined}
            </Info>
          </InfoGrid>
        </Group>
        <Group title="Passport" icon={IdCard}>
          <InfoGrid>
            <Info label="Passport / ID number">{p.passportNo ? <span className="font-mono">{p.passportNo}</span> : undefined}</Info>
            <Info label="Issue date" value={fmtDate(p.passportIssue)} />
            <Info label="Expiry date" value={fmtDate(p.passportExpiry)} hint={expiresSoon && <Tag tone="warning"><AlertTriangle className="size-3" /> Expires during course</Tag>} />
          </InfoGrid>
        </Group>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <AddressCard title="Present address" address={profile.presentAddress} />
          <AddressCard title="Permanent address" address={profile.permanentAddress} same={profile.sameAddress} />
        </div>
      </div>
    </Panel>
  );
}

function AddressCard({ title, address, same }: { title: string; address: Address; same?: boolean }) {
  const lines = [address.line1, address.line2, `${address.city}${address.postcode ? ` ${address.postcode}` : ""}`, address.state, address.country].filter(Boolean);
  return (
    <div className="rounded-2xl border border-border bg-surface-muted/60 p-4">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <MapPin className="size-3.5" /> {title}
        {same && <Tag className="ml-auto normal-case tracking-normal">Same as present</Tag>}
      </p>
      {lines.length ? (
        <address className="text-sm not-italic leading-6 text-foreground">
          {lines.map((l) => <span key={l} className="block">{l}</span>)}
        </address>
      ) : (
        <p className="text-sm text-muted-foreground">Not provided</p>
      )}
    </div>
  );
}

function AddressFields({ title, value, onChange }: { title: string; value: Address; onChange: (a: Address) => void }) {
  const set = (k: keyof Address, v: string) => onChange({ ...value, [k]: v });
  const fields: [keyof Address, string][] = [["line1", "House number / name and street"], ["line2", "Address line 2"], ["city", "Town / city"], ["state", "County / state"], ["postcode", "Postcode"], ["country", "Country"]];
  return (
    <Group title={title} icon={MapPin}>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
        {fields.map(([k, label]) => (
          <Field key={k} label={label}>
            <TextInput value={value[k]} onChange={(e) => set(k, e.target.value)} />
          </Field>
        ))}
      </div>
    </Group>
  );
}

// --- Courses --------------------------------------------------------------

export function CoursesSection({
  app,
  onManage,
  onPatch,
}: {
  app: ApplicationRow;
  onManage: () => void;
  onPatch: (id: string, patch: { stage?: ApplicationStage; funding?: FundingStatus }) => void;
}) {
  const courses = coursesOf(app);
  return (
    <Panel
      title="Courses"
      description={`${courses.length} course${courses.length === 1 ? "" : "s"} applied for, in order of preference.`}
      action={<button type="button" onClick={onManage} className={smallPrimary}><BookOpen className="size-3.5" /> Manage courses</button>}
    >
      <ol className="flex flex-col gap-3">
        {courses.map((c, i) => (
          <li key={c.id} className={cn("rounded-2xl border p-4", c.id === MAIN ? "border-primary/30 bg-primary-soft/40" : "border-border")}>
            <div className="flex flex-wrap items-start gap-3">
              <span className={cn("flex size-8 shrink-0 items-center justify-center rounded-xl text-xs font-bold", c.id === MAIN ? "bg-primary text-primary-foreground" : "bg-surface-hover text-muted-foreground")}>{i + 1}</span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                  {c.course}
                  {c.id === MAIN && <Tag tone="primary">Main choice</Tag>}
                </p>
                <p className="text-xs text-muted-foreground">{c.university} · {c.country}</p>
              </div>
              <div className="flex flex-wrap items-center gap-1.5">
                <StagePicker size="sm" value={c.stage} onChange={(stage) => onPatch(c.id, { stage })} />
                <FundingPicker size="sm" value={c.funding} onChange={(funding) => onPatch(c.id, { funding })} />
              </div>
            </div>
            <dl className="mt-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
              {[["Level", c.level], ["Delivery", c.mode], ["Campus", c.campus], ["Intake", c.intake]].map(([l, v]) => (
                <div key={l} className="rounded-xl bg-surface px-3 py-2 ring-1 ring-border">
                  <dt className="text-[10px] font-medium text-muted-foreground">{l}</dt>
                  <dd className="truncate text-xs font-semibold text-foreground">{v}</dd>
                </div>
              ))}
            </dl>
          </li>
        ))}
      </ol>
    </Panel>
  );
}

// --- Academic, work, language, declaration --------------------------------

export function AcademicSection({ profile }: { profile: ApplicationProfile }) {
  return (
    <Panel title="Academic qualifications" description="Highest qualification last. Certified copies are checked under Documents.">
      {profile.education.length === 0 ? (
        <Empty icon={GraduationCap} title="No qualifications added" />
      ) : (
        <ol className="relative flex flex-col gap-3 before:absolute before:bottom-4 before:left-[15px] before:top-4 before:w-px before:bg-border">
          {profile.education.map((q) => (
            <li key={q.id} className="relative flex gap-4">
              <span className="relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full bg-primary-soft text-primary ring-4 ring-surface">
                <GraduationCap className="size-4" />
              </span>
              <div className="min-w-0 flex-1 rounded-2xl border border-border p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <p className="text-sm font-semibold text-foreground">{q.qualification}</p>
                  <Tag>{q.level}</Tag>
                  <Tag tone={q.status === "Completed" ? "success" : "warning"} className="ml-auto">{q.status}</Tag>
                </div>
                <p className="mt-0.5 text-xs text-muted-foreground">{q.institute}</p>
                <dl className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                  <Info label="Subject / group" value={q.subject} />
                  <Info label="Result" value={q.grade} />
                  <Info label="Year" value={q.year} />
                </dl>
              </div>
            </li>
          ))}
        </ol>
      )}
    </Panel>
  );
}

export function WorkSection({ profile }: { profile: ApplicationProfile }) {
  return (
    <Panel title="Work experience" description="Employment history, including gaps the university may ask about.">
      {profile.work.length === 0 ? (
        <Empty icon={Briefcase} title="No work experience" body="The student hasn't reported any employment. That's normal for school leavers." />
      ) : (
        <ul className="flex flex-col gap-3">
          {profile.work.map((w) => (
            <li key={w.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <span className="flex size-8 items-center justify-center rounded-xl bg-surface-hover text-muted-foreground"><Briefcase className="size-4" /></span>
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-foreground">{w.role}</p>
                  <p className="text-xs text-muted-foreground">{w.employer} · {w.type}</p>
                </div>
                <Tag tone={w.end ? "muted" : "success"}>{fmtDate(w.start)} – {w.end ? fmtDate(w.end) : "Present"}</Tag>
              </div>
              <p className="mt-3 text-xs leading-5 text-foreground/80">{w.duties}</p>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

export function LanguageSection({ profile }: { profile: ApplicationProfile }) {
  return (
    <Panel title="Language proficiency" description="English test results used for the offer and visa.">
      <ul className="flex flex-col gap-3">
        {profile.languages.map((l) => (
          <li key={l.id} className="rounded-2xl border border-border p-4">
            <div className="flex flex-wrap items-center gap-3">
              <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Languages className="size-5" /></span>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-foreground">{l.test}</p>
                <p className="text-xs text-muted-foreground">
                  {l.status === "Booked" ? `Test booked for ${fmtDate(l.date)}` : l.status === "Not required" ? "Exempt from an English test" : `Taken ${fmtDate(l.date)}`}
                </p>
              </div>
              <Tag tone={l.status === "Completed" ? "success" : l.status === "Booked" ? "warning" : "muted"}>{l.status}</Tag>
              {l.overall !== "—" && (
                <div className="text-right">
                  <p className="text-[10px] font-medium text-muted-foreground">Overall</p>
                  <p className="text-xl font-bold tabular-nums text-foreground">{l.overall}</p>
                </div>
              )}
            </div>
            {l.bands && (
              <div className="mt-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
                {Object.entries(l.bands).map(([k, v]) => (
                  <div key={k} className="rounded-xl bg-surface-muted px-3 py-2">
                    <p className="text-[10px] font-medium capitalize text-muted-foreground">{k}</p>
                    <p className="text-sm font-semibold tabular-nums text-foreground">{v}</p>
                  </div>
                ))}
              </div>
            )}
            {l.note && <p className="mt-3 text-xs text-muted-foreground">{l.note}</p>}
          </li>
        ))}
      </ul>
    </Panel>
  );
}

export function DeclarationSection({ profile }: { profile: ApplicationProfile }) {
  const flagged = profile.declaration.filter((d) => d.answer === "Yes" && /refused|criminal|disabilit/i.test(d.question));
  return (
    <Panel title="Declaration" description="The student's answers to the application declaration.">
      {flagged.length > 0 && (
        <div className="mb-4 flex items-start gap-2 rounded-2xl bg-warning-soft px-4 py-3 text-xs text-foreground">
          <AlertTriangle className="mt-0.5 size-4 shrink-0 text-warning" />
          <span>{flagged.length} answer{flagged.length > 1 ? "s need" : " needs"} a closer look before submission.</span>
        </div>
      )}
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {profile.declaration.map((d) => (
          <li key={d.question} className="flex items-start gap-3 px-4 py-3">
            <span className="min-w-0 flex-1 text-sm text-foreground">
              {d.question}
              {d.detail && <span className="mt-0.5 block text-xs text-muted-foreground">{d.detail}</span>}
            </span>
            <Tag tone={d.answer === "Yes" ? (/refused|criminal|disabilit/i.test(d.question) ? "warning" : "primary") : "muted"}>{d.answer}</Tag>
          </li>
        ))}
        <li className="flex items-start gap-3 px-4 py-3">
          <span className="min-w-0 flex-1 text-sm text-foreground">How will tuition fees be paid?</span>
          <span className="text-sm font-medium text-foreground">{profile.feesPayment}</span>
        </li>
      </ul>
      <p className="mt-4 flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="size-3.5 text-success" /> Student confirmed the information is accurate and consented to it being shared with the university.
      </p>
    </Panel>
  );
}

// --- Overview -------------------------------------------------------------

export function OverviewSection({ app, profile, onGo }: { app: ApplicationRow; profile: ApplicationProfile; onGo: (s: SectionKey) => void }) {
  const { checks, percent } = completeness(profile);
  const targets: Record<string, SectionKey> = {
    "Personal details": "personal",
    Address: "personal",
    "Academic qualifications": "academic",
    "Language proficiency": "language",
    Declaration: "declaration",
    Documents: "documents",
    "Student contract": "overview",
  };
  const openFollowUps = app.followUps.filter((f) => !f.done).length;
  const openRequests = app.documentRequests.filter((d) => d.status === "Requested").length;
  return (
    <Panel title="Application overview" description="How complete the file is and what's still outstanding.">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_minmax(0,1fr)]">
        <div className="flex flex-col items-center justify-center gap-2 rounded-2xl bg-surface-muted p-5 text-center">
          <div className="relative size-28">
            <svg viewBox="0 0 36 36" className="size-28 -rotate-90">
              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" className="stroke-border" />
              <circle cx="18" cy="18" r="15.5" fill="none" strokeWidth="3" strokeLinecap="round" className="stroke-primary" strokeDasharray={`${(percent / 100) * 97.4} 97.4`} />
            </svg>
            <span className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-2xl font-bold tabular-nums text-foreground">{percent}%</span>
              <span className="text-[10px] text-muted-foreground">complete</span>
            </span>
          </div>
          <p className="text-xs text-muted-foreground">{checks.filter((c) => c.done).length} of {checks.length} checks passed</p>
        </div>
        <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
          {checks.map((c) => (
            <li key={c.label}>
              <button type="button" onClick={() => onGo(targets[c.label])} className="flex w-full items-center gap-3 rounded-xl border border-border px-3 py-2.5 text-left transition-colors hover:border-primary/40 hover:bg-primary-soft/40">
                {c.done ? <CheckCircle2 className="size-4 shrink-0 text-success" /> : <CircleDot className="size-4 shrink-0 text-warning" />}
                <span className="flex-1 text-sm text-foreground">{c.label}</span>
                <span className={cn("text-[11px] font-semibold", c.done ? "text-success" : "text-warning")}>{c.done ? "Done" : "Outstanding"}</span>
              </button>
            </li>
          ))}
        </ul>
      </div>
      <div className="mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat label="Courses applied" value={1 + app.courseOptions.length} onClick={() => onGo("courses")} />
        <Stat label="Documents verified" value={`${profile.documents.filter((d) => d.status === "Verified").length}/${profile.documents.length}`} onClick={() => onGo("documents")} />
        <Stat label="Open follow-ups" value={openFollowUps} onClick={() => onGo("followups")} />
        <Stat label="Open document requests" value={openRequests} onClick={() => onGo("requests")} />
      </div>
      {(app.deadlines?.length || app.blockers?.length) ? (
        <div className="mt-6 flex flex-col gap-2">
          {app.deadlines?.map((d) => {
            const days = Math.round((Date.parse(d.dueDate) - Date.parse(operationsSnapshotDate)) / 86400000);
            return (
              <div key={d.type + d.dueDate} className="flex items-center gap-3 rounded-xl bg-surface-muted px-4 py-2.5 text-sm">
                <CalendarClock className="size-4 text-muted-foreground" />
                <span className="flex-1 text-foreground">{d.type} deadline · {fmtDate(d.dueDate)}</span>
                <Tag tone={days < 0 ? "danger" : days <= 7 ? "warning" : "muted"}>{days < 0 ? `${-days}d overdue` : days === 0 ? "Today" : `In ${days}d`}</Tag>
              </div>
            );
          })}
          {app.blockers?.map((b) => (
            <div key={b.reason} className="flex items-center gap-3 rounded-xl bg-warning-soft px-4 py-2.5 text-sm text-foreground">
              <AlertTriangle className="size-4 text-warning" />
              <span className="flex-1"><span className="font-semibold">{b.category}:</span> {b.reason}</span>
              <span className="text-xs text-muted-foreground">since {fmtDate(b.since)}</span>
            </div>
          ))}
        </div>
      ) : null}
    </Panel>
  );
}

function Stat({ label, value, onClick }: { label: string; value: string | number; onClick: () => void }) {
  return (
    <button type="button" onClick={onClick} className="rounded-2xl border border-border px-4 py-3 text-left transition-colors hover:border-primary/40">
      <p className="text-xl font-bold tabular-nums text-foreground">{value}</p>
      <p className="text-[11px] text-muted-foreground">{label}</p>
    </button>
  );
}

// --- Documents ------------------------------------------------------------

const docTone: Record<DocumentStatus, "success" | "warning" | "muted" | "danger"> = {
  Verified: "success",
  "Pending review": "warning",
  Missing: "muted",
  Rejected: "danger",
};
const allowed = ".pdf,.doc,.docx,.jpg,.jpeg,.png,.gif";

export function DocumentsSection({
  profile,
  onUpload,
  onStatus,
  onRequest,
}: {
  profile: ApplicationProfile;
  onUpload: (docId: string, file: File) => void;
  onStatus: (docId: string, status: DocumentStatus) => void;
  onRequest: () => void;
}) {
  const input = useRef<HTMLInputElement>(null);
  const target = useRef<string>("");
  const [filter, setFilter] = useState<"All" | DocumentStatus>("All");
  const counts = (s: DocumentStatus) => profile.documents.filter((d) => d.status === s).length;
  const list = profile.documents.filter((d) => filter === "All" || d.status === filter);

  const choose = (id: string) => {
    target.current = id;
    input.current?.click();
  };

  return (
    <Panel
      title="Documents"
      description="PDF, DOC, DOCX, JPG, PNG or GIF — up to 10MB each."
      action={<button type="button" onClick={onRequest} className={smallButton}><FileUp className="size-3.5" /> Request from student</button>}
    >
      <input
        ref={input}
        type="file"
        accept={allowed}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onUpload(target.current, file);
          e.target.value = "";
        }}
      />
      <div className="mb-4 flex flex-wrap gap-1.5">
        {(["All", "Verified", "Pending review", "Missing", "Rejected"] as const).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setFilter(s)}
            className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition-colors", filter === s ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground hover:bg-surface-hover")}
          >
            {s} <span className="ml-0.5 tabular-nums opacity-80">{s === "All" ? profile.documents.length : counts(s)}</span>
          </button>
        ))}
      </div>
      <ul className="divide-y divide-border rounded-2xl border border-border">
        {list.map((d) => (
          <li key={d.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
            <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", d.status === "Missing" ? "bg-surface-hover text-muted-foreground" : "bg-primary-soft text-primary")}>
              {d.status === "Verified" ? <FileCheck2 className="size-4" /> : <FileText className="size-4" />}
            </span>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-foreground">{d.type}</p>
              <p className="truncate text-xs text-muted-foreground">
                {d.status === "Missing" ? "Not uploaded yet" : `${d.fileName} · ${d.size} · ${fmtDate(d.uploadedAt)}`}
              </p>
            </div>
            <Tag tone={docTone[d.status]}>{d.status}</Tag>
            <div className="flex items-center gap-1">
              {d.status === "Pending review" && (
                <>
                  <button type="button" onClick={() => onStatus(d.id, "Verified")} className="inline-flex h-8 items-center gap-1 rounded-full bg-success-soft px-3 text-xs font-semibold text-success hover:opacity-90"><Check className="size-3.5" /> Verify</button>
                  <button type="button" onClick={() => onStatus(d.id, "Rejected")} aria-label={`Reject ${d.type}`} className="flex size-8 items-center justify-center rounded-full text-danger hover:bg-danger-soft"><XCircle className="size-4" /></button>
                </>
              )}
              {d.status !== "Missing" && (
                <span className="flex size-8 items-center justify-center rounded-full text-muted-foreground" title={d.fileName}><Eye className="size-4" /></span>
              )}
              <button type="button" onClick={() => choose(d.id)} className={smallButton}>
                <Upload className="size-3.5" /> {d.status === "Missing" ? "Upload" : "Replace"}
              </button>
            </div>
          </li>
        ))}
        {list.length === 0 && <li className="px-4 py-8 text-center text-xs text-muted-foreground">No documents with this status.</li>}
      </ul>
    </Panel>
  );
}

export function RequestsSection({ app, onNew, onReceived }: { app: ApplicationRow; onNew: () => void; onReceived: (id: string) => void }) {
  return (
    <Panel
      title="Document requests"
      description="Requests sent to the student by email, WhatsApp or the student portal."
      action={<button type="button" onClick={onNew} className={smallPrimary}><FileUp className="size-3.5" /> New request</button>}
    >
      {app.documentRequests.length === 0 ? (
        <Empty icon={FileUp} title="No requests yet" body="Ask the student for a missing or updated document and track it here." action={<button type="button" onClick={onNew} className={smallButton}>Request a document</button>} />
      ) : (
        <ul className="flex flex-col gap-3">
          {app.documentRequests.map((d) => (
            <li key={d.id} className="rounded-2xl border border-border p-4">
              <div className="flex flex-wrap items-center gap-2">
                <p className="text-sm font-semibold text-foreground">{d.title}</p>
                {d.count > 1 && <Tag>× {d.count}</Tag>}
                <Tag tone={d.status === "Received" ? "success" : "warning"} className="ml-auto">{d.status}</Tag>
              </div>
              {d.description && <p className="mt-1 text-xs text-muted-foreground">{d.description}</p>}
              <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
                <span>Due {fmtDate(d.dueDate)}</span>
                <span>Via {d.channels.join(", ")}</span>
                <span>Requested by {d.by} · {formatCreated(d.requestedAt)}</span>
                {d.status === "Requested" && (
                  <button type="button" onClick={() => onReceived(d.id)} className="ml-auto inline-flex h-7 items-center gap-1 rounded-full bg-success-soft px-3 text-[11px] font-semibold text-success">
                    <Check className="size-3" /> Mark received
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// --- Status ---------------------------------------------------------------

export function StatusSection({
  app,
  profile,
  onStage,
  onFunding,
}: {
  app: ApplicationRow;
  profile: ApplicationProfile;
  onStage: (s: ApplicationStage) => void;
  onFunding: (f: FundingStatus) => void;
}) {
  const history = [...profile.history].reverse();
  return (
    <Panel title="Application status" description="Current status of the main course and how it got there.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <div className="rounded-2xl border border-border p-4">
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">Application status</p>
          <StagePicker value={app.stage} onChange={onStage} />
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="mb-2 text-[11px] font-medium text-muted-foreground">Fees & funding</p>
          <FundingPicker value={app.funding} onChange={onFunding} />
        </div>
        <div className="rounded-2xl border border-border p-4">
          <p className="mb-1 text-[11px] font-medium text-muted-foreground">Student ID</p>
          <p className={cn("text-sm font-semibold", app.studentId ? "font-mono text-foreground" : "text-muted-foreground")}>{app.studentId || "Issued on enrolment"}</p>
        </div>
      </div>
      <Group title="Status history" icon={Flag} className="mt-6">
        <ol className="relative flex flex-col gap-4 before:absolute before:bottom-2 before:left-[7px] before:top-2 before:w-px before:bg-border">
          {history.map((h, i) => {
            const st = applicationStageStyles[h.stage];
            return (
              <li key={`${h.stage}-${h.at}-${i}`} className="relative flex items-start gap-3 pl-0">
                <span className={cn("relative z-10 mt-1 size-[15px] shrink-0 rounded-full ring-4 ring-surface", st.dot)} />
                <div className="min-w-0 flex-1">
                  <p className="flex flex-wrap items-center gap-2 text-sm text-foreground">
                    <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", st.bg, st.text)}>{h.stage}</span>
                    {i === 0 && <Tag tone="primary">Current</Tag>}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{formatCreated(h.at)} · {h.by === "System" ? "Application created" : `Updated by ${h.by}`}</p>
                </div>
              </li>
            );
          })}
        </ol>
      </Group>
    </Panel>
  );
}

// --- Notes ----------------------------------------------------------------

export function NotesSection({ app, onAdd }: { app: ApplicationRow; onAdd: (text: string) => void }) {
  const [draft, setDraft] = useState("");
  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAdd(draft.trim());
    setDraft("");
  };
  return (
    <Panel title="Application notes" description="Internal notes. Students never see these.">
      <form onSubmit={submit} className="mb-5 flex flex-col gap-2">
        <Textarea rows={3} value={draft} onChange={(e) => setDraft(e.target.value)} placeholder="Write a note for the team…" aria-label="New note" />
        <div className="flex justify-end">
          <button type="submit" disabled={!draft.trim()} className={smallPrimary}><SendHorizontal className="size-3.5" /> Add note</button>
        </div>
      </form>
      {app.notes.length === 0 ? (
        <Empty icon={NotebookPen} title="No notes yet" />
      ) : (
        <ul className="flex flex-col gap-3">
          {app.notes.map((n, i) => (
            <li key={i} className="flex gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-surface-hover text-[10px] font-bold text-muted-foreground">{initialsFor(n.author)}</span>
              <div className="min-w-0 flex-1 rounded-2xl rounded-tl-sm bg-surface-muted px-4 py-3">
                <p className="text-[11px] text-muted-foreground"><span className="font-semibold text-foreground">{n.author}</span> · {formatCreated(n.at)}</p>
                <p className="mt-1 text-sm text-foreground">{n.text}</p>
              </div>
            </li>
          ))}
        </ul>
      )}
    </Panel>
  );
}

// --- Follow-ups and meetings ----------------------------------------------

export function FollowUpsSection({ app, onNew, onToggle }: { app: ApplicationRow; onNew: () => void; onToggle: (id: string) => void }) {
  const open = app.followUps.filter((f) => !f.done);
  const done = app.followUps.filter((f) => f.done);
  return (
    <Panel
      title="Follow-ups"
      description={`${open.length} open · ${done.length} completed`}
      action={<button type="button" onClick={onNew} className={smallPrimary}><CalendarPlus className="size-3.5" /> Schedule follow-up</button>}
    >
      {app.followUps.length === 0 ? (
        <Empty icon={CalendarPlus} title="No follow-ups scheduled" body="Set a reminder to call, message or email the student." />
      ) : (
        <ul className="flex flex-col gap-2">
          {[...open, ...done].map((f) => {
            const overdue = !f.done && f.at < NOW;
            return (
              <li key={f.id} className="flex items-start gap-3 rounded-2xl border border-border px-4 py-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={f.done}
                  aria-label={`Mark follow-up ${f.done ? "not done" : "done"}`}
                  onClick={() => onToggle(f.id)}
                  className={cn("mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors", f.done ? "border-success bg-success text-white" : "border-border-strong hover:border-primary")}
                >
                  {f.done && <Check className="size-3" strokeWidth={3} />}
                </button>
                <div className="min-w-0 flex-1">
                  <p className={cn("text-sm font-semibold", f.done ? "text-muted-foreground line-through" : "text-foreground")}>{f.channel} · {formatCreated(f.at)}</p>
                  {f.notes && <p className="text-xs text-muted-foreground">{f.notes}</p>}
                  <p className="mt-1 text-[11px] text-muted-foreground">Set by {f.by}</p>
                </div>
                {overdue && <Tag tone="danger">Overdue</Tag>}
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

export function MeetingsSection({ app, onNew }: { app: ApplicationRow; onNew: () => void }) {
  return (
    <Panel
      title="Meetings & appointments"
      description="Counselling sessions, interview prep and document checks."
      action={<button type="button" onClick={onNew} className={smallPrimary}><Users className="size-3.5" /> Book meeting</button>}
    >
      {app.meetings.length === 0 ? (
        <Empty icon={Users} title="No meetings booked" />
      ) : (
        <ul className="flex flex-col gap-3">
          {app.meetings.map((m) => {
            const d = new Date(m.at);
            const upcoming = m.at >= NOW;
            return (
              <li key={m.id} className="flex items-center gap-4 rounded-2xl border border-border p-4">
                <div className="flex w-14 shrink-0 flex-col items-center rounded-xl bg-primary-soft py-2 text-primary">
                  <span className="text-[10px] font-semibold uppercase">{d.toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</span>
                  <span className="text-lg font-bold leading-none">{d.getUTCDate()}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <p className="flex items-center gap-2 text-sm font-semibold text-foreground">
                    {m.format === "Video call" ? <Video className="size-4 text-muted-foreground" /> : m.format === "Phone" ? <Phone className="size-4 text-muted-foreground" /> : <Users className="size-4 text-muted-foreground" />}
                    {m.format} with {m.counsellor}
                  </p>
                  <p className="text-xs text-muted-foreground">{formatCreated(m.at).split(", ")[1]} · {m.durationMins} min{m.notes && ` · ${m.notes}`}</p>
                </div>
                <Tag tone={upcoming ? "primary" : "muted"}>{upcoming ? "Upcoming" : "Past"}</Tag>
              </li>
            );
          })}
        </ul>
      )}
    </Panel>
  );
}

// --- Direct contact -------------------------------------------------------

const templates = [
  { name: "Custom message", subject: "", body: "" },
  {
    name: "Document reminder",
    subject: "Documents needed for your {university} application",
    body: "Hi {first},\n\nTo move your application forward we still need a few documents. Please upload them to the student portal or reply to this email with copies.\n\nKind regards,\n{me}",
  },
  {
    name: "Offer update",
    subject: "Update on your {university} application",
    body: "Hi {first},\n\nGood news — there's an update on your application for {course}. Please log in to the portal to review your offer and next steps.\n\nKind regards,\n{me}",
  },
  {
    name: "Interview invitation",
    subject: "Admissions interview — {university}",
    body: "Hi {first},\n\n{university} would like to invite you to a short admissions interview. Please reply with a few times that suit you this week.\n\nKind regards,\n{me}",
  },
];

export function ContactSection({ app, profile, me, onSend }: { app: ApplicationRow; profile: ApplicationProfile; me: string; onSend: (e: SentEmail) => void }) {
  const [subject, setSubject] = useState("");
  const [body, setBody] = useState("");
  const [tried, setTried] = useState(false);
  const fill = (s: string) => s.replaceAll("{first}", app.applicant.split(" ")[0]).replaceAll("{university}", app.university).replaceAll("{course}", app.course).replaceAll("{me}", me);

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (!subject.trim() || !body.trim()) return;
    onSend({ id: `EM-${Date.now().toString(36)}`, subject: subject.trim(), body: body.trim(), to: app.email, by: me, at: NOW });
    setSubject("");
    setBody("");
    setTried(false);
  };

  return (
    <Panel title="Direct contact" description="Reach the student directly. Emails are logged against this application.">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        <ContactCard icon={Phone} label="Call" value={app.phone} href={`tel:${app.phone.replace(/[^\d+]/g, "")}`} />
        <ContactCard icon={MessageCircle} label="WhatsApp" value={app.phone} href={whatsappLink(app.phone)} external />
        <ContactCard icon={Mail} label="Email" value={app.email} href={`mailto:${app.email}`} />
      </div>
      <form onSubmit={submit} className="mt-6 flex flex-col gap-4 rounded-2xl border border-border p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <p className="text-sm font-semibold text-foreground">Compose email</p>
          <div className="flex flex-wrap gap-1.5">
            {templates.slice(1).map((t) => (
              <button key={t.name} type="button" onClick={() => { setSubject(fill(t.subject)); setBody(fill(t.body)); }} className="rounded-full bg-surface-muted px-3 py-1.5 text-[11px] font-medium text-muted-foreground hover:bg-primary-soft hover:text-primary">
                {t.name}
              </button>
            ))}
          </div>
        </div>
        <Field label="To">
          <TextInput value={app.email} readOnly className="bg-surface-muted" />
        </Field>
        <Field label="Subject" required hint={tried && !subject.trim() ? "Add a subject." : undefined}>
          <TextInput value={subject} onChange={(e) => setSubject(e.target.value)} placeholder="Subject" />
        </Field>
        <Field label="Message" required hint={tried && !body.trim() ? "Write a message." : undefined}>
          <Textarea rows={7} value={body} onChange={(e) => setBody(e.target.value)} placeholder="Write your message…" />
        </Field>
        <div className="flex justify-end">
          <button type="submit" className={smallPrimary}><SendHorizontal className="size-3.5" /> Send email</button>
        </div>
      </form>
      <Group title={`Sent emails · ${profile.emails.length}`} icon={Mail} className="mt-6">
        {profile.emails.length === 0 ? (
          <p className="text-xs text-muted-foreground">No emails sent from the CRM yet.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            {profile.emails.map((m) => (
              <li key={m.id} className="rounded-2xl bg-surface-muted px-4 py-3">
                <p className="text-sm font-semibold text-foreground">{m.subject}</p>
                <p className="text-[11px] text-muted-foreground">To {m.to} · {m.by} · {formatCreated(m.at)}</p>
                <p className="mt-2 line-clamp-2 whitespace-pre-line text-xs text-foreground/80">{m.body}</p>
              </li>
            ))}
          </ul>
        )}
      </Group>
    </Panel>
  );
}

function ContactCard({ icon: Icon, label, value, href, external }: { icon: typeof Phone; label: string; value: string; href: string; external?: boolean }) {
  return (
    <a href={href} target={external ? "_blank" : undefined} rel={external ? "noreferrer" : undefined} className="group flex items-center gap-3 rounded-2xl border border-border p-4 transition-colors hover:border-primary/40 hover:bg-primary-soft/40">
      <span className="flex size-10 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="size-5" /></span>
      <span className="min-w-0">
        <span className="block text-sm font-semibold text-foreground group-hover:text-primary">{label}</span>
        <span className="block truncate text-xs text-muted-foreground">{value}</span>
      </span>
    </a>
  );
}

// --- Activities -----------------------------------------------------------

export type ActivityKind = "Status" | "Notes" | "Follow-ups" | "Meetings" | "Documents" | "Emails";
export interface ActivityItem {
  at: string;
  kind: ActivityKind;
  title: string;
  detail: string;
  by: string;
}

export function buildActivities(app: ApplicationRow, profile: ApplicationProfile): ActivityItem[] {
  const items: ActivityItem[] = [
    ...profile.history.map((h): ActivityItem => ({ at: h.at, kind: "Status", title: h.by === "System" ? "Application created" : `Status changed to ${h.stage}`, detail: `${app.course} · ${app.university}`, by: h.by })),
    ...app.notes.map((n): ActivityItem => ({ at: n.at, kind: "Notes", title: "Note added", detail: n.text, by: n.author })),
    ...app.followUps.map((f): ActivityItem => ({ at: f.at, kind: "Follow-ups", title: `${f.channel} follow-up${f.done ? " completed" : " scheduled"}`, detail: f.notes, by: f.by })),
    ...app.meetings.map((m): ActivityItem => ({ at: m.at, kind: "Meetings", title: `${m.format} meeting · ${m.durationMins} min`, detail: m.notes, by: m.counsellor })),
    ...app.documentRequests.map((d): ActivityItem => ({ at: d.requestedAt, kind: "Documents", title: `Requested: ${d.title}`, detail: `${d.status} · via ${d.channels.join(", ")}`, by: d.by })),
    ...profile.documents.filter((d) => d.uploadedAt).map((d): ActivityItem => ({ at: d.uploadedAt, kind: "Documents", title: `${d.type} uploaded`, detail: `${d.fileName} · ${d.status}`, by: app.applicant })),
    ...profile.emails.map((m): ActivityItem => ({ at: m.at, kind: "Emails", title: `Email sent: ${m.subject}`, detail: `To ${m.to}`, by: m.by })),
  ];
  if (profile.contract.sentAt) items.push({ at: profile.contract.sentAt, kind: "Documents", title: "Student contract sent", detail: profile.contract.status, by: app.counsellor });
  return items.sort((a, b) => b.at.localeCompare(a.at));
}

const kindIcon: Record<ActivityKind, { icon: typeof Phone; className: string }> = {
  Status: { icon: Flag, className: "bg-primary-soft text-primary" },
  Notes: { icon: NotebookPen, className: "bg-surface-hover text-muted-foreground" },
  "Follow-ups": { icon: CalendarPlus, className: "bg-warning-soft text-warning" },
  Meetings: { icon: Users, className: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  Documents: { icon: ScrollText, className: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  Emails: { icon: Mail, className: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
};

export function ActivitiesSection({ app, profile }: { app: ApplicationRow; profile: ApplicationProfile }) {
  const [kind, setKind] = useState<"All" | ActivityKind>("All");
  const all = buildActivities(app, profile);
  const list = all.filter((a) => kind === "All" || a.kind === kind);
  return (
    <Panel title="Activities" description="Everything that has happened on this application, newest first.">
      <div className="mb-5 flex flex-wrap gap-1.5">
        {(["All", "Status", "Notes", "Follow-ups", "Meetings", "Documents", "Emails"] as const).map((k) => (
          <button key={k} type="button" onClick={() => setKind(k)} className={cn("rounded-full px-3 py-1.5 text-xs font-medium transition-colors", kind === k ? "bg-primary text-primary-foreground" : "bg-surface-muted text-muted-foreground hover:bg-surface-hover")}>
            {k} <span className="ml-0.5 tabular-nums opacity-80">{k === "All" ? all.length : all.filter((a) => a.kind === k).length}</span>
          </button>
        ))}
      </div>
      {list.length === 0 ? (
        <Empty icon={Plane} title="Nothing here yet" />
      ) : (
        <ol className="relative flex flex-col gap-4 before:absolute before:bottom-3 before:left-[15px] before:top-3 before:w-px before:bg-border">
          {list.map((a, i) => {
            const k = kindIcon[a.kind];
            return (
              <li key={`${a.at}-${i}`} className="relative flex gap-3">
                <span className={cn("relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-surface", k.className)}>
                  <k.icon className="size-3.5" />
                </span>
                <div className="min-w-0 flex-1 pt-0.5">
                  <p className="text-sm font-medium text-foreground">{a.title}</p>
                  {a.detail && <p className="text-xs text-muted-foreground">{a.detail}</p>}
                  <p className="mt-0.5 text-[11px] text-muted-foreground">{formatCreated(a.at)} · {a.by}</p>
                </div>
              </li>
            );
          })}
        </ol>
      )}
    </Panel>
  );
}
