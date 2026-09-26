"use client";

import { useState } from "react";
import { Check, Megaphone, PencilLine, Send, Users } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { Checkbox, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import {
  announcementCategories,
  audienceOptions,
  audienceSizes,
  commsNow,
  type Announcement,
  type AnnouncementAttachment,
  type AnnouncementCategory,
  type AnnouncementPriority,
  type DeliveryChannel,
} from "@/lib/mock/communications";
import type { CurrentUser } from "@/lib/mock/user";
import { cn } from "@/lib/utils";
import { channelIcon } from "./announcement-detail";
import { AttachmentPicker } from "./attachment-picker";

const channels: DeliveryChannel[] = ["In-app", "Email", "WhatsApp"];
const priorities: { value: AnnouncementPriority; label: string }[] = [
  { value: "Normal", label: "Normal" },
  { value: "Important", label: "Important" },
  { value: "Urgent", label: "Urgent" },
];

/** "All staff" already covers every internal group, so only partners add to it. */
export function recipientCount(audience: string[]) {
  if (audience.includes("All staff")) {
    return audienceSizes["All staff"] + (audience.includes("Agent partners") ? audienceSizes["Agent partners"] : 0);
  }
  return audience.reduce((sum, a) => sum + (audienceSizes[a] ?? 0), 0);
}

/** Local "YYYY-MM-DDTHH:mm" value for a datetime-local input. */
function toLocalInput(iso: string) {
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

/**
 * Create or edit an announcement. Pass `initial` to edit; remount with a new
 * `key` when switching between announcements so the fields reset.
 */
export function AnnouncementComposer({
  open,
  onClose,
  author,
  initial,
  onSubmit,
}: {
  open: boolean;
  onClose: () => void;
  author: CurrentUser;
  initial?: Announcement;
  onSubmit: (a: Announcement) => void;
}) {
  const editing = !!initial;
  // A live announcement can be edited but not re-scheduled or turned back into a draft.
  const live = initial?.status === "Published" || initial?.status === "Inactive" || initial?.status === "Archived";
  const [title, setTitle] = useState(initial?.title ?? "");
  const [message, setMessage] = useState(initial?.body.join("\n\n") ?? "");
  const [category, setCategory] = useState<AnnouncementCategory>(initial?.category ?? "Operations");
  const [priority, setPriority] = useState<AnnouncementPriority>(initial?.priority ?? "Normal");
  const [audience, setAudience] = useState<string[]>(initial?.audience ?? ["All staff"]);
  const [via, setVia] = useState<DeliveryChannel[]>(initial?.channels ?? ["In-app"]);
  const [requiresAck, setRequiresAck] = useState(initial?.requiresAck ?? false);
  const [pinned, setPinned] = useState(initial?.pinned ?? false);
  const [dueDate, setDueDate] = useState(initial?.dueDate ?? "");
  const [timing, setTiming] = useState<"now" | "later">(initial?.status === "Scheduled" ? "later" : "now");
  const [scheduleAt, setScheduleAt] = useState(initial?.status === "Scheduled" ? toLocalInput(initial.publishedAt) : "");
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>(initial?.attachments ?? []);
  const [tried, setTried] = useState(false);

  const reset = () => {
    setTitle("");
    setMessage("");
    setCategory("Operations");
    setPriority("Normal");
    setAudience(["All staff"]);
    setVia(["In-app"]);
    setRequiresAck(false);
    setPinned(false);
    setDueDate("");
    setTiming("now");
    setScheduleAt("");
    setAttachments([]);
    setTried(false);
  };

  const toggle = <T,>(list: T[], value: T) => (list.includes(value) ? list.filter((v) => v !== value) : [...list, value]);
  const recipients = recipientCount(audience);
  const errors = {
    title: !title.trim(),
    message: !message.trim(),
    audience: audience.length === 0,
    channels: via.length === 0,
    schedule: timing === "later" && !scheduleAt,
  };
  const valid = !Object.values(errors).some(Boolean);

  const submit = (asDraft: boolean) => {
    setTried(true);
    if (!asDraft && !valid) return;
    if (asDraft && errors.title) return;
    const paragraphs = message.split(/\n{2,}/).map((p) => p.trim()).filter(Boolean);
    const status: Announcement["status"] = live
      ? initial.status
      : asDraft
        ? "Draft"
        : timing === "later"
          ? "Scheduled"
          : "Published";
    const publishedAt =
      status === "Scheduled" ? new Date(scheduleAt).toISOString() : live ? initial.publishedAt : commsNow;
    const fields = {
      title: title.trim(),
      summary: paragraphs[0]?.slice(0, 140) ?? "",
      body: paragraphs.length ? paragraphs : [""],
      category,
      priority,
      status,
      audience,
      channels: via,
      publishedAt,
      dueDate: dueDate || undefined,
      pinned: pinned && status === "Published",
      requiresAck,
      attachments,
    };
    onSubmit(
      initial
        ? { ...initial, ...fields, recipients: live ? initial.recipients : recipients, editedAt: commsNow }
        : {
            ...fields,
            id: `ANN-${2046 + Math.floor(Math.random() * 900)}`,
            author: { name: author.name, role: author.role, branch: "Dhaka HQ" },
            readByMe: true,
            acknowledgedByMe: false,
            recipients,
            read: 0,
            acknowledged: 0,
            byBranch: [],
            pendingAck: [],
          }
    );
    if (!editing) reset();
  };

  return (
    <SlideOver
      open={open}
      onClose={onClose}
      icon={editing ? PencilLine : Megaphone}
      title={editing ? "Edit announcement" : "New announcement"}
      subtitle={editing ? `${initial.id} · ${initial.status}` : "Share an update with staff and partners"}
      footer={
        <div className="flex flex-wrap items-center gap-2">
          <span className="mr-auto inline-flex items-center gap-1.5 text-xs text-muted-foreground">
            <Users className="size-3.5" />
            Reaches up to <span className="font-semibold text-foreground">{recipients}</span> people
          </span>
          {!live && (
            <button type="button" onClick={() => submit(true)} className={buttonSecondary}>
              Save draft
            </button>
          )}
          <button type="button" onClick={() => submit(false)} className={buttonPrimary}>
            {live ? <Check className="size-4" /> : <Send className="size-4" />}
            {live ? "Save changes" : timing === "later" ? "Schedule" : "Publish"}
          </button>
        </div>
      }
    >
      <div className="flex flex-col gap-5">
        <Field label="Title" required>
          <TextInput
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. January 2027 intake: CAS request deadlines"
            maxLength={120}
            className={cn(tried && errors.title && "border-danger")}
          />
        </Field>

        <Field label="Message" required hint="Leave a blank line between paragraphs. The first paragraph is used as the preview.">
          <Textarea
            rows={7}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder="What's changing, who it affects, and what people need to do."
            className={cn(tried && errors.message && "border-danger")}
          />
        </Field>

        <Field label="Attachments" hint="Optional — policy documents, letters, posters or screenshots.">
          <AttachmentPicker files={attachments} onChange={setAttachments} />
        </Field>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Field label="Category">
            <Select value={category} onChange={(e) => setCategory(e.target.value as AnnouncementCategory)}>
              {announcementCategories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </Select>
          </Field>
          <Field label="Action deadline" hint="Optional">
            <TextInput type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} />
          </Field>
        </div>

        <Field label="Priority">
          <PillGroup options={priorities} value={priority} onChange={setPriority} />
        </Field>

        <Field label="Audience" required>
          <div className={cn("flex flex-wrap gap-1.5", tried && errors.audience && "rounded-xl ring-2 ring-danger/40")}>
            {audienceOptions.map((a) => {
              const on = audience.includes(a);
              return (
                <button
                  key={a}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setAudience((list) => toggle(list, a))}
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full border px-3 py-1.5 text-xs font-medium transition-colors",
                    on ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground"
                  )}
                >
                  {on && <Check className="size-3" />}
                  {a}
                  <span className="text-[10px] opacity-70">{audienceSizes[a]}</span>
                </button>
              );
            })}
          </div>
        </Field>

        <Field label="Deliver via" required>
          <div className="grid grid-cols-3 gap-2">
            {channels.map((c) => {
              const Icon = channelIcon[c];
              const on = via.includes(c);
              return (
                <button
                  key={c}
                  type="button"
                  aria-pressed={on}
                  onClick={() => setVia((list) => toggle(list, c))}
                  className={cn(
                    "flex flex-col items-center gap-1.5 rounded-xl border p-3 text-xs font-medium transition-colors",
                    on ? "border-primary/50 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground",
                    tried && errors.channels && "border-danger/50"
                  )}
                >
                  <Icon className="size-4" />
                  {c}
                </button>
              );
            })}
          </div>
        </Field>

        <div className="flex flex-col gap-3 rounded-2xl border border-border bg-surface-muted p-4">
          <Checkbox
            checked={requiresAck}
            onChange={setRequiresAck}
            label={
              <>
                <span className="font-medium">Require acknowledgement</span>
                <span className="block text-xs text-muted-foreground">Recipients must confirm they have read it. You can send reminders.</span>
              </>
            }
          />
          <Checkbox
            checked={pinned}
            onChange={setPinned}
            label={
              <>
                <span className="font-medium">Pin to top</span>
                <span className="block text-xs text-muted-foreground">Keeps it at the top of everyone&apos;s list until unpinned.</span>
              </>
            }
          />
        </div>

        {live ? (
          editing && (
            <p className="rounded-xl bg-surface-muted px-3 py-2 text-xs text-muted-foreground">
              This announcement is already live. Recipients will see an &ldquo;Edited&rdquo; label after you save.
            </p>
          )
        ) : (
        <Field label="When">
          <PillGroup
            options={[
              { value: "now", label: "Publish now" },
              { value: "later", label: "Schedule" },
            ]}
            value={timing}
            onChange={setTiming}
          />
          {timing === "later" && (
            <TextInput
              type="datetime-local"
              value={scheduleAt}
              onChange={(e) => setScheduleAt(e.target.value)}
              className={cn("mt-2", tried && errors.schedule && "border-danger")}
            />
          )}
        </Field>
        )}

        {tried && !valid && (
          <p className="rounded-xl bg-danger-soft px-3 py-2 text-xs font-medium text-danger">
            Add a title, message, at least one audience and one channel{timing === "later" ? ", and a schedule time" : ""}.
          </p>
        )}
      </div>
    </SlideOver>
  );
}
