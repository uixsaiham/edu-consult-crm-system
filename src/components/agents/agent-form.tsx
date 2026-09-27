"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Briefcase, CircleAlert, Mail, MapPin, Percent, Phone, Send, ShieldCheck, X } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox, Dropzone, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { countryList } from "@/lib/mock/country-list";
import {
  agentSources,
  agentTiers,
  destinationOptions,
  getAgents,
  markAgentChange,
  nextAgentId,
  relationshipManagers,
  requiredDocs,
  saveAgents,
  tierShare,
  today,
  type Agent,
  type AgentDocument,
  type AgentSource,
  type AgentStatus,
  type AgentTier,
  type AgentType,
  type DocKey,
} from "@/lib/mock/agents";
import { cn } from "@/lib/utils";
import { AgentStatusBadge, TierBadge } from "./agent-ui";

interface FormState {
  type: AgentType;
  name: string;
  legalName: string;
  website: string;
  country: string;
  city: string;
  address: string;
  contactName: string;
  contactRole: string;
  email: string;
  phone: string;
  markets: string[];
  destinations: string[];
  expectedStudents: string;
  source: AgentSource;
  manager: string;
  tier: AgentTier;
  commissionShare: string;
  agreementEnd: string;
  bankName: string;
  accountName: string;
  accountNumber: string;
  docs: Record<DocKey, AgentDocument>;
  status: AgentStatus;
  approveNow: boolean;
  notes: string;
}

const emptyDocs = () => Object.fromEntries(requiredDocs.map((d) => [d.key, { status: "Missing" }])) as Record<DocKey, AgentDocument>;

function initialState(agent?: Agent): FormState {
  if (!agent) {
    return {
      type: "Company",
      name: "",
      legalName: "",
      website: "",
      country: "Bangladesh",
      city: "",
      address: "",
      contactName: "",
      contactRole: "Director",
      email: "",
      phone: "",
      markets: ["Bangladesh"],
      destinations: ["United Kingdom"],
      expectedStudents: "",
      source: "Direct outreach",
      manager: relationshipManagers[0],
      tier: "Silver",
      commissionShare: String(tierShare.Silver),
      agreementEnd: "2027-09-30",
      bankName: "",
      accountName: "",
      accountNumber: "",
      docs: emptyDocs(),
      status: "Pending",
      approveNow: false,
      notes: "",
    };
  }
  return {
    type: agent.type,
    name: agent.name,
    legalName: agent.legalName,
    website: agent.website,
    country: agent.country,
    city: agent.city,
    address: agent.address,
    contactName: agent.contactName,
    contactRole: agent.contactRole,
    email: agent.email,
    phone: agent.phone,
    markets: agent.markets,
    destinations: agent.destinations,
    expectedStudents: String(agent.expectedStudents || ""),
    source: agent.source,
    manager: agent.manager,
    tier: agent.tier,
    commissionShare: String(agent.commissionShare),
    agreementEnd: agent.agreementEnd ?? "",
    bankName: agent.bankName,
    accountName: agent.accountName,
    accountNumber: agent.accountLast4 ? `••••${agent.accountLast4}` : "",
    docs: agent.docs,
    status: agent.status,
    approveNow: false,
    notes: agent.notes ?? "",
  };
}

export function AgentForm({ agent }: { agent?: Agent }) {
  const router = useRouter();
  const editing = !!agent;
  const [form, setForm] = useState<FormState>(() => initialState(agent));
  const [tried, setTried] = useState(false);
  const agents = getAgents();
  const set = <K extends keyof FormState>(k: K, v: FormState[K]) => setForm((f) => ({ ...f, [k]: v }));
  const approved = editing && agent.status !== "Pending" && agent.status !== "Rejected";
  const backHref = editing && !approved ? "/agent-management/pending" : "/agent-management";

  const docsUploaded = requiredDocs.every((d) => form.docs[d.key].status !== "Missing");
  const goingLive = form.approveNow || approved;

  const errors = (() => {
    const e: Partial<Record<keyof FormState, string>> = {};
    if (!form.name.trim()) e.name = form.type === "Company" ? "Enter the agency's trading name" : "Enter the agent's name";
    if (agents.some((a) => a.id !== agent?.id && a.name.toLowerCase() === form.name.trim().toLowerCase())) e.name = "An agent with this name already exists";
    if (!form.city.trim()) e.city = "Enter a city";
    if (!form.contactName.trim()) e.contactName = "Enter the main contact's name";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) e.email = "Enter a valid email";
    else if (agents.some((a) => a.id !== agent?.id && a.email.toLowerCase() === form.email.trim().toLowerCase())) e.email = "Another agent already uses this email";
    if (form.phone.replace(/\D/g, "").length < 8) e.phone = "Enter a phone number with country code";
    if (!form.markets.length) e.markets = "Add at least one country they recruit from";
    if (!form.destinations.length) e.destinations = "Pick at least one destination";
    const share = Number(form.commissionShare);
    if (!(share > 0 && share <= 90)) e.commissionShare = "Enter a share between 1 and 90%";
    if (goingLive && !form.agreementEnd) e.agreementEnd = "Set when the agreement ends";
    if (form.approveNow && !docsUploaded) e.docs = "Upload all five documents to approve now";
    return e;
  })();
  const show = (k: keyof FormState) => (tried ? errors[k] : undefined);
  const errorCount = Object.keys(errors).length;

  const toggle = (list: string[], v: string) => (list.includes(v) ? list.filter((x) => x !== v) : [...list, v]);
  const setDoc = (key: DocKey, doc: AgentDocument) => set("docs", { ...form.docs, [key]: doc });

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errorCount) {
      document.querySelector("[aria-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const id = agent?.id ?? nextAgentId();
    const status: AgentStatus = editing ? form.status : form.approveNow ? "Active" : "Pending";
    const docs = form.approveNow
      ? (Object.fromEntries(requiredDocs.map((d) => [d.key, { ...form.docs[d.key], status: "Verified" }])) as Record<DocKey, AgentDocument>)
      : form.docs;
    const digits = form.accountNumber.replace(/\D/g, "");
    const now = `${today}T${new Date().toISOString().slice(11, 19)}Z`;
    const record: Agent = {
      id,
      name: form.name.trim(),
      legalName: form.legalName.trim() || form.name.trim(),
      type: form.type,
      contactName: form.contactName.trim(),
      contactRole: form.contactRole.trim() || (form.type === "Individual" ? "Independent agent" : "Director"),
      email: form.email.trim().toLowerCase(),
      phone: form.phone.trim(),
      website: form.website.trim().replace(/^https?:\/\//, ""),
      address: form.address.trim() || `${form.city.trim()}, ${form.country}`,
      city: form.city.trim(),
      country: form.country,
      markets: form.markets,
      destinations: form.destinations,
      tier: form.tier,
      commissionShare: Number(form.commissionShare),
      status,
      source: form.source,
      manager: form.manager,
      expectedStudents: Number(form.expectedStudents) || 0,
      appliedAt: agent?.appliedAt ?? today,
      approvedAt: agent?.approvedAt ?? (status === "Active" ? today : undefined),
      agreementEnd: form.agreementEnd || undefined,
      bankName: form.bankName.trim(),
      accountName: form.accountName.trim(),
      accountLast4: digits ? digits.slice(-4) : (agent?.accountLast4 ?? ""),
      docs,
      rejectionReason: agent?.rejectionReason,
      notes: form.notes.trim() || undefined,
      activity: [
        {
          at: now,
          text: !editing
            ? form.approveNow
              ? `Added and approved as ${form.tier} partner at ${form.commissionShare}% share`
              : "Added and sent for KYC review"
            : agent.status !== form.status
              ? `Status changed from ${agent.status} to ${form.status}`
              : "Details updated",
          by: form.manager,
        },
        ...(agent?.activity ?? []),
      ],
    };
    saveAgents(editing ? agents.map((a) => (a.id === id ? record : a)) : [record, ...agents]);
    markAgentChange(id, editing ? "updated" : status === "Pending" ? "submitted" : "added");
    router.push(status === "Pending" || status === "Rejected" ? "/agent-management/pending" : "/agent-management");
  };

  const input = (k: keyof FormState) => ({ "aria-invalid": !!show(k), className: cn(show(k) && "border-danger") });
  const docCount = requiredDocs.filter((d) => form.docs[d.key].status !== "Missing").length;

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <Link href={backHref} className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground">
          <ArrowLeft className="size-3.5" /> {backHref.endsWith("pending") ? "Pending agents" : "Agents"}
        </Link>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">{editing ? `Edit ${agent.name}` : "Add New Agent"}</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {editing ? "Update the agency's details, terms and documents." : "Register a recruitment partner. New agents go to Pending Agents for KYC review unless you approve them now."} Fields marked{" "}
            <span className="text-danger">*</span> are required.
          </p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section index={1} title="Agency details" description="Who the partner is and where they operate.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Agent type" className="sm:col-span-2">
                <PillGroup options={[{ value: "Company", label: "Company / agency" }, { value: "Individual", label: "Individual agent" }]} value={form.type} onChange={(v) => set("type", v)} />
              </Field>
              <Field label={form.type === "Company" ? "Trading name" : "Agent name"} required>
                <TextInput value={form.name} onChange={(e) => set("name", e.target.value)} placeholder={form.type === "Company" ? "e.g. Zenith Global Education" : "e.g. Priya Nair"} {...input("name")} />
                <Err msg={show("name")} />
              </Field>
              <Field label="Registered legal name" hint={form.type === "Company" ? "As shown on the trade licence." : undefined}>
                <TextInput value={form.legalName} onChange={(e) => set("legalName", e.target.value)} placeholder={form.type === "Company" ? "e.g. Zenith Overseas Consultants Ltd" : "Same as agent name"} />
              </Field>
              <Field label="Country" required>
                <Select value={form.country} onChange={(e) => set("country", e.target.value)}>
                  {countryList.map((c) => <option key={c.code}>{c.name}</option>)}
                </Select>
              </Field>
              <Field label="City" required>
                <TextInput value={form.city} onChange={(e) => set("city", e.target.value)} placeholder="e.g. Dhaka" {...input("city")} />
                <Err msg={show("city")} />
              </Field>
              <Field label="Office address" className="sm:col-span-2">
                <TextInput value={form.address} onChange={(e) => set("address", e.target.value)} placeholder="Street, area, postcode" />
              </Field>
              <Field label="Website">
                <TextInput value={form.website} onChange={(e) => set("website", e.target.value)} placeholder="www.example.com" />
              </Field>
              <Field label="How they found us">
                <Select value={form.source} onChange={(e) => set("source", e.target.value as AgentSource)}>
                  {agentSources.map((s) => <option key={s}>{s}</option>)}
                </Select>
              </Field>
            </div>
          </Section>

          <Section index={2} title="Main contact" description="The person BHE counsellors will deal with day to day.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Full name" required>
                <TextInput value={form.contactName} onChange={(e) => set("contactName", e.target.value)} placeholder="e.g. Tariq Mahmood" {...input("contactName")} />
                <Err msg={show("contactName")} />
              </Field>
              <Field label="Position">
                <TextInput value={form.contactRole} onChange={(e) => set("contactRole", e.target.value)} placeholder="e.g. Managing Director" />
              </Field>
              <Field label="Email" required hint="Login details for the agent portal go here.">
                <TextInput type="email" value={form.email} onChange={(e) => set("email", e.target.value)} placeholder="contact@agency.com" {...input("email")} />
                <Err msg={show("email")} />
              </Field>
              <Field label="Phone / WhatsApp" required>
                <TextInput type="tel" value={form.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+880 1711-000000" {...input("phone")} />
                <Err msg={show("phone")} />
              </Field>
            </div>
          </Section>

          <Section index={3} title="Recruitment" description="Where their students come from and where they want to study.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Recruits students from" required className="sm:col-span-2">
                <div className="flex flex-wrap items-center gap-1.5" aria-invalid={!!show("markets")}>
                  {form.markets.map((m) => (
                    <span key={m} className="inline-flex h-8 items-center gap-1 rounded-full border border-primary/40 bg-primary-soft pl-3 pr-1.5 text-xs font-medium text-primary">
                      {m}
                      <button type="button" aria-label={`Remove ${m}`} onClick={() => set("markets", form.markets.filter((x) => x !== m))} className="rounded-full p-0.5 hover:bg-primary/15">
                        <X className="size-3" />
                      </button>
                    </span>
                  ))}
                  <select
                    aria-label="Add a country"
                    value=""
                    onChange={(e) => e.target.value && set("markets", [...form.markets, e.target.value])}
                    className="h-8 rounded-full border border-dashed border-border-strong bg-transparent px-3 text-xs text-muted-foreground focus:border-primary focus:outline-none"
                  >
                    <option value="">+ Add country</option>
                    {countryList.filter((c) => !form.markets.includes(c.name)).map((c) => <option key={c.code}>{c.name}</option>)}
                  </select>
                </div>
                <Err msg={show("markets")} />
              </Field>
              <Field label="Study destinations" required className="sm:col-span-2">
                <div className="flex flex-wrap gap-1.5" aria-invalid={!!show("destinations")}>
                  {destinationOptions.map((d) => {
                    const on = form.destinations.includes(d);
                    return (
                      <button key={d} type="button" aria-pressed={on} onClick={() => set("destinations", toggle(form.destinations, d))} className={cn("h-8 rounded-full border px-3 text-xs font-medium transition-colors", on ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                        {d}
                      </button>
                    );
                  })}
                </div>
                <Err msg={show("destinations")} />
              </Field>
              <Field label="Expected students per year" hint="Their own estimate — used to set targets.">
                <TextInput inputMode="numeric" value={form.expectedStudents} onChange={(e) => set("expectedStudents", e.target.value.replace(/\D/g, "").slice(0, 4))} placeholder="e.g. 50" />
              </Field>
              <Field label="BHE relationship manager">
                <Select value={form.manager} onChange={(e) => set("manager", e.target.value)}>
                  {relationshipManagers.map((m) => <option key={m}>{m}</option>)}
                </Select>
              </Field>
            </div>
          </Section>

          <Section index={4} title="Commission & agreement" description="The agent's share of the commission BHE receives from institutions.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Field label="Partner tier" hint={`Default share: Gold ${tierShare.Gold}%, Silver ${tierShare.Silver}%, Bronze ${tierShare.Bronze}%.`}>
                <PillGroup options={agentTiers.map((t) => ({ value: t, label: t }))} value={form.tier} onChange={(t) => setForm((f) => ({ ...f, tier: t, commissionShare: String(tierShare[t]) }))} />
              </Field>
              <Field label="Commission share (%)" required>
                <TextInput inputMode="numeric" value={form.commissionShare} onChange={(e) => set("commissionShare", e.target.value.replace(/\D/g, "").slice(0, 2))} {...input("commissionShare")} />
                <Err msg={show("commissionShare")} />
              </Field>
              <Field label="Agreement ends" required={goingLive}>
                <TextInput type="date" value={form.agreementEnd} min={today} onChange={(e) => set("agreementEnd", e.target.value)} {...input("agreementEnd")} />
                <Err msg={show("agreementEnd")} />
              </Field>
              <div className="rounded-2xl bg-surface-muted p-3.5 text-xs text-muted-foreground">
                On a £2,000 university commission this agent receives{" "}
                <span className="font-semibold text-foreground">£{Math.round((2000 * (Number(form.commissionShare) || 0)) / 100).toLocaleString()}</span> and BHE keeps{" "}
                <span className="font-semibold text-foreground">£{Math.round((2000 * (100 - (Number(form.commissionShare) || 0))) / 100).toLocaleString()}</span>.
              </div>
            </div>
          </Section>

          <Section index={5} title="Payout bank details" description="Where commission payments are sent. Only the last four digits are shown after saving.">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <Field label="Bank name">
                <TextInput value={form.bankName} onChange={(e) => set("bankName", e.target.value)} placeholder="e.g. BRAC Bank" />
              </Field>
              <Field label="Account holder">
                <TextInput value={form.accountName} onChange={(e) => set("accountName", e.target.value)} placeholder="As on bank statement" />
              </Field>
              <Field label="Account number / IBAN">
                <TextInput value={form.accountNumber} onChange={(e) => set("accountNumber", e.target.value)} onFocus={() => form.accountNumber.startsWith("••••") && set("accountNumber", "")} placeholder="Enter account number" />
              </Field>
            </div>
          </Section>

          <Section index={6} title="KYC documents" description={`${docCount} of ${requiredDocs.length} uploaded. Compliance verifies each one on the Pending Agents page.`}>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2" aria-invalid={!!show("docs")}>
              {requiredDocs.map((d) => {
                const doc = form.docs[d.key];
                return (
                  <Field key={d.key} label={d.label} hint={doc.status === "Verified" ? "Verified by compliance" : doc.status === "Rejected" ? `Rejected${doc.note ? ` — ${doc.note}` : ""}. Upload a new copy.` : undefined}>
                    <Dropzone
                      fileName={doc.fileName}
                      onFile={(f) => setDoc(d.key, { status: "Uploaded", fileName: f.name })}
                      onClear={() => setDoc(d.key, { status: "Missing" })}
                      accept=".pdf,.jpg,.jpeg,.png"
                    />
                  </Field>
                );
              })}
            </div>
            <Err msg={show("docs")} />
          </Section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
          <Card className="p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Preview</p>
            <div className="flex items-center gap-3">
              <span className="flex size-12 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary">
                <Briefcase className="size-5" />
              </span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{form.name || "New agent"}</p>
                <p className="truncate text-xs text-muted-foreground">{form.city ? `${form.city}, ${form.country}` : form.country}</p>
                <div className="mt-1.5 flex flex-wrap gap-1">
                  <TierBadge tier={form.tier} />
                  <AgentStatusBadge status={editing ? form.status : form.approveNow ? "Active" : "Pending"} />
                </div>
              </div>
            </div>
            <ul className="mt-4 flex flex-col gap-1.5 text-xs text-muted-foreground">
              <li className="flex items-center gap-2"><Mail className="size-3.5" /> {form.email || "—"}</li>
              <li className="flex items-center gap-2"><Phone className="size-3.5" /> {form.phone || "—"}</li>
              <li className="flex items-center gap-2"><MapPin className="size-3.5" /> {form.markets.join(", ") || "—"}</li>
              <li className="flex items-center gap-2"><Percent className="size-3.5" /> {form.commissionShare || 0}% commission share</li>
              <li className="flex items-center gap-2"><ShieldCheck className="size-3.5" /> {docCount}/{requiredDocs.length} KYC documents</li>
            </ul>
          </Card>

          {!editing && (
            <Card className="p-5">
              <Checkbox
                checked={form.approveNow}
                onChange={(v) => set("approveNow", v)}
                label={
                  <span>
                    <span className="font-semibold">Approve now</span>
                    <span className="mt-0.5 block text-xs text-muted-foreground">Skip the review queue and mark every document verified. Use only when compliance has already checked them.</span>
                  </span>
                }
              />
            </Card>
          )}

          {approved && (
            <Card className="p-5">
              <Field label="Partnership status">
                <PillGroup options={(["Active", "Suspended", "Inactive"] as AgentStatus[]).map((s) => ({ value: s, label: s }))} value={form.status} onChange={(v) => set("status", v)} />
              </Field>
              {form.status === "Suspended" && <p className="mt-2 text-[11px] text-muted-foreground">Suspended agents can&apos;t submit new applications; existing ones continue.</p>}
            </Card>
          )}

          <Card className="p-5">
            <Field label="Internal notes">
              <Textarea rows={3} value={form.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Met at the Dhaka fair; strong MBA pipeline" />
            </Field>
          </Card>

          {tried && errorCount > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-xs font-medium text-danger">
              <CircleAlert className="size-4 shrink-0" /> Fix {errorCount} field{errorCount > 1 ? "s" : ""} to continue.
            </p>
          )}

          <div className="flex gap-2">
            <Link href={backHref} className={cn(buttonSecondary, "flex-1")}>Cancel</Link>
            <button type="submit" className={cn(buttonPrimary, "flex-1")}>
              {editing ? "Save changes" : form.approveNow ? <><ShieldCheck className="size-4" /> Add & approve</> : <><Send className="size-4" /> Submit for review</>}
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
    <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-danger">
      <CircleAlert className="size-3" /> {msg}
    </span>
  );
}
