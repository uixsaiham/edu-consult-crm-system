"use client";

import { useState } from "react";
import { UserCog } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { Field, Select } from "@/components/ui/form-controls";
import { branches, counsellors, type LeadRow } from "@/lib/mock/leads";

export function AssignLeadPanel({
  lead,
  onClose,
  onAssign,
}: {
  lead: LeadRow | null;
  onClose: () => void;
  onAssign: (id: string, branch: string, counsellor: string) => void;
}) {
  const [branch, setBranch] = useState(lead?.branch ?? "");
  const [counsellor, setCounsellor] = useState(lead?.counsellor ?? "");

  const isValid = !!(branch && counsellor);

  function handleSave() {
    if (!lead || !isValid) return;
    onAssign(lead.id, branch, counsellor);
    onClose();
  }

  return (
    <SlideOver
      open={!!lead}
      onClose={onClose}
      icon={UserCog}
      title="Assign Lead"
      subtitle={lead?.name}
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            disabled={!isValid}
            className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Assign
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Branch" required>
          <Select placeholder="Select branch" value={branch} onChange={(e) => setBranch(e.target.value)}>
            {branches.map((b) => (
              <option key={b} value={b}>
                {b}
              </option>
            ))}
          </Select>
        </Field>
        <Field label="Counsellor" required>
          <Select placeholder="Select counsellor" value={counsellor} onChange={(e) => setCounsellor(e.target.value)}>
            {counsellors.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>
      </div>
    </SlideOver>
  );
}
