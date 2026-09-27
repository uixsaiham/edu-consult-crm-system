"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  CalendarDays,
  CircleAlert,
  FileText,
  Globe,
  KeyRound,
  Landmark,
  Mail,
  MapPin,
  Percent,
  Phone,
  Plane,
  UserRound,
} from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { buttonSecondary } from "@/components/ui/button-styles";
import { formatDay } from "@/components/people/people-ui";
import {
  agreementState,
  requiredDocs,
  type Agent,
  type AgentStatus,
  type AgentTier,
  type DocStatus,
  type ReferralStats,
} from "@/lib/mock/agents";
import { cn } from "@/lib/utils";
import { AgentTopActions, type AgentDialog } from "./agent-actions";

const tierStyles: Record<AgentTier, { chip: string; dot: string }> = {
  Gold: { chip: "border-amber-300/70 bg-amber-500/10 text-amber-700 dark:border-amber-500/30 dark:text-amber-300", dot: "bg-amber-500" },
  Silver: { chip: "border-slate-300/70 bg-slate-500/10 text-slate-700 dark:border-slate-400/30 dark:text-slate-300", dot: "bg-slate-400" },
  Bronze: { chip: "border-orange-300/70 bg-orange-500/10 text-orange-700 dark:border-orange-500/30 dark:text-orange-300", dot: "bg-orange-500" },
};

export function TierBadge({ tier }: { tier: AgentTier }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border px-2 py-0.5 text-[11px] font-semibold", tierStyles[tier].chip)}>
      <span className={cn("size-1.5 rounded-full", tierStyles[tier].dot)} />
      {tier}
    </span>
  );
}

const statusStyles: Record<AgentStatus, string> = {
  Active: "bg-success-soft text-success",
  Pending: "bg-primary-soft text-primary",
  Suspended: "bg-danger-soft text-danger",
  Inactive: "bg-surface-hover text-muted-foreground",
  Rejected: "bg-danger-soft text-danger",
};
export const agentStatusDot: Record<AgentStatus, string> = {
  Active: "bg-success",
  Pending: "bg-primary",
  Suspended: "bg-danger",
  Inactive: "bg-muted-foreground",
  Rejected: "bg-danger",
};

export function AgentStatusBadge({ status }: { status: AgentStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyles[status])}>
      <span className={cn("size-1.5 rounded-full", agentStatusDot[status])} />
      {status === "Pending" ? "Pending review" : status}
    </span>
  );
}

const docStyles: Record<DocStatus, string> = {
  Missing: "border border-dashed border-border-strong text-muted-foreground",
  Uploaded: "bg-primary-soft text-primary",
  Verified: "bg-success-soft text-success",
  Rejected: "bg-danger-soft text-danger",
};

export function DocStatusBadge({ status }: { status: DocStatus }) {
  return <span className={cn("inline-flex whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", docStyles[status])}>{status === "Uploaded" ? "To review" : status}</span>;
}

export function AgreementCell({ agent }: { agent: Agent }) {
  const state = agreementState(agent);
  if (state === "None") return <span className="text-muted-foreground">—</span>;
  return (
    <div>
      <p className={cn("whitespace-nowrap font-medium", state === "Valid" ? "text-foreground" : state === "Expiring" ? "text-warning" : "text-danger")}>
        {state === "Expired" ? "Expired" : state === "Expiring" ? "Renew soon" : "Valid"}
      </p>
      <p className="whitespace-nowrap text-[11px] text-muted-foreground">until {formatDay(agent.agreementEnd!)}</p>
    </div>
  );
}

/** Coloured segment bar for the application funnel: open / offers / enrolled / lost. */
export function FunnelBar({ stats }: { stats: ReferralStats }) {
  if (!stats.total) return <span className="block h-1.5 w-full rounded-full bg-surface-hover" />;
  const seg = (n: number) => `${(n / stats.total) * 100}%`;
  const early = stats.open - (stats.offers - stats.enrolled);
  return (
    <span className="flex h-1.5 w-full overflow-hidden rounded-full bg-surface-hover" title={`${stats.enrolled} enrolled · ${stats.offers - stats.enrolled} with offers · ${early} in progress · ${stats.lost} lost`}>
      <span className="bg-success" style={{ width: seg(stats.enrolled) }} />
      <span className="bg-primary" style={{ width: seg(stats.offers - stats.enrolled) }} />
      <span className="bg-primary/35" style={{ width: seg(Math.max(0, early)) }} />
      <span className="bg-danger/50" style={{ width: seg(stats.lost) }} />
    </span>
  );
}

export function AgentProfile({
  agent,
  stats,
  onClose,
  onAction,
}: {
  agent: Agent;
  stats: ReferralStats;
  onClose: () => void;
  onAction: (d: AgentDialog) => void;
}) {
  const conversion = stats.total ? Math.round((stats.enrolled / stats.total) * 100) : 0;
  return (
    <SlideOver
      open
      onClose={onClose}
      icon={Briefcase}
      title={agent.name}
      subtitle={`${agent.id} · ${agent.type === "Individual" ? "Individual agent" : agent.legalName}`}
      footer={
        <Link href={`/applications?source=agent&search=${encodeURIComponent(agent.name)}`} className={cn(buttonSecondary, "w-full")}>
          <FileText className="size-4" /> View all {stats.total} applications
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <AgentTopActions agent={agent} onAction={onAction} />

        <div className="flex flex-wrap items-center gap-1.5">
          <AgentStatusBadge status={agent.status} />
          <TierBadge tier={agent.tier} />
          <span className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">{agent.commissionShare}% share</span>
        </div>

        {agent.notes && (
          <p className={cn("flex gap-2 rounded-xl px-3 py-2 text-xs text-foreground", agent.status === "Suspended" ? "bg-danger-soft" : "bg-warning-soft")}>
            <CircleAlert className="mt-0.5 size-3.5 shrink-0" /> {agent.notes}
          </p>
        )}

        <div className="grid grid-cols-4 gap-2">
          {[
            ["Applications", stats.total],
            ["Open", stats.open],
            ["Enrolled", stats.enrolled],
            ["Conversion", `${conversion}%`],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-surface-muted px-3 py-2.5">
              <p className="text-lg font-bold tabular-nums text-foreground">{v}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm">
          <Row icon={UserRound} label="Main contact">{agent.contactName} · {agent.contactRole}</Row>
          <Row icon={Mail} label="Email"><a href={`mailto:${agent.email}`} className="hover:text-primary">{agent.email}</a></Row>
          <Row icon={Phone} label="Phone">{agent.phone}</Row>
          {agent.website && <Row icon={Globe} label="Website">{agent.website}</Row>}
          <Row icon={MapPin} label="Office">{agent.address}</Row>
          <Row icon={Building2} label="Recruits from">{agent.markets.join(", ")}</Row>
          <Row icon={Plane} label="Destinations">{agent.destinations.join(", ")}</Row>
          <Row icon={UserRound} label="BHE manager">{agent.manager}</Row>
          <Row icon={Percent} label="Commission">{agent.commissionShare}% of institution commission</Row>
          <Row icon={CalendarDays} label="Agreement">
            {agent.agreementEnd ? `${formatDay(agent.approvedAt ?? agent.appliedAt)} – ${formatDay(agent.agreementEnd)}` : "Not signed yet"}
          </Row>
          <Row icon={KeyRound} label="Portal login">
            {agent.login ? (
              <>Active · password changed {formatDay(agent.login.passwordChangedAt)}</>
            ) : (
              <button type="button" onClick={() => onAction("login")} className="font-semibold text-primary hover:underline">Create login</button>
            )}
          </Row>
          <Row icon={Landmark} label="Bank">{agent.bankName ? `${agent.bankName} · ${agent.accountName} · ••••${agent.accountLast4}` : "Not provided"}</Row>
        </dl>

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">KYC documents</p>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {requiredDocs.map((d) => (
              <li key={d.key} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs">
                <span className="min-w-0 truncate text-foreground">{d.label}</span>
                <span className="flex shrink-0 items-center gap-2">
                  {d.key === "agreement" && (
                    <button type="button" onClick={() => onAction("agreement")} className="text-[11px] font-semibold text-primary hover:underline">View PDF</button>
                  )}
                  <DocStatusBadge status={agent.docs[d.key].status} />
                </span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">Latest applications</p>
          {stats.recent.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {stats.recent.map((a) => (
                <li key={a.id}>
                  <Link href={`/applications/${a.id}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs transition-colors hover:bg-surface-hover">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{a.applicant}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{a.university} · {a.intake}</span>
                    </span>
                    <span className="shrink-0 text-[11px] font-medium text-muted-foreground">{a.stage}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">No applications from this agent yet.</p>
          )}
        </div>

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
    </SlideOver>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <dt className="w-28 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}
