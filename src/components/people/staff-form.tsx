"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert, KeyRound, Mail, Send, ShieldCheck, UserPlus } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import {
  getRoles,
  getStaff,
  getTeams,
  markStaffChange,
  nextStaffId,
  saveStaff,
  saveTeams,
  staffBranches,
  type EmploymentType,
  type StaffBranch,
  type StaffMember,
  type StaffStatus,
} from "@/lib/mock/staff";
import { cn } from "@/lib/utils";
import { Avatar, RoleChip, StaffStatusBadge } from "./people-ui";

const languageOptions = ["English", "Bengali", "Sylheti", "Hindi", "Urdu", "Arabic", "Romanian", "Ukrainian", "Polish", "Portuguese", "Mandarin", "Malayalam", "Tamil", "Gujarati"];
const employmentTypes: EmploymentType[] = ["Full time", "Part time", "Contractor"];
const caseRoles = new Set(["admissions-lead", "branch-manager", "senior-counsellor", "counsellor", "compliance"]);

interface FormState {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  jobTitle: string;
  roleId: string;
  branch: StaffBranch;
  reportsTo: string;
  teamIds: string[];
  employment: EmploymentType;
  joined: string;
  languages: string[];
  capacity: string;
  monthlyTarget: string;
  status: StaffStatus;
  notes: string;
  sendInvite: boolean;
  requireTwoFactor: boolean;
}

function initialState(person?: StaffMember): FormState {
  const teams = getTeams();
  if (!person) {
    return {
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      jobTitle: "Education Counsellor",
      roleId: "counsellor",
      branch: "Dhaka HQ",
      reportsTo: "",
      teamIds: [],
      employment: "Full time",
      joined: "2026-09-17",
      languages: ["English"],
      capacity: "35",
      monthlyTarget: "5",
      status: "Invited",
      notes: "",
      sendInvite: true,
      requireTwoFactor: true,
    };
  }
  const [firstName, ...rest] = person.name.split(" ");
  return {
    firstName,
    lastName: rest.join(" "),
    email: person.email,
    phone: person.phone,
    jobTitle: person.jobTitle,
    roleId: person.roleId,
    branch: person.branch,
    reportsTo: person.reportsTo ?? "",
    teamIds: teams.filter((t) => t.memberIds.includes(person.id)).map((t) => t.id),
    employment: person.employment,
    joined: person.joined,
    languages: person.languages,
    capacity: String(person.capacity),
    monthlyTarget: String(person.monthlyTarget),
    status: person.status,
    notes: person.notes ?? "",
    sendInvite: false,
    requireTwoFactor: person.twoFactor,
  };
}

export function StaffForm({ person }: { person?: StaffMember }) {
  const router = useRouter();
  const editing = !!person;
  const [form, setForm] = useState<FormState>(() => initialState(person));
  const [tried, setTried] = useState(false);
  const roles = getRoles();
  const teams = getTeams();
  const staff = getStaff();
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));

  const managers = staff.filter((s) => s.id !== person?.id && s.status !== "Inactive" && ["admissions-lead", "branch-manager", "senior-counsellor", "compliance"].includes(s.roleId));
  const takesCases = caseRoles.has(form.roleId);
  const selectedRole = roles.find((r) => r.id === form.roleId);
  const name = `${form.firstName.trim()} ${form.lastName.trim()}`.trim();

  const errors = (() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.firstName.trim()) e.firstName = "Enter a first name";
    if (!form.lastName.trim()) e.lastName = "Enter a last name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid work email";
    else if (staff.some((s) => s.id !== person?.id && s.email.toLowerCase() === form.email.trim().toLowerCase())) e.email = "Someone already uses this email";
    if (form.phone.replace(/\D/g, "").length < 10) e.phone = "Enter a phone number with country code";
    if (!form.jobTitle.trim()) e.jobTitle = "Enter a job title";
    if (!form.languages.length) e.languages = "Pick at least one language";
    if (takesCases && !(Number(form.capacity) > 0)) e.capacity = "Set how many open cases they can hold";
    return e;
  })();
  const show = (k: keyof FormState) => (tried ? errors[k] : undefined);
  const errorCount = Object.keys(errors).length;

  const suggestEmail = () => {
    if (form.email || !form.firstName || !form.lastName) return;
    set("email", `${form.firstName}.${form.lastName.split(" ")[0]}`.toLowerCase().replace(/[^a-z.]/g, "") + "@bheuni.com");
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errorCount) {
      document.querySelector("[aria-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const id = person?.id ?? nextStaffId();
    const record: StaffMember = {
      id,
      name,
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      roleId: form.roleId,
      jobTitle: form.jobTitle.trim(),
      branch: form.branch,
      reportsTo: form.reportsTo || undefined,
      employment: form.employment,
      status: editing ? form.status : form.sendInvite ? "Invited" : "Active",
      joined: form.joined,
      lastActive: person?.lastActive ?? "",
      languages: form.languages,
      capacity: takesCases ? Number(form.capacity) : 0,
      monthlyTarget: takesCases ? Number(form.monthlyTarget) || 0 : 0,
      twoFactor: form.requireTwoFactor,
      notes: form.notes.trim() || undefined,
    };
    saveStaff(editing ? staff.map((s) => (s.id === id ? record : s)) : [record, ...staff]);
    saveTeams(teams.map((t) => ({ ...t, memberIds: form.teamIds.includes(t.id) ? [...new Set([...t.memberIds, id])] : t.memberIds.filter((m) => m !== id) })));
    markStaffChange(id, editing ? "updated" : form.sendInvite ? "invited" : "added");
    router.push("/people");
  };

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <Link href="/people" className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> People
        </Link>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{editing ? `Edit ${person.name}` : "Add People"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {editing ? "Update their details, access and workload." : "Add a team member and choose what they can see and do in the CRM."} Fields marked <span className="text-danger">*</span> are required.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section index={1} title="Personal details" description="How colleagues and students will see them.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="First name" required>
                <TextInput value={form.firstName} onChange={(e) => set("firstName", e.target.value)} onBlur={suggestEmail} placeholder="e.g. Mahbuba" aria-invalid={!!show("firstName")} className={cn(show("firstName") && "border-danger")} />
                <Err msg={show("firstName")} />
              </Field>
              <Field label="Last name" required>
                <TextInput value={form.lastName} onChange={(e) => set("lastName", e.target.value)} onBlur={suggestEmail} placeholder="e.g. Akhter" aria-invalid={!!show("lastName")} className={cn(show("lastName") && "border-danger")} />
                <Err msg={show("lastName")} />
              </Field>
              <Field label="Work email" required hint={!form.email && form.firstName && form.lastName ? "We'll suggest one from their name" : undefined}>
                <TextInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="name@bheuni.com" aria-invalid={!!show("email")} className={cn(show("email") && "border-danger")} />
                <Err msg={show("email")} />
              </Field>
              <Field label="Phone / WhatsApp" required>
                <TextInput type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder={form.branch === "Dhaka HQ" || form.branch === "Sylhet" ? "+880 1711-000000" : "+44 7700 900000"} aria-invalid={!!show("phone")} className={cn(show("phone") && "border-danger")} />
                <Err msg={show("phone")} />
              </Field>
              <Field label="Languages spoken" required className="sm:col-span-2" hint="Used to match students with a counsellor who speaks their language.">
                <div className="flex flex-wrap gap-1.5" aria-invalid={!!show("languages")}>
                  {languageOptions.map((l) => {
                    const on = form.languages.includes(l);
                    return (
                      <button key={l} type="button" aria-pressed={on} onClick={() => set("languages", toggle(form.languages, l))} className={cn("h-8 rounded-full border px-3 text-xs font-medium transition-colors", on ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                        {l}
                      </button>
                    );
                  })}
                </div>
                <Err msg={show("languages")} />
              </Field>
            </div>
          </Section>

          <Section index={2} title="Role & access" description="The role decides which pages and records they can open.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Job title" required>
                <TextInput value={form.jobTitle} onChange={(e) => set("jobTitle", e.target.value)} placeholder="e.g. Senior Counsellor" aria-invalid={!!show("jobTitle")} className={cn(show("jobTitle") && "border-danger")} />
                <Err msg={show("jobTitle")} />
              </Field>
              <Field label="CRM role" required>
                <Select value={form.roleId} onChange={(e) => set("roleId", e.target.value)}>
                  {roles.map((r) => <option key={r.id} value={r.id}>{r.name}</option>)}
                </Select>
              </Field>
            </div>
            {selectedRole && (
              <div className="mt-4 rounded-2xl bg-surface-muted p-4">
                <p className="text-xs text-foreground">
                  <span className="font-semibold">{selectedRole.name}:</span> {selectedRole.description} <span className="text-muted-foreground">Sees {selectedRole.scope.toLowerCase()}.</span>
                </p>
                <div className="mt-2 flex flex-wrap gap-1.5">
                  {Object.entries(selectedRole.permissions).map(([m, a]) => (
                    <span key={m} className={cn("rounded-full px-2 py-0.5 text-[11px]", a.length ? "bg-surface text-foreground ring-1 ring-border" : "text-muted-foreground/60 line-through")}>
                      {m}
                      {a.length > 0 && <span className="text-muted-foreground"> · {a.length === 5 ? "full" : a.map((x) => x.toLowerCase()).join(", ")}</span>}
                    </span>
                  ))}
                </div>
                <Link href="/people/roles" className="mt-2 inline-block text-[11px] font-semibold text-primary hover:underline">Manage roles & permissions</Link>
              </div>
            )}
            <div className="mt-4 flex flex-col gap-3">
              <Checkbox checked={form.requireTwoFactor} onChange={(v) => set("requireTwoFactor", v)} label="Require two-factor sign-in" />
            </div>
          </Section>

          <Section index={3} title="Branch & reporting" description="Where they work and who they report to.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Branch" required>
                <Select value={form.branch} onChange={(e) => set("branch", e.target.value as StaffBranch)}>
                  {staffBranches.map((b) => <option key={b}>{b}</option>)}
                </Select>
              </Field>
              <Field label="Reports to">
                <Select value={form.reportsTo} onChange={(e) => set("reportsTo", e.target.value)}>
                  <option value="">No manager</option>
                  {managers.map((m) => <option key={m.id} value={m.id}>{m.name} · {m.jobTitle}, {m.branch}</option>)}
                </Select>
              </Field>
              <Field label="Employment type">
                <PillGroup options={employmentTypes.map((t) => ({ value: t, label: t }))} value={form.employment} onChange={(v) => set("employment", v)} />
              </Field>
              <Field label="Start date">
                <TextInput type="date" value={form.joined} onChange={(e) => set("joined", e.target.value)} />
              </Field>
              <Field label="Teams" className="sm:col-span-2">
                <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {teams.map((t) => (
                    <Checkbox key={t.id} checked={form.teamIds.includes(t.id)} onChange={() => set("teamIds", toggle(form.teamIds, t.id))} label={<span>{t.name} <span className="text-xs text-muted-foreground">· {t.branch}</span></span>} />
                  ))}
                </div>
              </Field>
            </div>
          </Section>

          <Section index={4} title="Workload & targets" description={takesCases ? "Used for auto-assignment and performance reports." : "This role doesn't hold student cases."}>
            {takesCases ? (
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Case capacity" required hint="New leads stop auto-assigning when they reach this many open cases.">
                  <TextInput inputMode="numeric" value={form.capacity} onChange={(e) => set("capacity", e.target.value.replace(/\D/g, "").slice(0, 3))} aria-invalid={!!show("capacity")} className={cn(show("capacity") && "border-danger")} />
                  <Err msg={show("capacity")} />
                </Field>
                <Field label="Monthly enrolment target">
                  <TextInput inputMode="numeric" value={form.monthlyTarget} onChange={(e) => set("monthlyTarget", e.target.value.replace(/\D/g, "").slice(0, 3))} />
                </Field>
              </div>
            ) : (
              <p className="text-sm text-muted-foreground">Change the role to a counselling or compliance role to set a caseload.</p>
            )}
            {editing && (
              <Field label="Account status" className="mt-4">
                <PillGroup options={(["Active", "On leave", "Inactive"] as StaffStatus[]).map((s) => ({ value: s, label: s }))} value={form.status === "Invited" ? "" : form.status} onChange={(v) => set("status", v)} />
              </Field>
            )}
            <Field label="Internal notes" className="mt-4">
              <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Covers Sylhet walk-ins on Thursdays" />
            </Field>
          </Section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
          <Card className="p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
            <div className="flex items-center gap-3">
              <Avatar name={name || "New Person"} size="lg" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{name || "New team member"}</p>
                <p className="truncate text-xs text-muted-foreground">{form.jobTitle || "Job title"} · {form.branch}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <RoleChip roleId={form.roleId} />
                  <StaffStatusBadge status={editing ? form.status : form.sendInvite ? "Invited" : "Active"} />
                </div>
              </div>
            </div>
            <ul className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="size-3.5" /> {form.email || "—"}</li>
              <li className="flex items-center gap-2"><ShieldCheck className="size-3.5" /> Two-factor {form.requireTwoFactor ? "required" : "optional"}</li>
              <li className="flex items-center gap-2"><KeyRound className="size-3.5" /> {selectedRole?.scope ?? "—"}</li>
            </ul>
          </Card>

          {!editing && (
            <Card className="p-5">
              <Checkbox
                checked={form.sendInvite}
                onChange={(v) => set("sendInvite", v)}
                label={<span><span className="font-semibold">Email an invitation</span><span className="mt-0.5 block text-xs text-muted-foreground">They set their own password. The link expires in 7 days.</span></span>}
              />
            </Card>
          )}

          {tried && errorCount > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-xs font-medium text-danger">
              <CircleAlert className="size-4 shrink-0" /> Fix {errorCount} field{errorCount > 1 ? "s" : ""} to continue.
            </p>
          )}

          <div className="flex gap-2">
            <Link href="/people" className={cn(buttonSecondary, "flex-1")}>Cancel</Link>
            <button type="submit" className={cn(buttonPrimary, "flex-1")}>
              {editing ? "Save changes" : form.sendInvite ? <><Send className="size-4" /> Send invite</> : <><UserPlus className="size-4" /> Add person</>}
            </button>
          </div>
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

function Err({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-danger">
      <CircleAlert className="size-3" /> {msg}
    </span>
  );
}
