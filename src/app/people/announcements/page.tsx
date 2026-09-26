"use client";

import { useMemo, useState, type FormEvent } from "react";
import { AttachmentPicker, AttachmentThumb, extensionOf, isImage } from "@/components/communications/attachment-picker";
import type { AnnouncementAttachment } from "@/lib/mock/communications";
import { BellRing, CheckCheck, CircleAlert, Download, Eye, EyeOff, Megaphone, Paperclip, Pin, PinOff, Plus, Send, Users } from "lucide-react";
import { Card } from "@/components/ui/card";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, PillGroup, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { SearchField } from "@/components/ui/filter-dropdown";
import { useToast } from "@/components/ui/toast";
import { Avatar, formatDay } from "@/components/people/people-ui";
import {
  audienceOf,
  getNotices,
  getRoles,
  getStaff,
  getStaffMember,
  getTeams,
  roleName,
  saveNotices,
  staffBranches,
  type NoticeAudience,
  type NoticeCategory,
  type StaffNotice,
} from "@/lib/mock/staff";
import { cn } from "@/lib/utils";

const ME = "STF-001";
const NOW = "2026-09-17T11:00:00Z";
const categories: NoticeCategory[] = ["Policy", "HR", "Training", "IT & security", "Compliance", "Celebration"];
const categoryStyle: Record<NoticeCategory, string> = {
  Policy: "bg-primary-soft text-primary",
  HR: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  Training: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "IT & security": "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  Compliance: "bg-warning-soft text-warning",
  Celebration: "bg-pink-500/10 text-pink-600 dark:text-pink-400",
};
type Filter = "all" | "ack" | "mine" | "pinned";

function audienceLabel(a: NoticeAudience) {
  if (a.type === "Everyone") return "Everyone";
  if (a.type === "Branch") return `${a.value} branch`;
  if (a.type === "Team") return getTeams().find((t) => t.id === a.value)?.name ?? "Team";
  return `${roleName(a.value ?? "")}s`;
}
const ago = (iso: string) => {
  const h = Math.round((Date.parse(NOW) - Date.parse(iso)) / 3600000);
  return h < 1 ? "Just now" : h < 24 ? `${h} h ago` : `${Math.round(h / 24)} d ago`;
};

export default function StaffAnnouncementsPage() {
  const [notices, setNotices] = useState<StaffNotice[]>(getNotices);
  const [filter, setFilter] = useState<Filter>("all");
  const [search, setSearch] = useState("");
  const [selectedId, setSelectedId] = useState(notices[0]?.id ?? "");
  const [listTab, setListTab] = useState<"pending" | "done" | "unread">("pending");
  const [composing, setComposing] = useState(false);
  const [toast, notify] = useToast();

  const commit = (next: StaffNotice[]) => {
    setNotices(next);
    saveNotices(next);
  };
  const patch = (id: string, fn: (n: StaffNotice) => Partial<StaffNotice>) => commit(notices.map((n) => (n.id === id ? { ...n, ...fn(n) } : n)));

  const forMe = (n: StaffNotice) => audienceOf(n).some((s) => s.id === ME);
  const needsMyAck = (n: StaffNotice) => n.requireAck && forMe(n) && !n.acks[ME];

  const sorted = useMemo(() => {
    const q = search.trim().toLowerCase();
    return [...notices]
      .filter((n) => (filter === "ack" ? n.requireAck : filter === "mine" ? needsMyAck(n) : filter === "pinned" ? n.pinned : true))
      .filter((n) => !q || `${n.title} ${n.body} ${n.category}`.toLowerCase().includes(q))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.publishedAt.localeCompare(a.publishedAt));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [notices, filter, search]);

  const selected = notices.find((n) => n.id === selectedId) ?? sorted[0];
  const people = selected ? audienceOf(selected) : [];
  const acked = selected ? people.filter((p) => selected.acks[p.id]) : [];
  const read = selected ? people.filter((p) => selected.reads.includes(p.id)) : [];
  const pending = selected?.requireAck ? people.filter((p) => !selected.acks[p.id]) : people.filter((p) => !selected?.reads.includes(p.id));
  const unread = people.filter((p) => !selected?.reads.includes(p.id));

  const ackNotices = notices.filter((n) => n.requireAck);
  const rate = ackNotices.length
    ? Math.round((ackNotices.reduce((n, x) => n + Object.keys(x.acks).length / Math.max(1, audienceOf(x).length), 0) / ackNotices.length) * 100)
    : 0;
  const overdue = ackNotices.filter((n) => n.ackDue && n.ackDue < NOW.slice(0, 10) && Object.keys(n.acks).length < audienceOf(n).length).length;

  const open = (id: string) => {
    setSelectedId(id);
    setListTab("pending");
    const n = notices.find((x) => x.id === id);
    if (n && forMe(n) && !n.reads.includes(ME)) patch(id, (x) => ({ reads: [...x.reads, ME] }));
  };

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Staff announcements</h2>
          <p className="mt-1 text-sm text-muted-foreground">Internal notices for the team — policies, training and IT changes, with read receipts and sign-off.</p>
        </div>
        <button type="button" onClick={() => setComposing(true)} className={buttonPrimary}>
          <Plus className="size-4" /> New announcement
        </button>
      </header>

      <StatGrid>
        <StatCard icon={Megaphone} label="Announcements this month" value={notices.filter((n) => n.publishedAt.startsWith("2026-09")).length} />
        <StatCard icon={CircleAlert} tone={notices.some(needsMyAck) ? "warning" : "success"} label="Waiting for your sign-off" value={notices.filter(needsMyAck).length} onClick={() => setFilter("mine")} />
        <StatCard icon={CheckCheck} tone="success" label="Average sign-off rate" value={`${rate}%`} onClick={() => setFilter("ack")} />
        <StatCard icon={BellRing} tone={overdue ? "danger" : "neutral"} label="Past due date, not everyone signed" value={overdue} />
      </StatGrid>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[380px_minmax(0,1fr)]">
        <Card className="flex flex-col gap-3 p-3 lg:sticky lg:top-0">
          <div className="px-1 pt-1">
            <SearchField value={search} onChange={setSearch} placeholder="Search announcements…" label="Search announcements" />
          </div>
          <div className="px-1">
            <PillGroup
              options={[
                { value: "all", label: "All" },
                { value: "mine", label: `To sign · ${notices.filter(needsMyAck).length}` },
                { value: "ack", label: "Sign-off" },
                { value: "pinned", label: "Pinned" },
              ]}
              value={filter}
              onChange={setFilter}
            />
          </div>
          <ul className="flex max-h-[calc(100vh-22rem)] flex-col gap-1 overflow-y-auto">
            {sorted.length === 0 && <li className="px-3 py-10 text-center text-xs text-muted-foreground">Nothing here.</li>}
            {sorted.map((n) => {
              const audience = audienceOf(n);
              const done = n.requireAck ? Object.keys(n.acks).length : n.reads.length;
              const unreadByMe = forMe(n) && !n.reads.includes(ME);
              const active = selected?.id === n.id;
              return (
                <li key={n.id}>
                  <button type="button" onClick={() => open(n.id)} className={cn("flex w-full flex-col gap-1.5 rounded-2xl px-3 py-3 text-left transition-colors", active ? "bg-primary-soft" : "hover:bg-surface-hover")}>
                    <span className="flex items-center gap-1.5">
                      <span className={cn("rounded-full px-2 py-0.5 text-[10px] font-semibold", categoryStyle[n.category])}>{n.category}</span>
                      {n.pinned && <Pin className="size-3 text-primary" />}
                      {!!n.attachments?.length && <Paperclip className="size-3 text-muted-foreground" aria-label={`${n.attachments.length} attachments`} />}
                      {needsMyAck(n) && <span className="rounded-full bg-warning-soft px-2 py-0.5 text-[10px] font-semibold text-warning">Sign-off needed</span>}
                      <span className="ml-auto text-[10px] text-muted-foreground">{ago(n.publishedAt)}</span>
                    </span>
                    <span className={cn("line-clamp-2 text-sm text-foreground", unreadByMe ? "font-semibold" : "font-medium")}>
                      {unreadByMe && <span className="mr-1.5 inline-block size-2 rounded-full bg-primary align-middle" />}
                      {n.title}
                    </span>
                    <span className="flex items-center gap-2 text-[11px] text-muted-foreground">
                      <Users className="size-3" /> {audienceLabel(n.audience)}
                      <span className="ml-auto tabular-nums">{done}/{audience.length} {n.requireAck ? "signed" : "read"}</span>
                    </span>
                    <span className="block h-1 overflow-hidden rounded-full bg-surface-hover">
                      <span className={cn("block h-full rounded-full", n.requireAck ? "bg-success" : "bg-primary")} style={{ width: `${(done / Math.max(1, audience.length)) * 100}%` }} />
                    </span>
                  </button>
                </li>
              );
            })}
          </ul>
        </Card>

        {selected && (
          <div className="flex min-w-0 flex-col gap-4">
            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center gap-2">
                <span className={cn("rounded-full px-2.5 py-0.5 text-[11px] font-semibold", categoryStyle[selected.category])}>{selected.category}</span>
                {selected.requireAck && (
                  <span className="rounded-full bg-surface-hover px-2.5 py-0.5 text-[11px] font-medium text-muted-foreground">
                    Sign-off required{selected.ackDue ? ` by ${formatDay(selected.ackDue)}` : ""}
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => { patch(selected.id, (n) => ({ pinned: !n.pinned })); notify(selected.pinned ? "Unpinned" : "Pinned to the top"); }}
                  className="ml-auto inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"
                >
                  {selected.pinned ? <><PinOff className="size-3.5" /> Unpin</> : <><Pin className="size-3.5" /> Pin</>}
                </button>
              </div>
              <h3 className="mt-3 text-xl font-semibold tracking-tight text-foreground">{selected.title}</h3>
              <div className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">
                {(() => {
                  const by = getStaffMember(selected.byId);
                  return by ? (
                    <>
                      <Avatar name={by.name} size="xs" />
                      <span><span className="font-medium text-foreground">{by.name}</span> · {by.jobTitle}</span>
                    </>
                  ) : null;
                })()}
                <span>· {formatDay(selected.publishedAt)} · to {audienceLabel(selected.audience)}</span>
              </div>
              <div className="mt-4 whitespace-pre-line text-sm leading-6 text-foreground/90">{selected.body}</div>

              {!!selected.attachments?.length && <NoticeAttachments files={selected.attachments} onNotify={notify} />}

              {forMe(selected) && selected.requireAck && (
                <div className={cn("mt-5 flex flex-wrap items-center gap-3 rounded-2xl px-4 py-3", selected.acks[ME] ? "bg-success-soft" : "bg-warning-soft")}>
                  {selected.acks[ME] ? (
                    <p className="flex items-center gap-2 text-sm text-foreground"><CheckCheck className="size-4 text-success" /> You signed this on {formatDay(selected.acks[ME])}.</p>
                  ) : (
                    <>
                      <p className="flex-1 text-sm text-foreground">Please confirm you&apos;ve read and understood this announcement.</p>
                      <button
                        type="button"
                        onClick={() => { patch(selected.id, (n) => ({ acks: { ...n.acks, [ME]: NOW }, reads: [...new Set([...n.reads, ME])] })); notify("Thanks — sign-off recorded"); }}
                        className={buttonPrimary}
                      >
                        <CheckCheck className="size-4" /> I&apos;ve read and understood
                      </button>
                    </>
                  )}
                </div>
              )}
            </Card>

            <Card className="p-5 sm:p-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{selected.requireAck ? "Sign-off tracking" : "Read receipts"}</h3>
                  <p className="text-xs text-muted-foreground">
                    {selected.requireAck ? `${acked.length} of ${people.length} signed` : `${read.length} of ${people.length} opened`} · {unread.length} haven&apos;t opened it yet
                  </p>
                </div>
                {pending.length > 0 && (
                  <button type="button" onClick={() => notify(`Reminder sent to ${pending.length} people by email and in-app`)} className={buttonSecondary}>
                    <Send className="size-4" /> Remind {pending.length}
                  </button>
                )}
              </div>
              <div className="mt-4 h-2 overflow-hidden rounded-full bg-surface-hover">
                <div className="h-full rounded-full bg-success transition-all" style={{ width: `${((selected.requireAck ? acked.length : read.length) / Math.max(1, people.length)) * 100}%` }} />
              </div>
              <div className="mt-4">
                <PillGroup
                  options={[
                    { value: "pending", label: `${selected.requireAck ? "Not signed" : "Not read"} · ${pending.length}` },
                    { value: "done", label: `${selected.requireAck ? "Signed" : "Read"} · ${selected.requireAck ? acked.length : read.length}` },
                    { value: "unread", label: `Not opened · ${unread.length}` },
                  ]}
                  value={listTab}
                  onChange={setListTab}
                />
              </div>
              <ul className="mt-3 grid grid-cols-1 gap-2 sm:grid-cols-2">
                {(listTab === "pending" ? pending : listTab === "done" ? (selected.requireAck ? acked : read) : unread).map((p) => (
                  <li key={p.id} className="flex items-center gap-3 rounded-xl border border-border px-3 py-2">
                    <Avatar name={p.name} size="sm" />
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-foreground">{p.name}{p.id === ME && <span className="text-muted-foreground"> (you)</span>}</p>
                      <p className="truncate text-[11px] text-muted-foreground">{p.jobTitle} · {p.branch}</p>
                    </div>
                    {selected.acks[p.id] ? (
                      <span className="whitespace-nowrap text-[11px] text-success">{formatDay(selected.acks[p.id])}</span>
                    ) : selected.reads.includes(p.id) ? (
                      <Eye className="size-3.5 text-muted-foreground" aria-label="Opened" />
                    ) : (
                      <EyeOff className="size-3.5 text-muted-foreground/60" aria-label="Not opened" />
                    )}
                  </li>
                ))}
                {(listTab === "pending" ? pending : listTab === "done" ? acked : unread).length === 0 && listTab !== "done" && (
                  <li className="col-span-full rounded-xl bg-success-soft px-3 py-4 text-center text-xs font-medium text-success">Everyone&apos;s done</li>
                )}
              </ul>
            </Card>
          </div>
        )}
      </div>

      {composing && (
        <ComposeModal
          onClose={() => setComposing(false)}
          onPublish={(n) => {
            commit([n, ...notices]);
            setSelectedId(n.id);
            setFilter("all");
            setComposing(false);
            notify(`Published to ${audienceOf(n).length} people`);
          }}
        />
      )}
      {toast}
    </div>
  );
}

function ComposeModal({ onClose, onPublish }: { onClose: () => void; onPublish: (n: StaffNotice) => void }) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [category, setCategory] = useState<NoticeCategory>("Policy");
  const [audience, setAudience] = useState<NoticeAudience>({ type: "Everyone" });
  const [requireAck, setRequireAck] = useState(true);
  const [ackDue, setAckDue] = useState("2026-09-24");
  const [pinned, setPinned] = useState(false);
  const [attachments, setAttachments] = useState<AnnouncementAttachment[]>([]);
  const [tried, setTried] = useState(false);
  const errors = { title: !title.trim() ? "Add a title" : "", body: body.trim().length < 20 ? "Write at least a couple of sentences" : "" };
  const reach = audienceOf({ audience }, getStaff()).length;
  const teams = getTeams();
  const roles = getRoles();

  const submit = (e: FormEvent) => {
    e.preventDefault();
    setTried(true);
    if (errors.title || errors.body) return;
    onPublish({ id: `NT-${Date.now().toString(36)}`, title: title.trim(), body: body.trim(), category, audience, requireAck, ackDue: requireAck ? ackDue : undefined, pinned, publishedAt: NOW, byId: ME, acks: requireAck ? { [ME]: NOW } : {}, reads: [ME], attachments });
  };

  const valuesFor = (type: NoticeAudience["type"]) =>
    type === "Branch" ? staffBranches.map((b) => ({ value: b, label: b })) : type === "Team" ? teams.map((t) => ({ value: t.id, label: t.name })) : type === "Role" ? roles.map((r) => ({ value: r.id, label: r.name })) : [];

  return (
    <Modal
      open
      onClose={onClose}
      icon={Megaphone}
      title="New staff announcement"
      subtitle={`Goes to ${reach} people`}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="submit" form="compose-notice" className={buttonPrimary}><Send className="size-4" /> Publish</button>
        </div>
      }
    >
      <form id="compose-notice" onSubmit={submit} noValidate className="flex flex-col gap-4">
        <Field label="Title" required hint={tried && errors.title ? errors.title : undefined}>
          <TextInput value={title} onChange={(e) => setTitle(e.target.value)} placeholder="e.g. New document checklist for January intake" className={cn(tried && errors.title && "border-danger")} />
        </Field>
        <Field label="Category">
          <div className="flex flex-wrap gap-1.5">
            {categories.map((c) => (
              <button key={c} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={cn("h-8 rounded-full px-3 text-xs font-semibold transition-colors", category === c ? categoryStyle[c] : "border border-border text-muted-foreground hover:text-foreground")}>
                {c}
              </button>
            ))}
          </div>
        </Field>
        <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
          <Field label="Send to">
            <Select
              value={audience.type}
              onChange={(e) => {
                const type = e.target.value as NoticeAudience["type"];
                setAudience({ type, value: valuesFor(type)[0]?.value });
              }}
            >
              {["Everyone", "Branch", "Team", "Role"].map((t) => <option key={t}>{t}</option>)}
            </Select>
          </Field>
          {audience.type !== "Everyone" && (
            <Field label={audience.type}>
              <Select value={audience.value} onChange={(e) => setAudience({ ...audience, value: e.target.value })}>
                {valuesFor(audience.type).map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </Select>
            </Field>
          )}
        </div>
        <Field label="Message" required hint={tried && errors.body ? errors.body : undefined}>
          <Textarea rows={6} value={body} onChange={(e) => setBody(e.target.value)} placeholder="What's changing, why, and what people need to do." className={cn(tried && errors.body && "border-danger")} />
        </Field>
        <Field label="Files & images" hint="Policies, checklists, screenshots or posters.">
          <AttachmentPicker files={attachments} onChange={setAttachments} />
        </Field>
        <div className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-4">
          <Checkbox checked={requireAck} onChange={setRequireAck} label={<span>Require sign-off<span className="block text-xs text-muted-foreground">Each person must confirm they&apos;ve read it. You can remind anyone who hasn&apos;t.</span></span>} />
          {requireAck && (
            <Field label="Sign off by" className="pl-7">
              <TextInput type="date" min="2026-09-17" value={ackDue} onChange={(e) => setAckDue(e.target.value)} className="max-w-48" />
            </Field>
          )}
          <Checkbox checked={pinned} onChange={setPinned} label="Pin to the top of the list" />
        </div>
      </form>
    </Modal>
  );
}

function NoticeAttachments({ files, onNotify }: { files: AnnouncementAttachment[]; onNotify: (text: string) => void }) {
  const images = files.filter((f) => f.url && isImage(f.name));
  return (
    <section className="mt-5">
      <p className="mb-2 flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
        <Paperclip className="size-3.5" /> Attachments · {files.length}
      </p>
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
        {files.map((a) => {
          const content = (
            <>
              <AttachmentThumb file={a} className="size-9" />
              <span className="min-w-0 flex-1">
                <span className="block truncate text-xs font-semibold text-foreground">{a.name}</span>
                <span className="text-[11px] uppercase text-muted-foreground">{extensionOf(a.name)} · {a.size}</span>
              </span>
              <Download className="size-4 shrink-0 text-muted-foreground" />
            </>
          );
          const cls = "flex w-full items-center gap-3 rounded-xl border border-border p-3 text-left transition-colors hover:bg-surface-hover";
          return (
            <li key={a.name}>
              {a.url ? (
                <a href={a.url} download={a.name} className={cls}>{content}</a>
              ) : (
                <button type="button" onClick={() => onNotify(`Downloading ${a.name}`)} className={cls}>{content}</button>
              )}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
