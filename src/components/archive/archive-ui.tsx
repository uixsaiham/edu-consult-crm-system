"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Archive, CalendarClock, ShieldAlert, Trash2 } from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { Field, Textarea } from "@/components/ui/form-controls";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { formatDay } from "@/components/people/people-ui";
import { archiveKinds, archiveReasons, archiveSummary, archiveToday, retentionState, retentionUntil, type ArchiveKind, type ArchiveMeta } from "@/lib/mock/archive";
import { cn } from "@/lib/utils";

/** Links between the three archive lists, with live counts. */
export function ArchiveNav({ counts }: { counts?: Partial<Record<ArchiveKind, number>> }) {
  const pathname = usePathname();
  const summary = archiveSummary();
  return (
    <nav aria-label="Archive sections" className="inline-flex w-fit max-w-full flex-wrap gap-0.5 self-start rounded-full border border-border bg-surface-muted p-0.5">
      {[{ href: "/archived", label: "Overview", count: undefined as number | undefined }, ...summary.map((s) => ({ href: archiveKinds[s.kind].href, label: archiveKinds[s.kind].label.replace("Archived ", ""), count: counts?.[s.kind] ?? s.total }))].map((t) => {
        const active = pathname === t.href;
        return (
          <Link key={t.href} href={t.href} aria-current={active ? "page" : undefined} className={cn("inline-flex h-8 items-center gap-1.5 whitespace-nowrap rounded-full px-3.5 text-xs font-semibold transition-colors", active ? "bg-surface text-foreground shadow-xs" : "text-muted-foreground hover:text-foreground")}>
            {t.label}
            {t.count !== undefined && <span className="rounded-full bg-surface-hover px-1.5 text-[10px] tabular-nums">{t.count}</span>}
          </Link>
        );
      })}
    </nav>
  );
}

export const retentionOptions = [
  { value: "due", label: "Due for deletion", dot: "bg-danger" },
  { value: "soon", label: "Due within 90 days", dot: "bg-warning" },
  { value: "kept", label: "Within retention", dot: "bg-success" },
];

/** Retention date with a state badge: due for deletion, due soon, or kept. */
export function RetentionCell({ kind, archivedAt }: { kind: ArchiveKind; archivedAt: string }) {
  const state = retentionState(kind, archivedAt);
  return (
    <div className="whitespace-nowrap">
      <p className="text-foreground">{formatDay(retentionUntil(kind, archivedAt))}</p>
      <p className={cn("text-[11px] font-semibold", state === "due" ? "text-danger" : state === "soon" ? "text-warning" : "text-success")}>
        {state === "due" ? "Due for deletion" : state === "soon" ? "Due within 90 days" : "Kept"}
      </p>
    </div>
  );
}

export function ReasonCell({ reason, note }: { reason: string; note: string }) {
  return (
    <div className="max-w-60">
      <span className="inline-flex whitespace-nowrap rounded-full bg-surface-hover px-2.5 py-0.5 text-[11px] font-semibold text-foreground">{reason}</span>
      {note && <p className="mt-1 line-clamp-2 text-[11px] text-muted-foreground" title={note}>{note}</p>}
    </div>
  );
}

export function ArchivedCell({ at, by }: { at: string; by: string }) {
  return (
    <div className="whitespace-nowrap">
      <p className="text-foreground">{formatDay(at)}</p>
      <p className="text-[11px] text-muted-foreground">by {by}</p>
    </div>
  );
}

/** Reason + note dialog, used when archiving from a list and when editing an archived record's reason. */
export function ArchiveDialog({ kind, names, initial, onClose, onConfirm }: { kind: ArchiveKind; names: string[]; initial?: Pick<ArchiveMeta, "reason" | "note">; onClose: () => void; onConfirm: (meta: Pick<ArchiveMeta, "reason" | "note">) => void }) {
  const def = archiveKinds[kind];
  const [reason, setReason] = useState(initial?.reason ?? "");
  const [note, setNote] = useState(initial?.note ?? "");
  const [tried, setTried] = useState(false);
  const who = names.length === 1 ? names[0] : `${names.length} ${def.singular}s`;
  return (
    <Modal open onClose={onClose} icon={Archive} title={initial ? "Edit archive reason" : `Archive ${who}?`}
      subtitle={initial ? who : `Moves to ${def.label}. Nothing is deleted — you can restore it any time.`}
      footer={
        <div className="flex flex-wrap items-center justify-between gap-2">
          <span className="inline-flex items-center gap-1.5 text-[11px] text-muted-foreground"><CalendarClock className="size-3.5" /> Kept until {formatDay(retentionUntil(kind, archiveToday))}</span>
          <div className="flex gap-2">
            <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
            <button type="button" onClick={() => { setTried(true); if (reason) onConfirm({ reason, note: note.trim() }); }} className={buttonPrimary}>{initial ? "Save" : <><Archive className="size-4" /> Archive</>}</button>
          </div>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Reason" required>
          <div className="flex flex-wrap gap-1.5">
            {archiveReasons[kind].map((r) => (
              <button key={r} type="button" aria-pressed={reason === r} onClick={() => setReason(r)} className={cn("rounded-full border px-3 py-1.5 text-xs font-medium transition-colors", reason === r ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-foreground hover:bg-surface-hover")}>
                {r}
              </button>
            ))}
          </div>
          {tried && !reason && <span className="text-[11px] font-medium text-danger">Pick a reason so the team knows why it was closed</span>}
        </Field>
        <Field label="Note" hint="Optional — anything someone restoring it later should know.">
          <Textarea rows={3} value={note} onChange={(e) => setNote(e.target.value)} placeholder="e.g. Called 5 times over 6 weeks, no answer" />
        </Field>
        {!initial && <p className="rounded-xl bg-surface-muted px-3 py-2.5 text-[11px] leading-relaxed text-muted-foreground">{def.policy}</p>}
      </div>
    </Modal>
  );
}

/** Confirms permanent deletion. Warns when some records are still inside their retention period. */
export function PurgeDialog({ kind, entries, name, onClose, onConfirm }: { kind: ArchiveKind; entries: { id: string; archivedAt: string }[]; name: (id: string) => string; onClose: () => void; onConfirm: () => void }) {
  const [ack, setAck] = useState(false);
  const early = entries.filter((e) => retentionState(kind, e.archivedAt) !== "due");
  const who = entries.length === 1 ? name(entries[0].id) : `${entries.length} ${archiveKinds[kind].singular}s`;
  const blocked = early.length > 0 && !ack;
  return (
    <Modal open onClose={onClose} icon={Trash2} size="sm" title={`Delete ${who} permanently?`} subtitle="This can't be undone — the record and its history are erased."
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="button" disabled={blocked} onClick={onConfirm} className={cn(buttonDanger, "disabled:opacity-50")}><Trash2 className="size-4" /> Delete permanently</button>
        </div>
      }
    >
      {early.length > 0 ? (
        <div className="flex flex-col gap-3">
          <p className="flex gap-2 rounded-xl bg-warning-soft px-3 py-2.5 text-xs text-foreground">
            <ShieldAlert className="mt-0.5 size-4 shrink-0 text-warning" />
            <span>{early.length === entries.length ? (entries.length === 1 ? "This record is" : "These records are") : `${early.length} of these are`} still inside the {archiveKinds[kind].retentionYears}-year retention period. Only delete early if the person asked for their data to be erased.</span>
          </p>
          <label className="flex items-center gap-2 text-xs font-medium text-foreground">
            <input type="checkbox" checked={ack} onChange={(e) => setAck(e.target.checked)} className="size-4 accent-danger" />
            I understand — delete before the retention date
          </label>
        </div>
      ) : (
        <p className="text-sm text-muted-foreground">{entries.length === 1 ? "Its" : "Their"} retention period has ended, so deleting now follows the data retention policy.</p>
      )}
    </Modal>
  );
}

/** Label/value row for detail panels. */
export function Detail({ label, children, className }: { label: string; children: ReactNode; className?: string }) {
  return (
    <div className={cn("min-w-0", className)}>
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm text-foreground">{children || "—"}</dd>
    </div>
  );
}

/** Archive details block at the top of a record's panel. */
export function ArchiveInfo({ kind, entry, onEdit }: { kind: ArchiveKind; entry: ArchiveMeta; onEdit: () => void }) {
  const state = retentionState(kind, entry.archivedAt);
  return (
    <section className="rounded-2xl border border-border bg-surface-muted p-4">
      <div className="mb-3 flex items-center justify-between gap-2">
        <h4 className="inline-flex items-center gap-1.5 text-xs font-semibold text-foreground"><Archive className="size-3.5 text-muted-foreground" /> Archive details</h4>
        <button type="button" onClick={onEdit} className="text-xs font-semibold text-primary hover:underline">Edit reason</button>
      </div>
      <dl className="grid grid-cols-2 gap-3">
        <Detail label="Reason">{entry.reason}</Detail>
        <Detail label="Archived">{formatDay(entry.archivedAt)} · {entry.archivedBy}</Detail>
        <Detail label="Keep until"><span className={cn(state === "due" && "font-semibold text-danger", state === "soon" && "font-semibold text-warning")}>{formatDay(retentionUntil(kind, entry.archivedAt))}{state === "due" ? " · due" : ""}</span></Detail>
        <Detail label="Retention">{archiveKinds[kind].retentionYears} years</Detail>
        {entry.note && <Detail label="Note" className="col-span-2">{entry.note}</Detail>}
      </dl>
    </section>
  );
}

export function EmptyArchive({ filtered, noun, onReset }: { filtered: boolean; noun: string; onReset: () => void }) {
  return (
    <div className="flex flex-col items-center gap-2 px-6 py-16 text-center">
      <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground"><Archive className="size-5" /></span>
      <p className="text-sm font-medium text-foreground">{filtered ? `No archived ${noun} match` : `No archived ${noun}`}</p>
      <p className="text-xs text-muted-foreground">{filtered ? "Try another filter or search." : `${noun[0].toUpperCase()}${noun.slice(1)} you archive will appear here.`}</p>
      {filtered && <button type="button" onClick={onReset} className="mt-1 text-xs font-semibold text-primary hover:underline">Reset filters</button>}
    </div>
  );
}
