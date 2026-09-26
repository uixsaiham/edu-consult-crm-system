"use client";

import { useState, type FormEvent, type ReactNode } from "react";
import Link from "next/link";
import {
  AlertTriangle,
  ArrowRight,
  CalendarClock,
  Check,
  ChevronDown,
  ClipboardList,
  GraduationCap,
  Mail,
  MessageCircle,
  Phone,
  SendHorizontal,
  BookOpen,
  CalendarPlus,
  FileUp,
  Users,
  Video,
  UserRound,
  XCircle,
} from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import {
  applicationStageStyles,
  applicationStages,
  fundingStatuses,
  fundingStyles,
  operationsSnapshotDate,
  type ApplicationRow,
  type ApplicationStage,
  type FundingStatus,
} from "@/lib/mock/applications";
import { cn, initialsFor } from "@/lib/utils";
import { AnchoredMenu, MenuItem } from "./anchored-menu";
import { formatCreated, whatsappLink } from "./format";


/** The happy path shown in the progress tracker. */
export const journey: { label: string; stages: ApplicationStage[] }[] = [
  { label: "New", stages: ["New"] },
  { label: "Submitted", stages: ["App submitted"] },
  { label: "Offer", stages: ["Conditional offer", "Unconditional offer"] },
  { label: "CAS", stages: ["CAS issued"] },
  { label: "Visa", stages: ["Visa filed"] },
  { label: "Enrolled", stages: ["Enrolled"] },
];

export function ApplicationDrawer({
  app,
  onClose,
  onStage,
  onFunding,
  onAddNote,
  onAction,
  onToggleFollowUp,
  onReceivedDoc,
}: {
  app: ApplicationRow;
  onClose: () => void;
  onStage: (stage: ApplicationStage) => void;
  onFunding: (funding: FundingStatus) => void;
  onAddNote: (text: string) => void;
  onAction: (kind: "courses" | "docs" | "followUp" | "meeting") => void;
  onToggleFollowUp: (id: string) => void;
  onReceivedDoc: (id: string) => void;
}) {
  const [draft, setDraft] = useState("");
  const closed = app.stage === "Rejected" || app.stage === "Withdrawn";
  const step = journey.findIndex((j) => j.stages.includes(app.stage));
  const stage = applicationStageStyles[app.stage];

  const submit = (e: FormEvent) => {
    e.preventDefault();
    if (!draft.trim()) return;
    onAddNote(draft.trim());
    setDraft("");
  };

  return (
    <SlideOver open onClose={onClose} icon={ClipboardList} title={app.applicant} subtitle={`${app.id} · ${app.channel} application`}>
      <div className="flex flex-col gap-6">
        <header className="flex items-center gap-4">
          <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-primary-soft text-sm font-bold text-primary">
            {app.initials}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap gap-1.5">
              <AnchoredMenu
                label="Change application status"
                triggerClassName={cn("inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold", stage.bg, stage.text)}
                trigger={
                  <>
                    <span className={cn("size-1.5 rounded-full", stage.dot)} />
                    {app.stage}
                    <ChevronDown className="size-3" />
                  </>
                }
              >
                {(close) =>
                  applicationStages.map((s) => (
                    <MenuItem key={s} selected={s === app.stage} onClick={() => { onStage(s); close(); }}>
                      {s}
                    </MenuItem>
                  ))
                }
              </AnchoredMenu>
              <AnchoredMenu
                label="Change fees and funding"
                triggerClassName={cn("inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-semibold", fundingStyles[app.funding])}
                trigger={
                  <>
                    {app.funding === "N/A" ? "Funding: N/A" : app.funding}
                    <ChevronDown className="size-3" />
                  </>
                }
              >
                {(close) =>
                  fundingStatuses.map((f) => (
                    <MenuItem key={f} selected={f === app.funding} onClick={() => { onFunding(f); close(); }}>
                      {f}
                    </MenuItem>
                  ))
                }
              </AnchoredMenu>
            </div>
            <div className="mt-2.5 flex flex-wrap gap-1.5">
              <ContactButton href={`tel:${app.phone.replace(/[^\d+]/g, "")}`} icon={Phone} label="Call" />
              <ContactButton href={whatsappLink(app.phone)} icon={MessageCircle} label="WhatsApp" external />
              <ContactButton href={`mailto:${app.email}`} icon={Mail} label="Email" />
            </div>
          </div>
        </header>

        <div className="grid grid-cols-3 gap-2">
          <QuickAction icon={FileUp} label="Request docs" onClick={() => onAction("docs")} />
          <QuickAction icon={CalendarPlus} label="Follow-up" onClick={() => onAction("followUp")} />
          <QuickAction icon={Users} label="Meeting" onClick={() => onAction("meeting")} />
        </div>

        <Link
          href={`/applications/${app.id}`}
          className="-mt-3 flex items-center justify-center gap-1.5 rounded-xl bg-primary px-4 py-2.5 text-xs font-semibold text-primary-foreground transition-colors hover:bg-primary-hover"
        >
          View full details
          <ArrowRight className="size-3.5" />
        </Link>

        {closed ? (
          <div className="flex items-center gap-3 rounded-2xl border border-danger/20 bg-danger-soft px-4 py-3 text-sm">
            <XCircle className="size-5 shrink-0 text-danger" />
            <span className="text-foreground">
              Application <span className="font-semibold">{app.stage.toLowerCase()}</span>
              {app.notes[0] ? ` — ${app.notes[0].text}` : "."}
            </span>
          </div>
        ) : (
          <ol className="flex items-start" aria-label="Application progress">
            {journey.map((j, i) => {
              const done = i < step;
              const current = i === step;
              return (
                <li key={j.label} className="relative flex flex-1 flex-col items-center gap-1.5 text-center">
                  {i > 0 && (
                    <span className={cn("absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2", i <= step ? "bg-primary" : "bg-border")} />
                  )}
                  <span
                    className={cn(
                      "relative z-10 flex size-6 items-center justify-center rounded-full text-[10px] font-bold",
                      done ? "bg-primary text-primary-foreground" : current ? "bg-primary text-primary-foreground ring-4 ring-primary/20" : "bg-surface-hover text-muted-foreground"
                    )}
                  >
                    {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                  </span>
                  <span className={cn("text-[10px] font-medium", current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>{j.label}</span>
                </li>
              );
            })}
          </ol>
        )}

        <Section
          title={`Programme${app.courseOptions.length ? ` · ${app.courseOptions.length + 1} courses` : ""}`}
          icon={GraduationCap}
          action={
            <button
              type="button"
              onClick={() => onAction("courses")}
              className="inline-flex h-6 items-center gap-1 rounded-full px-2 text-[11px] font-semibold normal-case tracking-normal text-primary hover:bg-primary-soft"
            >
              <BookOpen className="size-3" /> Manage
            </button>
          }
        >
          <span className="mb-1 inline-flex rounded bg-primary px-1.5 text-[10px] font-semibold text-primary-foreground">Main choice</span>
          <p className="text-sm font-semibold text-foreground">{app.course}</p>
          <p className="text-xs text-muted-foreground">{app.university}</p>
          <div className="mt-3 grid grid-cols-3 gap-2">
            <Mini label="Campus" value={app.campus} />
            <Mini label="Intake" value={app.intake} />
            <Mini label="Student ID" value={app.studentId || "Not issued"} muted={!app.studentId} />
          </div>
          {app.courseOptions.length > 0 && (
            <ol className="mt-4 flex flex-col gap-2 border-t border-border pt-3">
              {app.courseOptions.map((c, i) => {
                const cs = applicationStageStyles[c.stage];
                return (
                  <li key={c.id} className="flex items-center gap-3 rounded-xl bg-surface-muted px-3 py-2.5">
                    <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-surface text-[10px] font-bold text-muted-foreground">{i + 2}</span>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-xs font-semibold text-foreground">{c.course}</p>
                      <p className="truncate text-[11px] text-muted-foreground">
                        {c.university} · {c.campus} · {c.intake}
                      </p>
                    </div>
                    <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[10px] font-semibold", cs.bg, cs.text)}>{c.stage}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </Section>

        <Section title="Student & ownership" icon={UserRound}>
          <dl className="grid grid-cols-1 gap-x-4 gap-y-2.5 text-xs sm:grid-cols-2">
            <Row label="Phone" value={app.phone} />
            <Row label="Email" value={app.email} />
            <Row label="Branch" value={app.branch} />
            <Row label="Counsellor" value={app.counsellor} />
            <Row label="Source" value={app.source} />
            <Row label="Channel" value={app.partner ? `${app.channel} · ${app.partner}` : app.channel} />
            <Row label="Created" value={formatCreated(app.createdAt)} />
          </dl>
        </Section>

        {(app.deadlines?.length || app.blockers?.length) ? (
          <Section title="Deadlines & blockers" icon={CalendarClock}>
            <ul className="flex flex-col gap-2 text-xs">
              {app.deadlines?.map((d) => {
                const days = Math.round((Date.parse(d.dueDate) - Date.parse(operationsSnapshotDate)) / 86400000);
                return (
                  <li key={d.type + d.dueDate} className="flex items-center justify-between gap-3">
                    <span className="text-foreground">{d.type} deadline</span>
                    <span className={cn("font-semibold", days < 0 ? "text-danger" : days <= 7 ? "text-warning" : "text-muted-foreground")}>
                      {new Date(`${d.dueDate}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}
                      {" · "}
                      {days < 0 ? `${-days}d overdue` : days === 0 ? "today" : `in ${days}d`}
                    </span>
                  </li>
                );
              })}
              {app.blockers?.map((b) => (
                <li key={b.reason} className="flex items-start gap-2 rounded-lg bg-warning-soft px-2.5 py-2 text-foreground">
                  <AlertTriangle className="mt-0.5 size-3.5 shrink-0 text-warning" />
                  <span>
                    <span className="font-semibold">{b.category}:</span> {b.reason}
                  </span>
                </li>
              ))}
            </ul>
          </Section>
        ) : null}

        {(app.followUps.length > 0 || app.meetings.length > 0 || app.documentRequests.length > 0) && (
          <Section title="Activity" icon={CalendarClock}>
            <ul className="flex flex-col gap-2.5 text-xs">
              {app.meetings.map((m) => (
                <li key={m.id} className="flex items-start gap-2.5">
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-lg bg-violet-500/10 text-violet-600 dark:text-violet-400">
                    {m.format === "Video call" ? <Video className="size-3.5" /> : <Users className="size-3.5" />}
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {m.format} with {m.counsellor} · {m.durationMins} min
                    </p>
                    <p className="text-muted-foreground">{formatCreated(m.at)}{m.notes && ` — ${m.notes}`}</p>
                  </div>
                </li>
              ))}
              {app.followUps.map((f) => (
                <li key={f.id} className="flex items-start gap-2.5">
                  <button
                    type="button"
                    role="checkbox"
                    aria-checked={f.done}
                    aria-label={`Mark follow-up ${f.done ? "not done" : "done"}`}
                    onClick={() => onToggleFollowUp(f.id)}
                    className={cn(
                      "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-md border transition-colors",
                      f.done ? "border-success bg-success text-white" : "border-border-strong hover:border-primary"
                    )}
                  >
                    {f.done && <Check className="size-3" strokeWidth={3} />}
                  </button>
                  <div className="min-w-0 flex-1">
                    <p className={cn("font-semibold", f.done ? "text-muted-foreground line-through" : "text-foreground")}>
                      {f.channel} follow-up · {formatCreated(f.at)}
                    </p>
                    {f.notes && <p className="text-muted-foreground">{f.notes}</p>}
                  </div>
                </li>
              ))}
              {app.documentRequests.map((d) => (
                <li key={d.id} className="flex items-start gap-2.5">
                  <span className={cn("flex size-7 shrink-0 items-center justify-center rounded-lg", d.status === "Received" ? "bg-success-soft text-success" : "bg-warning-soft text-warning")}>
                    <FileUp className="size-3.5" />
                  </span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-foreground">
                      {d.title} {d.count > 1 && <span className="font-normal text-muted-foreground">× {d.count}</span>}
                    </p>
                    <p className="text-muted-foreground">
                      {d.status === "Received" ? "Received" : `Due ${new Date(`${d.dueDate}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", timeZone: "UTC" })}`} · via {d.channels.join(", ")}
                    </p>
                  </div>
                  {d.status === "Requested" && (
                    <button type="button" onClick={() => onReceivedDoc(d.id)} className="shrink-0 rounded-full px-2 py-1 text-[11px] font-semibold text-primary hover:bg-primary-soft">
                      Mark received
                    </button>
                  )}
                </li>
              ))}
            </ul>
          </Section>
        )}

        <Section title={`Notes · ${app.notes.length}`} icon={ClipboardList}>
          <ul className="flex flex-col gap-3">
            {app.notes.length === 0 && <li className="text-xs text-muted-foreground">No notes yet.</li>}
            {app.notes.map((n, i) => (
              <li key={i} className="flex gap-2.5">
                <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-surface-hover text-[10px] font-bold text-muted-foreground">
                  {initialsFor(n.author)}
                </span>
                <div className="min-w-0 flex-1 rounded-xl rounded-tl-sm bg-surface-muted px-3 py-2">
                  <p className="text-[11px] text-muted-foreground">
                    <span className="font-semibold text-foreground">{n.author}</span> · {formatCreated(n.at)}
                  </p>
                  <p className="mt-0.5 text-xs text-foreground">{n.text}</p>
                </div>
              </li>
            ))}
          </ul>
          <form onSubmit={submit} className="mt-3 flex items-center gap-2">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              placeholder="Add a note…"
              aria-label="Add a note"
              className="h-9 min-w-0 flex-1 rounded-full border border-border bg-surface px-4 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
            />
            <button
              type="submit"
              disabled={!draft.trim()}
              aria-label="Save note"
              className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-primary-foreground transition-opacity disabled:opacity-40"
            >
              <SendHorizontal className="size-4" />
            </button>
          </form>
        </Section>
      </div>
    </SlideOver>
  );
}

function Section({ title, icon: Icon, action, children }: { title: string; icon: typeof Phone; action?: ReactNode; children: ReactNode }) {
  return (
    <section>
      <h4 className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Icon className="size-3.5" />
        {title}
        {action && <span className="ml-auto">{action}</span>}
      </h4>
      <div className="rounded-2xl border border-border p-4">{children}</div>
    </section>
  );
}

function QuickAction({ icon: Icon, label, onClick }: { icon: typeof Phone; label: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-col items-center gap-1.5 rounded-xl border border-border px-2 py-2.5 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
    >
      <Icon className="size-4" />
      {label}
    </button>
  );
}

function Mini({ label, value, muted }: { label: string; value: string; muted?: boolean }) {
  return (
    <div className="rounded-lg bg-surface-muted px-2.5 py-2">
      <p className="text-[10px] text-muted-foreground">{label}</p>
      <p className={cn("truncate text-xs font-semibold", muted ? "text-muted-foreground" : "text-foreground")}>{value}</p>
    </div>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-muted-foreground">{label}</dt>
      <dd className="truncate font-medium text-foreground">{value}</dd>
    </div>
  );
}

function ContactButton({ href, icon: Icon, label, external }: { href: string; icon: typeof Phone; label: string; external?: boolean }) {
  return (
    <a
      href={href}
      target={external ? "_blank" : undefined}
      rel={external ? "noreferrer" : undefined}
      className="inline-flex h-7 items-center gap-1.5 rounded-full border border-border px-2.5 text-[11px] font-semibold text-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary"
    >
      <Icon className="size-3.5" />
      {label}
    </a>
  );
}
