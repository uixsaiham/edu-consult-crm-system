"use client";

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  Building2,
  Check,
  CircleAlert,
  GraduationCap,
  Handshake,
  Landmark,
  Save,
  Settings2,
  UserRound,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox, Dropzone, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { mockCountries, type InstitutionDetails, type InstitutionRecord } from "@/lib/mock/directory";
import { addInstitution, detailsFor, getInstitutions, markUpdated, nextInstitutionId, updateInstitution } from "@/lib/mock/institution-store";
import { cn } from "@/lib/utils";

const countryOptions = mockCountries.map((c) => c.name).sort();
const institutionTypes = ["University", "College", "Pathway provider", "Language school"] as const;
const intakeOptions = ["January 2027", "May 2027", "September 2027", "January 2028"];
const levelOptions = ["Foundation", "Undergraduate", "Pre-Master's", "Postgraduate", "PhD"];
const tatOptions = ["24–48 hours", "3–5 days", "1–2 weeks", "2–4 weeks"];
const paymentTermsOptions = ["30 days after census", "60 days after census", "90 days after census", "Per semester"];
const ieltsOptions = ["5.5", "6.0", "6.5", "7.0", "7.5"];
const altTestOptions = ["PTE Academic", "TOEFL iBT", "Duolingo", "Oxford Test of English", "MOI accepted"];
const logoTypes = ["png", "jpg", "jpeg", "svg"];
const agreementDocTypes = ["pdf", "doc", "docx"];

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE = /^\+?[\d\s()-]{7,20}$/;
const DOMAIN = /^(https?:\/\/)?([\w-]+\.)+[a-z]{2,}(\/\S*)?$/i;

type FormState = InstitutionDetails;

const emptyForm: FormState = {
  name: "",
  shortName: "",
  type: "University",
  country: "United Kingdom",
  city: "",
  campuses: "",
  website: "",
  established: "",
  ranking: "",
  logo: "",
  agreementType: "Direct Agreement",
  aggregator: "",
  commissionRate: "",
  paymentTerms: paymentTermsOptions[0],
  startDate: "",
  endDate: "",
  agreementDoc: "",
  intakes: ["January 2027", "September 2027"],
  tat: tatOptions[1],
  levels: ["Undergraduate", "Postgraduate"],
  ieltsMin: "6.0",
  altTests: ["PTE Academic"],
  applicationFee: "0",
  deposit: "",
  scholarships: false,
  scholarshipMax: "",
  programsCount: "",
  contactName: "",
  contactRole: "",
  contactEmail: "",
  contactPhone: "",
  admissionsEmail: "",
  status: "Onboarding",
  featured: false,
  notes: "",
};

type Key = keyof FormState;

function tierFor(rate: number): InstitutionRecord["commissionTier"] {
  if (rate >= 15) return "Tier 1 (15-18%)";
  if (rate >= 12) return "Tier 2 (12-15%)";
  return "Tier 3 (10-12%)";
}

function initialsOf(name: string) {
  const skip = new Set(["of", "the", "and", "&", "for"]);
  return name
    .split(/\s+/)
    .filter((w) => w && !skip.has(w.toLowerCase()))
    .map((w) => w[0])
    .join("")
    .slice(0, 4)
    .toUpperCase();
}

const ext = (file: string) => file.split(".").pop()?.toLowerCase() ?? "";

function validate(f: FormState, existingNames: string[]) {
  const e: Partial<Record<Key, string>> = {};
  const name = f.name.trim();
  if (name.length < 3) e.name = "Enter the institution's full name.";
  else if (existingNames.includes(name.toLowerCase())) e.name = "This institution is already in your directory.";
  if (f.shortName && !/^[A-Za-z&]{2,6}$/.test(f.shortName)) e.shortName = "2–6 letters, e.g. UoG.";
  if (!f.country) e.country = "Choose a country.";
  if (f.city.trim().length < 2) e.city = "Enter the main campus city.";
  if (!f.website.trim()) e.website = "Enter the official website.";
  else if (!DOMAIN.test(f.website.trim())) e.website = "Enter a valid web address, e.g. www.herts.ac.uk.";
  if (f.established) {
    const y = Number(f.established);
    if (!Number.isInteger(y) || y < 1800 || y > 2026) e.established = "Enter a year between 1800 and 2026.";
  }
  if (f.logo && !logoTypes.includes(ext(f.logo))) e.logo = "Logo must be PNG, JPG or SVG.";

  if (f.agreementType === "Consortium / Aggregator" && !f.aggregator.trim()) e.aggregator = "Name the aggregator you work through.";
  const rate = Number(f.commissionRate);
  if (!f.commissionRate) e.commissionRate = "Enter the agreed commission rate.";
  else if (Number.isNaN(rate) || rate < 10 || rate > 18) e.commissionRate = "Commission must be between 10% and 18%.";
  if (!f.startDate) e.startDate = "Enter the agreement start date.";
  if (!f.endDate) e.endDate = "Enter the agreement end date.";
  else if (f.startDate && f.endDate <= f.startDate) e.endDate = "End date must be after the start date.";
  if (f.agreementDoc && !agreementDocTypes.includes(ext(f.agreementDoc))) e.agreementDoc = "Agreement must be a PDF or Word document.";

  if (f.intakes.length === 0) e.intakes = "Select at least one intake.";
  if (f.levels.length === 0) e.levels = "Select at least one study level.";
  const programs = Number(f.programsCount);
  if (!f.programsCount) e.programsCount = "Enter how many programmes you can offer.";
  else if (!Number.isInteger(programs) || programs < 1 || programs > 2000) e.programsCount = "Enter a whole number between 1 and 2,000.";
  if (f.applicationFee && (Number.isNaN(Number(f.applicationFee)) || Number(f.applicationFee) < 0)) e.applicationFee = "Enter 0 or a positive amount.";
  if (f.deposit && (Number.isNaN(Number(f.deposit)) || Number(f.deposit) < 0)) e.deposit = "Enter 0 or a positive amount.";
  if (f.scholarships && !f.scholarshipMax) e.scholarshipMax = "Enter the largest scholarship available.";

  if (f.contactName.trim().length < 2) e.contactName = "Enter the partnership manager's name.";
  if (!f.contactEmail.trim()) e.contactEmail = "Enter their email address.";
  else if (!EMAIL.test(f.contactEmail.trim())) e.contactEmail = "Enter a valid email address.";
  if (f.contactPhone && !PHONE.test(f.contactPhone.trim())) e.contactPhone = "Enter a valid phone number, e.g. +44 1707 284000.";
  if (f.admissionsEmail && !EMAIL.test(f.admissionsEmail.trim())) e.admissionsEmail = "Enter a valid email address.";
  return e;
}

const sections: { id: string; title: string; description: string; icon: typeof Landmark; fields: Key[] }[] = [
  { id: "basics", title: "Institution details", description: "Name, location and public profile", icon: Landmark, fields: ["name", "shortName", "country", "city", "website", "established", "logo"] },
  { id: "partnership", title: "Partnership & commission", description: "Agreement, commission and payment terms", icon: Handshake, fields: ["aggregator", "commissionRate", "startDate", "endDate", "agreementDoc"] },
  { id: "admissions", title: "Admissions", description: "Intakes, levels, entry requirements and fees", icon: GraduationCap, fields: ["intakes", "levels", "programsCount", "applicationFee", "deposit", "scholarshipMax"] },
  { id: "contacts", title: "Contacts", description: "Who we work with at the institution", icon: UserRound, fields: ["contactName", "contactEmail", "contactPhone", "admissionsEmail"] },
  { id: "settings", title: "Directory settings", description: "Status, visibility and internal notes", icon: Settings2, fields: [] },
];

/** Add or edit an institution. Pass `record` to edit an existing one. */
export function InstitutionForm({ record }: { record?: InstitutionRecord }) {
  const router = useRouter();
  const editing = !!record;
  const [form, setForm] = useState<FormState>(() => (record ? detailsFor(record) : emptyForm));
  const [touched, setTouched] = useState<Partial<Record<Key, boolean>>>({});
  const [submitted, setSubmitted] = useState(false);
  const [toast, notify] = useToast();

  const existingNames = useMemo(
    () => getInstitutions().filter((i) => i.id !== record?.id).map((i) => i.name.toLowerCase()),
    [record?.id]
  );
  // Keep values from older records selectable even if they are not in the standard lists.
  const intakeChoices = [...new Set([...intakeOptions, ...form.intakes])];
  const tatChoices = [...new Set([...tatOptions, form.tat])];
  const paymentChoices = [...new Set([...paymentTermsOptions, form.paymentTerms])];
  const errors = validate(form, existingNames);
  const errorCount = Object.keys(errors).length;
  const show = (k: Key) => ((submitted || touched[k]) && errors[k]) || undefined;

  const set = <K extends Key>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const blur = (k: Key) => () => setTouched((t) => ({ ...t, [k]: true }));
  const toggleIn = (k: "intakes" | "levels" | "altTests", v: string) => {
    set(k, form[k].includes(v) ? form[k].filter((x) => x !== v) : [...form[k], v]);
    setTouched((t) => ({ ...t, [k]: true }));
  };

  const rate = Number(form.commissionRate);
  const tier = form.commissionRate && !errors.commissionRate ? tierFor(rate) : null;
  const shortName = (form.shortName || initialsOf(form.name) || "—").toUpperCase();

  const sectionState = sections.map((s) => {
    const hasError = s.fields.some((k) => errors[k]);
    return { ...s, hasError, complete: !hasError };
  });
  const completed = sectionState.filter((s) => s.complete).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    if (errorCount > 0) {
      const first = sectionState.find((s) => s.hasError);
      if (first) document.getElementById(first.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
      notify(`Fix ${errorCount} field${errorCount === 1 ? "" : "s"} to continue`, "error");
      return;
    }
    const website = /^https?:\/\//i.test(form.website.trim()) ? form.website.trim() : `https://${form.website.trim()}`;
    const fields: Omit<InstitutionRecord, "id"> = {
      name: form.name.trim(),
      country: form.country,
      city: [form.city.trim(), ...form.campuses.split(",").map((c) => c.trim()).filter(Boolean)].join(" & "),
      logoText: shortName.slice(0, 4),
      ranking: form.ranking.trim() || form.type,
      commissionTier: tierFor(rate),
      agreementType: form.agreementType,
      tatDays: form.tat,
      openIntakes: form.intakes,
      programsCount: Number(form.programsCount),
      featured: form.featured,
      type: form.type,
      website,
      commissionRate: rate,
      status: form.status,
      contactName: form.contactName.trim(),
      contactEmail: form.contactEmail.trim(),
      details: { ...form, website },
    };
    if (record) {
      updateInstitution(record.id, fields);
      markUpdated(record.id);
    }
    else addInstitution({ ...fields, id: nextInstitutionId(), active: true, showOnWebsite: form.status === "Active" });
    router.push("/institutions");
  };

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <Link href="/institutions" className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" />
          Institutions
        </Link>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{editing ? "Edit Institution" : "Add Institution"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {editing
              ? `Update ${record.name}'s profile, agreement and admissions details.`
              : "Add a partner university or college so counsellors can apply to it."}{" "}
            Fields marked <span className="text-danger">*</span> are required.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-6 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-6">
          <Section {...sectionState[0]} index={1}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Institution name" required className="sm:col-span-2">
                <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} onBlur={blur("name")} placeholder="e.g. University of Westminster" aria-invalid={!!show("name")} className={cn(show("name") && "border-danger")} />
                <Error msg={show("name")} />
              </Field>
              <Field label="Short name" hint={form.shortName ? undefined : `Auto: ${initialsOf(form.name) || "—"}`}>
                <TextInput value={form.shortName} onChange={(e) => set("shortName", e.target.value)} onBlur={blur("shortName")} placeholder="e.g. UoW" maxLength={6} className={cn(show("shortName") && "border-danger")} />
                <Error msg={show("shortName")} />
              </Field>
              <Field label="Institution type" required>
                <Select value={form.type} onChange={(e) => set("type", e.target.value as FormState["type"])}>
                  {institutionTypes.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Country" required>
                <Select value={form.country} onChange={(e) => set("country", e.target.value)}>
                  {countryOptions.map((c) => (
                    <option key={c}>{c}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Main campus city" required>
                <TextInput value={form.city} onChange={(e) => set("city", e.target.value)} onBlur={blur("city")} placeholder="e.g. London" className={cn(show("city") && "border-danger")} />
                <Error msg={show("city")} />
              </Field>
              <Field label="Other campuses" hint="Separate with commas" className="sm:col-span-2">
                <TextInput value={form.campuses} onChange={(e) => set("campuses", e.target.value)} placeholder="e.g. Birmingham, Manchester" />
              </Field>
              <Field label="Established">
                <TextInput value={form.established} onChange={(e) => set("established", e.target.value.replace(/\D/g, "").slice(0, 4))} onBlur={blur("established")} inputMode="numeric" placeholder="e.g. 1838" className={cn(show("established") && "border-danger")} />
                <Error msg={show("established")} />
              </Field>
              <Field label="Official website" required className="sm:col-span-2">
                <TextInput value={form.website} onChange={(e) => set("website", e.target.value)} onBlur={blur("website")} type="url" placeholder="www.westminster.ac.uk" className={cn(show("website") && "border-danger")} />
                <Error msg={show("website")} />
              </Field>
              <Field label="Ranking / accolade">
                <TextInput value={form.ranking} onChange={(e) => set("ranking", e.target.value)} placeholder="e.g. Top 50 UK (Guardian 2026)" />
              </Field>
              <Field label="Logo" hint="A square logo looks best" className="sm:col-span-3">
                <Dropzone accept=".png,.jpg,.jpeg,.svg" hint="PNG, JPG or SVG — up to 5MB" fileName={form.logo || undefined} onFile={(f) => { set("logo", f.name); setTouched((t) => ({ ...t, logo: true })); }} onClear={() => set("logo", "")} />
                <Error msg={show("logo")} />
              </Field>
            </div>
          </Section>

          <Section {...sectionState[1]} index={2}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Agreement type" required className="sm:col-span-2">
                <PillGroup
                  options={[
                    { value: "Direct Agreement", label: "Direct agreement" },
                    { value: "Consortium / Aggregator", label: "Through an aggregator" },
                  ]}
                  value={form.agreementType}
                  onChange={(v) => set("agreementType", v)}
                />
              </Field>
              {form.agreementType === "Consortium / Aggregator" && (
                <Field label="Aggregator" required className="sm:col-span-2">
                  <TextInput value={form.aggregator} onChange={(e) => set("aggregator", e.target.value)} onBlur={blur("aggregator")} placeholder="e.g. Study Group, QA Higher Education, ApplyBoard" className={cn(show("aggregator") && "border-danger")} />
                  <Error msg={show("aggregator")} />
                </Field>
              )}
              <Field label="Commission rate (%)" required hint="Share of first-year tuition, 10–18%">
                <div className="relative">
                  <TextInput value={form.commissionRate} onChange={(e) => set("commissionRate", e.target.value.replace(/[^\d.]/g, "").slice(0, 5))} onBlur={blur("commissionRate")} inputMode="decimal" placeholder="e.g. 15" className={cn("pr-28", show("commissionRate") && "border-danger")} />
                  {tier && (
                    <span className={cn("absolute right-2 top-1/2 -translate-y-1/2 rounded-full px-2 py-0.5 text-[11px] font-semibold", tier.startsWith("Tier 1") ? "bg-success-soft text-success" : tier.startsWith("Tier 2") ? "bg-primary-soft text-primary" : "bg-warning-soft text-warning")}>
                      {tier.split(" (")[0]}
                    </span>
                  )}
                </div>
                <Error msg={show("commissionRate")} />
              </Field>
              <Field label="Payment terms" required>
                <Select value={form.paymentTerms} onChange={(e) => set("paymentTerms", e.target.value)}>
                  {paymentChoices.map((p) => (
                    <option key={p}>{p}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Agreement start" required>
                <TextInput type="date" value={form.startDate} onChange={(e) => set("startDate", e.target.value)} onBlur={blur("startDate")} className={cn(show("startDate") && "border-danger")} />
                <Error msg={show("startDate")} />
              </Field>
              <Field label="Agreement end" required>
                <TextInput type="date" min={form.startDate || undefined} value={form.endDate} onChange={(e) => set("endDate", e.target.value)} onBlur={blur("endDate")} className={cn(show("endDate") && "border-danger")} />
                <Error msg={show("endDate")} />
              </Field>
              <Field label="Signed agreement" hint="Optional — you can upload it later" className="sm:col-span-2">
                <Dropzone accept=".pdf,.doc,.docx" hint="PDF, DOC or DOCX — up to 10MB" fileName={form.agreementDoc || undefined} onFile={(f) => { set("agreementDoc", f.name); setTouched((t) => ({ ...t, agreementDoc: true })); }} onClear={() => set("agreementDoc", "")} />
                <Error msg={show("agreementDoc")} />
              </Field>
            </div>
          </Section>

          <Section {...sectionState[2]} index={3}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Open intakes" required className="sm:col-span-2">
                <Chips options={intakeChoices} selected={form.intakes} onToggle={(v) => toggleIn("intakes", v)} invalid={!!show("intakes")} />
                <Error msg={show("intakes")} />
              </Field>
              <Field label="Study levels offered" required className="sm:col-span-2">
                <Chips options={levelOptions} selected={form.levels} onToggle={(v) => toggleIn("levels", v)} invalid={!!show("levels")} />
                <Error msg={show("levels")} />
              </Field>
              <Field label="Programmes available to BHE" required>
                <TextInput value={form.programsCount} onChange={(e) => set("programsCount", e.target.value.replace(/\D/g, "").slice(0, 4))} onBlur={blur("programsCount")} inputMode="numeric" placeholder="e.g. 120" className={cn(show("programsCount") && "border-danger")} />
                <Error msg={show("programsCount")} />
              </Field>
              <Field label="Offer turnaround" required>
                <Select value={form.tat} onChange={(e) => set("tat", e.target.value)}>
                  {tatChoices.map((t) => (
                    <option key={t}>{t}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Minimum IELTS (overall)" required>
                <Select value={form.ieltsMin} onChange={(e) => set("ieltsMin", e.target.value)}>
                  {ieltsOptions.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </Select>
              </Field>
              <Field label="Application fee (£)">
                <TextInput value={form.applicationFee} onChange={(e) => set("applicationFee", e.target.value.replace(/[^\d.]/g, ""))} onBlur={blur("applicationFee")} inputMode="decimal" className={cn(show("applicationFee") && "border-danger")} />
                <Error msg={show("applicationFee")} />
              </Field>
              <Field label="Other English tests accepted" className="sm:col-span-2">
                <Chips options={altTestOptions} selected={form.altTests} onToggle={(v) => toggleIn("altTests", v)} />
              </Field>
              <Field label="Tuition deposit for CAS (£)" hint="Leave blank if none">
                <TextInput value={form.deposit} onChange={(e) => set("deposit", e.target.value.replace(/[^\d.]/g, ""))} onBlur={blur("deposit")} inputMode="decimal" placeholder="e.g. 4000" className={cn(show("deposit") && "border-danger")} />
                <Error msg={show("deposit")} />
              </Field>
              <div className="flex flex-col gap-2 sm:pt-6">
                <Checkbox checked={form.scholarships} onChange={(v) => set("scholarships", v)} label="Offers international scholarships" />
                {form.scholarships && (
                  <>
                    <TextInput value={form.scholarshipMax} onChange={(e) => set("scholarshipMax", e.target.value.replace(/[^\d.]/g, ""))} onBlur={blur("scholarshipMax")} inputMode="decimal" placeholder="Largest award in £, e.g. 3000" aria-label="Largest scholarship" className={cn(show("scholarshipMax") && "border-danger")} />
                    <Error msg={show("scholarshipMax")} />
                  </>
                )}
              </div>
            </div>
          </Section>

          <Section {...sectionState[3]} index={4}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Partnership manager" required>
                <TextInput value={form.contactName} onChange={(e) => set("contactName", e.target.value)} onBlur={blur("contactName")} placeholder="Full name" autoComplete="off" className={cn(show("contactName") && "border-danger")} />
                <Error msg={show("contactName")} />
              </Field>
              <Field label="Job title">
                <TextInput value={form.contactRole} onChange={(e) => set("contactRole", e.target.value)} placeholder="e.g. International Partnerships Manager" />
              </Field>
              <Field label="Email" required>
                <TextInput type="email" value={form.contactEmail} onChange={(e) => set("contactEmail", e.target.value)} onBlur={blur("contactEmail")} placeholder="name@university.ac.uk" autoComplete="off" className={cn(show("contactEmail") && "border-danger")} />
                <Error msg={show("contactEmail")} />
              </Field>
              <Field label="Phone">
                <TextInput type="tel" value={form.contactPhone} onChange={(e) => set("contactPhone", e.target.value)} onBlur={blur("contactPhone")} placeholder="+44 20 7911 5000" className={cn(show("contactPhone") && "border-danger")} />
                <Error msg={show("contactPhone")} />
              </Field>
              <Field label="Admissions team email" hint="Where applications and documents are sent" className="sm:col-span-2">
                <TextInput type="email" value={form.admissionsEmail} onChange={(e) => set("admissionsEmail", e.target.value)} onBlur={blur("admissionsEmail")} placeholder="international-admissions@university.ac.uk" className={cn(show("admissionsEmail") && "border-danger")} />
                <Error msg={show("admissionsEmail")} />
              </Field>
            </div>
          </Section>

          <Section {...sectionState[4]} index={5}>
            <div className="flex flex-col gap-4">
              <Field label="Status">
                <PillGroup
                  options={[
                    { value: "Onboarding", label: "Onboarding" },
                    { value: "Active", label: "Active — open for applications" },
                  ]}
                  value={form.status}
                  onChange={(v) => set("status", v)}
                />
              </Field>
              <Checkbox
                checked={form.featured}
                onChange={(v) => set("featured", v)}
                label={
                  <>
                    <span className="font-medium">Mark as Top Partner</span>
                    <span className="block text-xs text-muted-foreground">Shown first to counsellors when suggesting universities.</span>
                  </>
                }
              />
              <Field label="Internal notes">
                <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="Anything counsellors should know, e.g. interview requirements or country restrictions." />
              </Field>
            </div>
          </Section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
          <Card className="overflow-hidden p-5">
            <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
            <div className="mt-3 flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-xl border border-border bg-surface-muted font-mono text-xs font-bold text-primary">
                {shortName.slice(0, 4)}
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{form.name.trim() || "Institution name"}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {form.city.trim() || "City"}, {form.country}
                </p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-1.5">
              <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", form.status === "Active" ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>{form.status}</span>
              {tier && <span className="rounded-full bg-primary-soft px-2 py-0.5 text-[11px] font-semibold text-primary">{tier}</span>}
              {form.featured && <span className="rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400">Top Partner</span>}
            </div>
            <dl className="mt-4 grid grid-cols-2 gap-3 border-t border-border pt-4 text-xs">
              <div>
                <dt className="text-muted-foreground">Agreement</dt>
                <dd className="font-medium text-foreground">{form.agreementType === "Direct Agreement" ? "Direct" : "Aggregator"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Turnaround</dt>
                <dd className="font-medium text-foreground">{form.tat}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Programmes</dt>
                <dd className="font-medium text-foreground">{form.programsCount || "—"}</dd>
              </div>
              <div>
                <dt className="text-muted-foreground">Min. IELTS</dt>
                <dd className="font-medium text-foreground">{form.ieltsMin}</dd>
              </div>
            </dl>
            {form.intakes.length > 0 && (
              <div className="mt-3 flex flex-wrap gap-1">
                {form.intakes.map((i) => (
                  <span key={i} className="rounded-full border border-border px-2 py-0.5 text-[10px] font-medium text-muted-foreground">
                    {i}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Progress</p>
              <span className="text-xs font-semibold tabular-nums text-foreground">
                {completed}/{sections.length}
              </span>
            </div>
            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-hover">
              <div className="h-full rounded-full bg-primary transition-all" style={{ width: `${(completed / sections.length) * 100}%` }} />
            </div>
            <ol className="mt-4 flex flex-col gap-1">
              {sectionState.map((s, i) => (
                <li key={s.id}>
                  <a href={`#${s.id}`} className="flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-xs transition-colors hover:bg-surface-hover">
                    <span
                      className={cn(
                        "flex size-5 shrink-0 items-center justify-center rounded-full text-[10px] font-bold",
                        s.complete ? "bg-success text-white" : submitted && s.hasError ? "bg-danger text-white" : "bg-surface-hover text-muted-foreground"
                      )}
                    >
                      {s.complete ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={cn("flex-1", s.complete ? "text-foreground" : "text-muted-foreground")}>{s.title}</span>
                  </a>
                </li>
              ))}
            </ol>
          </Card>

          <div className="flex flex-col gap-2">
            <button type="submit" className={cn(buttonPrimary, "w-full")}>
              <Save className="size-4" />
              {editing ? "Save changes" : "Save institution"}
            </button>
            <Link href="/institutions" className={cn(buttonSecondary, "w-full")}>
              Cancel
            </Link>
            {submitted && errorCount > 0 && (
              <p className="flex items-center gap-1.5 text-xs font-medium text-danger">
                <CircleAlert className="size-3.5" />
                {errorCount} field{errorCount === 1 ? "" : "s"} need attention
              </p>
            )}
          </div>
        </aside>
      </div>
      {toast}
    </form>
  );
}

function Section({
  id,
  title,
  description,
  icon: Icon,
  index,
  complete,
  children,
}: {
  id: string;
  title: string;
  description: string;
  icon: typeof Building2;
  index: number;
  complete: boolean;
  children: ReactNode;
}) {
  return (
    <Card className="p-5 sm:p-6">
      <section id={id} aria-labelledby={`${id}-title`} className="scroll-mt-24">
        <div className="mb-5 flex items-center gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Icon className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id={`${id}-title`} className="text-[15px] font-semibold tracking-tight text-foreground">
              <span className="mr-1.5 text-muted-foreground">{index}.</span>
              {title}
            </h3>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          {complete && id !== "settings" && (
            <span className="inline-flex items-center gap-1 rounded-full bg-success-soft px-2 py-0.5 text-[11px] font-semibold text-success">
              <Check className="size-3" />
              Complete
            </span>
          )}
        </div>
        {children}
      </section>
    </Card>
  );
}

function Chips({
  options,
  selected,
  onToggle,
  invalid,
}: {
  options: string[];
  selected: string[];
  onToggle: (v: string) => void;
  invalid?: boolean;
}) {
  return (
    <div className={cn("flex flex-wrap gap-1.5 rounded-xl", invalid && "ring-2 ring-danger/40")}>
      {options.map((o) => {
        const on = selected.includes(o);
        return (
          <button
            key={o}
            type="button"
            aria-pressed={on}
            onClick={() => onToggle(o)}
            className={cn(
              "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
              on ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {on && <Check className="size-3" />}
            {o}
          </button>
        );
      })}
    </div>
  );
}

function Error({ msg }: { msg?: string }) {
  if (!msg) return null;
  return (
    <span role="alert" className="flex items-center gap-1 text-[11px] font-medium text-danger">
      <CircleAlert className="size-3 shrink-0" />
      {msg}
    </span>
  );
}

