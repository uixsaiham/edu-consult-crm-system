"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import {
  CalendarClock,
  CalendarPlus,
  CheckCircle2,
  Clock3,
  DoorOpen,
  Hourglass,
  LogOut,
  Phone,
  Play,
  Search,
  Ticket,
  UserCheck,
  UserPlus,
  UserX,
  Users,
} from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { Modal } from "@/components/ui/modal";
import { Checkbox, Field, Select, TextInput, Textarea } from "@/components/ui/form-controls";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { Avatar } from "@/components/people/people-ui";
import { OpenPill } from "@/components/office/office-ui";
import { addLead, makeLeadId } from "@/lib/mock/leads";
import {
  branchCounsellors,
  getBranches,
  getVisits,
  nextToken,
  officeToday,
  saveVisits,
  visitPurposes,
  type Visit,
  type VisitPurpose,
} from "@/lib/mock/office";
import { useNow } from "@/lib/use-now";
import { initialsFor, cn } from "@/lib/utils";

const clock = (ms?: number) => (ms ? new Date(ms).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "—");
const mins = (from?: number, to?: number | null) => (from && to ? Math.max(0, Math.round((to - from) / 60000)) : 0);
const waitTone = (m: number) => (m >= 20 ? "text-danger bg-danger-soft" : m >= 10 ? "text-warning bg-warning-soft" : "text-success bg-success-soft");

function FrontOfficePageInner() {
  return (
    <Suspense fallback={<p className="p-6 text-muted-foreground">Loading front office…</p>}>
      <FrontOfficeFromParams />
    </Suspense>
  );
}

function FrontOfficeFromParams() {
  const params = useSearchParams();
  const branches = getBranches().filter((b) => b.status !== "Inactive");
  const requested = params.get("branch");
  const initial = branches.find((b) => b.name === requested)?.name ?? branches[0].name;
  return <FrontOffice key={initial} initialBranch={initial} />;
}

function FrontOffice({ initialBranch }: { initialBranch: string }) {
  const [visits, setVisits] = useState<Visit[]>(getVisits);
  const [branchName, setBranchName] = useState(initialBranch);
  const [search, setSearch] = useState("");
  const [dialog, setDialog] = useState<{ kind: "walk-in" | "appointment" } | { kind: "finish"; id: string } | null>(null);
  const [toast, notify] = useToast();
  const now = useNow();
  const branch = getBranches().find((b) => b.name === branchName)!;
  const counsellors = branchCounsellors(branchName);

  useEffect(() => saveVisits(visits), [visits]);

  const here = useMemo(() => {
    const q = search.trim().toLowerCase();
    return visits.filter((v) => v.branch === branchName && (!q || `${v.name} ${v.phone} ${v.token} ${v.purpose}`.toLowerCase().includes(q)));
  }, [visits, branchName, search]);

  const waiting = here.filter((v) => v.status === "Waiting").sort((a, b) => a.checkedInAt! - b.checkedInAt!);
  const inSession = here.filter((v) => v.status === "In session");
  const expected = here.filter((v) => v.status === "Expected").sort((a, b) => a.scheduledAt! - b.scheduledAt!);
  const closed = here.filter((v) => v.status === "Done" || v.status === "No-show" || v.status === "Left").sort((a, b) => (b.endedAt ?? b.scheduledAt ?? 0) - (a.endedAt ?? a.scheduledAt ?? 0));
  const done = here.filter((v) => v.status === "Done");
  const avgWait = done.length ? Math.round(done.reduce((n, v) => n + mins(v.checkedInAt, v.startedAt), 0) / done.length) : 0;
  const longest = waiting.length && now ? mins(waiting[0].checkedInAt, now) : 0;
  const busy = new Set(inSession.map((v) => v.counsellor));

  const patch = (id: string, p: Partial<Visit>) => setVisits((prev) => prev.map((v) => (v.id === id ? { ...v, ...p } : v)));

  const callIn = (v: Visit, counsellor: string) => {
    if (!counsellor) return notify("Choose a counsellor first", "error");
    patch(v.id, { status: "In session", counsellor, startedAt: Date.now(), checkedInAt: v.checkedInAt ?? Date.now() });
    notify(`${v.token} ${v.name} — please go to ${counsellor}`);
  };

  const makeLead = (v: Visit, note: string) => {
    const leadId = makeLeadId();
    addLead({
      id: leadId,
      name: v.name,
      initials: initialsFor(v.name),
      phone: v.phone,
      email: v.email,
      country: branch.country,
      branch: v.branch,
      counsellor: v.counsellor,
      status: v.counsellor ? "Contacted" : "New",
      leadNote: note || v.notes || v.purpose,
      leadSource: v.kind === "Walk-in" ? "Walk-in" : "Office appointment",
      createdDate: officeToday,
    });
    return leadId;
  };

  const finishing = dialog?.kind === "finish" ? visits.find((v) => v.id === dialog.id) : undefined;

  // Times are shown in the viewer's local clock, so render the board only in the browser.
  if (!now) return <p className="p-6 text-sm text-muted-foreground">Loading front office…</p>;

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Front Office</h2>
            <OpenPill branch={branch} now={now} />
          </div>
          <p className="mt-1 text-sm text-muted-foreground">Check in walk-ins and appointments, keep the queue moving and turn visitors into leads.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <div className="w-44">
            <Select value={branchName} onChange={(e) => setBranchName(e.target.value)} aria-label="Branch" className="h-10 py-2 text-xs font-semibold">
              {getBranches().filter((b) => b.status !== "Inactive").map((b) => <option key={b.id}>{b.name}</option>)}
            </Select>
          </div>
          <button type="button" onClick={() => setDialog({ kind: "appointment" })} className={buttonSecondary}><CalendarPlus className="size-4" /> Book appointment</button>
          <button type="button" onClick={() => setDialog({ kind: "walk-in" })} className={buttonPrimary}><UserPlus className="size-4" /> Check in visitor</button>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={Hourglass} tone={longest >= 20 ? "danger" : waiting.length ? "warning" : "success"} label="Waiting now" value={waiting.length} note={waiting.length ? `longest ${longest}m` : undefined} />
        <StatCard icon={DoorOpen} tone="primary" label="In session" value={inSession.length} note={`${counsellors.length - busy.size} free`} />
        <StatCard icon={CalendarClock} tone="violet" label="Appointments due" value={expected.length} />
        <StatCard icon={CheckCircle2} tone="success" label="Seen today" value={done.length} note={done.length ? `avg wait ${avgWait}m` : undefined} />
      </StatGrid>

      <div className="grid grid-cols-1 items-start gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
        <div className="flex min-w-0 flex-col gap-4">
          <div className="relative">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <input type="search" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Find a visitor by name, phone or token…" aria-label="Search visitors" className="h-11 w-full rounded-2xl border border-border bg-surface pl-10 pr-4 text-sm text-foreground card-shadow placeholder:text-muted-foreground focus:border-primary focus:outline-none" />
          </div>

          <Lane title="Waiting" count={waiting.length} icon={Hourglass} hint="First come, first served">
            {waiting.length === 0 && <LaneEmpty text="No one is waiting." />}
            {waiting.map((v, i) => (
              <WaitingCard key={v.id} v={v} position={i + 1} now={now} counsellors={counsellors} busy={busy} onCallIn={callIn} onLeft={() => { patch(v.id, { status: "Left", endedAt: Date.now() }); notify(`${v.name} marked as left`); }} />
            ))}
          </Lane>

          <Lane title="In session" count={inSession.length} icon={DoorOpen}>
            {inSession.length === 0 && <LaneEmpty text="No one is with a counsellor." />}
            {inSession.map((v) => (
              <VisitRow key={v.id} v={v}>
                <span className="text-[11px] text-muted-foreground">with <span className="font-semibold text-foreground">{v.counsellor}</span> · {now ? mins(v.startedAt, now) : 0} min</span>
                <button type="button" onClick={() => setDialog({ kind: "finish", id: v.id })} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-success px-3.5 text-xs font-semibold text-white hover:bg-success/90">
                  <CheckCircle2 className="size-3.5" /> Finish
                </button>
              </VisitRow>
            ))}
          </Lane>

          <Lane title="Appointments due" count={expected.length} icon={CalendarClock}>
            {expected.length === 0 && <LaneEmpty text="No more appointments today." />}
            {expected.map((v) => {
              const late = now ? mins(v.scheduledAt, now) : 0;
              const due = now && v.scheduledAt! <= now;
              return (
                <VisitRow key={v.id} v={v}>
                  <span className={cn("text-[11px] font-semibold", due ? (late > 15 ? "text-danger" : "text-warning") : "text-muted-foreground")}>
                    {clock(v.scheduledAt)}{due ? ` · ${late ? `${late} min late` : "now"}` : ""} · {v.counsellor}
                  </span>
                  <div className="flex gap-1.5">
                    <button type="button" onClick={() => { patch(v.id, { status: "No-show", endedAt: Date.now() }); notify(`${v.name} marked as no-show`); }} className="inline-flex h-8 items-center gap-1 rounded-full border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-surface-hover hover:text-foreground">
                      <UserX className="size-3.5" /> No-show
                    </button>
                    <button type="button" onClick={() => { patch(v.id, { status: "Waiting", checkedInAt: Date.now() }); notify(`${v.name} checked in — ${v.counsellor} notified`); }} className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">
                      <UserCheck className="size-3.5" /> Check in
                    </button>
                  </div>
                </VisitRow>
              );
            })}
          </Lane>
        </div>

        <aside className="flex flex-col gap-4">
          <Card className="p-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-foreground"><Users className="size-3.5" /> Counsellors on duty</p>
            {counsellors.length === 0 ? (
              <p className="text-xs text-muted-foreground">No counsellors are based at this branch.</p>
            ) : (
              <ul className="flex flex-col gap-2">
                {counsellors.map((c) => {
                  const withWho = inSession.find((v) => v.counsellor === c);
                  const queue = waiting.filter((v) => v.counsellor === c).length;
                  return (
                    <li key={c} className="flex items-center gap-2.5">
                      <span className="relative">
                        <Avatar name={c} size="sm" />
                        <span className={cn("absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full ring-2 ring-surface", withWho ? "bg-warning" : "bg-success")} />
                      </span>
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-xs font-semibold text-foreground">{c}</span>
                        <span className="block truncate text-[11px] text-muted-foreground">{withWho ? `With ${withWho.name}` : "Free"}{queue ? ` · ${queue} waiting` : ""}</span>
                      </span>
                    </li>
                  );
                })}
              </ul>
            )}
          </Card>

          <Card className="p-5">
            <p className="mb-3 flex items-center gap-1.5 text-xs font-semibold text-foreground"><Clock3 className="size-3.5" /> Today&apos;s log</p>
            {closed.length === 0 ? (
              <p className="text-xs text-muted-foreground">Finished visits appear here.</p>
            ) : (
              <ul className="flex flex-col divide-y divide-border">
                {closed.map((v) => (
                  <li key={v.id} className="flex items-start gap-2.5 py-2.5 first:pt-0 last:pb-0">
                    <span className={cn("mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full", v.status === "Done" ? "bg-success-soft text-success" : "bg-surface-hover text-muted-foreground")}>
                      {v.status === "Done" ? <CheckCircle2 className="size-3.5" /> : v.status === "Left" ? <LogOut className="size-3.5" /> : <UserX className="size-3.5" />}
                    </span>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-xs font-semibold text-foreground">{v.name}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">
                        {v.status === "Done" ? `${v.purpose} · ${v.counsellor} · ${mins(v.startedAt, v.endedAt)} min` : v.status === "No-show" ? `Missed ${clock(v.scheduledAt)} appointment` : `Left after ${mins(v.checkedInAt, v.endedAt)} min`}
                      </span>
                      {v.leadId ? (
                        <Link href="/leads" className="text-[11px] font-semibold text-success hover:underline">Lead created ✓</Link>
                      ) : (
                        <button type="button" onClick={() => { patch(v.id, { leadId: makeLead(v, "") }); notify(`${v.name} added to Leads`); }} className="text-[11px] font-semibold text-primary hover:underline">Create lead</button>
                      )}
                    </span>
                  </li>
                ))}
              </ul>
            )}
          </Card>
        </aside>
      </div>

      {(dialog?.kind === "walk-in" || dialog?.kind === "appointment") && (
        <CheckInDialog
          kind={dialog.kind}
          branch={branchName}
          counsellors={counsellors}
          onClose={() => setDialog(null)}
          onSave={(v) => {
            const token = nextToken(branchName, visits);
            setVisits((prev) => [...prev, { ...v, id: `VIS-${Date.now()}`, token }]);
            notify(v.kind === "Walk-in" ? `Token ${token} issued to ${v.name}` : `${v.name} booked for ${clock(v.scheduledAt)}`);
            setDialog(null);
          }}
        />
      )}

      {finishing && (
        <FinishDialog
          visit={finishing}
          onClose={() => setDialog(null)}
          onFinish={(notes, createLead) => {
            const leadId = createLead && !finishing.leadId ? makeLead(finishing, notes) : finishing.leadId;
            patch(finishing.id, { status: "Done", endedAt: Date.now(), notes: notes || finishing.notes, leadId });
            notify(createLead ? `${finishing.name} finished and added to Leads` : `${finishing.name} finished`);
            setDialog(null);
          }}
        />
      )}
      {toast}
    </div>
  );
}

function Lane({ title, count, icon: Icon, hint, children }: { title: string; count: number; icon: typeof Hourglass; hint?: string; children: ReactNode }) {
  return (
    <Card className="overflow-hidden">
      <div className="flex items-center gap-2 border-b border-border px-5 py-3">
        <Icon className="size-4 text-muted-foreground" />
        <h3 className="text-sm font-semibold text-foreground">{title}</h3>
        <span className="rounded-full bg-surface-hover px-2 text-[11px] font-semibold tabular-nums text-muted-foreground">{count}</span>
        {hint && <span className="ml-auto text-[11px] text-muted-foreground">{hint}</span>}
      </div>
      <ul className="divide-y divide-border">{children}</ul>
    </Card>
  );
}

function LaneEmpty({ text }: { text: string }) {
  return <li className="px-5 py-6 text-center text-xs text-muted-foreground">{text}</li>;
}

function VisitRow({ v, children }: { v: Visit; children: ReactNode }) {
  return (
    <li className="flex flex-wrap items-center gap-3 px-5 py-3">
      <span className="flex h-9 min-w-14 items-center justify-center gap-1 rounded-xl bg-surface-muted px-2 font-mono text-xs font-bold text-foreground"><Ticket className="size-3 text-muted-foreground" />{v.token}</span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{v.name}</p>
        <p className="flex flex-wrap items-center gap-x-2 text-[11px] text-muted-foreground">
          <span>{v.purpose}</span>
          <span className="inline-flex items-center gap-1"><Phone className="size-3" />{v.phone}</span>
          {v.kind === "Appointment" && <span className="rounded-full bg-violet-500/10 px-1.5 font-semibold text-violet-600 dark:text-violet-400">Booked</span>}
        </p>
      </div>
      <div className="flex w-full flex-wrap items-center justify-between gap-2 sm:w-auto sm:justify-end sm:gap-3">{children}</div>
    </li>
  );
}

function WaitingCard({
  v,
  position,
  now,
  counsellors,
  busy,
  onCallIn,
  onLeft,
}: {
  v: Visit;
  position: number;
  now: number | null;
  counsellors: string[];
  busy: Set<string>;
  onCallIn: (v: Visit, counsellor: string) => void;
  onLeft: () => void;
}) {
  const [who, setWho] = useState(v.counsellor || counsellors.find((c) => !busy.has(c)) || "");
  const wait = now ? mins(v.checkedInAt, now) : 0;
  return (
    <VisitRow v={v}>
      <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold tabular-nums", waitTone(wait))} title={`Checked in ${clock(v.checkedInAt)} · #${position} in queue`}>
        {wait} min
      </span>
      <div className="flex items-center gap-1.5">
        <select value={who} onChange={(e) => setWho(e.target.value)} aria-label={`Counsellor for ${v.name}`} className="h-8 max-w-40 rounded-full border border-border bg-surface px-2.5 text-xs text-foreground focus:border-primary focus:outline-none">
          <option value="">Choose counsellor</option>
          {counsellors.map((c) => <option key={c} value={c}>{c}{busy.has(c) ? " (busy)" : ""}</option>)}
        </select>
        <button type="button" onClick={onLeft} aria-label={`${v.name} left without being seen`} title="Left without being seen" className="flex size-8 items-center justify-center rounded-full border border-border text-muted-foreground hover:bg-surface-hover hover:text-foreground">
          <LogOut className="size-3.5" />
        </button>
        <button type="button" onClick={() => onCallIn(v, who)} className="inline-flex h-8 items-center gap-1 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover">
          <Play className="size-3.5" /> Call in
        </button>
      </div>
    </VisitRow>
  );
}

function CheckInDialog({
  kind,
  branch,
  counsellors,
  onClose,
  onSave,
}: {
  kind: "walk-in" | "appointment";
  branch: string;
  counsellors: string[];
  onClose: () => void;
  onSave: (v: Omit<Visit, "id" | "token">) => void;
}) {
  const walkIn = kind === "walk-in";
  const [f, setF] = useState({ name: "", phone: "", email: "", purpose: (walkIn ? "New enquiry" : "Counselling appointment") as VisitPurpose, counsellor: walkIn ? "" : counsellors[0] ?? "", time: "", notes: "" });
  const [tried, setTried] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));

  const scheduledAt = (() => {
    if (!f.time) return undefined;
    const [h, m] = f.time.split(":").map(Number);
    const d = new Date();
    d.setHours(h, m, 0, 0);
    return d.getTime();
  })();
  const errors: Record<string, string> = {};
  if (!f.name.trim()) errors.name = "Enter the visitor's name";
  if (f.phone.replace(/\D/g, "").length < 8) errors.phone = "Enter a phone number";
  if (f.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = "Check the email";
  if (!walkIn && !f.time) errors.time = "Pick a time";
  if (!walkIn && !f.counsellor) errors.counsellor = "Choose a counsellor";
  const err = (k: string) => (tried ? errors[k] : undefined);

  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    onSave({
      branch,
      name: f.name.trim(),
      phone: f.phone.trim(),
      email: f.email.trim().toLowerCase(),
      purpose: f.purpose,
      kind: walkIn ? "Walk-in" : "Appointment",
      scheduledAt,
      counsellor: f.counsellor,
      status: walkIn ? "Waiting" : "Expected",
      checkedInAt: walkIn ? Date.now() : undefined,
      notes: f.notes.trim(),
    });
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={walkIn ? UserPlus : CalendarPlus}
      title={walkIn ? "Check in a visitor" : "Book an appointment for today"}
      subtitle={`${branch} · ${walkIn ? "they'll get the next queue token" : "shows in Appointments due"}`}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="button" onClick={save} className={buttonPrimary}>{walkIn ? <><Ticket className="size-4" /> Issue token</> : <><CalendarPlus className="size-4" /> Book</>}</button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Full name" required>
          <TextInput value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={!!err("name")} className={cn(err("name") && "border-danger")} />
          <Err msg={err("name")} />
        </Field>
        <Field label="Phone / WhatsApp" required>
          <TextInput type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+880 1711-000000" aria-invalid={!!err("phone")} className={cn(err("phone") && "border-danger")} />
          <Err msg={err("phone")} />
        </Field>
        <Field label="Email">
          <TextInput type="email" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={!!err("email")} className={cn(err("email") && "border-danger")} />
          <Err msg={err("email")} />
        </Field>
        <Field label="Reason for visit">
          <Select value={f.purpose} onChange={(e) => set("purpose", e.target.value as VisitPurpose)}>
            {visitPurposes.map((p) => <option key={p}>{p}</option>)}
          </Select>
        </Field>
        {!walkIn && (
          <Field label="Time" required>
            <TextInput type="time" value={f.time} onChange={(e) => set("time", e.target.value)} aria-invalid={!!err("time")} className={cn(err("time") && "border-danger")} />
            <Err msg={err("time")} />
          </Field>
        )}
        <Field label={walkIn ? "Asking for (optional)" : "Counsellor"} required={!walkIn}>
          <Select value={f.counsellor} onChange={(e) => set("counsellor", e.target.value)}>
            {walkIn && <option value="">Next available</option>}
            {counsellors.map((c) => <option key={c}>{c}</option>)}
          </Select>
          <Err msg={err("counsellor")} />
        </Field>
        <Field label="Notes" className="sm:col-span-2">
          <Textarea rows={2} value={f.notes} onChange={(e) => set("notes", e.target.value)} placeholder="e.g. Interested in nursing, Jan 2027" />
        </Field>
      </div>
    </Modal>
  );
}

function FinishDialog({ visit, onClose, onFinish }: { visit: Visit; onClose: () => void; onFinish: (notes: string, createLead: boolean) => void }) {
  const [notes, setNotes] = useState(visit.notes);
  const [createLead, setCreateLead] = useState(!visit.leadId && (visit.purpose === "New enquiry" || visit.kind === "Walk-in"));
  return (
    <Modal
      open
      onClose={onClose}
      icon={CheckCircle2}
      size="sm"
      title={`Finish visit — ${visit.name}`}
      subtitle={`${visit.purpose} with ${visit.counsellor}`}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="button" onClick={() => onFinish(notes.trim(), createLead)} className={buttonPrimary}>Finish visit</button>
        </div>
      }
    >
      <div className="flex flex-col gap-4">
        <Field label="Outcome" hint="Saved on the visit and copied to the lead note.">
          <Textarea rows={3} value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="e.g. Shortlisted 3 MSc courses, sending IELTS guide" />
        </Field>
        {visit.leadId ? (
          <p className="text-xs text-success">Already added to Leads.</p>
        ) : (
          <Checkbox checked={createLead} onChange={setCreateLead} label={<span><span className="font-semibold">Add to Leads</span><span className="block text-xs text-muted-foreground">Creates a lead assigned to {visit.counsellor}, source &quot;{visit.kind === "Walk-in" ? "Walk-in" : "Office appointment"}&quot;.</span></span>} />
        )}
      </div>
    </Modal>
  );
}

function Err({ msg }: { msg?: string }) {
  return msg ? <span className="text-[11px] font-medium text-danger">{msg}</span> : null;
}

export default function FrontOfficePage() { return <Suspense><FrontOfficePageInner /></Suspense>; }
