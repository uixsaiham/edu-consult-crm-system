"use client";

import { Building2, Calendar, Mail, MapPin, Phone, Radar, StickyNote, User, UserCog } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { leadStatusStyles, type LeadRow } from "@/lib/mock/leads";
import { cn } from "@/lib/utils";

function Row({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="flex items-start gap-3">
      <span className="mt-0.5 flex size-8 shrink-0 items-center justify-center rounded-lg bg-surface-muted text-muted-foreground">
        <Icon className="size-4" />
      </span>
      <div className="min-w-0">
        <p className="text-[11px] font-medium uppercase tracking-wide text-muted-foreground">{label}</p>
        <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value || "—"}</p>
      </div>
    </div>
  );
}

export function LeadDetailsPanel({
  lead,
  onClose,
  onAssign,
}: {
  lead: LeadRow | null;
  onClose: () => void;
  onAssign: (lead: LeadRow) => void;
}) {
  if (!lead) return null;

  const status = leadStatusStyles[lead.status];

  return (
    <SlideOver
      open={!!lead}
      onClose={onClose}
      icon={User}
      title={lead.name}
      subtitle={lead.id}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-surface-hover"
          >
            Close
          </button>
          <button
            type="button"
            onClick={() => onAssign(lead)}
            className="inline-flex items-center gap-1.5 rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-95"
          >
            <UserCog className="size-3.5" />
            {lead.counsellor ? "Reassign" : "Assign"} Counsellor
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-3">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
            {lead.initials}
          </span>
          <div className="min-w-0">
            <p className="truncate text-base font-semibold text-foreground">{lead.name}</p>
            <span
              className={cn(
                "mt-1 inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold",
                status.bg,
                status.text
              )}
            >
              <span className={cn("size-1.5 rounded-full", status.dot)} />
              {lead.status}
            </span>
          </div>
        </div>

        <div className="flex flex-col gap-4">
          <Row icon={Phone} label="Phone" value={lead.phone} />
          <Row icon={Mail} label="Email" value={lead.email} />
          <Row icon={MapPin} label="Country" value={lead.country} />
          <Row icon={Building2} label="Branch" value={lead.branch} />
          <Row icon={UserCog} label="Counsellor" value={lead.counsellor} />
          <Row icon={Radar} label="Lead Source" value={lead.leadSource} />
          <Row icon={Calendar} label="Created" value={lead.createdDate} />
        </div>

        <div className="rounded-2xl border border-border bg-surface-muted p-4">
          <p className="flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <StickyNote className="size-3.5" />
            Lead Note
          </p>
          <p className="mt-1.5 text-sm text-foreground">{lead.leadNote || "No notes added yet."}</p>
        </div>
      </div>
    </SlideOver>
  );
}
