"use client";

export const dynamic = 'force-dynamic';

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Bell,
  Building2,
  CalendarDays,
  CalendarOff,
  Check,
  Eye,
  Megaphone,
  MessageSquare,
  PartyPopper,
  PencilLine,
  Pin,
  Plus,
  Send,
  ThumbsUp,
  Trash2,
  UserRoundCheck,
  Wrench,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { ResetFilters, SearchField } from "@/components/ui/filter-dropdown";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonDanger, buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { Avatar, AvatarStack, formatDay } from "@/components/people/people-ui";
import { OpenPill, EmptyState, Tabs } from "@/components/office/office-ui";
import { relativeTime } from "@/components/communications/time";
import { commsNow } from "@/lib/mock/communications";
import { getStaff } from "@/lib/mock/staff";
import { branchNames, getBranches, getOfficeNotices, noticeCategories, officeToday, saveOfficeNotices, type NoticeCategory, type OfficeNotice } from "@/lib/mock/office";
import { useNow } from "@/lib/use-now";
import { cn } from "@/lib/utils";

const categoryStyle: Record<NoticeCategory, { icon: typeof Bell; tone: string }> = {
  "Office update": { icon: Megaphone, tone: "bg-primary-soft text-primary" },
  Closure: { icon: CalendarOff, tone: "bg-danger-soft text-danger" },
  Facilities: { icon: Wrench, tone: "bg-sky-500/10 text-sky-600 dark:text-sky-400" },
  Event: { icon: CalendarDays, tone: "bg-violet-500/10 text-violet-600 dark:text-violet-400" },
  Visitor: { icon: UserRoundCheck, tone: "bg-teal-500/10 text-teal-600 dark:text-teal-400" },
  Celebration: { icon: PartyPopper, tone: "bg-amber-500/10 text-amber-600 dark:text-amber-400" },
  Reminder: { icon: Bell, tone: "bg-warning-soft text-warning" },
};
const ALL = "All branches";
const eventLabel = (iso: string) => new Date(iso).toLocaleString("en-GB", { weekday: "short", day: "numeric", month: "short", hour: "2-digit", minute: "2-digit", timeZone: "UTC" });
const isExpired = (n: OfficeNotice) => !!n.expiresOn && n.expiresOn < officeToday;

export default function OfficeNewsFeedPage() {
  const { user } = useUser();
  const myBranch = getStaff().find((s) => s.name === user.name)?.branch ?? "Dhaka HQ";
  const [notices, setNotices] = useState<OfficeNotice[]>(getOfficeNotices);
  const [branch, setBranch] = useState<string>(ALL);
  const [category, setCategory] = useState<NoticeCategory | "">("");
  const [search, setSearch] = useState("");
  const [showExpired, setShowExpired] = useState(false);
  const [composer, setComposer] = useState<OfficeNotice | "new" | null>(null);
  const [deleting, setDeleting] = useState<OfficeNotice | null>(null);
  const [openComments, setOpenComments] = useState<Set<string>>(() => new Set());
  const [toast, notify] = useToast();
  const now = useNow();

  useEffect(() => saveOfficeNotices(notices), [notices]);

  const inBranch = (n: OfficeNotice, b: string) => b === ALL || n.branch === b || n.branch === ALL;
  const visible = useMemo(() => {
    const q = search.trim().toLowerCase();
    return notices
      .filter((n) => inBranch(n, branch) && (!category || n.category === category) && (showExpired || !isExpired(n)) && (!q || `${n.title} ${n.body} ${n.author}`.toLowerCase().includes(q)))
      .sort((a, b) => Number(b.pinned) - Number(a.pinned) || b.createdAt.localeCompare(a.createdAt));
  }, [notices, branch, category, search, showExpired]);

  const unseen = (b: string) => notices.filter((n) => inBranch(n, b) && !isExpired(n) && !n.seenBy.includes(user.name)).length;
  const upcoming = notices.filter((n) => n.eventAt && n.eventAt >= commsNow && inBranch(n, branch)).sort((a, b) => a.eventAt!.localeCompare(b.eventAt!));
  const patch = (id: string, fn: (n: OfficeNotice) => Partial<OfficeNotice>) => setNotices((prev) => prev.map((n) => (n.id === id ? { ...n, ...fn(n) } : n)));
  const markSeen = (n: OfficeNotice) => !n.seenBy.includes(user.name) && patch(n.id, (x) => ({ seenBy: [...x.seenBy, user.name] }));

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Office News Feed</h2>
          <p className="mt-1 text-sm text-muted-foreground">Notices for each branch — closures, visitors, events and facility updates. Company-wide news lives in <Link href="/communications/news-feed" className="font-medium text-primary hover:underline">Communications</Link>.</p>
        </div>
        <button type="button" onClick={() => setComposer("new")} className={buttonPrimary}><Plus className="size-4" /> Post notice</button>
      </header>

      <Tabs
        label="Branch"
        value={branch}
        onChange={setBranch}
        options={[ALL, ...branchNames()].map((b) => ({ value: b, label: b === myBranch ? `${b} (mine)` : b, count: unseen(b) || undefined, dot: unseen(b) ? "bg-primary" : undefined }))}
      />

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-3">
          <div className="flex flex-wrap items-center gap-2 rounded-2xl border border-border bg-surface p-3 card-shadow">
            <SearchField value={search} onChange={setSearch} placeholder="Search notices…" label="Search notices" />
            <div className="no-scrollbar flex min-w-0 flex-1 gap-1 overflow-x-auto">
              {(["", ...noticeCategories] as const).map((c) => (
                <button key={c || "all"} type="button" aria-pressed={category === c} onClick={() => setCategory(c)} className={cn("shrink-0 rounded-full px-3 py-1.5 text-xs font-semibold transition-colors", category === c ? "bg-foreground text-background" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground")}>
                  {c || "All"}
                </button>
              ))}
            </div>
            <label className="flex shrink-0 cursor-pointer items-center gap-2 text-xs text-muted-foreground">
              <input type="checkbox" checked={showExpired} onChange={(e) => setShowExpired(e.target.checked)} className="size-4 accent-primary" /> Show expired
            </label>
            {(search || category || showExpired) && <ResetFilters onClick={() => { setSearch(""); setCategory(""); setShowExpired(false); }} />}
          </div>

          {visible.length === 0 ? (
            <EmptyState icon={Megaphone} title="No notices here" body={search || category ? "Try another category or search." : "Nothing posted for this branch yet."} action={<button type="button" onClick={() => setComposer("new")} className={buttonSecondary}><Plus className="size-4" /> Post notice</button>} />
          ) : (
            visible.map((n) => {
              const { icon: Icon, tone } = categoryStyle[n.category];
              const seen = n.seenBy.includes(user.name);
              const liked = n.likes.includes(user.name);
              const expired = isExpired(n);
              const commentsOpen = openComments.has(n.id);
              return (
                <article key={n.id} className={cn("card-shadow rounded-3xl border bg-surface p-5", n.pinned ? "border-primary/30" : "border-border", expired && "opacity-60")}>
                  <div className="flex items-start gap-3">
                    <span className={cn("flex size-10 shrink-0 items-center justify-center rounded-2xl", tone)}><Icon className="size-5" /></span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {!seen && !expired && <span className="size-2 rounded-full bg-primary" aria-label="New" />}
                        <h3 className="text-[15px] font-semibold text-foreground">{n.title}</h3>
                      </div>
                      <p className="mt-0.5 flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
                        <span className="inline-flex items-center gap-1"><Building2 className="size-3" />{n.branch}</span>
                        <span>{n.category}</span>
                        <span>{n.author} · {relativeTime(n.createdAt)}</span>
                        {n.expiresOn && <span className={expired ? "text-danger" : ""}>{expired ? "Expired" : "Until"} {formatDay(n.expiresOn)}</span>}
                      </p>
                    </div>
                    <div className="flex shrink-0 items-center">
                      <IconBtn label={n.pinned ? "Unpin" : "Pin"} onClick={() => { patch(n.id, (x) => ({ pinned: !x.pinned })); notify(n.pinned ? "Unpinned" : "Pinned to the top"); }}><Pin className={cn("size-3.5", n.pinned && "fill-current text-primary")} /></IconBtn>
                      <IconBtn label="Edit" onClick={() => setComposer(n)}><PencilLine className="size-3.5" /></IconBtn>
                      <IconBtn label="Delete" danger onClick={() => setDeleting(n)}><Trash2 className="size-3.5" /></IconBtn>
                    </div>
                  </div>

                  <p className="mt-3 whitespace-pre-line text-sm leading-relaxed text-foreground">{n.body}</p>

                  {n.eventAt && (
                    <div className="mt-3 flex items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3">
                      <CalendarDays className="size-4 text-violet-600 dark:text-violet-400" />
                      <span className="text-sm font-semibold text-foreground">{eventLabel(n.eventAt)}</span>
                      <span className="text-xs text-muted-foreground">{n.eventAt < commsNow ? "Happened" : relativeTime(n.eventAt)}</span>
                    </div>
                  )}

                  <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-border pt-3">
                    <button type="button" onClick={() => patch(n.id, (x) => ({ likes: liked ? x.likes.filter((l) => l !== user.name) : [...x.likes, user.name] }))} aria-pressed={liked} className={cn("inline-flex h-8 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition-colors", liked ? "border-primary/40 bg-primary-soft text-primary" : "border-border text-muted-foreground hover:text-foreground")}>
                      <ThumbsUp className="size-3.5" /> {n.likes.length || ""}
                    </button>
                    <button type="button" onClick={() => setOpenComments((s) => { const x = new Set(s); if (x.has(n.id)) x.delete(n.id); else x.add(n.id); return x; })} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground hover:text-foreground">
                      <MessageSquare className="size-3.5" /> {n.comments.length || ""} Comment{n.comments.length === 1 ? "" : "s"}
                    </button>
                    <span className="ml-auto flex items-center gap-2 text-[11px] text-muted-foreground" title={n.seenBy.join(", ")}>
                      {n.seenBy.length > 0 && <AvatarStack names={n.seenBy} max={4} />}
                      <Eye className="size-3.5" /> Seen by {n.seenBy.length}
                    </span>
                    {!seen && !expired && (
                      <button type="button" onClick={() => markSeen(n)} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">
                        <Check className="size-3.5" /> Got it
                      </button>
                    )}
                  </div>

                  {commentsOpen && (
                    <Comments
                      notice={n}
                      userName={user.name}
                      onAdd={(text) => patch(n.id, (x) => ({ comments: [...x.comments, { id: `c-${Date.now()}`, author: user.name, text, at: commsNow }], seenBy: x.seenBy.includes(user.name) ? x.seenBy : [...x.seenBy, user.name] }))}
                    />
                  )}
                </article>
              );
            })
          )}
        </div>

        <aside className="flex flex-col gap-4">
          <Card>
            <CardHeader icon={CalendarDays} iconBg="bg-violet-500/10" iconColor="text-violet-600 dark:text-violet-400" title="Coming up" subtitle={branch === ALL ? "Across all branches" : branch} />
            <ul className="flex flex-col gap-1 p-3">
              {upcoming.length === 0 && <li className="px-2 py-3 text-xs text-muted-foreground">No events or visits scheduled.</li>}
              {upcoming.map((n) => (
                <li key={n.id} className="flex items-center gap-3 rounded-xl p-2">
                  <span className="flex w-11 shrink-0 flex-col items-center rounded-xl bg-surface-muted py-1">
                    <span className="text-[10px] font-semibold uppercase text-muted-foreground">{new Date(n.eventAt!).toLocaleDateString("en-GB", { month: "short", timeZone: "UTC" })}</span>
                    <span className="text-base font-bold leading-none text-foreground">{new Date(n.eventAt!).getUTCDate()}</span>
                  </span>
                  <span className="min-w-0">
                    <span className="block truncate text-xs font-semibold text-foreground">{n.title}</span>
                    <span className="block truncate text-[11px] text-muted-foreground">{n.branch} · {eventLabel(n.eventAt!).split(", ")[1] ?? ""}</span>
                  </span>
                </li>
              ))}
            </ul>
          </Card>

          <Card>
            <CardHeader icon={Building2} title="Branches right now" subtitle="Live opening status" />
            <ul className="flex flex-col gap-1 p-3">
              {getBranches().filter((b) => b.status !== "Inactive").map((b) => (
                <li key={b.id}>
                  <button type="button" onClick={() => setBranch(b.name)} className="flex w-full items-center justify-between gap-2 rounded-xl p-2 text-left transition-colors hover:bg-surface-hover">
                    <span className="truncate text-xs font-semibold text-foreground">{b.name}</span>
                    <OpenPill branch={b} now={now} />
                  </button>
                </li>
              ))}
            </ul>
          </Card>
        </aside>
      </div>

      {composer && (
        <Composer
          key={composer === "new" ? "new" : composer.id}
          notice={composer === "new" ? undefined : composer}
          defaultBranch={branch === ALL ? myBranch : branch}
          onClose={() => setComposer(null)}
          onSave={(n) => {
            const isNew = !notices.some((x) => x.id === n.id);
            setNotices((prev) => (isNew ? [n, ...prev] : prev.map((x) => (x.id === n.id ? n : x))));
            if (isNew && branch !== ALL && n.branch !== branch && n.branch !== ALL) setBranch(n.branch);
            notify(isNew ? `Posted to ${n.branch}` : "Notice updated");
            setComposer(null);
          }}
          author={user.name}
        />
      )}

      <Modal open={!!deleting} onClose={() => setDeleting(null)} icon={Trash2} size="sm" title="Delete this notice?" subtitle={deleting?.title}
        footer={<div className="flex justify-end gap-2"><button type="button" onClick={() => setDeleting(null)} className={buttonSecondary}>Cancel</button><button type="button" onClick={() => { setNotices((prev) => prev.filter((n) => n.id !== deleting!.id)); notify("Notice deleted"); setDeleting(null); }} className={buttonDanger}>Delete</button></div>}
      >
        <p className="text-sm text-muted-foreground">Its comments are deleted too. If it&apos;s just out of date, set an expiry date instead.</p>
      </Modal>
      {toast}
    </div>
  );
}

function IconBtn({ label, onClick, danger, children }: { label: string; onClick: () => void; danger?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label} className={cn("flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors", danger ? "hover:bg-danger-soft hover:text-danger" : "hover:bg-surface-hover hover:text-foreground")}>
      {children}
    </button>
  );
}

function Comments({ notice, userName, onAdd }: { notice: OfficeNotice; userName: string; onAdd: (text: string) => void }) {
  const [text, setText] = useState("");
  const send = () => {
    if (!text.trim()) return;
    onAdd(text.trim());
    setText("");
  };
  return (
    <div className="mt-3 flex flex-col gap-3 rounded-2xl bg-surface-muted p-3">
      {notice.comments.map((c) => (
        <div key={c.id} className="flex items-start gap-2.5">
          <Avatar name={c.author} size="xs" />
          <div className="min-w-0 flex-1 rounded-xl bg-surface px-3 py-2">
            <p className="text-[11px] font-semibold text-foreground">{c.author} <span className="font-normal text-muted-foreground">· {relativeTime(c.at)}</span></p>
            <p className="text-xs text-foreground">{c.text}</p>
          </div>
        </div>
      ))}
      <div className="flex items-center gap-2">
        <Avatar name={userName} size="xs" />
        <input value={text} onChange={(e) => setText(e.target.value)} onKeyDown={(e) => e.key === "Enter" && send()} placeholder="Write a comment…" aria-label="Write a comment" className="h-9 min-w-0 flex-1 rounded-full border border-border bg-surface px-3.5 text-xs text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
        <button type="button" onClick={send} disabled={!text.trim()} aria-label="Send comment" className="flex size-9 items-center justify-center rounded-full bg-primary text-primary-foreground disabled:opacity-40"><Send className="size-3.5" /></button>
      </div>
    </div>
  );
}

function Composer({ notice, defaultBranch, author, onClose, onSave }: { notice?: OfficeNotice; defaultBranch: string; author: string; onClose: () => void; onSave: (n: OfficeNotice) => void }) {
  const [f, setF] = useState({
    title: notice?.title ?? "",
    body: notice?.body ?? "",
    branch: notice?.branch ?? defaultBranch,
    category: notice?.category ?? ("Office update" as NoticeCategory),
    eventDate: notice?.eventAt?.slice(0, 10) ?? "",
    eventTime: notice?.eventAt?.slice(11, 16) ?? "10:00",
    expiresOn: notice?.expiresOn ?? "",
    pinned: notice?.pinned ?? false,
  });
  const [tried, setTried] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const needsDate = f.category === "Event" || f.category === "Visitor";

  const errors: Record<string, string> = {};
  if (f.title.trim().length < 5) errors.title = "Give the notice a clear title";
  if (f.body.trim().length < 10) errors.body = "Add the details";
  if (needsDate && !f.eventDate) errors.eventDate = "When is it?";
  if (f.expiresOn && f.expiresOn < officeToday) errors.expiresOn = "Expiry must be today or later";
  const err = (k: string) => (tried ? errors[k] : undefined);

  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    onSave({
      id: notice?.id ?? `N-${Date.now()}`,
      branch: f.branch,
      category: f.category,
      title: f.title.trim(),
      body: f.body.trim(),
      author: notice?.author ?? author,
      createdAt: notice?.createdAt ?? commsNow,
      pinned: f.pinned,
      eventAt: needsDate && f.eventDate ? `${f.eventDate}T${f.eventTime || "10:00"}:00Z` : undefined,
      expiresOn: f.expiresOn || (needsDate ? f.eventDate : undefined),
      seenBy: notice?.seenBy ?? [author],
      likes: notice?.likes ?? [],
      comments: notice?.comments ?? [],
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={Megaphone}
      size="lg"
      title={notice ? "Edit notice" : "Post a notice"}
      subtitle="Everyone at the chosen branch sees it at the top of this feed until it expires."
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="button" onClick={save} className={buttonPrimary}><Send className="size-4" /> {notice ? "Save" : "Post notice"}</button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Branch">
          <Select value={f.branch} onChange={(e) => set("branch", e.target.value)}>
            <option>{ALL}</option>
            {branchNames().map((b) => <option key={b}>{b}</option>)}
          </Select>
        </Field>
        <Field label="Category">
          <Select value={f.category} onChange={(e) => set("category", e.target.value as NoticeCategory)}>
            {noticeCategories.map((c) => <option key={c}>{c}</option>)}
          </Select>
        </Field>
        <Field label="Title" required className="sm:col-span-2">
          <TextInput value={f.title} onChange={(e) => set("title", e.target.value)} placeholder="e.g. Lift out of service on Monday" aria-invalid={!!err("title")} className={cn(err("title") && "border-danger")} />
          {err("title") && <span className="text-[11px] font-medium text-danger">{err("title")}</span>}
        </Field>
        <Field label="Details" required className="sm:col-span-2">
          <Textarea rows={5} value={f.body} onChange={(e) => set("body", e.target.value)} placeholder="What's happening, who it affects and what people should do." aria-invalid={!!err("body")} className={cn("resize-y", err("body") && "border-danger")} />
          {err("body") && <span className="text-[11px] font-medium text-danger">{err("body")}</span>}
        </Field>
        {needsDate && (
          <>
            <Field label={f.category === "Visitor" ? "Visit date" : "Event date"} required>
              <TextInput type="date" min={officeToday} value={f.eventDate} onChange={(e) => set("eventDate", e.target.value)} aria-invalid={!!err("eventDate")} className={cn(err("eventDate") && "border-danger")} />
              {err("eventDate") && <span className="text-[11px] font-medium text-danger">{err("eventDate")}</span>}
            </Field>
            <Field label="Time">
              <TextInput type="time" value={f.eventTime} onChange={(e) => set("eventTime", e.target.value)} />
            </Field>
          </>
        )}
        <Field label="Hide after" hint={needsDate ? "Defaults to the event date." : "Leave empty to keep it until you delete it."}>
          <TextInput type="date" min={officeToday} value={f.expiresOn} onChange={(e) => set("expiresOn", e.target.value)} aria-invalid={!!err("expiresOn")} className={cn(err("expiresOn") && "border-danger")} />
          {err("expiresOn") && <span className="text-[11px] font-medium text-danger">{err("expiresOn")}</span>}
        </Field>
        <div className="flex items-end pb-2">
          <Checkbox checked={f.pinned} onChange={(v) => set("pinned", v)} label="Pin to the top" />
        </div>
      </div>
    </Modal>
  );
}
