"use client";

import { useRef, useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import { Check, ClipboardList, FolderClosed, Plus, Trash2, Users, X, type LucideIcon } from "lucide-react";
import { Tooltip } from "@/components/ui/tooltip";
import { operationsSnapshotDate } from "@/lib/mock/applications";
import {
  getFollowUps,
  getMeetings,
  getQuickNotes,
  type FollowUp,
  type Meeting,
  type QuickNote,
} from "@/lib/mock/quick-actions";
import { useClickOutside } from "@/lib/use-click-outside";
import { cn } from "@/lib/utils";

// "Today" matches the snapshot date used across the dashboard mock data.
const today = operationsSnapshotDate;

const inputClass =
  "h-8 w-full min-w-0 rounded-lg border border-border bg-surface px-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none";

function newId() {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

function daysFromToday(date: string) {
  return Math.round((Date.parse(`${date}T00:00:00Z`) - Date.parse(`${today}T00:00:00Z`)) / 86400000);
}

function shortDate(date: string) {
  return new Date(`${date}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" });
}

/** Shared button + dropdown shell for the three quick-action menus. */
function ActionMenu({
  label,
  icon: Icon,
  badge = 0,
  addLabel,
  renderForm,
  footerLink,
  children,
}: {
  label: string;
  icon: LucideIcon;
  badge?: number;
  addLabel: string;
  renderForm: (done: () => void) => ReactNode;
  footerLink?: { href: string; label: string };
  children: ReactNode;
}) {
  const [open, setOpen] = useState(false);
  const [adding, setAdding] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useClickOutside(ref, () => setOpen(false), open);

  return (
    <div ref={ref} className="relative">
      <Tooltip label={label} hidden={open}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          aria-label={label}
          aria-expanded={open}
          className={cn(
            "relative flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface hover:text-foreground",
            open && "bg-surface text-foreground"
          )}
        >
          <Icon className="size-[17px]" />
          {badge > 0 && (
            <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-primary px-1 text-[9px] font-bold leading-none text-primary-foreground ring-2 ring-surface-muted">
              {badge > 9 ? "9+" : badge}
            </span>
          )}
        </button>
      </Tooltip>

      {open && (
        <div className="absolute right-0 top-full z-30 mt-2 w-80 overflow-hidden rounded-2xl border border-border bg-surface shadow-xl animate-fade-in">
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <p className="text-sm font-semibold text-foreground">{label}</p>
            <button
              type="button"
              onClick={() => setAdding((v) => !v)}
              className="inline-flex items-center gap-1 text-[11px] font-semibold text-primary hover:underline"
            >
              {adding ? <X className="size-3.5" /> : <Plus className="size-3.5" />}
              {adding ? "Cancel" : addLabel}
            </button>
          </div>
          {adding && (
            <div className="border-b border-border bg-surface-muted/50 px-4 py-3">{renderForm(() => setAdding(false))}</div>
          )}
          <div className="max-h-80 overflow-y-auto">{children}</div>
          {footerLink && (
            <Link
              href={footerLink.href}
              onClick={() => setOpen(false)}
              className="block border-t border-border px-4 py-2.5 text-center text-xs font-semibold text-primary transition-colors hover:bg-surface-hover"
            >
              {footerLink.label}
            </Link>
          )}
        </div>
      )}
    </div>
  );
}

function Empty({ children }: { children: ReactNode }) {
  return <p className="px-4 py-8 text-center text-xs text-muted-foreground">{children}</p>;
}

function SubmitButton({ children }: { children: ReactNode }) {
  return (
    <button
      type="submit"
      className="h-8 shrink-0 rounded-lg bg-primary px-3 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
    >
      {children}
    </button>
  );
}

export function FollowUpMenu() {
  const [items, setItems] = useState<FollowUp[]>(getFollowUps);
  const dueCount = items.filter((f) => !f.done && daysFromToday(f.due) <= 0).length;
  const sorted = [...items].sort((a, b) => Number(a.done) - Number(b.done) || a.due.localeCompare(b.due));

  function toggle(id: string) {
    setItems((prev) => prev.map((f) => (f.id === id ? { ...f, done: !f.done } : f)));
  }

  return (
    <ActionMenu
      label="Follow up"
      icon={ClipboardList}
      badge={dueCount}
      addLabel="New follow-up"
      footerLink={{ href: "/leads/follow-ups", label: "View all follow-ups" }}
      renderForm={(done) => (
        <FollowUpForm
          onAdd={(item) => {
            setItems((prev) => [...prev, item]);
            done();
          }}
        />
      )}
    >
      {sorted.length === 0 ? (
        <Empty>No follow-ups scheduled.</Empty>
      ) : (
        <ul className="divide-y divide-border/70">
          {sorted.map((f) => {
            const days = daysFromToday(f.due);
            return (
              <li key={f.id} className="flex items-start gap-3 px-4 py-3">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={f.done}
                  aria-label={`Mark follow-up with ${f.lead} as ${f.done ? "not done" : "done"}`}
                  onClick={() => toggle(f.id)}
                  className={cn(
                    "mt-0.5 flex size-4 shrink-0 items-center justify-center rounded border transition-colors",
                    f.done ? "border-primary bg-primary text-primary-foreground" : "border-border-strong hover:border-primary"
                  )}
                >
                  {f.done && <Check className="size-3" strokeWidth={3} />}
                </button>
                <span className={cn("min-w-0 flex-1", f.done && "opacity-50")}>
                  <span className={cn("block truncate text-xs font-semibold text-foreground", f.done && "line-through")}>
                    {f.lead}
                  </span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">{f.note}</span>
                </span>
                <span
                  className={cn(
                    "shrink-0 rounded-full px-2 py-0.5 text-[10px] font-medium",
                    f.done
                      ? "bg-surface-muted text-muted-foreground"
                      : days < 0
                        ? "bg-danger-soft text-danger"
                        : days === 0
                          ? "bg-warning-soft text-warning"
                          : "bg-surface-muted text-muted-foreground"
                  )}
                >
                  {f.done ? "Done" : days < 0 ? `${-days}d overdue` : days === 0 ? "Today" : `in ${days}d`}
                </span>
              </li>
            );
          })}
        </ul>
      )}
    </ActionMenu>
  );
}

function FollowUpForm({ onAdd }: { onAdd: (item: FollowUp) => void }) {
  const [lead, setLead] = useState("");
  const [note, setNote] = useState("");
  const [due, setDue] = useState(today);

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!lead.trim()) return;
    onAdd({ id: newId(), lead: lead.trim(), note: note.trim() || "Follow up", due, done: false });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <input autoFocus required aria-label="Lead name" placeholder="Lead name" value={lead} onChange={(e) => setLead(e.target.value)} className={inputClass} />
      <input aria-label="What to follow up on" placeholder="What to follow up on" value={note} onChange={(e) => setNote(e.target.value)} className={inputClass} />
      <div className="flex gap-2">
        <input type="date" required aria-label="Due date" value={due} onChange={(e) => setDue(e.target.value)} className={inputClass} />
        <SubmitButton>Add</SubmitButton>
      </div>
    </form>
  );
}

export function MeetingMenu() {
  const [items, setItems] = useState<Meeting[]>(getMeetings);
  const todayCount = items.filter((m) => m.date === today).length;
  const sorted = [...items].sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));

  return (
    <ActionMenu
      label="Meeting"
      icon={Users}
      badge={todayCount}
      addLabel="New meeting"
      renderForm={(done) => (
        <MeetingForm
          onAdd={(item) => {
            setItems((prev) => [...prev, item]);
            done();
          }}
        />
      )}
    >
      {sorted.length === 0 ? (
        <Empty>No meetings scheduled.</Empty>
      ) : (
        <ul className="divide-y divide-border/70">
          {sorted.map((m) => {
            const days = daysFromToday(m.date);
            return (
              <li key={m.id} className="group flex items-center gap-3 px-4 py-3">
                <span className="flex w-12 shrink-0 flex-col items-center rounded-lg bg-surface-muted py-1">
                  <span className="text-xs font-semibold tabular-nums text-foreground">{m.time}</span>
                  <span className={cn("text-[10px]", days === 0 ? "font-medium text-primary" : "text-muted-foreground")}>
                    {days === 0 ? "Today" : days === 1 ? "Tomorrow" : shortDate(m.date)}
                  </span>
                </span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-foreground">{m.title}</span>
                  <span className="mt-0.5 block truncate text-xs text-muted-foreground">with {m.attendee}</span>
                </span>
                <button
                  type="button"
                  aria-label={`Cancel ${m.title}`}
                  onClick={() => setItems((prev) => prev.filter((x) => x.id !== m.id))}
                  className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
                >
                  <X className="size-3.5" />
                </button>
              </li>
            );
          })}
        </ul>
      )}
    </ActionMenu>
  );
}

function MeetingForm({ onAdd }: { onAdd: (item: Meeting) => void }) {
  const [title, setTitle] = useState("");
  const [attendee, setAttendee] = useState("");
  const [date, setDate] = useState(today);
  const [time, setTime] = useState("10:00");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ id: newId(), title: title.trim(), attendee: attendee.trim() || "Team", date, time });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <input autoFocus required aria-label="Meeting title" placeholder="Meeting title" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} />
      <input aria-label="With" placeholder="With (student, agent or team)" value={attendee} onChange={(e) => setAttendee(e.target.value)} className={inputClass} />
      <div className="flex gap-2">
        <input type="date" required aria-label="Date" value={date} onChange={(e) => setDate(e.target.value)} className={inputClass} />
        <input type="time" required aria-label="Time" value={time} onChange={(e) => setTime(e.target.value)} className={cn(inputClass, "w-24")} />
        <SubmitButton>Add</SubmitButton>
      </div>
    </form>
  );
}

export function NotesMenu() {
  const [items, setItems] = useState<QuickNote[]>(getQuickNotes);

  return (
    <ActionMenu
      label="Notes"
      icon={FolderClosed}
      addLabel="New note"
      renderForm={(done) => (
        <NoteForm
          onAdd={(item) => {
            setItems((prev) => [item, ...prev]);
            done();
          }}
        />
      )}
    >
      {items.length === 0 ? (
        <Empty>No notes yet.</Empty>
      ) : (
        <ul className="divide-y divide-border/70">
          {items.map((n) => (
            <li key={n.id} className="group flex items-start gap-3 px-4 py-3">
              <span className="min-w-0 flex-1">
                <span className="block whitespace-pre-wrap break-words text-xs text-foreground">{n.text}</span>
                <span className="mt-1 block text-[10px] text-muted-foreground/70">{n.created}</span>
              </span>
              <button
                type="button"
                aria-label="Delete note"
                onClick={() => setItems((prev) => prev.filter((x) => x.id !== n.id))}
                className="shrink-0 rounded-md p-1 text-muted-foreground opacity-0 transition-opacity hover:text-danger focus-visible:opacity-100 group-hover:opacity-100"
              >
                <Trash2 className="size-3.5" />
              </button>
            </li>
          ))}
        </ul>
      )}
    </ActionMenu>
  );
}

function NoteForm({ onAdd }: { onAdd: (item: QuickNote) => void }) {
  const [text, setText] = useState("");

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!text.trim()) return;
    onAdd({ id: newId(), text: text.trim(), created: "Just now" });
  }

  return (
    <form onSubmit={submit} className="flex flex-col gap-2">
      <textarea
        autoFocus
        required
        rows={3}
        aria-label="Note"
        placeholder="Write a note…"
        value={text}
        onChange={(e) => setText(e.target.value)}
        className="w-full resize-none rounded-lg border border-border bg-surface px-2.5 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
      />
      <div className="flex justify-end">
        <SubmitButton>Save note</SubmitButton>
      </div>
    </form>
  );
}
