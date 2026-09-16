"use client";

import { useState } from "react";
import { BookOpen, Plus } from "lucide-react";
import { EntryList } from "@/components/applications/entry-list";
import { Field, Select, SectionHeading, TextInput } from "@/components/ui/form-controls";
import {
  countries,
  courseLevels,
  deliveryModes,
  intakes,
  makeId,
  universities,
  type CourseEntry,
} from "@/lib/mock/applications";

const emptyDraft = () => ({
  country: "",
  university: "",
  courseName: "",
  courseLevel: "",
  deliveryMode: "",
  intake: "",
  campus: "",
});

export function CoursesStep({
  entries,
  onAdd,
  onRemove,
}: {
  entries: CourseEntry[];
  onAdd: (entry: CourseEntry) => void;
  onRemove: (id: string) => void;
}) {
  const [draft, setDraft] = useState(emptyDraft());

  const canAdd =
    draft.country && draft.university && draft.courseName && draft.courseLevel && draft.deliveryMode && draft.intake;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({ id: makeId("course"), ...draft });
    setDraft(emptyDraft());
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeading title="Add Course" description="Select the programme this application is for" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Country" required>
            <Select
              placeholder="Select"
              value={draft.country}
              onChange={(e) => setDraft((d) => ({ ...d, country: e.target.value }))}
            >
              {countries.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="University" required>
            <Select
              placeholder="Select"
              value={draft.university}
              onChange={(e) => setDraft((d) => ({ ...d, university: e.target.value }))}
            >
              {universities.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Course name" required>
            <TextInput
              placeholder="Select a course"
              value={draft.courseName}
              onChange={(e) => setDraft((d) => ({ ...d, courseName: e.target.value }))}
            />
          </Field>
          <Field label="Course level" required>
            <Select
              placeholder="Select"
              value={draft.courseLevel}
              onChange={(e) => setDraft((d) => ({ ...d, courseLevel: e.target.value }))}
            >
              {courseLevels.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Course delivery mode" required>
            <Select
              placeholder="Select"
              value={draft.deliveryMode}
              onChange={(e) => setDraft((d) => ({ ...d, deliveryMode: e.target.value }))}
            >
              {deliveryModes.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Intake" required>
            <Select
              placeholder="Select"
              value={draft.intake}
              onChange={(e) => setDraft((d) => ({ ...d, intake: e.target.value }))}
            >
              {intakes.map((i) => (
                <option key={i} value={i}>
                  {i}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Campus">
            <TextInput value={draft.campus} onChange={(e) => setDraft((d) => ({ ...d, campus: e.target.value }))} />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="inline-flex items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-4" />
              Add Course
            </button>
          </div>
        </div>
      </div>

      <div>
        <SectionHeading title="Selected Courses" description={`${entries.length} course${entries.length === 1 ? "" : "s"} added to this application`} />
        <EntryList
          items={entries}
          onRemove={onRemove}
          emptyIcon={BookOpen}
          emptyText="No courses added yet — fill the form above to add one."
          renderItem={(item) => ({
            title: item.courseName,
            subtitle: `${item.university} · ${item.country}`,
            icon: BookOpen,
            meta: [
              { label: "Level", value: item.courseLevel },
              { label: "Mode", value: item.deliveryMode },
              { label: "Intake", value: item.intake },
              ...(item.campus ? [{ label: "Campus", value: item.campus }] : []),
            ],
          })}
        />
      </div>
    </div>
  );
}
