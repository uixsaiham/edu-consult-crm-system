"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  CalendarRange,
  ExternalLink,
  FileText,
  Globe,
  Landmark,
  Mail,
  Pencil,
  Phone,
  UserRound,
} from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import type { InstitutionRecord } from "@/lib/mock/directory";
import { detailsFor, isActive, isOnWebsite } from "@/lib/mock/institution-store";
import { operationsSnapshotDate } from "@/lib/mock/applications";
import { cn } from "@/lib/utils";
import { StatusSwitch, WebsiteToggle } from "./row-actions";

function longDate(iso: string) {
  return new Date(`${iso}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" });
}

function daysUntil(iso: string) {
  return Math.round((Date.parse(`${iso}T00:00:00Z`) - Date.parse(`${operationsSnapshotDate}T00:00:00Z`)) / 86400000);
}

const gbp = (v: string) => (v ? `£${Number(v).toLocaleString("en-GB")}` : "—");

export function InstitutionView({
  institution,
  onClose,
  onToggleActive,
  onToggleWebsite,
}: {
  institution: InstitutionRecord;
  onClose: () => void;
  onToggleActive: (next: boolean) => void;
  onToggleWebsite: (next: boolean) => void;
}) {
  const d = detailsFor(institution);
  const active = isActive(institution);
  const onWeb = isOnWebsite(institution);
  const expiresIn = d.endDate ? daysUntil(d.endDate) : null;
  const href = /^https?:\/\//.test(d.website) ? d.website : `https://${d.website}`;

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={Landmark}
      title={institution.name}
      subtitle={`${institution.id} · ${d.type}`}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onClose} className={cn(buttonSecondary, "flex-1")}>
            Close
          </button>
          <Link href={`/institutions/${institution.id}/edit`} className={cn(buttonPrimary, "flex-1")}>
            <Pencil className="size-4" />
            Edit institution
          </Link>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <header className="flex items-start gap-4">
          <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-border bg-surface-muted font-mono text-sm font-bold text-primary">
            {institution.logoText}
          </span>
          <div className="min-w-0 flex-1">
            <p className="text-sm text-muted-foreground">
              {institution.city}, {institution.country}
            </p>
            <a href={href} target="_blank" rel="noreferrer" className="mt-0.5 inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline">
              <Globe className="size-3.5" />
              {d.website.replace(/^https?:\/\//, "")}
              <ExternalLink className="size-3" />
            </a>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Badge tone={active ? "success" : "neutral"}>{active ? "Active" : "Inactive"}</Badge>
              {d.status === "Onboarding" && <Badge tone="warning">Onboarding</Badge>}
              <Badge tone="primary">{institution.commissionTier}</Badge>
              {institution.featured && <Badge tone="amber">Top Partner</Badge>}
            </div>
          </div>
        </header>

        <section className="flex flex-col divide-y divide-border rounded-2xl border border-border">
          <ToggleRow
            title="Active"
            description={active ? "Counsellors can see it and apply to it." : "Hidden from counsellors and new applications."}
          >
            <StatusSwitch checked={active} onChange={onToggleActive} ariaLabel="Active" showLabel={false} />
          </ToggleRow>
          <ToggleRow
            title="Show courses on website"
            description={
              !active
                ? "Activate the institution first to publish its courses."
                : onWeb
                  ? `${institution.programsCount} courses are live on the BHE website.`
                  : "Courses are hidden from the public website."
            }
          >
            <WebsiteToggle live={onWeb} onChange={onToggleWebsite} disabled={!active} ariaLabel="Show courses on website" />
          </ToggleRow>
        </section>

        <dl className="grid grid-cols-2 gap-2.5">
          <Fact label="Commission" value={`${d.commissionRate}% of tuition`} />
          <Fact label="Agreement" value={d.agreementType === "Direct Agreement" ? "Direct" : `Via ${d.aggregator || "aggregator"}`} />
          <Fact label="Offer turnaround" value={d.tat} />
          <Fact label="Programmes" value={`${d.programsCount} courses`} />
          <Fact label="Minimum IELTS" value={d.ieltsMin} />
          <Fact label="Application fee" value={d.applicationFee === "0" ? "Free" : gbp(d.applicationFee)} />
          <Fact label="CAS deposit" value={gbp(d.deposit)} />
          <Fact label="Scholarships" value={d.scholarships ? `Up to ${gbp(d.scholarshipMax)}` : "None"} />
        </dl>

        <Block title="Agreement" icon={CalendarRange}>
          <p className="text-sm text-foreground">
            {d.startDate ? longDate(d.startDate) : "—"} – {d.endDate ? longDate(d.endDate) : "—"}
          </p>
          {expiresIn !== null && expiresIn <= 90 && (
            <p className={cn("mt-1.5 inline-flex items-center gap-1 text-xs font-semibold", expiresIn < 0 ? "text-danger" : "text-warning")}>
              <AlertTriangle className="size-3.5" />
              {expiresIn < 0 ? `Expired ${-expiresIn} days ago` : `Expires in ${expiresIn} days — plan renewal`}
            </p>
          )}
          <p className="mt-1.5 text-xs text-muted-foreground">Commission paid {d.paymentTerms.toLowerCase()}</p>
          {d.agreementDoc && (
            <p className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-surface-muted px-2.5 py-1.5 text-xs font-medium text-foreground">
              <FileText className="size-3.5 text-danger" />
              {d.agreementDoc}
            </p>
          )}
        </Block>

        <Block title="Admissions" icon={Landmark}>
          <ChipRow label="Intakes" items={d.intakes} />
          <ChipRow label="Study levels" items={d.levels} />
          <ChipRow label="English tests" items={[`IELTS ${d.ieltsMin}`, ...d.altTests]} />
        </Block>

        <Block title="Contacts" icon={UserRound}>
          <p className="text-sm font-semibold text-foreground">{d.contactName}</p>
          {d.contactRole && <p className="text-xs text-muted-foreground">{d.contactRole}</p>}
          <div className="mt-2 flex flex-col gap-1 text-xs">
            <a href={`mailto:${d.contactEmail}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
              <Mail className="size-3.5" />
              {d.contactEmail}
            </a>
            {d.contactPhone && (
              <a href={`tel:${d.contactPhone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-primary hover:underline">
                <Phone className="size-3.5" />
                {d.contactPhone}
              </a>
            )}
            {d.admissionsEmail && (
              <a href={`mailto:${d.admissionsEmail}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary">
                <Mail className="size-3.5" />
                {d.admissionsEmail} <span className="text-[10px]">(admissions)</span>
              </a>
            )}
          </div>
        </Block>

        {d.notes && (
          <Block title="Internal notes" icon={FileText}>
            <p className="whitespace-pre-line text-sm text-foreground/90">{d.notes}</p>
          </Block>
        )}
      </div>
    </SlideOver>
  );
}

const badgeTone = {
  success: "bg-success-soft text-success",
  neutral: "bg-surface-hover text-muted-foreground",
  warning: "bg-warning-soft text-warning",
  primary: "bg-primary-soft text-primary",
  amber: "bg-amber-500/10 text-amber-600 dark:text-amber-400",
};

function Badge({ tone, children }: { tone: keyof typeof badgeTone; children: ReactNode }) {
  return <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", badgeTone[tone])}>{children}</span>;
}

function ToggleRow({ title, description, children }: { title: string; description: string; children: ReactNode }) {
  return (
    <div className="flex items-center gap-4 px-4 py-3">
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-foreground">{title}</p>
        <p className="text-xs text-muted-foreground">{description}</p>
      </div>
      {children}
    </div>
  );
}

function Fact({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border border-border bg-surface-muted px-3.5 py-2.5">
      <dt className="text-[11px] text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 truncate text-sm font-semibold text-foreground">{value || "—"}</dd>
    </div>
  );
}

function Block({ title, icon: Icon, children }: { title: string; icon: typeof Landmark; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
      </h4>
      <div className="rounded-2xl border border-border p-4">{children}</div>
    </section>
  );
}

function ChipRow({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="flex flex-col gap-1.5 py-1.5 first:pt-0 last:pb-0 sm:flex-row sm:items-start">
      <span className="w-28 shrink-0 pt-0.5 text-xs text-muted-foreground">{label}</span>
      <div className="flex flex-wrap gap-1">
        {items.length ? (
          items.map((i) => (
            <span key={i} className="rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
              {i}
            </span>
          ))
        ) : (
          <span className="text-xs text-muted-foreground">—</span>
        )}
      </div>
    </div>
  );
}
