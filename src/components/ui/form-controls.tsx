"use client";

import {
  useRef,
  type InputHTMLAttributes,
  type ReactNode,
  type SelectHTMLAttributes,
  type TextareaHTMLAttributes,
} from "react";
import { Check, ChevronDown, UploadCloud, X } from "lucide-react";
import { cn } from "@/lib/utils";

export const fieldClass =
  "w-full rounded-xl border border-border bg-surface px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 transition-all focus:outline-none focus:border-primary focus:ring-4 focus:ring-primary/10 disabled:cursor-not-allowed disabled:bg-surface-muted disabled:opacity-70";

export function Field({
  label,
  required,
  hint,
  className,
  children,
}: {
  label: string;
  required?: boolean;
  hint?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={cn("flex min-w-0 flex-col gap-1.5", className)}>
      <label className="flex items-baseline gap-1 text-xs font-semibold text-foreground">
        {label}
        {required && <span className="text-danger">*</span>}
      </label>
      {children}
      {hint && <span className="text-[11px] text-muted-foreground">{hint}</span>}
    </div>
  );
}

export function TextInput(props: InputHTMLAttributes<HTMLInputElement>) {
  const { className, ...rest } = props;
  return <input className={cn(fieldClass, className)} {...rest} />;
}

export function Textarea(props: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const { className, ...rest } = props;
  return <textarea className={cn(fieldClass, "resize-none", className)} {...rest} />;
}

export function Select({
  className,
  placeholder,
  children,
  ...rest
}: SelectHTMLAttributes<HTMLSelectElement> & { placeholder?: string }) {
  return (
    <div className="relative">
      <select className={cn(fieldClass, "cursor-pointer appearance-none pr-9", className)} {...rest}>
        {placeholder && (
          <option value="" disabled hidden>
            {placeholder}
          </option>
        )}
        {children}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
    </div>
  );
}

export function SectionHeading({
  title,
  description,
  action,
}: {
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
      <div>
        <h4 className="text-sm font-bold text-foreground">{title}</h4>
        {description && <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>}
      </div>
      {action}
    </div>
  );
}

export function PillGroup<T extends string>({
  options,
  value,
  onChange,
}: {
  options: { value: T; label: string }[];
  value: T | "";
  onChange: (v: T) => void;
}) {
  return (
    <div className="inline-flex flex-wrap items-center gap-1 rounded-full border border-border bg-surface-muted p-1">
      {options.map((opt) => {
        const active = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            aria-pressed={active}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-full px-4 py-1.5 text-xs font-semibold whitespace-nowrap transition-all",
              active ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:text-foreground"
            )}
          >
            {opt.label}
          </button>
        );
      })}
    </div>
  );
}

export function Checkbox({
  checked,
  onChange,
  label,
  required,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex cursor-pointer items-start gap-2.5 text-sm text-foreground">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="sr-only"
      />
      <span
        className={cn(
          "mt-0.5 flex size-[18px] shrink-0 items-center justify-center rounded-md border transition-all",
          checked ? "border-primary bg-primary text-primary-foreground" : "border-border-strong bg-surface"
        )}
      >
        {checked && <Check className="size-3" strokeWidth={3} />}
      </span>
      <span className="leading-snug">
        {label} {required && <span className="text-danger">*</span>}
      </span>
    </label>
  );
}

export function Dropzone({
  onFile,
  fileName,
  onClear,
  accept,
}: {
  onFile: (file: File) => void;
  fileName?: string;
  onClear?: () => void;
  accept?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onFile(file);
          e.target.value = "";
        }}
      />
      {fileName ? (
        <div className="flex items-center justify-between gap-2 rounded-xl border border-border bg-surface-muted px-3.5 py-2.5 text-sm">
          <span className="flex min-w-0 items-center gap-2 text-foreground">
            <UploadCloud className="size-4 shrink-0 text-primary" />
            <span className="truncate">{fileName}</span>
          </span>
          {onClear && (
            <button
              type="button"
              onClick={onClear}
              aria-label="Remove file"
              className="shrink-0 rounded-md p-1 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
            >
              <X className="size-4" />
            </button>
          )}
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => e.preventDefault()}
          onDrop={(e) => {
            e.preventDefault();
            const file = e.dataTransfer.files?.[0];
            if (file) onFile(file);
          }}
          className="flex w-full flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-border px-4 py-6 text-center transition-colors hover:border-primary hover:bg-primary-soft/30"
        >
          <UploadCloud className="size-5 text-muted-foreground" />
          <span className="text-xs font-semibold text-foreground">Click to upload or drag &amp; drop</span>
          <span className="text-[11px] text-muted-foreground">PDF, JPG or PNG — up to 10MB</span>
        </button>
      )}
    </div>
  );
}
