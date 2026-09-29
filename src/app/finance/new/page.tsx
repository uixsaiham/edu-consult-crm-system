"use client";

export const dynamic = 'force-dynamic';

import { useMemo, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, CircleAlert, Receipt } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Checkbox, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useUser } from "@/components/layout/user-context";
import { formatDay } from "@/components/people/people-ui";
import { getAgents } from "@/lib/mock/agents";
import { getApplications } from "@/lib/mock/applications";
import { allIntakes, intakeWindow } from "@/lib/mock/targets";
import {
  commissionFor,
  financeToday,
  getAgreements,
  getClaims,
  getPlan,
  invoice,
  markFinanceChange,
  money,
  nextClaimId,
  nextInvoiceNo,
  planAmount,
  saveClaims,
  tuitionFor,
  type Claim,
  type ClaimType,
} from "@/lib/mock/finance";
import { cn } from "@/lib/utils";

type Channel = Claim["channel"];

function AddCommissionPageInner() {
  const router = useRouter();
  const { user } = useUser();
  const agreements = getAgreements();
  const claims = getClaims();
  const agents = getAgents().filter((a) => a.status === "Active" || a.status === "Suspended");

  // Applications that are enrolled or about to be, and have no claim yet.
  const candidates = useMemo(() => {
    const claimed = new Set(claims.map((c) => c.applicationId).filter(Boolean));
    return getApplications()
      .filter((a) => ["Enrolled", "Visa filed", "CAS issued"].includes(a.stage) && !claimed.has(a.id))
      .sort((a, b) => a.applicant.localeCompare(b.applicant));
  }, [claims]);

  const [type, setType] = useState<ClaimType>("Student commission");
  const [appId, setAppId] = useState("");
  const [student, setStudent] = useState("");
  const [university, setUniversity] = useState("");
  const [course, setCourse] = useState("");
  const [intake, setIntake] = useState("Sep 2026");
  const [channel, setChannel] = useState<Channel>("Direct");
  const [agent, setAgent] = useState("");
  const [counsellor, setCounsellor] = useState(user.name);
  const [tuition, setTuition] = useState("");
  const [override, setOverride] = useState("");
  const [amount, setAmount] = useState("");
  const [credit, setCredit] = useState(true);
  const [relatedId, setRelatedId] = useState("");
  const [notes, setNotes] = useState("");
  const [invoiceNow, setInvoiceNow] = useState(true);
  const [tried, setTried] = useState(false);

  const agr = agreements.find((a) => a.university === university);
  const currency = agr?.currency ?? "GBP";
  const census = intakeWindow(intake).end;
  const calc = commissionFor(agr, Number(tuition) || 0);
  const studentAmount = override ? Number(override) : calc.amount;
  const baseAmount = type === "Student commission" ? studentAmount : (Number(amount) || 0) * (type === "Adjustment" && credit ? -1 : 1);
  const agentRow = agents.find((a) => a.name === agent);
  const agentShare = type === "Student commission" && channel === "Agent" ? (agentRow?.commissionShare ?? 50) : 0;
  const agentAmount = Math.round((baseAmount * agentShare) / 100);
  const counsellorAmount = type === "Student commission" ? planAmount(channel, getPlan()) : 0;
  const canInvoiceNow = type !== "Student commission" || census <= financeToday;
  const relatedClaims = claims.filter((c) => c.university === university && c.invoiceNo);

  const pickApplication = (id: string) => {
    setAppId(id);
    const a = candidates.find((x) => x.id === id);
    if (!a) return;
    setStudent(a.applicant);
    setUniversity(a.university);
    setCourse(a.course);
    setIntake(allIntakes.includes(a.intake) ? a.intake : intake);
    setChannel(a.channel);
    setAgent(a.channel === "Agent" ? (a.partner ?? "") : "");
    setCounsellor(a.counsellor);
    const g = agreements.find((x) => x.university === a.university);
    setTuition(String(tuitionFor(a, g?.currency ?? "GBP")));
    setOverride("");
  };

  const errors: Record<string, string> = {};
  if (!university) errors.university = "Choose the university";
  if (type === "Student commission") {
    if (!student.trim()) errors.student = "Enter the student's name";
    if (!course.trim()) errors.course = "Enter the course";
    if (!(Number(tuition) > 0) && agr?.basis !== "Flat fee per student") errors.tuition = "Enter the first-year tuition";
    if (channel === "Agent" && !agent) errors.agent = "Choose the agent";
    if (override && !notes.trim()) errors.notes = "Explain why the amount differs from the agreement";
    if (appId && claims.some((c) => c.applicationId === appId)) errors.student = "This application already has a commission claim";
  } else {
    if (!(Number(amount) > 0)) errors.amount = "Enter the amount";
    if (!notes.trim()) errors.notes = type === "Volume bonus" ? "Describe what the bonus is for" : "Explain the adjustment";
  }
  const err = (k: string) => (tried ? errors[k] : undefined);
  const errorCount = Object.keys(errors).length;

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errorCount) {
      document.querySelector("[aria-invalid='true']")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    const related = claims.find((c) => c.id === relatedId);
    let record: Claim = {
      id: nextClaimId(),
      type,
      applicationId: type === "Student commission" ? appId || undefined : undefined,
      student: type === "Student commission" ? student.trim() : type === "Volume bonus" ? `Volume bonus · ${intake}` : `Adjustment${related ? ` to ${related.invoiceNo}` : ""}`,
      university,
      course: type === "Student commission" ? course.trim() : "—",
      intake,
      country: agr?.country ?? "United Kingdom",
      currency,
      channel: type === "Student commission" ? channel : "Direct",
      agent: type === "Student commission" && channel === "Agent" ? agent : undefined,
      counsellor: type === "Student commission" ? counsellor : user.name,
      branch: getApplications().find((a) => a.counsellor === counsellor)?.branch ?? "Dhaka HQ",
      tuition: Number(tuition) || 0,
      rateLabel: type === "Student commission" ? (override ? `Manual ${money(Number(override), currency)} (agreement: ${calc.label})` : calc.label) : type,
      amount: baseAmount,
      status: type === "Student commission" && census > financeToday ? "Awaiting census" : "Ready to invoice",
      censusDate: type === "Student commission" ? census : financeToday,
      payments: [],
      agentShare,
      agentAmount,
      payoutStatus: agentShare ? "Awaiting university" : "Not applicable",
      counsellorAmount,
      counsellorStatus: "Pending",
      notes: notes.trim(),
      createdAt: financeToday,
      createdBy: user.name,
    };
    if (invoiceNow && canInvoiceNow && record.status === "Ready to invoice") record = invoice(record, nextInvoiceNo(claims));
    saveClaims([record, ...claims]);
    markFinanceChange(record.id, record.invoiceNo ? `${record.id} added and invoiced as ${record.invoiceNo}` : `${record.id} added`);
    router.push("/finance/payments");
  };

  const input = (k: string) => ({ "aria-invalid": !!err(k), className: cn(err(k) && "border-danger") });

  return (
    <form onSubmit={submit} noValidate className="flex flex-col gap-4">
      <header className="flex flex-col gap-3">
        <Link href="/finance/payments" className="inline-flex w-fit items-center gap-1.5 text-xs font-medium text-muted-foreground hover:text-foreground"><ArrowLeft className="size-3.5" /> Commission payments</Link>
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Add New Commission</h2>
          <p className="mt-1 text-sm text-muted-foreground">Commission for enrolled students is created automatically. Use this for a student not in the CRM, a volume bonus, or a correction.</p>
        </div>
      </header>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[minmax(0,1fr)_340px]">
        <div className="flex min-w-0 flex-col gap-4">
          <Section index={1} title="What kind of commission?">
            <PillGroup<ClaimType> options={[{ value: "Student commission", label: "Student commission" }, { value: "Volume bonus", label: "Volume bonus" }, { value: "Adjustment", label: "Adjustment" }]} value={type} onChange={(t) => { setType(t); setTried(false); }} />
            <p className="mt-2 text-xs text-muted-foreground">
              {type === "Student commission" ? "Commission on one student's first-year tuition, worked out from the university's agreement." : type === "Volume bonus" ? "Extra commission a university pays for reaching an enrolment threshold." : "A credit note (money back to the university) or an extra charge on an earlier invoice."}
            </p>
          </Section>

          {type === "Student commission" ? (
            <Section index={2} title="Student">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Pick from applications" className="sm:col-span-2" hint={candidates.length ? `${candidates.length} enrolled or about-to-enrol students without a claim.` : "Every enrolled student already has a claim — enter the student below."}>
                  <Select value={appId} onChange={(e) => pickApplication(e.target.value)} disabled={!candidates.length}>
                    <option value="">Enter manually</option>
                    {candidates.map((a) => <option key={a.id} value={a.id}>{a.applicant} · {a.university} · {a.stage}</option>)}
                  </Select>
                </Field>
                <Field label="Student name" required>
                  <TextInput value={student} onChange={(e) => setStudent(e.target.value)} {...input("student")} />
                  <Err msg={err("student")} />
                </Field>
                <Field label="University" required>
                  <Select value={university} placeholder="Choose a university" onChange={(e) => setUniversity(e.target.value)} {...input("university")}>
                    {agreements.map((a) => <option key={a.id} value={a.university}>{a.university}</option>)}
                  </Select>
                  <Err msg={err("university")} />
                </Field>
                <Field label="Course" required>
                  <TextInput value={course} onChange={(e) => setCourse(e.target.value)} {...input("course")} />
                  <Err msg={err("course")} />
                </Field>
                <Field label="Intake" hint={`Census ${formatDay(census)} — invoice after this date.`}>
                  <Select value={intake} onChange={(e) => setIntake(e.target.value)}>
                    {allIntakes.map((i) => <option key={i}>{i}</option>)}
                  </Select>
                </Field>
                <Field label="Source">
                  <PillGroup<Channel> options={[{ value: "Direct", label: "Direct" }, { value: "Agent", label: "Agent" }, { value: "Affiliate", label: "Ambassador" }]} value={channel} onChange={setChannel} />
                </Field>
                {channel === "Agent" ? (
                  <Field label="Agent" required>
                    <Select value={agent} placeholder="Choose the agent" onChange={(e) => setAgent(e.target.value)} {...input("agent")}>
                      {agents.map((a) => <option key={a.id} value={a.name}>{a.name} · {a.commissionShare}%</option>)}
                    </Select>
                    <Err msg={err("agent")} />
                  </Field>
                ) : (
                  <Field label="Counsellor">
                    <TextInput value={counsellor} onChange={(e) => setCounsellor(e.target.value)} />
                  </Field>
                )}
              </div>
            </Section>
          ) : (
            <Section index={2} title={type === "Volume bonus" ? "Bonus" : "Adjustment"}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="University" required>
                  <Select value={university} placeholder="Choose a university" onChange={(e) => { setUniversity(e.target.value); setRelatedId(""); }} {...input("university")}>
                    {agreements.map((a) => <option key={a.id} value={a.university}>{a.university}</option>)}
                  </Select>
                  <Err msg={err("university")} />
                </Field>
                <Field label="Intake">
                  <Select value={intake} onChange={(e) => setIntake(e.target.value)}>
                    {allIntakes.map((i) => <option key={i}>{i}</option>)}
                  </Select>
                </Field>
                {type === "Adjustment" && (
                  <>
                    <Field label="Direction" className="sm:col-span-2">
                      <PillGroup<"credit" | "debit"> options={[{ value: "credit", label: "Credit note (reduce what they owe)" }, { value: "debit", label: "Extra charge" }]} value={credit ? "credit" : "debit"} onChange={(v) => setCredit(v === "credit")} />
                    </Field>
                    <Field label="Related invoice" className="sm:col-span-2">
                      <Select value={relatedId} onChange={(e) => setRelatedId(e.target.value)} disabled={!university}>
                        <option value="">None</option>
                        {relatedClaims.map((c) => <option key={c.id} value={c.id}>{c.invoiceNo} · {c.student} · {money(c.amount, c.currency)}</option>)}
                      </Select>
                    </Field>
                  </>
                )}
                <Field label={`Amount (${currency})`} required>
                  <TextInput inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))} {...input("amount")} />
                  <Err msg={err("amount")} />
                </Field>
              </div>
            </Section>
          )}

          {type === "Student commission" && (
            <Section index={3} title="Amount" description={agr ? `${agr.university}: ${agr.basis === "Flat fee per student" ? `${money(agr.rate, agr.currency)} per student` : `${agr.rate}% of first-year tuition`}` : "Choose the university to use its agreement."}>
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label={`First-year tuition (${currency})`} required={agr?.basis !== "Flat fee per student"}>
                  <TextInput inputMode="numeric" value={tuition} onChange={(e) => setTuition(e.target.value.replace(/\D/g, "").slice(0, 7))} {...input("tuition")} />
                  <Err msg={err("tuition")} />
                </Field>
                <Field label="Override amount" hint={`Leave empty to use ${money(calc.amount, currency)} from the agreement.`}>
                  <TextInput inputMode="numeric" value={override} onChange={(e) => setOverride(e.target.value.replace(/\D/g, "").slice(0, 7))} placeholder={String(calc.amount || "")} />
                </Field>
              </div>
            </Section>
          )}

          <Section index={type === "Student commission" ? 4 : 3} title="Notes">
            <Field label={override || type !== "Student commission" ? "Reason" : "Notes"} required={!!override || type !== "Student commission"}>
              <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder={type === "Volume bonus" ? "e.g. 25+ enrolments for Sep 2026 — 2% bonus on all tuition" : type === "Adjustment" ? "e.g. Scholarship reduced tuition by £2,000 after invoicing" : "Anything finance should know"} {...input("notes")} />
              <Err msg={err("notes")} />
            </Field>
          </Section>
        </div>

        <aside className="flex flex-col gap-4 lg:sticky lg:top-0">
          <Card className="p-5">
            <p className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Summary</p>
            <div className="flex items-center gap-3">
              <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Receipt className="size-5" /></span>
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-foreground">{type === "Student commission" ? student || "New student commission" : type}</p>
                <p className="truncate text-xs text-muted-foreground">{university || "University"} · {intake}</p>
              </div>
            </div>
            <dl className="mt-4 flex flex-col gap-2 text-xs">
              <Line label="Commission to BHE" value={money(baseAmount, currency)} strong />
              {type === "Student commission" && <Line label={agentShare ? `Agent payout (${agentShare}%)` : "Agent payout"} value={agentShare ? `−${money(agentAmount, currency)}` : "—"} />}
              {type === "Student commission" && <Line label="Counsellor commission" value={`−${money(counsellorAmount)}`} />}
              <div className="my-1 border-t border-border" />
              <Line label="BHE keeps" value={money(baseAmount - agentAmount - (currency === "GBP" ? counsellorAmount : 0), currency)} strong />
            </dl>
          </Card>

          <Card className="p-5">
            <Checkbox
              checked={invoiceNow && canInvoiceNow}
              onChange={setInvoiceNow}
              label={
                <span>
                  <span className="font-semibold">Raise the invoice now</span>
                  <span className="block text-xs text-muted-foreground">
                    {canInvoiceNow ? `Due in ${agr?.paymentDays ?? 45} days under the agreement.` : `Not until census on ${formatDay(census)} — it'll wait as "Awaiting census".`}
                  </span>
                </span>
              }
            />
          </Card>

          {tried && errorCount > 0 && (
            <p className="flex items-center gap-2 rounded-2xl bg-danger-soft px-4 py-3 text-xs font-medium text-danger"><CircleAlert className="size-4 shrink-0" /> Fix {errorCount} field{errorCount > 1 ? "s" : ""} to continue.</p>
          )}

          <div className="flex gap-2">
            <Link href="/finance/payments" className={cn(buttonSecondary, "flex-1")}>Cancel</Link>
            <button type="submit" className={cn(buttonPrimary, "flex-1")}>Add commission</button>
          </div>
        </aside>
      </div>
    </form>
  );
}

function Section({ index, title, description, children }: { index: number; title: string; description?: string; children: ReactNode }) {
  return (
    <Card className="p-5 sm:p-6">
      <div className="mb-4 flex items-start gap-3">
        <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-xs font-bold text-primary">{index}</span>
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
          {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
        </div>
      </div>
      {children}
    </Card>
  );
}

function Line({ label, value, strong }: { label: string; value: string; strong?: boolean }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className={cn("tabular-nums", strong ? "text-sm font-bold text-foreground" : "text-foreground")}>{value}</dd>
    </div>
  );
}

function Err({ msg }: { msg?: string }) {
  return msg ? <span className="mt-1 flex items-center gap-1 text-[11px] font-medium text-danger"><CircleAlert className="size-3" /> {msg}</span> : null;
}

export default function AddCommissionPage() { return <Suspense><AddCommissionPageInner /></Suspense>; }
