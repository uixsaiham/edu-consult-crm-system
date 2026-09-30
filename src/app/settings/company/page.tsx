"use client";

export const dynamic = 'force-dynamic';

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Building2, Clock3, Globe2, History, MessageSquare, Palette, RotateCcw, Save, ShieldCheck, UserCheck, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { allIntakes, companySettingLabels, defaultCompanySettings, timezones, type CompanySettings } from "@/lib/mock/system";
import { companyStore, withDefaults } from "@/lib/settings/company";
import { diff, logAudit } from "@/lib/settings/audit";
import { useSettingsStore } from "@/lib/settings/store";
import { archiveKinds } from "@/lib/mock/archive";
import { cn } from "@/lib/utils";

const sections = [
  { id: "profile", label: "Company profile", icon: Building2 },
  { id: "branding", label: "Branding & email", icon: Palette },
  { id: "regional", label: "Regional & intakes", icon: Globe2 },
  { id: "leads", label: "Leads & applications", icon: Users2 },
  { id: "comms", label: "Communications", icon: MessageSquare },
  { id: "security", label: "Security", icon: ShieldCheck },
  { id: "privacy", label: "Data & privacy", icon: UserCheck },
] as const;

const email = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const url = /^https:\/\/[^\s.]+\.[^\s]+$/;

function validate(s: CompanySettings) {
  const e: Partial<Record<keyof CompanySettings, string>> = {};
  if (s.legalName.trim().length < 3) e.legalName = "Enter the registered company name";
  if (!s.tradingName.trim()) e.tradingName = "Enter the name students see";
  if (!/^([0-9]{8}|[A-Z]{2}[0-9]{6})$/.test(s.companyNumber.trim())) e.companyNumber = "8 digits, or 2 letters + 6 digits (e.g. SC123456)";
  if (!/^[A-Z]{1,2}[0-9]{6,7}$/.test(s.icoNumber.trim())) e.icoNumber = "ICO numbers look like ZA123456";
  if (!url.test(s.website)) e.website = "Use a full https:// address";
  if (!url.test(s.portalUrl)) e.portalUrl = "Use a full https:// address";
  if (!email.test(s.supportEmail)) e.supportEmail = "Enter a valid email";
  if (!email.test(s.dpoEmail)) e.dpoEmail = "Enter a valid email";
  if (!url.test(s.privacyNoticeUrl)) e.privacyNoticeUrl = "Use a full https:// address";
  if (!/^#[0-9a-f]{6}$/i.test(s.brandColor)) e.brandColor = "Use a hex colour like #4d76bb";
  if (!s.intakes.length) e.intakes = "Offer at least one intake";
  if (!/^(?=.*[A-Za-z])[A-Za-z0-9 &._-]{3,11}$/.test(s.smsSenderId)) e.smsSenderId = "3–11 letters, numbers, spaces or & . _ - (at least one letter)";
  if (!/^[A-Z]{2,5}$/.test(s.applicationPrefix)) e.applicationPrefix = "2–5 capital letters";
  if (s.dormancyDays < 3 || s.dormancyDays > 180) e.dormancyDays = "Between 3 and 180 days";
  if (s.firstContactHours < 1 || s.firstContactHours > 168) e.firstContactHours = "Between 1 and 168 hours";
  if (s.sessionTimeoutMinutes < 5 || s.sessionTimeoutMinutes > 720) e.sessionTimeoutMinutes = "Between 5 and 720 minutes";
  if (s.passwordMinLength < 8 || s.passwordMinLength > 64) e.passwordMinLength = "Between 8 and 64 characters";
  const badIp = s.ipAllowlist.split(/[\n,]/).map((x) => x.trim()).filter(Boolean).find((x) => !/^(\d{1,3}\.){3}\d{1,3}(\/\d{1,2})?$/.test(x));
  if (badIp) e.ipAllowlist = `“${badIp}” isn't an IPv4 address or range`;
  if (!/opt out/i.test(s.marketingConsentText)) e.marketingConsentText = "Tell people they can opt out";
  return e;
}

export default function CompanySettingsPage() {
  const { user } = useUser();
  const saved = withDefaults(useSettingsStore(companyStore));
  const [draft, setDraft] = useState<CompanySettings | null>(null);
  const [tried, setTried] = useState(false);
  const [confirmReset, setConfirmReset] = useState(false);
  const [toast, notify] = useToast();

  const s = draft ?? saved;
  const changes = diff(saved, s, companySettingLabels);
  const errors = validate(s);
  const errorCount = Object.keys(errors).length;
  const set = <K extends keyof CompanySettings>(k: K, v: CompanySettings[K]) => setDraft({ ...s, [k]: v });
  const err = (k: keyof CompanySettings) => (tried || draft) && errors[k] ? errors[k] : undefined;

  const save = () => {
    setTried(true);
    if (errorCount) return notify(`Fix ${errorCount} field${errorCount === 1 ? "" : "s"} before saving`, "error");
    companyStore.set(s);
    const security = changes.some((c) => ["Require 2FA", "Session timeout", "Minimum password length", "IP allowlist"].includes(c.field));
    logAudit({ actor: user.name, role: user.role, module: security ? "Security" : "Settings", action: "Settings changed", entity: "Company settings", summary: `Changed ${changes.map((c) => c.field.toLowerCase()).join(", ")}`, changes, severity: security ? "critical" : "notice" });
    setDraft(null);
    setTried(false);
    notify(`${changes.length} setting${changes.length === 1 ? "" : "s"} saved`);
  };

  return (
    <div className="flex flex-col gap-4 pb-20">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Company Settings</h2>
          <p className="mt-1 max-w-2xl text-sm text-muted-foreground">Organisation details, regional defaults, lead handling, communications and security rules that apply across the CRM. Every change is recorded in the audit log.</p>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Link href="/settings/audit-logs?module=Settings" className={buttonSecondary}><History className="size-4" /> Change history</Link>
          <button type="button" onClick={() => setConfirmReset(true)} className={buttonSecondary}><RotateCcw className="size-4" /> Restore defaults</button>
        </div>
      </header>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[220px_minmax(0,1fr)]">
        <nav aria-label="Settings sections" className="hidden lg:block">
          <ul className="sticky top-4 flex flex-col gap-0.5 rounded-2xl border border-border bg-surface p-2">
            {sections.map((x) => (
              <li key={x.id}>
                <a href={`#${x.id}`} className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-surface-hover hover:text-foreground"><x.icon className="size-4" />{x.label}</a>
              </li>
            ))}
          </ul>
        </nav>

        <div className="flex min-w-0 flex-col gap-4">
          <Section id="profile" icon={Building2} title="Company profile" description="Shown on invoices, certificates, emails and the student portal.">
            <Field label="Legal name" required><TextInput value={s.legalName} onChange={(e) => set("legalName", e.target.value)} /><Err m={err("legalName")} /></Field>
            <Field label="Trading name" required hint="The name students and agents see"><TextInput value={s.tradingName} onChange={(e) => set("tradingName", e.target.value)} /><Err m={err("tradingName")} /></Field>
            <Field label="Company number" hint="Companies House"><TextInput value={s.companyNumber} onChange={(e) => set("companyNumber", e.target.value.toUpperCase())} /><Err m={err("companyNumber")} /></Field>
            <Field label="ICO registration" hint="Data protection fee registration"><TextInput value={s.icoNumber} onChange={(e) => set("icoNumber", e.target.value.toUpperCase())} /><Err m={err("icoNumber")} /></Field>
            <Field label="Website"><TextInput value={s.website} onChange={(e) => set("website", e.target.value)} /><Err m={err("website")} /></Field>
            <Field label="Student portal"><TextInput value={s.portalUrl} onChange={(e) => set("portalUrl", e.target.value)} /><Err m={err("portalUrl")} /></Field>
            <Field label="Support email"><TextInput type="email" value={s.supportEmail} onChange={(e) => set("supportEmail", e.target.value)} /><Err m={err("supportEmail")} /></Field>
            <Field label="Support phone"><TextInput value={s.supportPhone} onChange={(e) => set("supportPhone", e.target.value)} /></Field>
            <Field label="Registered address" className="sm:col-span-2"><Textarea rows={2} value={s.registeredAddress} onChange={(e) => set("registeredAddress", e.target.value)} /></Field>
            <p className="text-xs text-muted-foreground sm:col-span-2">Branch addresses and opening hours are managed in <Link href="/office" className="font-semibold text-primary hover:underline">Office › Branch Office</Link>.</p>
          </Section>

          <Section id="branding" icon={Palette} title="Branding & email" description="Used on emails, certificates and exported documents.">
            <Field label="Brand colour">
              <div className="flex gap-2">
                <input type="color" value={/^#[0-9a-f]{6}$/i.test(s.brandColor) ? s.brandColor : "#4d76bb"} onChange={(e) => set("brandColor", e.target.value)} className="h-[42px] w-12 cursor-pointer rounded-xl border border-border bg-surface p-1" aria-label="Pick brand colour" />
                <TextInput value={s.brandColor} onChange={(e) => set("brandColor", e.target.value)} />
              </div>
              <Err m={err("brandColor")} />
            </Field>
            <Field label="Email sender name" hint="Appears in the recipient's inbox"><TextInput value={s.emailFromName} onChange={(e) => set("emailFromName", e.target.value)} /></Field>
            <Field label="Email signature" className="sm:col-span-2" hint="{sender_name}, {sender_role} and {branch_phone} fill in for each staff member">
              <Textarea rows={4} value={s.emailSignature} onChange={(e) => set("emailSignature", e.target.value)} />
            </Field>
            <div className="rounded-2xl border border-border p-4 sm:col-span-2">
              <p className="mb-2 text-[11px] font-semibold text-muted-foreground">Preview</p>
              <div className="h-1 w-16 rounded-full" style={{ background: s.brandColor }} />
              <p className="mt-3 whitespace-pre-line text-sm text-foreground">{s.emailSignature.replace("{sender_name}", user.name).replace("{sender_role}", user.role).replace("{branch_phone}", s.supportPhone)}</p>
            </div>
          </Section>

          <Section id="regional" icon={Globe2} title="Regional & intakes" description="Defaults for money, dates and the academic calendar.">
            <Field label="Currency"><Select value={s.currency} onChange={(e) => set("currency", e.target.value as CompanySettings["currency"])}>{["GBP", "BDT", "USD", "EUR"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Time zone" hint="Reminders and reports use this unless a branch has its own"><Select value={s.timezone} onChange={(e) => set("timezone", e.target.value)}>{timezones.map((t) => <option key={t}>{t}</option>)}</Select></Field>
            <Field label="Date format"><PillGroup options={(["D MMM YYYY", "DD/MM/YYYY", "YYYY-MM-DD"] as const).map((v) => ({ value: v, label: v }))} value={s.dateFormat} onChange={(v) => set("dateFormat", v)} /></Field>
            <Field label="Primary destination"><Select value={s.primaryDestination} onChange={(e) => set("primaryDestination", e.target.value)}>{["United Kingdom", "Ireland", "Canada", "Australia"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Academic cycle"><Select value={s.academicCycle} onChange={(e) => set("academicCycle", e.target.value)}>{["2025/26", "2026/27", "2027/28"].map((c) => <option key={c}>{c}</option>)}</Select></Field>
            <Field label="Intakes offered" hint="Used in lead forms, campaigns and targets">
              <div className="flex flex-wrap gap-1.5">
                {allIntakes.map((m) => {
                  const on = s.intakes.includes(m);
                  return <button key={m} type="button" aria-pressed={on} onClick={() => set("intakes", on ? s.intakes.filter((x) => x !== m) : allIntakes.filter((x) => x === m || s.intakes.includes(x)))} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium", on ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:bg-surface-hover")}>{m}</button>;
                })}
              </div>
              <Err m={err("intakes")} />
            </Field>
          </Section>

          <Section id="leads" icon={Users2} title="Leads & applications" description="How new enquiries are handled.">
            <Toggle label="Auto-assign new leads" hint="New leads go straight to a counsellor instead of the unassigned queue" on={s.autoAssignLeads} onChange={(v) => set("autoAssignLeads", v)} className="sm:col-span-2" />
            <Field label="Assignment rule"><Select disabled={!s.autoAssignLeads} value={s.assignmentAlgorithm} onChange={(e) => set("assignmentAlgorithm", e.target.value as CompanySettings["assignmentAlgorithm"])}>{["Round-robin by branch", "Language & country match", "Least busy counsellor"].map((a) => <option key={a}>{a}</option>)}</Select></Field>
            <Field label="First contact target" hint="Hours to first call or message; late leads are flagged"><Unit value={s.firstContactHours} unit="hours" onChange={(n) => set("firstContactHours", n)} /><Err m={err("firstContactHours")} /></Field>
            <Field label="Dormancy threshold" hint="Days without activity before a lead is flagged dormant"><Unit value={s.dormancyDays} unit="days" onChange={(n) => set("dormancyDays", n)} /><Err m={err("dormancyDays")} /></Field>
            <Field label="Duplicate check" hint="When adding a lead or application"><PillGroup options={(["Phone or email", "Email only", "Off"] as const).map((v) => ({ value: v, label: v }))} value={s.duplicateCheck} onChange={(v) => set("duplicateCheck", v)} /></Field>
            <Field label="Application ID prefix" hint={`New applications are numbered ${s.applicationPrefix}-2026-1001`}><TextInput value={s.applicationPrefix} maxLength={5} onChange={(e) => set("applicationPrefix", e.target.value.toUpperCase())} /><Err m={err("applicationPrefix")} /></Field>
          </Section>

          <Section id="comms" icon={MessageSquare} title="Communications" description="Defaults for WhatsApp and SMS. Twilio credentials are set on the server — see SMS Setup.">
            <Field label="WhatsApp greeting" className="sm:col-span-2" hint={`${s.whatsappGreeting.length} characters`}><Textarea rows={3} value={s.whatsappGreeting} onChange={(e) => set("whatsappGreeting", e.target.value)} /></Field>
            <Field label="SMS sender ID" hint="Shown as the sender on UK texts · max 11 characters"><TextInput value={s.smsSenderId} maxLength={11} onChange={(e) => set("smsSenderId", e.target.value)} /><Err m={err("smsSenderId")} /></Field>
            <Field label="Quiet hours" hint="No marketing texts or automated reminders in this window">
              <div className="flex items-center gap-2"><TextInput type="time" value={s.quietHoursStart} onChange={(e) => set("quietHoursStart", e.target.value)} /><span className="text-xs text-muted-foreground">to</span><TextInput type="time" value={s.quietHoursEnd} onChange={(e) => set("quietHoursEnd", e.target.value)} /></div>
            </Field>
            <p className="text-xs text-muted-foreground sm:col-span-2">Twilio connection, test mode and costs: <Link href="/communications/sms/setup" className="font-semibold text-primary hover:underline">Communications › SMS Setup</Link>.</p>
          </Section>

          <Section id="security" icon={ShieldCheck} title="Security" description="Sign-in rules for staff and agents. Changes here are flagged as critical in the audit log.">
            <Field label="Require two-factor sign-in"><PillGroup options={(["Everyone", "Admins only", "Off"] as const).map((v) => ({ value: v, label: v }))} value={s.twoFactor} onChange={(v) => set("twoFactor", v)} /></Field>
            <Field label="Sign out after inactivity"><Unit value={s.sessionTimeoutMinutes} unit="minutes" onChange={(n) => set("sessionTimeoutMinutes", n)} /><Err m={err("sessionTimeoutMinutes")} /></Field>
            <Field label="Minimum password length"><Unit value={s.passwordMinLength} unit="characters" onChange={(n) => set("passwordMinLength", n)} /><Err m={err("passwordMinLength")} /></Field>
            <Field label="Office IP allowlist" hint="Optional. One IPv4 address or range per line; leave empty to allow sign-in from anywhere">
              <Textarea rows={3} value={s.ipAllowlist} onChange={(e) => set("ipAllowlist", e.target.value)} placeholder={"103.4.145.0/24\n81.2.69.160"} className="font-mono text-xs" />
              <Err m={err("ipAllowlist")} />
            </Field>
            {s.twoFactor !== "Everyone" && <Warn className="sm:col-span-2">Staff can see passports, financial evidence and visa documents. Two-factor sign-in for everyone is strongly recommended.</Warn>}
          </Section>

          <Section id="privacy" icon={UserCheck} title="Data & privacy" description="UK GDPR and PECR details used across forms and exports.">
            <Field label="Data protection contact"><TextInput type="email" value={s.dpoEmail} onChange={(e) => set("dpoEmail", e.target.value)} /><Err m={err("dpoEmail")} /></Field>
            <Field label="Privacy notice"><TextInput value={s.privacyNoticeUrl} onChange={(e) => set("privacyNoticeUrl", e.target.value)} /><Err m={err("privacyNoticeUrl")} /></Field>
            <Field label="Marketing consent wording" className="sm:col-span-2" hint="Shown next to an unticked box on enquiry forms and the student portal"><Textarea rows={2} value={s.marketingConsentText} onChange={(e) => set("marketingConsentText", e.target.value)} /><Err m={err("marketingConsentText")} /></Field>
            <div className="rounded-2xl bg-surface-muted p-4 sm:col-span-2">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground"><Clock3 className="size-3.5" /> Retention periods</p>
              <ul className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-3">
                {Object.values(archiveKinds).map((k) => <li key={k.href}><Link href={k.href} className="font-semibold text-foreground hover:text-primary">{k.label.replace("Archived ", "")}</Link> · {k.retentionYears} years after archiving</li>)}
              </ul>
            </div>
          </Section>
        </div>
      </div>

      {draft && changes.length > 0 && (
        <div className="fixed inset-x-0 bottom-0 z-30 border-t border-border bg-surface/95 px-4 py-3 shadow-[0_-8px_24px_-12px_rgba(15,23,42,0.25)] backdrop-blur">
          <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3">
            <p className="min-w-0 text-xs text-muted-foreground">
              <span className="font-semibold text-foreground">{changes.length} unsaved change{changes.length === 1 ? "" : "s"}</span> — {changes.slice(0, 4).map((c) => c.field).join(", ")}{changes.length > 4 ? "…" : ""}
              {tried && errorCount > 0 && <span className="ml-2 font-semibold text-danger">{errorCount} to fix</span>}
            </p>
            <div className="flex gap-2">
              <button type="button" onClick={() => { setDraft(null); setTried(false); }} className={buttonSecondary}>Discard</button>
              <button type="button" onClick={save} className={buttonPrimary}><Save className="size-4" /> Save changes</button>
            </div>
          </div>
        </div>
      )}

      <Modal open={confirmReset} onClose={() => setConfirmReset(false)} icon={RotateCcw} size="sm" title="Restore default settings?" subtitle="Loads the defaults into the form so you can review them before saving."
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setConfirmReset(false)} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { setDraft(defaultCompanySettings); setConfirmReset(false); }} className={buttonPrimary}>Load defaults</button></div>}
      >
        <p className="text-sm text-muted-foreground">{diff(saved, defaultCompanySettings, companySettingLabels).length} settings differ from the defaults. Nothing changes until you save.</p>
      </Modal>
      {toast}
    </div>
  );
}

function Section({ id, icon: Icon, title, description, children }: { id: string; icon: typeof Building2; title: string; description: string; children: ReactNode }) {
  return (
    <Card className="scroll-mt-4 p-5 sm:p-6">
      <section id={id} className="scroll-mt-6">
        <div className="mb-5 flex items-start gap-3">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary"><Icon className="size-4" /></span>
          <div><h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3><p className="text-xs text-muted-foreground">{description}</p></div>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">{children}</div>
      </section>
    </Card>
  );
}

function Err({ m }: { m?: string }) {
  return m ? <span className="text-[11px] font-medium text-danger">{m}</span> : null;
}

function Warn({ children, className }: { children: ReactNode; className?: string }) {
  return <p className={cn("rounded-xl bg-warning-soft px-3 py-2.5 text-xs text-foreground", className)}>{children}</p>;
}

function Unit({ value, unit, onChange }: { value: number; unit: string; onChange: (n: number) => void }) {
  return (
    <div className="flex items-center gap-2">
      <TextInput type="number" value={Number.isFinite(value) ? value : ""} onChange={(e) => onChange(Number(e.target.value))} className="w-28" />
      <span className="text-xs text-muted-foreground">{unit}</span>
    </div>
  );
}

function Toggle({ label, hint, on, onChange, className }: { label: string; hint?: string; on: boolean; onChange: (v: boolean) => void; className?: string }) {
  return (
    <label className={cn("flex cursor-pointer items-center justify-between gap-4 rounded-2xl border border-border px-4 py-3", className)}>
      <span><span className="block text-sm font-medium text-foreground">{label}</span>{hint && <span className="block text-xs text-muted-foreground">{hint}</span>}</span>
      <button type="button" role="switch" aria-checked={on} onClick={() => onChange(!on)} className={cn("relative h-6 w-11 shrink-0 rounded-full transition-colors", on ? "bg-primary" : "bg-border-strong")}>
        <span className={cn("absolute left-0.5 top-0.5 size-5 rounded-full bg-white shadow transition-transform", on && "translate-x-5")} />
      </button>
    </label>
  );
}
