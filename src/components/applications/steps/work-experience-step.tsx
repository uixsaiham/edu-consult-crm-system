"use client";

import { useState } from "react";
import { Briefcase, Plus } from "lucide-react";
import { EntryList } from "@/components/applications/entry-list";
import { Field, Select, SectionHeading, Textarea, TextInput } from "@/components/ui/form-controls";
import { makeId, workStatuses, workTypes, type WorkExperienceEntry } from "@/lib/mock/applications";

const emptyDraft = () => ({
  status: "",
  startDate: "",
  endDate: "",
  employer: "",
  employerEmail: "",
  designation: "",
  workType: "",
  responsibilities: "",
});

export function WorkExperienceStep({
  entries,
  onAdd,
  onRemove,
}: {
  entries: WorkExperienceEntry[];
  onAdd: (entry: WorkExperienceEntry) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState(emptyDraft());

  const canAdd = draft.status && draft.startDate && draft.employer && draft.designation && draft.workType;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({ id: makeId("work"), ...draft });
    setDraft(emptyDraft());
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeading title="Work Experience" description="Employment history relevant to this application" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Work status" required>
            <Select placeholder="Select" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
              {workStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Start date" required>
            <TextInput type="date" value={draft.startDate} onChange={(e) => setDraft((d) => ({ ...d, startDate: e.target.value }))} />
          </Field>
          <Field label="End date">
            <TextInput type="date" value={draft.endDate} onChange={(e) => setDraft((d) => ({ ...d, endDate: e.target.value }))} />
          </Field>
          <Field label="Employer / Company name" required>
            <TextInput value={draft.employer} onChange={(e) => setDraft((d) => ({ ...d, employer: e.target.value }))} />
          </Field>
          <Field label="Employer email address">
            <TextInput
              type="email"
              value={draft.employerEmail}
              onChange={(e) => setDraft((d) => ({ ...d, employerEmail: e.target.value }))}
            />
          </Field>
          <Field label="Designation / Job title" required>
            <TextInput value={draft.designation} onChange={(e) => setDraft((d) => ({ ...d, designation: e.target.value }))} />
          </Field>
          <Field label="Work type" required>
            <Select placeholder="Select" value={draft.workType} onChange={(e) => setDraft((d) => ({ ...d, workType: e.target.value }))}>
              {workTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Responsibilities" className="sm:col-span-2 lg:col-span-4">
            <Textarea
              rows={3}
              value={draft.responsibilities}
              onChange={(e) => setDraft((d) => ({ ...d, responsibilities: e.target.value }))}
            />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-4" />
              Add work experience
            </button>
          </div>
        </div>
      </div>

      <div>
        <SectionHeading
          title="Experience Added"
          description={`${entries.length} entr${entries.length === 1 ? "y" : "ies"} on file`}
        />
        <EntryList
          items={entries}
          onRemove={onRemove}
          emptyIcon={Briefcase}
          emptyText="No work experience added yet — this step is optional."
          renderItem={(item) => ({
            title: `${item.designation} at ${item.employer}`,
            subtitle: item.responsibilities || undefined,
            icon: Briefcase,
            meta: [
              { label: "Status", value: item.status },
              { label: "Type", value: item.workType },
              { label: "From", value: item.startDate || "—" },
              ...(item.endDate ? [{ label: "To", value: item.endDate }] : []),
            ],
          })}
        />
      </div>
    </div>
  );
}
