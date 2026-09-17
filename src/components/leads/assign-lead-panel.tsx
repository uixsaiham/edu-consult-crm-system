"use client";

import { useState } from "react";
import { UserCog, Users2 } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { Field, Select } from "@/components/ui/form-controls";
import { branches, counsellors, type LeadRow } from "@/lib/mock/leads";
import { cn } from "@/lib/utils";

function uniqueValue(leads: LeadRow[], pick: (l: LeadRow) => string) {
  const values = new Set(leads.map(pick).filter(Boolean));
  return values.size === 1 ? [...values][0] : "";
}

export function AssignLeadPanel({
  leads,
  onClose,
  onAssign,
}: {
  leads: LeadRow[] | null;
  onClose: () => void;
  onAssign: (ids: string[], branch: string, counsellor: string) => void;
}) {
  const list = leads ?? [];
  const isBulk = list.length > 1;

  const [branch, setBranch] = useState(() => uniqueValue(list, (l) => l.branch));
  const [counsellor, setCounsellor] = useState(() => uniqueValue(list, (l) => l.counsellor));

  const isValid = !!(branch && counsellor);

  function handleSave() {
    if (list.length === 0 || !isValid) return;
    onAssign(list.map((l) => l.id), branch, counsellor);
    onClose();
  }

  return (
    <SlideOver
      open={list.length > 0}
      onClose={onClose}
      icon={isBulk ? Users2 : UserCog}
      title={isBulk ? "Assign Leads" : "Assign Lead"}
      subtitle={isBulk ? `${list.length} leads selected` : list[0]?.name}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex min-h-10 items-center justify-center rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="inline-flex min-h-10 items-center justify-center rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            {isBulk ? `Assign ${list.length} Leads` : "Assign"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        {isBulk && (
          <div>
            <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Assigning together
            </p>
            <div className="max-h-48 overflow-y-auto rounded-xl border border-border">
              <ul className="divide-y divide-border/70">
                {list.map((l) => (
                  <li key={l.id} className="flex items-center gap-2.5 px-3 py-2">
                    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary-soft text-[10px] font-bold text-primary">
                      {l.initials}
                    </span>
                    <span className="min-w-0 flex-1 truncate text-xs font-medium text-foreground">{l.name}</span>
                    <span
                      className={cn(
                        "shrink-0 truncate rounded-full px-2 py-0.5 text-[10px] font-semibold",
                        l.counsellor
                          ? "bg-surface-muted text-muted-foreground"
                          : "bg-danger-soft text-danger"
                      )}
                    >
                      {l.counsellor || "Unassigned"}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}

        <div className="flex flex-col gap-4">
          <Field label="Branch" required hint={isBulk ? "Applied to every selected lead" : undefined}>
            <Select placeholder="Select branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Counsellor" required hint={isBulk ? "Applied to every selected lead" : undefined}>
            <Select placeholder="Select counsellor" value={counsellor} onChange={(e) => setCounsellor(e.target.value)}>
              {counsellors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>
    </SlideOver>
  );
}
