"use client";

import type { ReactNode } from "react";
import {
  Archive,
  ArchiveRestore,
  BellRing,
  EyeOff,
  CalendarClock,
  CheckCircle2,
  Download,
  Link2,
  Mail,
  MessageCircle,
  MonitorSmartphone,
  PencilLine,
  Pin,
  PinOff,
  Send,
  Users,
} from "lucide-react";
import type { Announcement, AnnouncementCategory, AnnouncementPriority, DeliveryChannel } from "@/lib/mock/communications";
import { Avatar, Pill, type Tone } from "@/components/performance/perf-ui";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { cn } from "@/lib/utils";
import { AttachmentThumb, extensionOf, isImage } from "./attachment-picker";
import { dueLabel, daysUntil, longDateTime, relativeTime, shortDate } from "./time";

export const priorityTone: Record<AnnouncementPriority, Tone> = { Urgent: "danger", Important: "warning", Normal: "neutral" };

export const categoryTone: Record<AnnouncementCategory, Tone> = {
  "Visa & Compliance": "danger",
  Intake: "primary",
  Operations: "teal",
  Training: "violet",
  Partners: "warning",
  Celebration: "success",
};

export const channelIcon: Record<DeliveryChannel, typeof Mail> = {
  "In-app": MonitorSmartphone,
  Email: Mail,
  WhatsApp: MessageCircle,
};

export function AnnouncementDetail({
  item,
  onAcknowledge,
  onTogglePin,
  onToggleActive,
  onToggleArchive,
  onEdit,
  onPublish,
  onNotify,
}: {
  item: Announcement;
  onAcknowledge: () => void;
  onTogglePin: () => void;
  onToggleActive: () => void;
  onToggleArchive: () => void;
  onEdit: () => void;
  onPublish: () => void;
  onNotify: (message: string) => void;
}) {
  const live = item.status === "Published";
  const canToggle = item.status === "Published" || item.status === "Inactive";
  const images = item.attachments.filter((a) => a.url && isImage(a.name));
  const readRate = item.recipients ? item.read / item.recipients : 0;
  const ackRate = item.recipients ? item.acknowledged / item.recipients : 0;

  return (
    <article className="flex flex-col gap-6">
      <header className="flex flex-col gap-3">
        <div className="flex flex-wrap items-center gap-1.5">
          {item.priority !== "Normal" && <Pill tone={priorityTone[item.priority]}>{item.priority}</Pill>}
          <Pill tone={categoryTone[item.category]}>{item.category}</Pill>
          {item.pinned && (
            <Pill tone="primary">
              <Pin className="size-3" />
              Pinned
            </Pill>
          )}
          {item.status !== "Published" && <Pill tone="neutral">{item.status}</Pill>}
          <span className="ml-auto text-[11px] text-muted-foreground">{item.id}</span>
          {canToggle && <ActiveSwitch active={live} onToggle={onToggleActive} />}
        </div>
        <h2 className="text-xl font-semibold leading-snug tracking-tight text-foreground">{item.title}</h2>
        <div className="flex items-center gap-3">
          <Avatar name={item.author.name} />
          <div className="min-w-0 text-xs">
            <p className="font-semibold text-foreground">{item.author.name}</p>
            <p className="text-muted-foreground">
              {item.author.role} · {item.author.branch} ·{" "}
              {item.status === "Scheduled" ? `Scheduled for ${longDateTime(item.publishedAt)}` : longDateTime(item.publishedAt)}
              {item.editedAt && <span title={longDateTime(item.editedAt)}> · Edited {relativeTime(item.editedAt).toLowerCase()}</span>}
            </p>
          </div>
        </div>
      </header>

      {item.status === "Inactive" && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm">
          <EyeOff className="size-5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">Inactive.</span> Recipients can&apos;t see this announcement. Switch it
            back on to show it again.
          </span>
        </div>
      )}

      {item.status === "Archived" && (
        <div className="flex items-center gap-3 rounded-2xl border border-border bg-surface-muted px-4 py-3 text-sm">
          <Archive className="size-5 shrink-0 text-muted-foreground" />
          <span className="text-muted-foreground">
            <span className="font-semibold text-foreground">Archived.</span> Kept for the record and hidden from recipients. Restore
            it to make it active again.
          </span>
        </div>
      )}

      <dl className="grid grid-cols-1 gap-2 rounded-2xl border border-border bg-surface-muted p-3 text-xs sm:grid-cols-3">
        <Meta icon={Users} label="Audience">
          {item.audience.join(", ")}
        </Meta>
        <Meta icon={Send} label="Delivered via">
          <span className="flex flex-wrap gap-1.5">
            {item.channels.map((c) => {
              const Icon = channelIcon[c];
              return (
                <span key={c} className="inline-flex items-center gap-1">
                  <Icon className="size-3 text-muted-foreground" />
                  {c}
                </span>
              );
            })}
          </span>
        </Meta>
        <Meta icon={CalendarClock} label="Action by">
          {item.dueDate ? (
            <span className={cn(daysUntil(item.dueDate) <= 3 && live && "text-danger")}>
              {shortDate(item.dueDate)} · {dueLabel(item.dueDate)}
            </span>
          ) : (
            "No deadline"
          )}
        </Meta>
      </dl>

      {live && item.requiresAck && (
        item.acknowledgedByMe ? (
          <div className="flex items-center gap-3 rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm">
            <CheckCircle2 className="size-5 shrink-0 text-success" />
            <span className="font-medium text-foreground">You acknowledged this announcement.</span>
          </div>
        ) : (
          <div className="flex flex-col gap-3 rounded-2xl border border-warning/40 bg-warning-soft px-4 py-3 sm:flex-row sm:items-center">
            <BellRing className="size-5 shrink-0 text-warning" />
            <div className="min-w-0 flex-1 text-sm">
              <p className="font-semibold text-foreground">Your acknowledgement is required</p>
              <p className="text-xs text-muted-foreground">
                Confirm you have read and will follow this{item.dueDate ? ` by ${shortDate(item.dueDate)}` : ""}.
              </p>
            </div>
            <button type="button" onClick={onAcknowledge} className={buttonPrimary}>
              <CheckCircle2 className="size-4" />
              Acknowledge
            </button>
          </div>
        )
      )}

      <div className="flex flex-col gap-3 text-sm leading-relaxed text-foreground/90">
        {item.body.map((p, i) => (
          <p key={i}>{p}</p>
        ))}
      </div>

      {item.attachments.length > 0 && (
        <section>
          <SectionTitle>Attachments · {item.attachments.length}</SectionTitle>
          {images.length > 0 && (
            <div className="mb-2 grid grid-cols-2 gap-2 sm:grid-cols-3">
              {images.map((a) => (
                <a key={a.name} href={a.url} target="_blank" rel="noreferrer" className="overflow-hidden rounded-xl border border-border">
                  {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
                  <img src={a.url} alt={a.name} className="aspect-video w-full object-cover transition-transform hover:scale-105" />
                </a>
              ))}
            </div>
          )}
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            {item.attachments.map((a) => {
              const content = (
                <>
                  <AttachmentThumb file={a} className="size-9" />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-xs font-semibold text-foreground">{a.name}</span>
                    <span className="text-[11px] uppercase text-muted-foreground">
                      {extensionOf(a.name)} · {a.size}
                    </span>
                  </span>
                  <Download className="size-4 shrink-0 text-muted-foreground" />
                </>
              );
              const cls = "flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-surface-hover";
              return (
                <li key={a.name}>
                  {a.url ? (
                    <a href={a.url} download={a.name} className={cls}>
                      {content}
                    </a>
                  ) : (
                    <button type="button" onClick={() => onNotify(`Downloading ${a.name}`)} className={cls}>
                      {content}
                    </button>
                  )}
                </li>
              );
            })}
          </ul>
        </section>
      )}

      {live && (
        <section className="rounded-2xl border border-border p-4">
          <SectionTitle>Engagement</SectionTitle>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Progress label="Read" value={item.read} total={item.recipients} rate={readRate} color="var(--primary)" />
            {item.requiresAck ? (
              <Progress label="Acknowledged" value={item.acknowledged} total={item.recipients} rate={ackRate} color="var(--success)" />
            ) : (
              <div className="text-xs text-muted-foreground">
                <p className="font-semibold text-foreground">No acknowledgement required</p>
                <p className="mt-1">Posted {relativeTime(item.publishedAt)} to {item.recipients} people.</p>
              </div>
            )}
          </div>

          {item.byBranch.length > 0 && (
            <div className="mt-5">
              <p className="mb-2 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">Read by team</p>
              <ul className="flex flex-col gap-2">
                {item.byBranch.map((b) => (
                  <li key={b.branch} className="flex items-center gap-3 text-xs">
                    <span className="w-28 shrink-0 truncate text-muted-foreground">{b.branch}</span>
                    <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-surface-hover">
                      <span className="block h-full rounded-full bg-primary" style={{ width: `${(b.read / b.total) * 100}%` }} />
                    </span>
                    <span className="w-12 shrink-0 text-right font-semibold tabular-nums text-foreground">
                      {b.read}/{b.total}
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {item.requiresAck && item.pendingAck.length > 0 && (
            <div className="mt-5 flex flex-col gap-3 border-t border-border pt-4 sm:flex-row sm:items-center">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-semibold text-foreground">
                  {item.recipients - item.acknowledged} still to acknowledge
                </p>
                <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                  {item.pendingAck.slice(0, 3).join(", ")}
                  {item.recipients - item.acknowledged > 3 && ` and ${item.recipients - item.acknowledged - 3} more`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => onNotify(`Reminder sent to ${item.recipients - item.acknowledged} people`)}
                className={buttonSecondary}
              >
                <BellRing className="size-4 text-muted-foreground" />
                Send reminder
              </button>
            </div>
          )}
        </section>
      )}

      <footer className="flex flex-wrap gap-2 border-t border-border pt-4">
        <button type="button" onClick={onEdit} className={buttonSecondary}>
          <PencilLine className="size-4 text-muted-foreground" />
          Edit
        </button>
        {(item.status === "Draft" || item.status === "Scheduled") && (
          <button type="button" onClick={onPublish} className={buttonPrimary}>
            <Send className="size-4" />
            Publish now
          </button>
        )}
        {live && (
          <button type="button" onClick={onTogglePin} className={buttonSecondary}>
            {item.pinned ? <PinOff className="size-4 text-muted-foreground" /> : <Pin className="size-4 text-muted-foreground" />}
            {item.pinned ? "Unpin" : "Pin to top"}
          </button>
        )}
        <button
          type="button"
          onClick={() => {
            void navigator.clipboard?.writeText(`${window.location.origin}/communications/announcements?id=${item.id}`);
            onNotify("Link copied");
          }}
          className={buttonSecondary}
        >
          <Link2 className="size-4 text-muted-foreground" />
          Copy link
        </button>
        {item.status !== "Draft" && (
          <button type="button" onClick={onToggleArchive} className={cn(buttonSecondary, "sm:ml-auto")}>
            {item.status === "Archived" ? <ArchiveRestore className="size-4 text-muted-foreground" /> : <Archive className="size-4 text-muted-foreground" />}
            {item.status === "Archived" ? "Restore" : "Archive"}
          </button>
        )}
      </footer>
    </article>
  );
}

export function ActiveSwitch({ active, onToggle }: { active: boolean; onToggle: () => void }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={active}
      onClick={onToggle}
      title={active ? "Active — click to hide from recipients" : "Inactive — click to show to recipients"}
      className="inline-flex items-center gap-2 rounded-full border border-border py-1 pl-2.5 pr-1 text-[11px] font-semibold text-foreground transition-colors hover:bg-surface-hover"
    >
      <span className={active ? "text-success" : "text-muted-foreground"}>{active ? "Active" : "Inactive"}</span>
      <span
        className={cn(
          "relative inline-flex h-5 w-9 shrink-0 rounded-full border-2 border-transparent transition-colors duration-200",
          active ? "bg-success" : "bg-muted-foreground/30"
        )}
      >
        <span
          className={cn(
            "pointer-events-none inline-block size-4 rounded-full bg-white shadow-sm transition-transform duration-200",
            active ? "translate-x-4" : "translate-x-0"
          )}
        />
      </span>
    </button>
  );
}

function Meta({ icon: Icon, label, children }: { icon: typeof Users; label: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 gap-2 rounded-xl bg-surface p-2.5">
      <Icon className="mt-0.5 size-3.5 shrink-0 text-muted-foreground" />
      <div className="min-w-0">
        <dt className="text-[11px] text-muted-foreground">{label}</dt>
        <dd className="mt-0.5 font-medium text-foreground">{children}</dd>
      </div>
    </div>
  );
}

function SectionTitle({ children }: { children: ReactNode }) {
  return <h3 className="mb-3 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{children}</h3>;
}

function Progress({ label, value, total, rate, color }: { label: string; value: number; total: number; rate: number; color: string }) {
  return (
    <div>
      <div className="flex items-baseline justify-between text-xs">
        <span className="font-semibold text-foreground">{label}</span>
        <span className="tabular-nums text-muted-foreground">
          <span className="font-semibold text-foreground">{value}</span> / {total} · {Math.round(rate * 100)}%
        </span>
      </div>
      <div className="mt-2 h-2 overflow-hidden rounded-full bg-surface-hover">
        <div className="h-full rounded-full" style={{ width: `${rate * 100}%`, backgroundColor: color }} />
      </div>
    </div>
  );
}
