"use client";

import { useState } from "react";
import { FileText, Plus } from "lucide-react";
import { EntryList } from "@/components/applications/entry-list";
import { Dropzone, Field, Select, SectionHeading, TextInput } from "@/components/ui/form-controls";
import { documentTypes, makeId, type DocumentEntry } from "@/lib/mock/applications";

export function DocumentsStep({
  entries,
  onAdd,
  onRemove,
}: {
  entries: DocumentEntry[];
  onAdd: (entry: DocumentEntry) => void;
  onRemove: (id: string) => void;
}) {
  const [type, setType] = useState("");
  const [title, setTitle] = useState("");
  const [fileName, setFileName] = useState("");

  const canAdd = type && title && fileName;

  function handleAdd() {
    if (!canAdd) return;
    onAdd({ id: makeId("doc"), type, title, fileName });
    setType("");
    setTitle("");
    setFileName("");
  }

  return (
    <div className="flex flex-col gap-6">
      <div>
        <SectionHeading title="Application Documents" description="Upload supporting files for the application" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Document type" required>
            <Select placeholder="Select" value={type} onChange={(e) => setType(e.target.value)}>
              {documentTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Document title" required>
            <TextInput value={title} onChange={(e) => setTitle(e.target.value)} />
          </Field>
          <Field label="Upload file" required className="sm:col-span-2 lg:col-span-2">
            <Dropzone fileName={fileName} onFile={(f) => setFileName(f.name)} onClear={() => setFileName("")} />
          </Field>
          <div className="flex items-end">
            <button
              type="button"
              onClick={handleAdd}
              disabled={!canAdd}
              className="inline-flex min-h-10 items-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-all hover:bg-primary-hover active:scale-95 disabled:cursor-not-allowed disabled:opacity-40"
            >
              <Plus className="size-4" />
              Add document
            </button>
          </div>
        </div>
      </div>

      <div>
        <SectionHeading
          title="Uploaded Documents"
          description={`${entries.length} file${entries.length === 1 ? "" : "s"} attached`}
        />
        <EntryList
          items={entries}
          onRemove={onRemove}
          emptyIcon={FileText}
          emptyText="No documents uploaded yet — this step is optional."
          renderItem={(item) => ({
            title: item.title,
            subtitle: item.fileName,
            icon: FileText,
            meta: [{ label: "Type", value: item.type }],
          })}
        />
      </div>
    </div>
  );
}
