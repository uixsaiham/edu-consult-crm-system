// Finance: university commission agreements, the commission claims raised on
// enrolled students, what BHE pays agents out of that commission, and the
// counsellor commission plan. Everything is derived from the applications
// data so numbers line up across the CRM; edits are kept for the session.
import { getApplications, type ApplicationRow } from "./applications";
import { findUniversity } from "./course-catalog";
import { getCourses } from "./courses";
import { getAgents } from "./agents";
import { getStaff } from "./staff";
import { intakeWindow } from "./targets";

export const financeToday = "2026-09-17";
const todayMs = Date.parse(financeToday);
const DAY = 86400000;
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
export const daysBetween = (a: string, b = financeToday) => Math.round((Date.parse(b) - Date.parse(a)) / DAY);

// --- Money -------------------------------------------------------------------------

export const currencies = ["GBP", "EUR", "AUD", "CAD", "USD", "CNY"] as const;
export type Currency = (typeof currencies)[number];
const symbol: Record<Currency, string> = { GBP: "£", EUR: "€", AUD: "A$", CAD: "C$", USD: "$", CNY: "¥" };
/** Rough conversion to GBP for reporting totals. */
export const toGbpRate: Record<Currency, number> = { GBP: 1, EUR: 0.85, AUD: 0.52, CAD: 0.55, USD: 0.79, CNY: 0.11 };
export const toGbp = (amount: number, c: Currency) => Math.round(amount * toGbpRate[c]);

export function money(amount: number, c: Currency = "GBP", compact = false) {
  const sign = amount < 0 ? "-" : "";
  const n = Math.abs(amount);
  if (compact && n >= 1000) return `${sign}${symbol[c]}${n >= 1_000_000 ? `${(n / 1_000_000).toFixed(1)}m` : `${(n / 1000).toFixed(n >= 100_000 ? 0 : 1)}k`}`;
  return `${sign}${symbol[c]}${Math.round(n).toLocaleString()}`;
}

const currencyFor = (country: string): Currency =>
  (({ Ireland: "EUR", Australia: "AUD", Canada: "CAD", "United States": "USD", China: "CNY" }) as Record<string, Currency>)[country] ?? "GBP";

// --- University agreements ----------------------------------------------------------

export type CommissionBasis = "Percent of first-year tuition" | "Flat fee per student";
export type AgreementStatus = "Active" | "Expiring" | "Expired";

export interface UniversityAgreement {
  id: string;
  university: string;
  country: string;
  currency: Currency;
  basis: CommissionBasis;
  /** % of tuition, or the flat amount per student. */
  rate: number;
  /** Extra % once enrolments for the intake reach `bonusThreshold`. */
  bonusRate: number;
  bonusThreshold: number;
  paymentDays: number;
  invoiceTrigger: "After census date" | "After tuition is paid" | "After enrolment confirmed";
  startDate: string;
  endDate: string;
  contact: string;
  contactEmail: string;
  notes: string;
}

// UK providers that recruit home students on Student Finance usually pay a flat fee.
const flatFee: Record<string, number> = {
  "UK Management College": 1800,
  "London School of Commerce": 2000,
  "University of the West of Scotland (London)": 1500,
  "London College of Contemporary Arts": 1700,
  "Anglia Ruskin University London": 2200,
  "Regent College London": 1900,
  "Oxford Business College": 2100,
};

function seedAgreements(): UniversityAgreement[] {
  const unis = [...new Set(getApplications().map((a) => a.university))].sort();
  return unis.map((u, i) => {
    const country = findUniversity(u)?.country ?? "United Kingdom";
    const flat = flatFee[u];
    const domain = u.toLowerCase().replace(/\(.*?\)/g, "").replace(/university of |university|college|the /g, "").trim().split(/\s+/)[0] || "uni";
    const end = i % 7 === 3 ? "2026-10-31" : i % 11 === 5 ? "2026-06-30" : `202${7 + (i % 2)}-08-31`;
    return {
      id: `AGR-${String(i + 1).padStart(2, "0")}`,
      university: u,
      country,
      currency: currencyFor(country),
      basis: flat ? "Flat fee per student" : "Percent of first-year tuition",
      rate: flat ?? [15, 18, 12, 16, 20, 14, 17][i % 7],
      bonusRate: flat ? 0 : i % 3 === 0 ? 2 : 0,
      bonusThreshold: i % 3 === 0 ? 25 : 0,
      paymentDays: [30, 45, 60, 30, 90][i % 5],
      invoiceTrigger: flat ? "After enrolment confirmed" : i % 4 === 0 ? "After tuition is paid" : "After census date",
      startDate: `202${3 + (i % 3)}-09-01`,
      endDate: end,
      contact: ["International Partnerships", "Agent Relations Team", "Recruitment Office"][i % 3],
      contactEmail: `partners@${domain}.ac.uk`,
      notes: "",
    };
  });
}

export function agreementStatus(a: UniversityAgreement): AgreementStatus {
  const left = daysBetween(financeToday, a.endDate);
  return left < 0 ? "Expired" : left <= 60 ? "Expiring" : "Active";
}

// --- Commission claims (money in) -----------------------------------------------------

export type ClaimStatus = "Awaiting census" | "Ready to invoice" | "Invoiced" | "Part paid" | "Paid" | "Disputed" | "Written off";
export type ClaimType = "Student commission" | "Volume bonus" | "Adjustment";
export type PayoutStatus = "Not applicable" | "Awaiting university" | "Due" | "On hold" | "Paid";
export type CounsellorPayStatus = "Pending" | "Approved" | "Paid";

export interface Payment {
  date: string;
  amount: number;
  reference: string;
}

export interface Claim {
  id: string;
  type: ClaimType;
  applicationId?: string;
  student: string;
  university: string;
  course: string;
  intake: string;
  country: string;
  currency: Currency;
  channel: "Direct" | "Agent" | "Affiliate";
  agent?: string;
  counsellor: string;
  branch: string;
  tuition: number;
  /** % or flat amount used, for the record. */
  rateLabel: string;
  amount: number;
  status: ClaimStatus;
  censusDate: string;
  invoiceNo?: string;
  invoiceDate?: string;
  dueDate?: string;
  payments: Payment[];
  disputeReason?: string;
  // What BHE owes the referring agent out of this commission.
  agentShare: number;
  agentAmount: number;
  payoutStatus: PayoutStatus;
  payoutDate?: string;
  payoutRef?: string;
  // Counsellor commission earned on this enrolment (GBP).
  counsellorAmount: number;
  counsellorStatus: CounsellorPayStatus;
  payrollMonth?: string;
  notes: string;
  createdAt: string;
  createdBy: string;
}

export const paid = (c: Claim) => c.payments.reduce((n, p) => n + p.amount, 0);
export const outstanding = (c: Claim) => (c.status === "Written off" || c.status === "Awaiting census" || c.status === "Ready to invoice" ? 0 : Math.max(0, c.amount - paid(c)));
export const isOverdue = (c: Claim) => !!c.dueDate && (c.status === "Invoiced" || c.status === "Part paid") && c.dueDate < financeToday;

/** Deterministic 0–1 value from a string, so seeded data is stable. */
function rand(seed: string, salt = 0) {
  let h = 2166136261 ^ salt;
  for (let i = 0; i < seed.length; i++) h = Math.imul(h ^ seed.charCodeAt(i), 16777619);
  return ((h >>> 0) % 10000) / 10000;
}

function tuitionFor(a: ApplicationRow, currency: Currency) {
  const course = getCourses().find((c) => c.institution === a.university && c.name === a.course);
  const home = a.funding === "SFE applied" || a.funding === "SFE approved";
  if (course) {
    const fee = home ? course.homeFee || course.intlFee : course.intlFee || course.homeFee;
    if (fee) return fee;
  }
  const base = home ? 9535 : a.level === "Postgraduate" ? 17000 : a.level === "Foundation" ? 9250 : 15500;
  return Math.round((base / toGbpRate[currency]) / 50) * 50;
}

export function commissionFor(agr: UniversityAgreement | undefined, tuition: number) {
  if (!agr) return { amount: Math.round(tuition * 0.15), label: "15% (no agreement)" };
  if (agr.basis === "Flat fee per student") return { amount: agr.rate, label: `Flat ${money(agr.rate, agr.currency)}` };
  return { amount: Math.round((tuition * agr.rate) / 100), label: `${agr.rate}% of ${money(tuition, agr.currency)}` };
}

// Counsellor commission plan (GBP per enrolment, paid once the university pays).
export interface CounsellorPlan {
  direct: number;
  agent: number;
  affiliate: number;
  /** Bonus when a counsellor's enrolments in a payroll month reach their monthly target. */
  targetBonus: number;
  payrollDay: number;
}
let plan: CounsellorPlan = { direct: 150, agent: 50, affiliate: 100, targetBonus: 250, payrollDay: 25 };
export function getPlan() {
  return plan;
}
export function savePlan(next: CounsellorPlan) {
  plan = next;
}
export const planAmount = (channel: Claim["channel"], p = plan) => (channel === "Direct" ? p.direct : channel === "Agent" ? p.agent : p.affiliate);

function payrollFor(paidDate: string) {
  const d = new Date(`${paidDate}T00:00:00Z`);
  d.setUTCMonth(d.getUTCMonth() + 1);
  return iso(d.getTime()).slice(0, 7);
}
export function payrollDate(month: string) {
  return `${month}-${String(plan.payrollDay).padStart(2, "0")}`;
}

function seedClaims(agreements: UniversityAgreement[]): Claim[] {
  const agents = getAgents();
  const enrolled = getApplications().filter((a) => a.stage === "Enrolled");
  let inv = 4200;
  return enrolled
    .sort((x, y) => x.createdAt.localeCompare(y.createdAt))
    .map((a, i) => {
      const agr = agreements.find((g) => g.university === a.university);
      const currency = agr?.currency ?? currencyFor(a.country);
      const tuition = tuitionFor(a, currency);
      const { amount, label } = commissionFor(agr, tuition);
      const census = intakeWindow(a.intake).end;
      const sinceCensus = daysBetween(census);
      const r = rand(a.id);
      const terms = agr?.paymentDays ?? 45;

      let status: ClaimStatus = "Awaiting census";
      let invoiceDate: string | undefined;
      let dueDate: string | undefined;
      const payments: Payment[] = [];
      let disputeReason: string | undefined;

      if (sinceCensus >= 0) {
        status = "Ready to invoice";
        // A few recent enrolments are still waiting for someone to raise the invoice.
        const backlog = sinceCensus <= 120 && r > 0.86;
        if (!backlog && (sinceCensus > 10 || r < 0.5)) {
          invoiceDate = iso(Date.parse(census) + Math.min(sinceCensus, 3 + Math.round(r * 10)) * DAY);
          dueDate = iso(Date.parse(invoiceDate) + terms * DAY);
          status = "Invoiced";
          const dueIn = daysBetween(financeToday, dueDate);
          if (dueIn < 0 || (dueIn < terms / 2 && r < 0.3)) {
            if (r < 0.86) {
              payments.push({ date: iso(Math.min(todayMs, Date.parse(dueDate) - Math.round(r * 12) * DAY)), amount, reference: `BACS ${a.university.split(" ")[0].toUpperCase()}-${Math.round(r * 90000)}` });
              status = "Paid";
            } else if (r < 0.9) {
              payments.push({ date: iso(Date.parse(dueDate) - 5 * DAY), amount: Math.round(amount / 2), reference: `BACS part ${Math.round(r * 9000)}` });
              status = "Part paid";
            } else if (r < 0.93) {
              status = "Disputed";
              disputeReason = r < 0.915 ? "University says the student withdrew before census" : "Tuition fee on invoice doesn't match the university's records";
            }
          }
        }
      }

      const agentRow = a.channel === "Agent" && a.partner ? agents.find((g) => g.name === a.partner) : undefined;
      const agentShare = a.channel === "Agent" ? (agentRow?.commissionShare ?? 50) : 0;
      const agentAmount = Math.round((amount * agentShare) / 100);
      const paidDate = payments[0]?.date;
      let payoutStatus: PayoutStatus = a.channel === "Agent" ? "Awaiting university" : "Not applicable";
      let payoutDate: string | undefined;
      if (a.channel === "Agent" && status === "Paid" && paidDate) {
        if (daysBetween(paidDate) > 45) {
          payoutStatus = "Paid";
          payoutDate = iso(Date.parse(paidDate) + 14 * DAY);
        } else payoutStatus = r > 0.95 ? "On hold" : "Due";
      }

      const counsellorAmount = planAmount(a.channel);
      let counsellorStatus: CounsellorPayStatus = "Pending";
      let payrollMonth: string | undefined;
      if (status === "Paid" && paidDate) {
        payrollMonth = payrollFor(paidDate);
        counsellorStatus = payrollDate(payrollMonth) < financeToday ? "Paid" : "Approved";
      }

      return {
        id: `CLM-${String(1001 + i)}`,
        type: "Student commission",
        applicationId: a.id,
        student: a.applicant,
        university: a.university,
        course: a.course,
        intake: a.intake,
        country: a.country,
        currency,
        channel: a.channel,
        agent: a.channel === "Agent" ? a.partner : undefined,
        counsellor: a.counsellor,
        branch: a.branch,
        tuition,
        rateLabel: label,
        amount,
        status,
        censusDate: census,
        invoiceNo: invoiceDate ? `BHE-INV-${inv++}` : undefined,
        invoiceDate,
        dueDate,
        payments,
        disputeReason,
        agentShare,
        agentAmount,
        payoutStatus,
        payoutDate,
        payoutRef: payoutDate ? `AGT-PAY-${Math.round(r * 90000)}` : undefined,
        counsellorAmount,
        counsellorStatus,
        payrollMonth,
        notes: "",
        createdAt: census,
        createdBy: "System",
      } satisfies Claim;
    });
}

// --- Store ------------------------------------------------------------------------------

let agreements: UniversityAgreement[] | null = null;
let claims: Claim[] | null = null;

export function getAgreements() {
  return (agreements ??= seedAgreements());
}
export function saveAgreements(next: UniversityAgreement[]) {
  agreements = next;
}
export function getClaims() {
  return (claims ??= seedClaims(getAgreements()));
}
export function saveClaims(next: Claim[]) {
  claims = next;
}
export function nextClaimId() {
  return `CLM-${Math.max(1000, ...getClaims().map((c) => Number(c.id.slice(4)) || 0)) + 1}`;
}
export function nextInvoiceNo(list = getClaims()) {
  const max = Math.max(4199, ...list.map((c) => Number(c.invoiceNo?.split("-").pop()) || 0));
  return `BHE-INV-${max + 1}`;
}

let lastChange: { id: string; text: string } | null = null;
export function markFinanceChange(id: string, text: string) {
  lastChange = { id, text };
}
export function getFinanceChange() {
  return lastChange;
}
export function clearFinanceChange() {
  lastChange = null;
}

/** Apply an invoice to a claim that's ready: number, date and due date from its agreement's terms. */
export function invoice(c: Claim, no: string, date = financeToday): Claim {
  const terms = getAgreements().find((a) => a.university === c.university)?.paymentDays ?? 45;
  return { ...c, status: "Invoiced", invoiceNo: no, invoiceDate: date, dueDate: iso(Date.parse(date) + terms * DAY) };
}

/** Record money received; moves agent payouts and counsellor commission along with it. */
export function recordPayment(c: Claim, pay: Payment): Claim {
  const payments = [...c.payments, pay];
  const total = payments.reduce((n, p) => n + p.amount, 0);
  const fully = total >= c.amount;
  return {
    ...c,
    payments,
    status: fully ? "Paid" : "Part paid",
    disputeReason: undefined,
    payoutStatus: fully && c.channel === "Agent" && c.payoutStatus === "Awaiting university" ? "Due" : c.payoutStatus,
    counsellorStatus: fully && c.counsellorStatus === "Pending" ? "Approved" : c.counsellorStatus,
    payrollMonth: fully && !c.payrollMonth ? payrollFor(pay.date) : c.payrollMonth,
  };
}

/** Enrolled applications that don't have a commission claim yet (for Add New Commission). */
export function unclaimedEnrolments() {
  const claimed = new Set(getClaims().map((c) => c.applicationId).filter(Boolean));
  return getApplications().filter((a) => a.stage === "Enrolled" && !claimed.has(a.id));
}

export function applicationForClaim(id: string) {
  return getApplications().find((a) => a.id === id);
}

export { tuitionFor, currencyFor };

/** Staff monthly targets, for the counsellor target bonus. */
export function monthlyTargetOf(name: string) {
  return getStaff().find((s) => s.name === name)?.monthlyTarget ?? 0;
}

/** Last 12 months, oldest first, as YYYY-MM. */
export function last12Months() {
  const out: string[] = [];
  const d = new Date(`${financeToday.slice(0, 7)}-01T00:00:00Z`);
  for (let i = 11; i >= 0; i--) {
    const x = new Date(d);
    x.setUTCMonth(d.getUTCMonth() - i);
    out.push(iso(x.getTime()).slice(0, 7));
  }
  return out;
}
export const monthLabel = (ym: string) => new Date(`${ym}-01T00:00:00Z`).toLocaleDateString("en-GB", { month: "short", year: "2-digit", timeZone: "UTC" });
