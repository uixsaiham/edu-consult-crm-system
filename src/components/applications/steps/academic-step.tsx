"use client";

import { useState } from "react";
import { GraduationCap, Plus } from "lucide-react";
import { EntryList } from "@/components/applications/entry-list";
import { Field, Select, SectionHeading, TextInput } from "@/components/ui/form-controls";
import {
  educationLevels,
  educationStatuses,
  gradeSchemes,
  makeId,
  type EducationEntry,
} from "@/lib/mock/applications";

const emptyDraft = () => ({
  level: "",
  specialisation: "",
  institute: "",
  status: "",
  qualification: "",
  gradeScheme: "",
  gradeAverage: "",
});

export function AcademicStep({
  entries,
  onAdd,
  onRemove,
}: {
  entries: EducationEntry[];
  onAdd: (entry: EducationEntry) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState(emptyDraft());

  const canAdd = draft.level && draft.specialisation && draft.institute && draft.status && draft.gradeAverage;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({ id: makeId("edu"), ...draft });
    setDraft(emptyDraft());
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeading title="Educational Qualification" description="Add every qualification, most recent first" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Highest level of education" required>
            <Select placeholder="Select" value={draft.level} onChange={(e) => setDraft((d) => ({ ...d, level: e.target.value }))}>
              {educationLevels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Specialisation" required>
            <TextInput value={draft.specialisation} onChange={(e) => setDraft((d) => ({ ...d, specialisation: e.target.value }))} />
          </Field>
          <Field label="Name of institute" required>
            <TextInput value={draft.institute} onChange={(e) => setDraft((d) => ({ ...d, institute: e.target.value }))} />
          </Field>
          <Field label="Education status" required>
            <Select placeholder="Select" value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))}>
              {educationStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Degree/Diploma/Certificate">
            <TextInput value={draft.qualification} onChange={(e) => setDraft((d) => ({ ...d, qualification: e.target.value }))} />
          </Field>
          <Field label="Grade scheme/GPA percentage">
            <Select
              placeholder="Select"
              value={draft.gradeScheme}
              onChange={(e) => setDraft((d) => ({ ...d, gradeScheme: e.target.value }))}
            >
              {gradeSchemes.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Grade average / Marks obtained" required>
            <TextInput value={draft.gradeAverage} onChange={(e) => setDraft((d) => ({ ...d, gradeAverage: e.target.value }))} />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-4" />
              Add education
            </button>
          </div>
        </div>
      </div>

      <div>
        <SectionHeading
          title="Qualifications Added"
          description={`${entries.length} qualification${entries.length === 1 ? "" : "s"} on file`}
        />
        <EntryList
          items={entries}
          onRemove={onRemove}
          emptyIcon={GraduationCap}
          emptyText="No qualifications added yet — this step is optional."
          renderItem={(item) => ({
            title: `${item.level} · ${item.specialisation}`,
            subtitle: item.institute,
            icon: GraduationCap,
            meta: [
              { label: "Status", value: item.status },
              ...(item.qualification ? [{ label: "Award", value: item.qualification }] : []),
              ...(item.gradeScheme ? [{ label: "Scheme", value: item.gradeScheme }] : []),
              { label: "Result", value: item.gradeAverage },
            ],
          })}
        />
      </div>
    </div>
  );
}
