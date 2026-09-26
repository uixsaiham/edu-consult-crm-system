"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import { CalendarClock, CircleAlert, FileUp, Minus, NotebookPen, Plus, Users } from "lucide-react";
import { formatCreated } from "./format";
import { Modal } from "@/components/ui/modal";
import { Field, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import type { ApplicationRow, DocumentRequest, FollowUp, Meeting } from "@/lib/mock/applications";
import { cn } from "@/lib/utils";

/** "Now" for the demo data, as a datetime-local value. */
export const NOW_LOCAL = "2026-09-17T11:00";

const toIso = (local: string) => `${local}:00Z`;
const addDays = (days: number, time = "10:00") => {
  const d = new Date(`${NOW_LOCAL.slice(0, 10)}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return `${d.toISOString().slice(0, 10)}T${time}`;
};
const nextMonday = () => {
  const d = new Date(`${NOW_LOCAL.slice(0, 10)}T00:00:00Z`);
  return addDays(((8 - d.getUTCDay()) % 7) || 7);
};
const uid = (p: string) => `${p}-${Date.now().toString(36)}${Math.random().toString(36).slice(2, 5)}`;

function Footer({ onCancel, submitLabel, form }: { onCancel: () => void; submitLabel: string; form: string }) {
  return (
    <div className="flex justify-end gap-2">
      <button type="button" onClick={onCancel} className={buttonSecondary}>
        Cancel
      </button>
      <button type="submit" form={form} className={buttonPrimary}>
        {submitLabel}
      </button>
    </div>
  );
}

function Chips<T extends string>({ options, value, onToggle, multi }: { options: readonly T[]; value: T[]; onToggle: (v: T) => void; multi?: boolean }) {
  return (
    <div className="flex flex-wrap gap-1.5" role={multi ? "group" : "radiogroup"}>
      {options.map((o) => {
        const on = value.includes(o);
        return (
          <button
            key={o}
            type="button"
            role={multi ? undefined : "radio"}
            aria-checked={multi ? undefined : on}
            aria-pressed={multi ? on : undefined}
            onClick={() => onToggle(o)}
            className={cn(
              "h-8 rounded-full border px-3 text-xs font-medium transition-colors",
              on ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground"
            )}
          >
            {o}
          </button>
        );
      })}
    </div>
  );
}

function ErrorText({ children }: { children?: ReactNode }) {
  if (!children) return null;
  return (
    <span className="flex items-center gap-1 text-[11px] font-medium text-danger">
      <CircleAlert className="size-3 shrink-0" />
      {children}
    </span>
  );
}

function QuickPicks({ onPick }: { onPick: (v: string) => void }) {
  const picks = [
    { label: "Later today", value: `${NOW_LOCAL.slice(0, 10)}T16:00` },
    { label: "Tomorrow 10:00", value: addDays(1) },
    { label: "In 3 days", value: addDays(3) },
    { label: "Next Monday", value: nextMonday() },
  ];
  return (
    <div className="flex flex-wrap gap-1.5">
      {picks.map((p) => (
        <button
          key={p.label}
          type="button"
          onClick={() => onPick(p.value)}
          className="h-7 rounded-full bg-surface-hover px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
        >
          {p.label}
        </button>
      ))}
    </div>
  );
}

// --- Document request ---------------------------------------------------

const templates = [
  { title: "Passport copy", description: "Clear colour scan of the photo page, valid for at least 6 months." },
  { title: "Bank statement", description: "Last 28 days, showing the required maintenance funds held continuously." },
  { title: "Academic transcripts", description: "Final transcripts and certificates for your highest qualification." },
  { title: "English test certificate", description: "IELTS / PTE / TOEFL result with your test reference number." },
  { title: "Share code", description: "Home Office share code proving your right to study in the UK." },
  { title: "CV", description: "Up-to-date CV including any gaps in education or employment." },
];
const sendChannels = ["Email", "WhatsApp", "Student portal"] as const;

export function DocumentRequestModal({
  app,
  by,
  onClose,
  onSend,
}: {
  app: ApplicationRow;
  by: string;
  onClose: () => void;
  onSend: (r: DocumentRequest) => void;
}) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [count, setCount] = useState(1);
  const [dueDate, setDueDate] = useState(addDays(7).slice(0, 10));
  const [channels, setChannels] = useState<DocumentRequest["channels"]>(["Email", "WhatsApp"]);
  const [tried, setTried] = useState(false);
  const errors = {
    title: !title.trim() ? "Give the request a title" : "",
    dueDate: !dueDate ? "Choose a due date" : dueDate < NOW_LOCAL.slice(0, 10) ? "Due date can't be in the past" : "",
    channels: channels.length === 0 ? "Choose at least one way to send it" : "",
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (Object.values(errors).some(Boolean)) return;
    onSend({
      id: uid("DOC"),
      title: title.trim(),
      description: description.trim(),
      count,
      dueDate,
      channels,
      requestedAt: toIso(NOW_LOCAL),
      by,
      status: "Requested",
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={FileUp}
      title="Request documents"
      subtitle={`From ${app.applicant} · ${app.email}`}
      footer={<Footer onCancel={onClose} submitLabel="Send request" form="doc-request" />}
    >
      <form id="doc-request" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <div>
          <p className="mb-1.5 text-xs font-semibold text-foreground">Common requests</p>
          <div className="flex flex-wrap gap-1.5">
            {templates.map((t) => (
              <button
                key={t.title}
                type="button"
                onClick={() => {
                  setTitle(t.title);
                  setDescription(t.description);
                }}
                className={cn(
                  "h-7 rounded-full border px-2.5 text-[11px] font-medium transition-colors",
                  title === t.title ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground"
                )}
              >
                {t.title}
              </button>
            ))}
          </div>
        </div>
        <Field label="Document title" required>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. Bank statement" className={cn(tried && errors.title && "border-danger")} />
          <ErrorText>{tried && errors.title}</ErrorText>
        </Field>
        <Field label="What the student should send" hint="Shown to the student in the request.">
          <Textarea rows={3} value={description} onChange={(e) => setDescription(e.target.value)} placeholder="Explain exactly what you need and any requirements." />
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Number of documents" required>
            <div className="flex h-[42px] items-center justify-between rounded-xl border border-border px-1.5">
              <button type="button" aria-label="Fewer documents" onClick={() => setCount((c) => Math.max(1, c - 1))} disabled={count <= 1} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover disabled:opacity-40">
                <Minus className="size-4" />
              </button>
              <span className="text-sm font-semibold tabular-nums text-foreground" aria-live="polite">{count}</span>
              <button type="button" aria-label="More documents" onClick={() => setCount((c) => Math.min(10, c + 1))} disabled={count >= 10} className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-surface-hover disabled:opacity-40">
                <Plus className="size-4" />
              </button>
            </div>
          </Field>
          <Field label="Due by" required>
            <TextInput type="date" min={NOW_LOCAL.slice(0, 10)} value={dueDate} onChange={(e) => setDueDate(e.target.value)} className={cn(tried && errors.dueDate && "border-danger")} />
            <ErrorText>{tried && errors.dueDate}</ErrorText>
          </Field>
        </div>
        <Field label="Send via" required>
          <Chips
            multi
            options={sendChannels}
            value={channels}
            onToggle={(c) => setChannels((list) => (list.includes(c) ? list.filter((x) => x !== c) : [...list, c]))}
          />
          <ErrorText>{tried && errors.channels}</ErrorText>
        </Field>
      </form>
    </Modal>
  );
}

// --- Follow-up ------------------------------------------------------------

const followChannels = ["Call", "WhatsApp", "Email", "In person"] as const;

export function FollowUpModal({
  app,
  by,
  onClose,
  onSave,
}: {
  app: ApplicationRow;
  by: string;
  onClose: () => void;
  onSave: (f: FollowUp) => void;
}) {
  const [at, setAt] = useState(addDays(1));
  const [channel, setChannel] = useState<FollowUp["channel"]>("Call");
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);
  const error = !at ? "Pick a date and time" : at <= NOW_LOCAL ? "Choose a time in the future" : "";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (error) return;
    onSave({ id: uid("FU"), at: toIso(at), channel, notes: notes.trim(), by, done: false });
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      icon={CalendarClock}
      title="Schedule follow-up"
      subtitle={`${app.applicant} · ${app.phone}`}
      footer={<Footer onCancel={onClose} submitLabel="Save follow-up" form="follow-up" />}
    >
      <form id="follow-up" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="When" required>
          <TextInput type="datetime-local" min={NOW_LOCAL} value={at} onChange={(e) => setAt(e.target.value)} className={cn(tried && error && "border-danger")} />
          <QuickPicks onPick={setAt} />
          <ErrorText>{tried && error}</ErrorText>
        </Field>
        <Field label="How">
          <Chips options={followChannels} value={[channel]} onToggle={setChannel} />
        </Field>
        <Field label="Notes">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="What to discuss, e.g. confirm IELTS booking and deposit date." />
        </Field>
      </form>
    </Modal>
  );
}

// --- Meeting ----------------------------------------------------------------

const formats = ["In person", "Video call", "Phone"] as const;

export function MeetingModal({
  app,
  counsellors,
  onClose,
  onSave,
}: {
  app: ApplicationRow;
  counsellors: string[];
  onClose: () => void;
  onSave: (m: Meeting) => void;
}) {
  const [at, setAt] = useState(addDays(1, "14:00"));
  const [counsellor, setCounsellor] = useState(app.counsellor);
  const [format, setFormat] = useState<Meeting["format"]>("Video call");
  const [duration, setDuration] = useState(30);
  const [notes, setNotes] = useState("");
  const [tried, setTried] = useState(false);
  const errors = {
    at: !at ? "Pick a meeting time" : at <= NOW_LOCAL ? "Choose a time in the future" : "",
    counsellor: !counsellor ? "Choose a counsellor" : "",
  };

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errors.at || errors.counsellor) return;
    onSave({ id: uid("MT"), at: toIso(at), counsellor, format, durationMins: duration, notes: notes.trim() });
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={Users}
      title="Book a meeting"
      subtitle={`With ${app.applicant}`}
      footer={<Footer onCancel={onClose} submitLabel="Book meeting" form="meeting" />}
    >
      <form id="meeting" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Meeting time" required>
          <TextInput type="datetime-local" min={NOW_LOCAL} value={at} onChange={(e) => setAt(e.target.value)} className={cn(tried && errors.at && "border-danger")} />
          <QuickPicks onPick={setAt} />
          <ErrorText>{tried && errors.at}</ErrorText>
        </Field>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Counsellor" required>
            <Select value={counsellor} onChange={(e) => setCounsellor(e.target.value)} placeholder="Select a counsellor">
              {counsellors.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
            <ErrorText>{tried && errors.counsellor}</ErrorText>
          </Field>
          <Field label="Duration">
            <Select value={String(duration)} onChange={(e) => setDuration(Number(e.target.value))}>
              {[15, 30, 45, 60, 90].map((m) => (
                <option key={m} value={m}>
                  {m} minutes
                </option>
              ))}
            </Select>
          </Field>
        </div>
        <Field label="Format">
          <Chips options={formats} value={[format]} onToggle={setFormat} />
        </Field>
        <Field label="Meeting notes">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Agenda, documents to bring, meeting link…" />
        </Field>
      </form>
    </Modal>
  );
}

// --- Notes ------------------------------------------------------------------

const noteStarters = ["Called — no answer", "Documents chased on WhatsApp", "Student confirmed intake", "Awaiting university response"];

export function NoteModal({ app, onClose, onSave }: { app: ApplicationRow; onClose: () => void; onSave: (text: string) => void }) {
  const [text, setText] = useState("");
  const [tried, setTried] = useState(false);
  const error = !text.trim() ? "Write a note first" : "";

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (error) return;
    onSave(text.trim());
  };

  return (
    <Modal
      open
      onClose={onClose}
      size="sm"
      icon={NotebookPen}
      title="Add note"
      subtitle={`${app.applicant} · ${app.id}`}
      footer={<Footer onCancel={onClose} submitLabel="Save note" form="app-note" />}
    >
      <form id="app-note" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Note" required>
          <Textarea
            rows={4}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && (e.metaKey || e.ctrlKey)) submit(e);
            }}
            placeholder="What happened, what's next…"
            className={cn(tried && error && "border-danger")}
          />
          <div className="flex flex-wrap gap-1.5">
            {noteStarters.map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setText((t) => (t.trim() ? `${t.trim()} ${s}` : s))}
                className="h-7 rounded-full bg-surface-hover px-2.5 text-[11px] font-medium text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary"
              >
                {s}
              </button>
            ))}
          </div>
          <ErrorText>{tried && error}</ErrorText>
        </Field>
        {app.notes.length > 0 && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-semibold text-foreground">
              Previous notes <span className="font-normal text-muted-foreground">· {app.notes.length}</span>
            </p>
            <ul className="flex max-h-44 flex-col gap-2 overflow-y-auto">
              {app.notes.map((n, i) => (
                <li key={i} className="rounded-xl bg-surface-muted px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{n.author}</span> · {formatCreated(n.at)}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground">{n.text}</p>
                </li>
              ))}
            </ul>
          </div>
        )}
      </form>
    </Modal>
  );
}
