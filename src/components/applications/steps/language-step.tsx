"use client";

import { useState } from "react";
import { Languages, Plus } from "lucide-react";
import { EntryList } from "@/components/applications/entry-list";
import { Dropzone, Field, Select, SectionHeading, TextInput } from "@/components/ui/form-controls";
import { makeId, testStatuses, testTypes, type LanguageEntry } from "@/lib/mock/applications";

const emptyDraft = () => ({
  testType: "",
  testStatus: "",
  overallScore: "",
  completionDate: "",
  fileName: "",
});

export function LanguageStep({
  entries,
  onAdd,
  onRemove,
}: {
  entries: LanguageEntry[];
  onAdd: (entry: LanguageEntry) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState(emptyDraft());

  const canAdd = draft.testType && draft.testStatus;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({ id: makeId("lang"), ...draft });
    setDraft(emptyDraft());
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeading title="Language Proficiency" description="Add every language test attempt" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Test type" required>
            <Select placeholder="Select" value={draft.testType} onChange={(e) => setDraft((d) => ({ ...d, testType: e.target.value }))}>
              {testTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Test status" required>
            <Select
              placeholder="Select"
              value={draft.testStatus}
              onChange={(e) => setDraft((d) => ({ ...d, testStatus: e.target.value }))}
            >
              {testStatuses.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Overall score">
            <TextInput value={draft.overallScore} onChange={(e) => setDraft((d) => ({ ...d, overallScore: e.target.value }))} />
          </Field>
          <Field label="Expected completion date">
            <TextInput
              type="date"
              value={draft.completionDate}
              onChange={(e) => setDraft((d) => ({ ...d, completionDate: e.target.value }))}
            />
          </Field>
          <Field label="Upload certificate" className="sm:col-span-2 lg:col-span-2">
            <Dropzone
              fileName={draft.fileName}
              onFile={(f) => setDraft((d) => ({ ...d, fileName: f.name }))}
              onClear={() => setDraft((d) => ({ ...d, fileName: "" }))}
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
              Add test result
            </button>
          </div>
        </div>
      </div>

      <div>
        <SectionHeading
          title="Test Results Added"
          description={`${entries.length} test result${entries.length === 1 ? "" : "s"} on file`}
        />
        <EntryList
          items={entries}
          onRemove={onRemove}
          emptyIcon={Languages}
          emptyText="No language test results added yet — this step is optional."
          renderItem={(item) => ({
            title: item.testType,
            subtitle: item.fileName || undefined,
            icon: Languages,
            meta: [
              { label: "Status", value: item.testStatus },
              ...(item.overallScore ? [{ label: "Score", value: item.overallScore }] : []),
              ...(item.completionDate ? [{ label: "Date", value: item.completionDate }] : []),
            ],
          })}
        />
      </div>
    </div>
  );
}
