"use client";

import { useRef, useState } from "react";
import { AlertCircle, FileImage, FileText, UploadCloud, X } from "lucide-react";
import type { AnnouncementAttachment } from "@/lib/mock/communications";
import { cn } from "@/lib/utils";

export const allowedExtensions = ["pdf", "doc", "docx", "jpg", "jpeg", "png", "gif"];
const imageExtensions = ["jpg", "jpeg", "png", "gif"];
const acceptAttr = allowedExtensions.map((e) => `.${e}`).join(",");
const MAX_BYTES = 10 * 1024 * 1024;
const MAX_FILES = 5;

export function extensionOf(name: string) {
  return name.split(".").pop()?.toLowerCase() ?? "";
}

export function isImage(name: string) {
  return imageExtensions.includes(extensionOf(name));
}

export function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${Math.round(bytes / 1024)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

/** Multi-file upload limited to PDF, Word and image files. */
export function AttachmentPicker({
  files,
  onChange,
}: {
  files: AnnouncementAttachment[];
  onChange: (files: AnnouncementAttachment[]) => void;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  const add = (list: FileList | null) => {
    if (!list) return;
    const problems: string[] = [];
    const accepted: AnnouncementAttachment[] = [];
    for (const file of Array.from(list)) {
      if (!allowedExtensions.includes(extensionOf(file.name))) {
        problems.push(`${file.name}: file type not allowed`);
      } else if (file.size > MAX_BYTES) {
        problems.push(`${file.name}: larger than 10 MB`);
      } else if (files.some((f) => f.name === file.name) || accepted.some((f) => f.name === file.name)) {
        problems.push(`${file.name}: already attached`);
      } else if (files.length + accepted.length >= MAX_FILES) {
        problems.push(`${file.name}: maximum ${MAX_FILES} files`);
      } else {
        accepted.push({ name: file.name, size: formatBytes(file.size), url: URL.createObjectURL(file) });
      }
    }
    setErrors(problems);
    if (accepted.length) onChange([...files, ...accepted]);
  };

  const remove = (name: string) => {
    const file = files.find((f) => f.name === name);
    if (file?.url?.startsWith("blob:")) URL.revokeObjectURL(file.url);
    onChange(files.filter((f) => f.name !== name));
  };

  return (
    <div className="flex flex-col gap-2">
      <input
        ref={inputRef}
        type="file"
        multiple
        accept={acceptAttr}
        className="hidden"
        onChange={(e) => {
          add(e.target.files);
          e.target.value = "";
        }}
      />
      {files.length < MAX_FILES && (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            add(e.dataTransfer.files);
          }}
          className={cn(
            "flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed px-4 py-5 text-center transition-colors",
            dragging ? "border-primary bg-primary-soft" : "border-border hover:border-primary hover:bg-primary-soft/30"
          )}
        >
          <UploadCloud className="size-5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Click to upload or drag &amp; drop</span>
          <span className="text-[11px] text-muted-foreground">
            Allowed types: PDF, DOC, DOCX, JPG, JPEG, PNG, GIF · up to 10 MB each, {MAX_FILES} files max
          </span>
        </button>
      )}

      {errors.length > 0 && (
        <ul className="flex flex-col gap-1 rounded-xl bg-danger-soft px-3 py-2">
          {errors.map((e) => (
            <li key={e} className="flex items-start gap-1.5 text-[11px] font-medium text-danger">
              <AlertCircle className="mt-px size-3.5 shrink-0" />
              {e}
            </li>
          ))}
        </ul>
      )}

      {files.length > 0 && (
        <ul className="flex flex-col gap-2">
          {files.map((f) => (
            <li key={f.name} className="flex items-center gap-3 rounded-xl border border-border bg-surface-muted p-2 pr-3">
              <AttachmentThumb file={f} />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-foreground">{f.name}</span>
                <span className="text-[11px] uppercase text-muted-foreground">
                  {extensionOf(f.name)} · {f.size}
                </span>
              </span>
              <button
                type="button"
                onClick={() => remove(f.name)}
                aria-label={`Remove ${f.name}`}
                className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
              >
                <X className="size-4" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

/** Image preview for uploaded images, otherwise a file-type icon. */
export function AttachmentThumb({ file, className }: { file: AnnouncementAttachment; className?: string }) {
  if (file.url && isImage(file.name)) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- local blob preview
      <img src={file.url} alt="" className={cn("size-10 shrink-0 rounded-lg object-cover", className)} />
    );
  }
  const Icon = isImage(file.name) ? FileImage : FileText;
  const pdf = extensionOf(file.name) === "pdf";
  return (
    <span
      className={cn(
        "flex size-10 shrink-0 items-center justify-center rounded-lg",
        pdf ? "bg-danger-soft text-danger" : isImage(file.name) ? "bg-success-soft text-success" : "bg-primary-soft text-primary",
        className
      )}
    >
      <Icon className="size-4" />
    </span>
  );
}
