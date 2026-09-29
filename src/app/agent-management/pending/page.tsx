"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  Archive,
  Ban,
  Check,
  CircleAlert,
  ClipboardCheck,
  Clock3,
  FileWarning,
  Hourglass,
  Mail,
  Plus,
  RotateCcw,
  SearchX,
  Send,
  ShieldCheck,
  X,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { SlideOver } from "@/components/ui/slide-over";
import { Modal } from "@/components/ui/modal";
import { Field, PillGroup, TextInput, Textarea } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { formatDay, Meter } from "@/components/people/people-ui";
import { DocStatusBadge, TierBadge } from "@/components/agents/agent-ui";
import { AgentDialogs, AgentRowMenu, AgentTopActions, type AgentDialog } from "@/components/agents/agent-actions";
import {
  agentSources,
  agentTiers,
  clearAgentChange,
  daysBetween,
  docProgress,
  getAgentChange,
  getAgents,
  relationshipManagers,
  requiredDocs,
  saveAgents,
  tierShare,
  today,
  type Agent,
  type AgentTier,
  type DocKey,
} from "@/lib/mock/agents";
import { useRowSelection } from "@/lib/use-row-selection";
import { ArchiveDialog } from "@/components/archive/archive-ui";
import { agentApplicationArchive } from "@/lib/mock/archive";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const reviewer = "Sadman Rahman";
const stamp = () => `${today}T${new Date().toISOString().slice(11, 19)}Z`;
const log = (a: Agent, text: string): Agent => ({ ...a, activity: [{ at: stamp(), text, by: reviewer }, ...a.activity] });
const ready = (a: Agent) => docProgress(a).verified === requiredDocs.length;
const toReview = (a: Agent) => requiredDocs.some((d) => a.docs[d.key].status === "Uploaded");
const missing = (a: Agent) => requiredDocs.some((d) => a.docs[d.key].status === "Missing" || a.docs[d.key].status === "Rejected");

export default function PendingAgentsPage() {
  const [all, setAll] = useState<Agent[]>(getAgents);
  const [tab, setTab] = useState<"Pending" | "Rejected">("Pending");
  const [search, setSearch] = useState("");
  const [manager, setManager] = useState("");
  const [source, setSource] = useState("");
  const [readiness, setReadiness] = useState("");
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ kind: AgentDialog; id: string } | null>(null);
  const [lastChange] = useState(getAgentChange);
  const [archiving, setArchiving] = useState<Agent[] | null>(null);
  const [toast, notify] = useToast();

  useEffect(() => saveAgents(all), [all]);
  useEffect(() => {
    if (!lastChange) return;
    clearAgentChange();
    const who = getAgents().find((a) => a.id === lastChange.id)?.name ?? "Agent";
    notify(lastChange.verb === "submitted" ? `${who} added to the review queue` : `${who} saved`);
  }, [lastChange, notify]);

  const pending = all.filter((a) => a.status === "Pending");
  const rejected = all.filter((a) => a.status === "Rejected");
  const avgWait = pending.length ? Math.round(pending.reduce((n, a) => n + daysBetween(a.appliedAt), 0) / pending.length) : 0;

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return all
      .filter(
        (a) =>
          a.status === tab &&
          (!manager || a.manager === manager) &&
          (!source || a.source === source) &&
          (!readiness || (readiness === "ready" ? ready(a) : readiness === "review" ? toReview(a) : missing(a))) &&
          (!q || `${a.name} ${a.contactName} ${a.email} ${a.city} ${a.country} ${a.id}`.toLowerCase().includes(q))
      )
      .sort((a, b) => a.appliedAt.localeCompare(b.appliedAt));
  }, [all, tab, search, manager, source, readiness]);

  const selection = useRowSelection(filtered.map((a) => a.id));
  const selected = filtered.filter((a) => selection.isSelected(a.id));
  const hasFilters = !!(search || manager || source || readiness);

  const patch = (id: string, fn: (a: Agent) => Agent) => setAll((prev) => prev.map((a) => (a.id === id ? fn(a) : a)));

  const remind = (rows: Agent[]) => {
    const need = rows.filter(missing);
    if (!need.length) return notify("Everyone selected has uploaded all their documents", "error");
    setAll((prev) => prev.map((a) => (need.some((n) => n.id === a.id) ? log(a, "Reminder sent for missing documents") : a)));
    notify(need.length === 1 ? `Reminder emailed to ${need[0].email}` : `Reminders emailed to ${need.length} agents`);
  };

  const exportRows = (rows: Agent[]) =>
    downloadCsv(
      tab === "Pending" ? "pending-agents.csv" : "rejected-agents.csv",
      rows.map((a) => {
        const p = docProgress(a);
        return {
          id: a.id,
          agent: a.name,
          type: a.type,
          contact: a.contactName,
          email: a.email,
          phone: a.phone,
          city: a.city,
          country: a.country,
          expectedStudents: a.expectedStudents,
          source: a.source,
          manager: a.manager,
          applied: a.appliedAt,
          daysWaiting: daysBetween(a.appliedAt),
          documentsVerified: `${p.verified}/${p.total}`,
          rejectionReason: a.rejectionReason ?? "",
        };
      })
    );

  const reviewing = all.find((a) => a.id === reviewingId);
  const dialogAgent = all.find((a) => a.id === dialog?.id);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Pending Agents</h2>
          <p className="mt-1 text-sm text-muted-foreground">New agent applications waiting for KYC checks. Verify each document, then approve with commission terms.</p>
        </div>
        <Link href="/agent-management/new" className={buttonPrimary}>
          <Plus className="size-4" /> Add agent
        </Link>
      </header>

      <StatGrid>
        <StatCard icon={Hourglass} label="Awaiting review" value={pending.length} onClick={() => { setTab("Pending"); setReadiness(""); }} />
        <StatCard icon={ShieldCheck} tone="success" label="Ready to approve" value={pending.filter(ready).length} onClick={() => { setTab("Pending"); setReadiness("ready"); }} />
        <StatCard icon={FileWarning} tone={pending.some(missing) ? "warning" : "success"} label="Missing documents" value={pending.filter(missing).length} onClick={() => { setTab("Pending"); setReadiness("missing"); }} />
        <StatCard icon={Clock3} tone={avgWait > 10 ? "danger" : "primary"} label="Average wait" value={`${avgWait} days`} note="target 7" />
      </StatGrid>

      <div role="tablist" aria-label="Queue" className="inline-flex w-fit gap-0.5 self-start rounded-full border border-border bg-surface-muted p-0.5">
        {(["Pending", "Rejected"] as const).map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => { setTab(t); setReadiness(""); selection.clear(); }}
            className={cn("inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors", tab === t ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
          >
            <span className={cn("size-1.5 rounded-full", t === "Pending" ? "bg-primary" : "bg-danger")} />
            {t === "Pending" ? "In review" : "Rejected"}
            <span className="rounded-full bg-surface-hover px-1.5 text-[10px] tabular-nums">{t === "Pending" ? pending.length : rejected.length}</span>
          </button>
        ))}
      </div>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Agency, contact, email, city…" label="Search pending agents" />
        {tab === "Pending" && (
          <SelectFilter
            label="Documents"
            value={readiness}
            onChange={setReadiness}
            allLabel="Any stage"
            options={[
              { value: "ready", label: "Ready to approve", dot: "bg-success" },
              { value: "review", label: "Documents to review", dot: "bg-primary" },
              { value: "missing", label: "Missing or rejected", dot: "bg-warning" },
            ]}
          />
        )}
        <SelectFilter label="Manager" value={manager} onChange={setManager} allLabel="All managers" options={relationshipManagers} />
        <SelectFilter label="Source" value={source} onChange={setSource} allLabel="All sources" options={agentSources} />
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setManager(""); setSource(""); setReadiness(""); }} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{tab === "Pending" ? "Review queue" : "Rejected applications"}</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} agent{filtered.length === 1 ? "" : "s"} · oldest first</p>
        </div>
        <SelectionBar selection={selection} noun={["agent", "agents"]} onExport={() => exportRows(selected)} className="mx-5 mt-3">
          {tab === "Pending" && <BarButton onClick={() => { remind(selected); selection.clear(); }}><Send className="size-3.5" /> Remind about documents</BarButton>}
          <BarButton onClick={() => setArchiving(selected)}><Archive className="size-3.5" /> Archive</BarButton>
        </SelectionBar>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[980px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} /></th>
                <th className="py-2.5 pl-3 pr-3">Applicant</th>
                <th className="px-3 py-2.5">Recruits from</th>
                <th className="px-3 py-2.5">Source & manager</th>
                <th className="px-3 py-2.5">{tab === "Pending" ? "KYC documents" : "Reason"}</th>
                <th className="px-3 py-2.5">Applied</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const p = docProgress(a);
                const wait = daysBetween(a.appliedAt);
                return (
                  <tr key={a.id} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, a.id))}>
                    <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={a.id} label={`Select ${a.name}`} /></td>
                    <td className="py-3 pl-3 pr-3">
                      <button type="button" onClick={() => setReviewingId(a.id)} className="text-left">
                        <span className="block text-sm font-semibold text-foreground hover:text-primary">{a.name}</span>
                        <span className="block text-[11px] text-muted-foreground">{a.contactName} · {a.email}</span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-foreground">{a.markets.join(", ")}</p>
                      <p className="text-[11px] text-muted-foreground">{a.type === "Individual" ? "Individual" : "Company"} · ~{a.expectedStudents} students/yr</p>
                    </td>
                    <td className="px-3 py-3">
                      <p className="text-foreground">{a.source}</p>
                      <p className="text-[11px] text-muted-foreground">{a.manager}</p>
                    </td>
                    <td className="w-52 px-3 py-3">
                      {tab === "Pending" ? (
                        <>
                          <p className="mb-1 flex justify-between text-[11px]">
                            <span className="font-semibold tabular-nums text-foreground">{p.verified} / {p.total} verified</span>
                            {p.rejected > 0 ? (
                              <span className="font-semibold text-danger">{p.rejected} rejected</span>
                            ) : p.uploaded > p.verified ? (
                              <span className="font-semibold text-primary">{p.uploaded - p.verified} to check</span>
                            ) : p.uploaded < p.total ? (
                              <span className="text-warning">{p.total - p.uploaded} missing</span>
                            ) : null}
                          </p>
                          <Meter value={p.verified} max={p.total} tone={p.verified === p.total ? "success" : "primary"} />
                        </>
                      ) : (
                        <p className="line-clamp-2 text-[11px] text-muted-foreground" title={a.rejectionReason}>{a.rejectionReason || "No reason recorded"}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-3 py-3">
                      <p className="text-foreground">{formatDay(a.appliedAt)}</p>
                      {tab === "Pending" && <p className={cn("text-[11px]", wait > 14 ? "font-semibold text-danger" : wait > 7 ? "text-warning" : "text-muted-foreground")}>{wait === 0 ? "Today" : `${wait} days waiting`}</p>}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        {tab === "Pending" ? (
                          <button type="button" onClick={() => setReviewingId(a.id)} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full px-3.5 text-xs font-semibold transition-colors", ready(a) ? "bg-success text-white hover:bg-success/90" : "border border-border bg-surface text-foreground hover:bg-surface-hover")}>
                            {ready(a) ? <><ShieldCheck className="size-3.5" /> Approve</> : <><ClipboardCheck className="size-3.5" /> Review</>}
                          </button>
                        ) : (
                          <button
                            type="button"
                            onClick={() => {
                              patch(a.id, (x) => log({ ...x, status: "Pending", rejectionReason: undefined }, "Application reopened for review"));
                              notify(`${a.name} moved back to review`);
                            }}
                            className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-semibold text-foreground hover:bg-surface-hover"
                          >
                            <RotateCcw className="size-3.5" /> Reopen
                          </button>
                        )}
                        {tab === "Rejected" && (
                          <button type="button" onClick={() => setArchiving([a])} aria-label={`Archive ${a.name}`} title="Archive" className="flex size-8 items-center justify-center rounded-full border border-border bg-surface text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                            <Archive className="size-3.5" />
                          </button>
                        )}
                        <AgentRowMenu agent={a} onAction={(kind) => setDialog({ kind, id: a.id })} />
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground">{tab === "Pending" && !hasFilters ? <Check className="size-5" /> : <SearchX className="size-5" />}</span>
              <p className="text-sm font-medium text-foreground">{tab === "Pending" && !hasFilters ? "Queue is clear" : "Nothing matches"}</p>
              <p className="text-xs text-muted-foreground">{tab === "Pending" && !hasFilters ? "Every agent application has been reviewed." : "Try another filter or search."}</p>
            </div>
          )}
        </div>
      </Card>

      {reviewing && (
        <ReviewPanel
          key={reviewing.id}
          agent={reviewing}
          onClose={() => setReviewingId(null)}
          onChange={(fn) => patch(reviewing.id, fn)}
          notify={notify}
          onRemind={() => remind([reviewing])}
          onAction={(kind) => setDialog({ kind, id: reviewing.id })}
        />
      )}
      {dialogAgent && dialog && (
        <AgentDialogs
          agent={dialogAgent}
          dialog={dialog.kind}
          applications={0}
          onClose={() => setDialog(null)}
          onChange={(fn, message) => {
            patch(dialogAgent.id, fn);
            notify(message);
          }}
          onDelete={() => {
            setAll((prev) => prev.filter((a) => a.id !== dialogAgent.id));
            selection.clear();
            setReviewingId(null);
            setDialog(null);
            notify(`${dialogAgent.name} deleted`);
          }}
        />
      )}
      {archiving && (
        <ArchiveDialog
          kind="agent-applications"
          names={archiving.map((a) => a.name)}
          onClose={() => setArchiving(null)}
          onConfirm={(meta) => {
            const ids = new Set(archiving.map((a) => a.id));
            agentApplicationArchive.archive(all.filter((a) => ids.has(a.id)), { ...meta, archivedBy: reviewer });
            setAll((prev) => prev.filter((a) => !ids.has(a.id)));
            selection.clear();
            if (reviewingId && ids.has(reviewingId)) setReviewingId(null);
            notify(archiving.length === 1 ? `${archiving[0].name} moved to Archived Agent Applications` : `${archiving.length} applications moved to Archived Agent Applications`);
            setArchiving(null);
          }}
        />
      )}
      {toast}
    </div>
  );
}

function ReviewPanel({
  agent,
  onClose,
  onChange,
  notify,
  onRemind,
  onAction,
}: {
  agent: Agent;
  onClose: () => void;
  onChange: (fn: (a: Agent) => Agent) => void;
  notify: (text: string, tone?: "success" | "error") => void;
  onRemind: () => void;
  onAction: (d: AgentDialog) => void;
}) {
  const [tier, setTier] = useState<AgentTier>(agent.tier);
  const [share, setShare] = useState(String(agent.commissionShare));
  const [agreementEnd, setAgreementEnd] = useState(agent.agreementEnd ?? `${Number(today.slice(0, 4)) + 1}${today.slice(4)}`);
  const [rejectingDoc, setRejectingDoc] = useState<DocKey | null>(null);
  const [docNote, setDocNote] = useState("");
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const p = docProgress(agent);
  const readyToApprove = p.verified === p.total;
  const shareOk = Number(share) > 0 && Number(share) <= 90;
  const editable = agent.status === "Pending";

  const setDoc = (key: DocKey, status: "Verified" | "Rejected", note?: string) => {
    const label = requiredDocs.find((d) => d.key === key)!.label;
    onChange((a) => log({ ...a, docs: { ...a.docs, [key]: { ...a.docs[key], status, note } } }, `${label} ${status.toLowerCase()}${note ? ` — ${note}` : ""}`));
  };

  const approve = () => {
    onChange((a) =>
      log({ ...a, status: "Active", tier, commissionShare: Number(share), agreementEnd, approvedAt: today }, `Approved as ${tier} partner at ${share}% share`)
    );
    notify(`${agent.name} approved — portal login sent to ${agent.email}`);
    onClose();
  };

  const reject = () => {
    const why = reason.trim();
    onChange((a) => log({ ...a, status: "Rejected", rejectionReason: why }, `Rejected — ${why}`));
    notify(`${agent.name} rejected`);
    setRejecting(false);
    onClose();
  };

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={ClipboardCheck}
      title={agent.name}
      subtitle={`${agent.id} · applied ${formatDay(agent.appliedAt)} · ${daysBetween(agent.appliedAt)} days ago`}
      footer={
        editable ? (
          <div className="flex gap-2">
            <button type="button" onClick={() => setRejecting(true)} className={cn(buttonSecondary, "text-danger")}>
              <Ban className="size-4" /> Reject
            </button>
            <button type="button" onClick={approve} disabled={!readyToApprove || !shareOk || !agreementEnd} className={cn(buttonPrimary, "flex-1")}>
              <ShieldCheck className="size-4" /> {readyToApprove ? "Approve agent" : `Verify ${p.total - p.verified} more document${p.total - p.verified === 1 ? "" : "s"}`}
            </button>
          </div>
        ) : undefined
      }
    >
      <div className="flex flex-col gap-6">
        <AgentTopActions agent={agent} onAction={onAction} />
        {agent.notes && <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-foreground">{agent.notes}</p>}

        <dl className="grid grid-cols-2 gap-x-4 gap-y-3 rounded-2xl bg-surface-muted p-4 text-xs">
          {[
            ["Contact", `${agent.contactName} · ${agent.contactRole}`],
            ["Email", agent.email],
            ["Phone", agent.phone],
            ["Office", agent.address],
            ["Recruits from", agent.markets.join(", ")],
            ["Destinations", agent.destinations.join(", ")],
            ["Expected students", `${agent.expectedStudents} a year`],
            ["Found us via", agent.source],
          ].map(([k, v]) => (
            <div key={k} className="min-w-0">
              <dt className="text-[11px] text-muted-foreground">{k}</dt>
              <dd className="break-words font-medium text-foreground">{v}</dd>
            </div>
          ))}
        </dl>

        <div>
          <div className="mb-2 flex items-center justify-between">
            <p className="text-xs font-semibold text-foreground">KYC documents · {p.verified}/{p.total} verified</p>
            {editable && p.uploaded - p.rejected < p.total && (
              <button type="button" onClick={onRemind} className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline">
                <Mail className="size-3" /> Request missing
              </button>
            )}
          </div>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {requiredDocs.map((d) => {
              const doc = agent.docs[d.key];
              return (
                <li key={d.key} className="px-3.5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium text-foreground">
                        {d.label}
                        {d.key === "agreement" && (
                          <button type="button" onClick={() => onAction("agreement")} className="ml-2 text-[11px] font-semibold text-primary hover:underline">View template</button>
                        )}
                      </p>
                      <p className="truncate text-[11px] text-muted-foreground">{doc.fileName ?? "Not uploaded"}{doc.note ? ` · ${doc.note}` : ""}</p>
                    </div>
                    <div className="flex shrink-0 items-center gap-1.5">
                      {editable && doc.status === "Uploaded" ? (
                        <>
                          <button type="button" onClick={() => { setRejectingDoc(d.key); setDocNote(""); }} aria-label={`Reject ${d.label}`} title="Reject" className="flex size-7 items-center justify-center rounded-full border border-border text-danger transition-colors hover:bg-danger-soft">
                            <X className="size-3.5" />
                          </button>
                          <button type="button" onClick={() => setDoc(d.key, "Verified")} aria-label={`Verify ${d.label}`} title="Verify" className="flex size-7 items-center justify-center rounded-full bg-success text-white transition-colors hover:bg-success/90">
                            <Check className="size-3.5" />
                          </button>
                        </>
                      ) : (
                        <DocStatusBadge status={doc.status} />
                      )}
                    </div>
                  </div>
                  {rejectingDoc === d.key && (
                    <div className="mt-2 flex gap-2">
                      <TextInput autoFocus value={docNote} onChange={(e) => setDocNote(e.target.value)} placeholder="What's wrong? e.g. Expired, unreadable" className="py-1.5 text-xs" />
                      <button type="button" disabled={!docNote.trim()} onClick={() => { setDoc(d.key, "Rejected", docNote.trim()); setRejectingDoc(null); }} className="shrink-0 rounded-full bg-danger px-3 text-xs font-semibold text-white disabled:opacity-50">
                        Reject
                      </button>
                      <button type="button" onClick={() => setRejectingDoc(null)} className="shrink-0 rounded-full px-2 text-xs text-muted-foreground hover:text-foreground">Cancel</button>
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
          {editable && p.rejected > 0 && (
            <p className="mt-2 flex items-center gap-1.5 text-[11px] text-muted-foreground">
              <CircleAlert className="size-3" /> The agent is asked to re-upload rejected documents.{" "}
              <Link href={`/agent-management/${agent.id}/edit`} className="font-semibold text-primary hover:underline">Upload on their behalf</Link>
            </p>
          )}
        </div>

        {editable && (
          <div className="rounded-2xl border border-border p-4">
            <p className="mb-3 text-xs font-semibold text-foreground">Commercial terms</p>
            <div className="flex flex-col gap-4">
              <Field label="Partner tier">
                <PillGroup options={agentTiers.map((t) => ({ value: t, label: t }))} value={tier} onChange={(t) => { setTier(t); setShare(String(tierShare[t])); }} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Commission share (%)">
                  <TextInput inputMode="numeric" value={share} onChange={(e) => setShare(e.target.value.replace(/\D/g, "").slice(0, 2))} aria-invalid={!shareOk} className={cn(!shareOk && "border-danger")} />
                </Field>
                <Field label="Agreement ends">
                  <TextInput type="date" min={today} value={agreementEnd} onChange={(e) => setAgreementEnd(e.target.value)} />
                </Field>
              </div>
              <p className="flex items-center gap-2 text-[11px] text-muted-foreground">
                Approving as <TierBadge tier={tier} /> sends portal login details to {agent.email}.
              </p>
            </div>
          </div>
        )}

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">History</p>
          <ol className="flex flex-col gap-3 border-l border-border pl-4">
            {agent.activity.map((e, i) => (
              <li key={i} className="relative text-xs">
                <span className="absolute -left-[21px] top-1 size-2 rounded-full bg-border-strong ring-4 ring-surface" />
                <p className="text-foreground">{e.text}</p>
                <p className="text-[11px] text-muted-foreground">{formatDay(e.at)} · {e.by}</p>
              </li>
            ))}
          </ol>
        </div>
      </div>

      <Modal
        open={rejecting}
        onClose={() => setRejecting(false)}
        icon={Ban}
        size="sm"
        title={`Reject ${agent.name}?`}
        subtitle="The applicant is emailed the reason. You can reopen it later."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => setRejecting(false)} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={reject} disabled={!reason.trim()} className={buttonDanger}>Reject application</button>
          </div>
        }
      >
        <Field label="Reason" required>
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Licence could not be verified with the registrar" />
        </Field>
      </Modal>
    </SlideOver>
  );
}
