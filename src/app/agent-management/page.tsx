"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { Briefcase, CalendarClock, ClipboardCheck, Download, FileText, GraduationCap, Plus, SearchX, ShieldOff } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { BarButton, HeaderCheckbox, RowCheckbox, SelectionBar, selectedRowClass } from "@/components/ui/row-selection";
import { Modal } from "@/components/ui/modal";
import { Field, Textarea } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { RowActions, StatusSwitch } from "@/components/institutions/row-actions";
import { formatDay } from "@/components/people/people-ui";
import { AgentDialogs, AgentRowMenu, type AgentDialog } from "@/components/agents/agent-actions";
import { AgentProfile, AgentStatusBadge, AgreementCell, FunnelBar, TierBadge, agentStatusDot } from "@/components/agents/agent-ui";
import {
  agentReferrals,
  agentTiers,
  agreementState,
  daysBetween,
  getAgents,
  relationshipManagers,
  saveAgents,
  clearAgentChange,
  getAgentChange,
  today,
  type Agent,
  type AgentStatus,
} from "@/lib/mock/agents";
import { useRowSelection } from "@/lib/use-row-selection";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const statusTabs = ["All", "Active", "Suspended", "Inactive"] as const;
type Tab = (typeof statusTabs)[number];
const approvedStatuses = new Set<AgentStatus>(["Active", "Suspended", "Inactive"]);

function AgentsPageInner() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading agents…</p>}>
      <AgentsFromParams />
    </Suspense>
  );
}

function AgentsFromParams() {
  const params = useSearchParams();
  return <AgentList key={params.toString()} initialAgreement={params.get("agreement") ?? ""} />;
}

function AgentList({ initialAgreement }: { initialAgreement: string }) {
  const [all, setAll] = useState<Agent[]>(getAgents);
  const [tab, setTab] = useState<Tab>("All");
  const [search, setSearch] = useState("");
  const [tier, setTier] = useState("");
  const [country, setCountry] = useState("");
  const [manager, setManager] = useState("");
  const [agreement, setAgreement] = useState(initialAgreement);
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [dialog, setDialog] = useState<{ kind: AgentDialog; id: string } | null>(null);
  const [suspending, setSuspending] = useState<string[] | null>(null);
  const [reason, setReason] = useState("");
  const [lastChange] = useState(getAgentChange);
  const [toast, notify] = useToast();
  const referrals = useMemo(() => agentReferrals(), []);

  useEffect(() => saveAgents(all), [all]);
  useEffect(() => {
    if (!lastChange) return;
    clearAgentChange();
    const who = getAgents().find((a) => a.id === lastChange.id)?.name ?? "Agent";
    notify(lastChange.verb === "updated" ? `${who} saved` : `${who} added and approved`);
  }, [lastChange, notify]);

  const agents = useMemo(() => all.filter((a) => approvedStatuses.has(a.status)), [all]);
  const pendingCount = all.filter((a) => a.status === "Pending").length;
  const countries = [...new Set(agents.map((a) => a.country))].sort();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return agents
      .filter(
        (a) =>
          (tab === "All" || a.status === tab) &&
          (!tier || a.tier === tier) &&
          (!country || a.country === country) &&
          (!manager || a.manager === manager) &&
          (!agreement || agreementState(a) === agreement) &&
          (!q || `${a.name} ${a.legalName} ${a.contactName} ${a.email} ${a.phone} ${a.city} ${a.country} ${a.id}`.toLowerCase().includes(q))
      )
      .sort((a, b) => referrals(b.name).total - referrals(a.name).total);
  }, [agents, tab, tier, country, manager, agreement, search, referrals]);

  const selection = useRowSelection(filtered.map((a) => a.id));
  const selected = agents.filter((a) => selection.isSelected(a.id));
  const active = agents.filter((a) => a.status === "Active");
  const totals = active.reduce(
    (t, a) => {
      const s = referrals(a.name);
      return { month: t.month + s.thisMonth, enrolled: t.enrolled + s.enrolled, total: t.total + s.total };
    },
    { month: 0, enrolled: 0, total: 0 }
  );
  const renewals = agents.filter((a) => a.status !== "Inactive" && (agreementState(a) === "Expiring" || agreementState(a) === "Expired")).length;
  const hasFilters = !!(search || tier || country || manager || agreement);
  const count = (t: Tab) => (t === "All" ? agents.length : agents.filter((a) => a.status === t).length);

  const update = (ids: string[], patch: (a: Agent) => Partial<Agent>, log: (a: Agent) => string) => {
    const set = new Set(ids);
    const at = `${today}T${new Date().toISOString().slice(11, 19)}Z`;
    setAll((prev) => prev.map((a) => (set.has(a.id) ? { ...a, ...patch(a), activity: [{ at, text: log(a), by: "Sadman Rahman" }, ...a.activity] } : a)));
  };

  const activate = (ids: string[]) => {
    update(ids, () => ({ status: "Active", notes: undefined }), (a) => `Reactivated (was ${a.status.toLowerCase()})`);
    notify(ids.length === 1 ? `${all.find((a) => a.id === ids[0])?.name} reactivated` : `${ids.length} agents reactivated`);
  };

  const confirmSuspend = () => {
    if (!suspending) return;
    const note = reason.trim();
    update(suspending, () => ({ status: "Suspended", notes: note ? `Suspended ${formatDay(today)} — ${note}` : undefined }), () => `Suspended${note ? ` — ${note}` : ""}`);
    notify(suspending.length === 1 ? `${all.find((a) => a.id === suspending[0])?.name} suspended` : `${suspending.length} agents suspended`);
    setSuspending(null);
    setReason("");
    selection.clear();
  };

  const renew = (a: Agent) => {
    const from = a.agreementEnd && a.agreementEnd > today ? a.agreementEnd : today;
    const next = `${Number(from.slice(0, 4)) + 1}${from.slice(4)}`;
    update([a.id], () => ({ agreementEnd: next }), () => `Agreement renewed until ${formatDay(next)}`);
    notify(`${a.name} renewed until ${formatDay(next)}`);
  };

  const exportRows = (rows: Agent[], name: string) =>
    downloadCsv(
      name,
      rows.map((a) => {
        const s = referrals(a.name);
        return {
          id: a.id,
          agent: a.name,
          legalName: a.legalName,
          contact: a.contactName,
          email: a.email,
          phone: a.phone,
          city: a.city,
          country: a.country,
          recruitsFrom: a.markets.join("; "),
          tier: a.tier,
          commissionShare: `${a.commissionShare}%`,
          manager: a.manager,
          applications: s.total,
          open: s.open,
          enrolled: s.enrolled,
          conversion: s.total ? `${Math.round((s.enrolled / s.total) * 100)}%` : "0%",
          agreementEnds: a.agreementEnd ?? "",
          status: a.status,
        };
      })
    );

  const viewing = all.find((a) => a.id === viewingId);
  const dialogAgent = all.find((a) => a.id === dialog?.id);
  const suspendNames = suspending?.map((id) => all.find((a) => a.id === id)?.name).filter(Boolean) ?? [];

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Agents</h2>
          <p className="mt-1 text-sm text-muted-foreground">Approved recruitment partners — their terms, agreements and the applications they send.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={() => exportRows(filtered, "agents.csv")} className={buttonSecondary}>
            <Download className="size-4" /> Export
          </button>
          <Link href="/agent-management/new" className={buttonPrimary}>
            <Plus className="size-4" /> Add agent
          </Link>
        </div>
      </header>

      {pendingCount > 0 && (
        <Link href="/agent-management/pending" className="flex items-center gap-3 rounded-2xl border border-primary/25 bg-primary-soft px-4 py-3 text-sm transition-colors hover:border-primary/50">
          <ClipboardCheck className="size-4 shrink-0 text-primary" />
          <span className="flex-1 text-foreground">
            <span className="font-semibold">{pendingCount} agent application{pendingCount > 1 ? "s" : ""}</span> waiting for KYC review
          </span>
          <span className="text-xs font-semibold text-primary">Review →</span>
        </Link>
      )}

      <StatGrid>
        <StatCard icon={Briefcase} label="Active agents" value={active.length} note={`${countries.length} countries`} onClick={() => setTab("Active")} />
        <StatCard icon={FileText} tone="primary" label="Sent this month" value={totals.month} note={`${totals.total} all time`} />
        <StatCard icon={GraduationCap} tone="success" label="Students enrolled" value={totals.enrolled} note={totals.total ? `${Math.round((totals.enrolled / totals.total) * 100)}%` : undefined} />
        <StatCard icon={CalendarClock} tone={renewals ? "warning" : "success"} label="Renewals due" value={renewals} note="60 days" onClick={() => setAgreement(agreement === "Expiring" ? "" : "Expiring")} />
      </StatGrid>

      <div role="tablist" aria-label="Status" className="inline-flex w-fit max-w-full gap-0.5 self-start overflow-x-auto rounded-full border border-border bg-surface-muted p-0.5">
        {statusTabs.map((t) => (
          <button
            key={t}
            type="button"
            role="tab"
            aria-selected={tab === t}
            onClick={() => setTab(t)}
            className={cn("inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors", tab === t ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}
          >
            {t !== "All" && <span className={cn("size-1.5 rounded-full", agentStatusDot[t])} />}
            {t}
            <span className="rounded-full bg-surface-hover px-1.5 text-[10px] tabular-nums">{count(t)}</span>
          </button>
        ))}
      </div>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Agency, contact, email, city…" label="Search agents" />
        <SelectFilter label="Tier" value={tier} onChange={setTier} allLabel="All tiers" options={agentTiers.map((t) => ({ value: t, label: t, hint: agents.filter((a) => a.tier === t).length }))} />
        <SelectFilter label="Country" value={country} onChange={setCountry} allLabel="All countries" options={countries.map((c) => ({ value: c, label: c, hint: agents.filter((a) => a.country === c).length }))} />
        <SelectFilter label="Manager" value={manager} onChange={setManager} allLabel="All managers" options={relationshipManagers.map((m) => ({ value: m, label: m, hint: agents.filter((a) => a.manager === m).length }))} />
        <SelectFilter
          label="Agreement"
          value={agreement}
          onChange={setAgreement}
          allLabel="Any agreement"
          options={[
            { value: "Valid", label: "Valid", dot: "bg-success" },
            { value: "Expiring", label: "Renew soon", dot: "bg-warning" },
            { value: "Expired", label: "Expired", dot: "bg-danger" },
          ]}
        />
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setTier(""); setCountry(""); setManager(""); setAgreement(""); }} />}
      </FilterBar>

      <Card className="overflow-hidden">
        <div className="px-5 pt-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">Partner agents</h3>
          <p className="text-xs text-muted-foreground">{filtered.length} of {agents.length} agents · busiest first</p>
        </div>
        <SelectionBar selection={selection} noun={["agent", "agents"]} onExport={() => exportRows(selected, "agents-selected.csv")} className="mx-5 mt-3">
          <BarButton onClick={() => { activate(selected.map((a) => a.id)); selection.clear(); }}>Activate</BarButton>
          <BarButton onClick={() => setSuspending(selected.map((a) => a.id))} tone="danger">Suspend</BarButton>
        </SelectionBar>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full min-w-[1100px] text-left text-xs">
            <thead className="whitespace-nowrap border-y border-border bg-surface-muted text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              <tr>
                <th className="w-10 py-2.5 pl-5 pr-0"><HeaderCheckbox selection={selection} /></th>
                <th className="py-2.5 pl-3 pr-3">Agent</th>
                <th className="px-3 py-2.5">Contact</th>
                <th className="px-3 py-2.5">Tier & share</th>
                <th className="px-3 py-2.5">Applications</th>
                <th className="px-3 py-2.5">Last sent</th>
                <th className="px-3 py-2.5">Agreement</th>
                <th className="px-3 py-2.5">Status</th>
                <th className="py-2.5 pl-3 pr-5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {filtered.map((a) => {
                const s = referrals(a.name);
                const conv = s.total ? Math.round((s.enrolled / s.total) * 100) : 0;
                const state = agreementState(a);
                return (
                  <tr key={a.id} className={cn("transition-colors hover:bg-surface-hover/60", selectedRowClass(selection, a.id), a.status === "Inactive" && "opacity-60")}>
                    <td className="py-3 pl-5 pr-0 align-middle"><RowCheckbox selection={selection} id={a.id} label={`Select ${a.name}`} /></td>
                    <td className="py-3 pl-3 pr-3">
                      <button type="button" onClick={() => setViewingId(a.id)} className="flex items-center gap-3 text-left">
                        <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
                          <Briefcase className="size-4" />
                        </span>
                        <span className="min-w-0">
                          <span className="block max-w-[220px] truncate text-sm font-semibold text-foreground hover:text-primary">{a.name}</span>
                          <span className="block truncate text-[11px] text-muted-foreground">{a.city}, {a.country} · since {a.approvedAt?.slice(0, 4)}</span>
                        </span>
                      </button>
                    </td>
                    <td className="px-3 py-3">
                      <p className="font-medium text-foreground">{a.contactName}</p>
                      <p className="max-w-[200px] truncate text-[11px] text-muted-foreground">{a.email}</p>
                    </td>
                    <td className="px-3 py-3">
                      <TierBadge tier={a.tier} />
                      <p className="mt-1 text-[11px] text-muted-foreground">{a.commissionShare}% of commission</p>
                    </td>
                    <td className="w-44 px-3 py-3">
                      <p className="mb-1 flex justify-between text-[11px]">
                        <span className="font-semibold tabular-nums text-foreground">{s.total} sent · {s.enrolled} enrolled</span>
                        <span className="text-muted-foreground">{conv}%</span>
                      </p>
                      <FunnelBar stats={s} />
                    </td>
                    <td className="whitespace-nowrap px-3 py-3 text-muted-foreground">
                      {s.lastAt ? (daysBetween(s.lastAt) <= 0 ? "Today" : `${daysBetween(s.lastAt)} d ago`) : "Never"}
                    </td>
                    <td className="px-3 py-3">
                      <AgreementCell agent={a} />
                      {(state === "Expiring" || state === "Expired") && a.status !== "Inactive" && (
                        <button type="button" onClick={() => renew(a)} className="mt-0.5 text-[11px] font-semibold text-primary hover:underline">Renew 1 year</button>
                      )}
                    </td>
                    <td className="px-3 py-3">
                      {a.status === "Inactive" ? (
                        <div className="flex flex-col items-start gap-1">
                          <AgentStatusBadge status="Inactive" />
                          <button type="button" onClick={() => activate([a.id])} className="text-[11px] font-semibold text-primary hover:underline">Reactivate</button>
                        </div>
                      ) : (
                        <div className="flex flex-col items-start gap-0.5">
                          <StatusSwitch checked={a.status === "Active"} ariaLabel={`${a.name} partnership active`} onChange={(on) => (on ? activate([a.id]) : setSuspending([a.id]))} />
                          {a.status === "Suspended" && <span className="text-[11px] font-semibold text-danger">Suspended</span>}
                        </div>
                      )}
                    </td>
                    <td className="py-3 pl-3 pr-5 text-right">
                      <div className="inline-flex items-center gap-1.5">
                        <RowActions onView={() => setViewingId(a.id)} editHref={`/agent-management/${a.id}/edit`} name={a.name} editLabel="Edit agent" />
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
              <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground"><SearchX className="size-5" /></span>
              <p className="text-sm font-medium text-foreground">No agents match</p>
              <p className="text-xs text-muted-foreground">Try another status, filter or search.</p>
            </div>
          )}
        </div>
        <footer className="flex flex-wrap items-center gap-x-4 gap-y-1 border-t border-border px-5 py-3 text-[11px] text-muted-foreground">
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-success" /> Enrolled</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary" /> Offer to visa</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-primary/35" /> In progress</span>
          <span className="inline-flex items-center gap-1.5"><span className="size-2 rounded-full bg-danger/50" /> Rejected or withdrawn</span>
          <span className="ml-auto inline-flex items-center gap-1.5"><ShieldOff className="size-3.5" /> Suspended agents can&apos;t submit new applications</span>
        </footer>
      </Card>

      {viewing && <AgentProfile agent={viewing} stats={referrals(viewing.name)} onClose={() => setViewingId(null)} onAction={(kind) => setDialog({ kind, id: viewing.id })} />}

      {dialogAgent && dialog && (
        <AgentDialogs
          agent={dialogAgent}
          dialog={dialog.kind}
          applications={referrals(dialogAgent.name).total}
          onClose={() => setDialog(null)}
          onChange={(fn, message) => {
            setAll((prev) => prev.map((a) => (a.id === dialogAgent.id ? fn(a) : a)));
            notify(message);
          }}
          onDelete={() => {
            setAll((prev) => prev.filter((a) => a.id !== dialogAgent.id));
            selection.clear();
            setViewingId(null);
            setDialog(null);
            notify(`${dialogAgent.name} deleted`);
          }}
        />
      )}

      <Modal
        open={!!suspending}
        onClose={() => { setSuspending(null); setReason(""); }}
        icon={ShieldOff}
        size="sm"
        title={suspendNames.length === 1 ? `Suspend ${suspendNames[0]}?` : `Suspend ${suspendNames.length} agents?`}
        subtitle="They can't submit new applications until reactivated."
        footer={
          <div className="flex justify-end gap-2">
            <button type="button" onClick={() => { setSuspending(null); setReason(""); }} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={confirmSuspend} className={buttonDanger}>Suspend</button>
          </div>
        }
      >
        <Field label="Reason" hint="Shown on the agent's profile so colleagues know why.">
          <Textarea rows={3} value={reason} onChange={(e) => setReason(e.target.value)} placeholder="e.g. Unverified bank statements on two applications" />
        </Field>
      </Modal>

      {toast}
    </div>
  );
}

export default function AgentsPage() { return <Suspense><AgentsPageInner /></Suspense>; }
