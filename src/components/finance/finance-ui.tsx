"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { Ban, Banknote, CheckCircle2, CircleAlert, CircleDashed, Clock3, FileText, Hourglass, Printer, Receipt, Send, XCircle } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { Modal } from "@/components/ui/modal";
import { Field, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { formatDay } from "@/components/people/people-ui";
import {
  daysBetween,
  financeToday,
  getAgreements,
  isOverdue,
  money,
  outstanding,
  paid,
  type Claim,
  type ClaimStatus,
  type CounsellorPayStatus,
  type Payment,
  type PayoutStatus,
} from "@/lib/mock/finance";
import { cn } from "@/lib/utils";

const claimStyle: Record<ClaimStatus | "Overdue", { cls: string; icon: typeof CheckCircle2 }> = {
  "Awaiting census": { cls: "bg-surface-hover text-muted-foreground", icon: CircleDashed },
  "Ready to invoice": { cls: "bg-violet-500/10 text-violet-600 dark:text-violet-400", icon: FileText },
  Invoiced: { cls: "bg-primary-soft text-primary", icon: Send },
  Overdue: { cls: "bg-danger-soft text-danger", icon: Clock3 },
  "Part paid": { cls: "bg-warning-soft text-warning", icon: Hourglass },
  Paid: { cls: "bg-success-soft text-success", icon: CheckCircle2 },
  Disputed: { cls: "bg-danger-soft text-danger", icon: CircleAlert },
  "Written off": { cls: "bg-surface-hover text-muted-foreground line-through", icon: XCircle },
};

/** Claim status, with "Overdue" shown for invoices past their due date. */
export function ClaimStatusBadge({ claim }: { claim: Claim }) {
  const key = isOverdue(claim) ? "Overdue" : claim.status;
  const { cls, icon: Icon } = claimStyle[key];
  return (
    <span className={cn("inline-flex items-center gap-1 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", cls)}>
      <Icon className="size-3" />
      {key}
    </span>
  );
}

const payoutStyle: Record<PayoutStatus, string> = {
  "Not applicable": "bg-surface-hover text-muted-foreground",
  "Awaiting university": "bg-surface-hover text-muted-foreground",
  Due: "bg-warning-soft text-warning",
  "On hold": "bg-danger-soft text-danger",
  Paid: "bg-success-soft text-success",
};
export function PayoutBadge({ status }: { status: PayoutStatus }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", payoutStyle[status])}>{status === "Awaiting university" ? "Awaiting uni" : status}</span>;
}

const payStyle: Record<CounsellorPayStatus, string> = { Pending: "bg-surface-hover text-muted-foreground", Approved: "bg-primary-soft text-primary", Paid: "bg-success-soft text-success" };
export function CounsellorPayBadge({ status }: { status: CounsellorPayStatus }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", payStyle[status])}>{status}</span>;
}

export function ClaimDetail({
  claim: c,
  onClose,
  onInvoice,
  onPay,
  onDispute,
  onResolve,
  onWriteOff,
}: {
  claim: Claim;
  onClose: () => void;
  onInvoice: () => void;
  onPay: () => void;
  onDispute: () => void;
  onResolve: () => void;
  onWriteOff: () => void;
}) {
  const due = outstanding(c);
  const overdueDays = isOverdue(c) && c.dueDate ? daysBetween(c.dueDate) : 0;
  const canPay = c.status === "Invoiced" || c.status === "Part paid" || c.status === "Disputed";
  return (
    <SlideOver
      open
      onClose={onClose}
      icon={Receipt}
      title={`${c.student}`}
      subtitle={`${c.id}${c.invoiceNo ? ` · ${c.invoiceNo}` : ""} · ${c.type}`}
      footer={
        <div className="flex flex-wrap gap-2">
          {c.status === "Ready to invoice" && <button type="button" onClick={onInvoice} className={cn(buttonPrimary, "flex-1")}><Send className="size-4" /> Raise invoice</button>}
          {canPay && <button type="button" onClick={onPay} className={cn(buttonPrimary, "flex-1")}><Banknote className="size-4" /> Record payment</button>}
          {c.invoiceNo && <button type="button" onClick={() => printInvoice(c)} className={buttonSecondary}><Printer className="size-4" /> Invoice</button>}
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <ClaimStatusBadge claim={c} />
          {overdueDays > 0 && <span className="text-xs font-semibold text-danger">{overdueDays} days overdue</span>}
          <span className="ml-auto flex gap-1.5">
            {(c.status === "Invoiced" || c.status === "Part paid") && <button type="button" onClick={onDispute} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><CircleAlert className="size-3.5" /> Dispute</button>}
            {c.status === "Disputed" && <button type="button" onClick={onResolve} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><CheckCircle2 className="size-3.5" /> Resolved</button>}
            {c.status !== "Paid" && c.status !== "Written off" && <button type="button" onClick={onWriteOff} className="inline-flex h-8 items-center gap-1 rounded-full border border-danger/30 px-3 text-xs font-semibold text-danger hover:bg-danger-soft"><Ban className="size-3.5" /> Write off</button>}
          </span>
        </div>

        {c.disputeReason && <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs text-foreground">Disputed: {c.disputeReason}</p>}

        <div className="grid grid-cols-3 gap-2">
          {[
            ["Commission", money(c.amount, c.currency)],
            ["Received", money(paid(c), c.currency)],
            ["Outstanding", money(due, c.currency)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-surface-muted px-3 py-2.5">
              <p className="text-base font-bold tabular-nums text-foreground">{v}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>

        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-xs">
          <Row label="University">{c.university} · {c.country}</Row>
          <Row label="Course">{c.course}</Row>
          <Row label="Intake">{c.intake} · census {formatDay(c.censusDate)}</Row>
          <Row label="Calculation">{c.rateLabel}</Row>
          <Row label="Source">{c.channel}{c.agent ? ` · ${c.agent}` : ""}</Row>
          <Row label="Counsellor">{c.counsellor} · {c.branch}</Row>
          {c.invoiceDate && <Row label="Invoiced">{formatDay(c.invoiceDate)} · due {formatDay(c.dueDate!)}</Row>}
          {c.applicationId && <Row label="Application"><Link href={`/applications/${c.applicationId}`} className="text-primary hover:underline">{c.applicationId}</Link></Row>}
          {c.notes && <Row label="Notes">{c.notes}</Row>}
        </dl>

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">Payments received</p>
          {c.payments.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {c.payments.map((p, i) => (
                <li key={i} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                  <span><span className="text-foreground">{formatDay(p.date)}</span> <span className="text-muted-foreground">· {p.reference}</span></span>
                  <span className="font-semibold tabular-nums text-foreground">{money(p.amount, c.currency)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">{c.status === "Awaiting census" ? "Can be invoiced once the census date has passed." : "Nothing received yet."}</p>
          )}
        </div>

        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <div className="rounded-2xl border border-border p-3.5">
            <p className="text-[11px] text-muted-foreground">Agent payout</p>
            {c.channel === "Agent" ? (
              <>
                <p className="mt-0.5 text-sm font-semibold text-foreground">{money(c.agentAmount, c.currency)} <span className="text-xs font-normal text-muted-foreground">({c.agentShare}%)</span></p>
                <div className="mt-1 flex items-center gap-2"><PayoutBadge status={c.payoutStatus} />{c.payoutDate && <span className="text-[11px] text-muted-foreground">{formatDay(c.payoutDate)}</span>}</div>
              </>
            ) : (
              <p className="mt-0.5 text-xs text-muted-foreground">Direct student — no agent to pay.</p>
            )}
          </div>
          <div className="rounded-2xl border border-border p-3.5">
            <p className="text-[11px] text-muted-foreground">Counsellor commission</p>
            <p className="mt-0.5 text-sm font-semibold text-foreground">{money(c.counsellorAmount)} <span className="text-xs font-normal text-muted-foreground">to {c.counsellor}</span></p>
            <div className="mt-1 flex items-center gap-2"><CounsellorPayBadge status={c.counsellorStatus} />{c.payrollMonth && <span className="text-[11px] text-muted-foreground">payroll {c.payrollMonth}</span>}</div>
          </div>
        </div>
      </div>
    </SlideOver>
  );
}

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <>
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="text-foreground">{children}</dd>
    </>
  );
}

export function PaymentDialog({ claims, onClose, onSave }: { claims: Claim[]; onClose: () => void; onSave: (pay: Omit<Payment, "amount"> & { amount?: number }) => void }) {
  const single = claims.length === 1 ? claims[0] : undefined;
  const [amount, setAmount] = useState(single ? String(outstanding(single)) : "");
  const [date, setDate] = useState(financeToday);
  const [reference, setReference] = useState("");
  const n = Number(amount);
  const valid = !!date && reference.trim().length >= 3 && (!single || (n > 0 && n <= outstanding(single)));
  return (
    <Modal
      open
      onClose={onClose}
      icon={Banknote}
      size="sm"
      title={single ? `Record payment · ${single.student}` : `Record payment for ${claims.length} invoices`}
      subtitle={single ? `${single.invoiceNo} · ${money(outstanding(single), single.currency)} outstanding` : "Each invoice is marked paid in full."}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={!valid} onClick={() => onSave({ amount: single ? n : undefined, date, reference: reference.trim() })} className={buttonPrimary}>Record payment</button></div>}
    >
      <div className="flex flex-col gap-4">
        {single && (
          <Field label={`Amount received (${single.currency})`} hint={n > 0 && n < outstanding(single) ? "Less than outstanding — the invoice stays part paid." : undefined}>
            <TextInput inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 7))} />
          </Field>
        )}
        <Field label="Date received">
          <TextInput type="date" max={financeToday} value={date} onChange={(e) => setDate(e.target.value)} />
        </Field>
        <Field label="Bank reference" hint="As it appears on the bank statement.">
          <TextInput value={reference} onChange={(e) => setReference(e.target.value)} placeholder="e.g. BACS COVENTRY-48213" />
        </Field>
      </div>
    </Modal>
  );
}

export function ReasonDialog({ title, subtitle, label, placeholder, confirm, danger, onClose, onSave }: { title: string; subtitle: string; label: string; placeholder: string; confirm: string; danger?: boolean; onClose: () => void; onSave: (reason: string) => void }) {
  const [reason, setReason] = useState("");
  return (
    <Modal open onClose={onClose} icon={danger ? Ban : CircleAlert} size="sm" title={title} subtitle={subtitle}
      footer={<div className="flex justify-end gap-2"><button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button><button type="button" disabled={reason.trim().length < 5} onClick={() => onSave(reason.trim())} className={danger ? buttonDanger : buttonPrimary}>{confirm}</button></div>}
    >
      <Field label={label}>
        <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder={placeholder} />
      </Field>
    </Modal>
  );
}

/** Opens a printable invoice in a new tab. */
export function printInvoice(c: Claim) {
  const agr = getAgreements().find((a) => a.university === c.university);
  const w = window.open("", "_blank", "width=820,height=1000");
  if (!w) return;
  const esc = (s: string) => s.replace(/[&<>"]/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[ch]!);
  w.document.write(`<!doctype html><html><head><meta charset="utf-8"><title>${esc(c.invoiceNo ?? c.id)}</title>
<style>body{font-family:Helvetica,Arial,sans-serif;color:#1f2937;margin:48px;font-size:13px}h1{font-size:22px;margin:0}table{width:100%;border-collapse:collapse;margin-top:24px}th,td{text-align:left;padding:10px;border-bottom:1px solid #e5e7eb}th{background:#f3f6fb;font-size:12px}.r{text-align:right}.muted{color:#6b7280}.top{display:flex;justify-content:space-between}.brand{color:#3b5bdb;font-weight:800;font-size:16px}.total td{font-weight:700;font-size:15px}</style></head><body>
<div class="top"><div><div class="brand">BHE Student Consultancy Ltd</div><div class="muted">compliance@bhe-consultancy.co.uk</div></div><div class="r"><h1>Commission invoice</h1><div>${esc(c.invoiceNo ?? "")}</div><div class="muted">Issued ${esc(c.invoiceDate ?? "")} · Due ${esc(c.dueDate ?? "")}</div></div></div>
<p style="margin-top:28px"><strong>Bill to</strong><br>${esc(c.university)}<br><span class="muted">${esc(agr?.contact ?? "International Office")} · ${esc(agr?.contactEmail ?? "")}</span></p>
<table><thead><tr><th>Student</th><th>Course</th><th>Intake</th><th>Calculation</th><th class="r">Amount (${c.currency})</th></tr></thead>
<tbody><tr><td>${esc(c.student)}</td><td>${esc(c.course)}</td><td>${esc(c.intake)}</td><td>${esc(c.rateLabel)}</td><td class="r">${c.amount.toLocaleString()}</td></tr>
<tr class="total"><td colspan="4" class="r">Total due</td><td class="r">${c.amount.toLocaleString()}</td></tr></tbody></table>
<p class="muted" style="margin-top:28px">Payment terms: ${agr?.paymentDays ?? 45} days. Please quote ${esc(c.invoiceNo ?? "")} with your payment.</p>
<script>window.onload=()=>window.print()</script></body></html>`);
  w.document.close();
}
