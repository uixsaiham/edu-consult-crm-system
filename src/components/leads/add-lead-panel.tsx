"use client";

import { useState } from "react";
import { UserPlus } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { Field, Select, Textarea, TextInput } from "@/components/ui/form-controls";
import {
  branches,
  countries,
  counsellors,
  leadSources,
  makeLeadId,
  initialsFor,
  type LeadRow,
} from "@/lib/mock/leads";

const emptyForm = {
  name: "",
  phone: "",
  email: "",
  country: "",
  branch: "",
  counsellor: "",
  leadSource: "",
  leadNote: "",
};

export function AddLeadPanel({
  open,
  onClose,
  onAdd,
}: {
  open: boolean;
  onClose: () => void;
  onAdd: (lead: LeadRow) => void;
}) {
  const [form, setForm] = useState(emptyForm);

  function set<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((f) => ({ ...f, [key]: value }));
  }

  const isValid = !!(form.name.trim() && form.phone.trim() && form.email.trim() && form.leadSource);

  function handleClose() {
    setForm(emptyForm);
    onClose();
  }

  function handleSubmit() {
    if (!isValid) return;
    onAdd({
      id: makeLeadId(),
      name: form.name.trim(),
      initials: initialsFor(form.name.trim()),
      phone: form.phone.trim(),
      email: form.email.trim(),
      country: form.country,
      branch: form.branch,
      counsellor: form.counsellor,
      status: "New",
      leadNote: form.leadNote.trim(),
      leadSource: form.leadSource,
      createdDate: new Date().toISOString().slice(0, 10),
    });
    setForm(emptyForm);
    onClose();
  }

  return (
    <SlideOver
      open={open}
      onClose={handleClose}
      icon={UserPlus}
      title="Add Lead"
      subtitle="Capture a new prospective student"
      footer={
        <div className="flex items-center justify-end gap-2.5">
          <button
            type="button"
            onClick={handleClose}
            className="rounded-full border border-border bg-surface px-4 py-2 text-xs font-semibold text-foreground transition-all hover:bg-surface-hover"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={!isValid}
            className="rounded-full bg-primary px-5 py-2 text-xs font-semibold text-primary-foreground shadow-xs transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
          >
            Add Lead
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Full Name" required>
          <TextInput
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
            placeholder="e.g. Farzana Islam"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Phone" required>
            <TextInput
              value={form.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+880 1XXX XXXXXX"
            />
          </Field>
          <Field label="Email" required>
            <TextInput
              type="email"
              value={form.email}
              onChange={(e) => set("email", e.target.value)}
              placeholder="name@example.com"
            />
          </Field>
        </div>

        <Field label="Country">
          <Select placeholder="Select" value={form.country} onChange={(e) => set("country", e.target.value)}>
            {countries.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </Select>
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Branch" hint="Leave blank to assign later">
            <Select placeholder="Unassigned" value={form.branch} onChange={(e) => set("branch", e.target.value)}>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Counsellor" hint="Leave blank to assign later">
            <Select placeholder="Unassigned" value={form.counsellor} onChange={(e) => set("counsellor", e.target.value)}>
              {counsellors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
        </div>

        <Field label="Lead Source" required>
          <Select placeholder="Select" value={form.leadSource} onChange={(e) => set("leadSource", e.target.value)}>
            {leadSources.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </Select>
        </Field>

        <Field label="Lead Note">
          <Textarea
            rows={3}
            value={form.leadNote}
            onChange={(e) => set("leadNote", e.target.value)}
            placeholder="Any context worth sharing with the assigned counsellor..."
          />
        </Field>
      </div>
    </SlideOver>
  );
}
