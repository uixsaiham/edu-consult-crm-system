"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Banknote,
  Copy,
  Download,
  GraduationCap,
  Link2,
  Megaphone,
  Pause,
  PencilLine,
  Play,
  Send,
  SearchX,
  UserPlus,
  Users,
  Wallet,
} from "lucide-react";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { Modal } from "@/components/ui/modal";
import { SlideOver } from "@/components/ui/slide-over";
import { Field, PillGroup, Select, TextInput } from "@/components/ui/form-controls";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { Avatar, formatDay } from "@/components/people/people-ui";
import {
  ambassadorReferrals,
  getAmbassadors,
  referralLink,
  relationshipManagers,
  saveAmbassadors,
  today,
  type Ambassador,
  type AmbassadorKind,
  type AmbassadorStatus,
  type ReferralStats,
} from "@/lib/mock/agents";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const kinds: AmbassadorKind[] = ["Student", "Alumni", "Community"];
const kindStyles: Record<AmbassadorKind, string> = {
  Student: "bg-sky-500/10 text-sky-600 dark:text-sky-400",
  Alumni: "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  Community: "bg-teal-500/10 text-teal-600 dark:text-teal-400",
};
const statusStyles: Record<AmbassadorStatus, string> = {
  Active: "bg-success-soft text-success",
  Invited: "bg-primary-soft text-primary",
  Paused: "bg-warning-soft text-warning",
};
const money = (n: number) => `£${n.toLocaleString()}`;

export default function AmbassadorsPage() {
  const { user } = useUser();
  const [list, setList] = useState<Ambassador[]>(getAmbassadors);
  const [scope, setScope] = useState<"mine" | "all">("mine");
  const [search, setSearch] = useState("");
  const [kind, setKind] = useState("");
  const [status, setStatus] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Ambassador | "new" | null>(null);
  const [payingId, setPayingId] = useState<string | null>(null);
  const [toast, notify] = useToast();
  const referrals = useMemo(() => ambassadorReferrals(), []);

  useEffect(() => saveAmbassadors(list), [list]);

  const earned = (a: Ambassador) => referrals(a.name).enrolled * a.reward;
  const owed = (a: Ambassador) => Math.max(0, earned(a) - a.paid);

  const scoped = useMemo(() => list.filter((a) => scope === "all" || a.manager === user.name), [list, scope, user.name]);
  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return scoped
      .filter(
        (a) =>
          (!kind || a.kind === kind) &&
          (!status || a.status === status) &&
          (!q || `${a.name} ${a.email} ${a.code} ${a.affiliation} ${a.city}`.toLowerCase().includes(q))
      )
      .sort((a, b) => referrals(b.name).enrolled - referrals(a.name).enrolled || referrals(b.name).total - referrals(a.name).total);
  }, [scoped, search, kind, status, referrals]);

  const totals = scoped.reduce(
    (t, a) => {
      const s = referrals(a.name);
      return { referred: t.referred + s.total, enrolled: t.enrolled + s.enrolled, owed: t.owed + owed(a), month: t.month + s.thisMonth };
    },
    { referred: 0, enrolled: 0, owed: 0, month: 0 }
  );
  const hasFilters = !!(search || kind || status);

  const patch = (id: string, fn: (a: Ambassador) => Ambassador) => setList((prev) => prev.map((a) => (a.id === id ? fn(a) : a)));

  const copyLink = async (a: Ambassador) => {
    try {
      await navigator.clipboard.writeText(referralLink(a.code));
      notify(`Referral link for ${a.name} copied`);
    } catch {
      notify("Couldn't copy — your browser blocked clipboard access", "error");
    }
  };

  const exportRows = () =>
    downloadCsv(
      "ambassadors.csv",
      filtered.map((a) => {
        const s = referrals(a.name);
        return {
          id: a.id,
          name: a.name,
          type: a.kind,
          email: a.email,
          phone: a.phone,
          affiliation: a.affiliation,
          city: a.city,
          code: a.code,
          link: referralLink(a.code),
          manager: a.manager,
          status: a.status,
          referred: s.total,
          enrolled: s.enrolled,
          rewardPerEnrolment: a.reward,
          earned: earned(a),
          paid: a.paid,
          owed: owed(a),
        };
      })
    );

  const viewing = list.find((a) => a.id === viewingId);
  const paying = list.find((a) => a.id === payingId);

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">My Ambassadors</h2>
          <p className="mt-1 text-sm text-muted-foreground">Students, alumni and community leaders who refer applicants with a personal link — and earn a reward for each enrolment.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportRows} className={buttonSecondary}>
            <Download className="size-4" /> Export
          </button>
          <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}>
            <UserPlus className="size-4" /> Invite ambassador
          </button>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={Users} label="Active ambassadors" value={scoped.filter((a) => a.status === "Active").length} note={`${scoped.filter((a) => a.status === "Invited").length} invited`} />
        <StatCard icon={Megaphone} tone="primary" label="Applicants referred" value={totals.referred} note={`${totals.month} this month`} />
        <StatCard icon={GraduationCap} tone="success" label="Students enrolled" value={totals.enrolled} note={totals.referred ? `${Math.round((totals.enrolled / totals.referred) * 100)}%` : undefined} />
        <StatCard icon={Wallet} tone={totals.owed ? "warning" : "success"} label="Rewards owed" value={money(totals.owed)} />
      </StatGrid>

      <FilterBar>
        <PillGroup options={[{ value: "mine", label: `Mine (${list.filter((a) => a.manager === user.name).length})` }, { value: "all", label: `Everyone's (${list.length})` }]} value={scope} onChange={setScope} />
        <SearchField value={search} onChange={setSearch} placeholder="Name, code, university…" label="Search ambassadors" />
        <SelectFilter label="Type" value={kind} onChange={setKind} allLabel="All types" options={kinds} />
        <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="Any status" options={["Active", "Invited", "Paused"]} />
        {hasFilters && <ResetFilters onClick={() => { setSearch(""); setKind(""); setStatus(""); }} />}
      </FilterBar>

      {filtered.length === 0 ? (
        <div className="flex flex-col items-center gap-2 rounded-3xl border border-dashed border-border px-6 py-16 text-center">
          <span className="flex size-10 items-center justify-center rounded-full bg-surface-hover text-muted-foreground"><SearchX className="size-5" /></span>
          <p className="text-sm font-medium text-foreground">{scoped.length ? "No ambassadors match" : "You don't manage any ambassadors yet"}</p>
          <p className="text-xs text-muted-foreground">{scoped.length ? "Try another filter or search." : "Invite one, or switch to everyone's ambassadors."}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
          {filtered.map((a, i) => {
            const s = referrals(a.name);
            const due = owed(a);
            return (
              <article key={a.id} className={cn("card-shadow flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5", a.status === "Paused" && "opacity-75")}>
                <div className="flex items-start gap-3">
                  <span className="relative">
                    <Avatar name={a.name} size="md" />
                    {i < 3 && s.enrolled > 0 && !hasFilters && (
                      <span className="absolute -right-1 -top-1 flex size-4 items-center justify-center rounded-full bg-amber-500 text-[9px] font-bold text-white ring-2 ring-surface">{i + 1}</span>
                    )}
                  </span>
                  <button type="button" onClick={() => setViewingId(a.id)} className="min-w-0 flex-1 text-left">
                    <p className="truncate text-sm font-semibold text-foreground hover:text-primary">{a.name}</p>
                    <p className="truncate text-[11px] text-muted-foreground">{a.affiliation}</p>
                  </button>
                  <span className={cn("shrink-0 rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyles[a.status])}>{a.status}</span>
                </div>

                <div className="flex items-center gap-2">
                  <span className={cn("rounded-full px-2 py-0.5 text-[11px] font-semibold", kindStyles[a.kind])}>{a.kind}</span>
                  <span className="text-[11px] text-muted-foreground">{a.city} · {money(a.reward)} per enrolment</span>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  {[
                    ["Referred", s.total],
                    ["Enrolled", s.enrolled],
                    ["Owed", money(due)],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-xl bg-surface-muted px-3 py-2">
                      <p className={cn("text-base font-bold tabular-nums", l === "Owed" && due > 0 ? "text-warning" : "text-foreground")}>{v}</p>
                      <p className="text-[11px] text-muted-foreground">{l}</p>
                    </div>
                  ))}
                </div>

                <button type="button" onClick={() => copyLink(a)} className="group flex items-center gap-2 rounded-xl border border-dashed border-border-strong px-3 py-2 text-left transition-colors hover:border-primary hover:bg-primary-soft/40">
                  <Link2 className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                  <span className="min-w-0 flex-1 truncate font-mono text-[11px] text-foreground">bheuni.com/apply?ref={a.code}</span>
                  <Copy className="size-3.5 shrink-0 text-muted-foreground group-hover:text-primary" />
                </button>

                <div className="mt-auto flex items-center gap-1.5 border-t border-border pt-3">
                  {a.status === "Invited" ? (
                    <CardButton onClick={() => notify(`Invitation re-sent to ${a.email}`)}><Send className="size-3.5" /> Resend invite</CardButton>
                  ) : (
                    <CardButton onClick={() => setPayingId(a.id)} disabled={due === 0}><Banknote className="size-3.5" /> Pay {due ? money(due) : ""}</CardButton>
                  )}
                  {a.status !== "Invited" && (
                    <CardButton
                      onClick={() => {
                        patch(a.id, (x) => ({ ...x, status: x.status === "Paused" ? "Active" : "Paused" }));
                        notify(a.status === "Paused" ? `${a.name}'s link is live again` : `${a.name} paused — their link stops crediting referrals`);
                      }}
                    >
                      {a.status === "Paused" ? <><Play className="size-3.5" /> Resume</> : <><Pause className="size-3.5" /> Pause</>}
                    </CardButton>
                  )}
                  <button type="button" onClick={() => setEditing(a)} aria-label={`Edit ${a.name}`} title="Edit" className="ml-auto flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground">
                    <PencilLine className="size-4" />
                  </button>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {viewing && (
        <AmbassadorProfile ambassador={viewing} stats={referrals(viewing.name)} owed={owed(viewing)} onClose={() => setViewingId(null)} onCopy={() => copyLink(viewing)} onPay={() => setPayingId(viewing.id)} />
      )}

      {editing && (
        <AmbassadorDialog
          key={editing === "new" ? "new" : editing.id}
          ambassador={editing === "new" ? undefined : editing}
          defaultManager={user.name}
          existing={list}
          onClose={() => setEditing(null)}
          onSave={(a, isNew) => {
            setList((prev) => (isNew ? [a, ...prev] : prev.map((x) => (x.id === a.id ? a : x))));
            if (isNew && a.manager !== user.name) setScope("all");
            notify(isNew ? `Invitation sent to ${a.email}` : `${a.name} saved`);
            setEditing(null);
          }}
        />
      )}

      {paying && (
        <PayoutDialog
          key={paying.id}
          ambassador={paying}
          owed={owed(paying)}
          by={user.name}
          onClose={() => setPayingId(null)}
          onPay={(amount) => {
            patch(paying.id, (x) => ({ ...x, paid: x.paid + amount, payouts: [{ at: today, amount, by: user.name }, ...x.payouts] }));
            notify(`${money(amount)} payout to ${paying.name} recorded`);
            setPayingId(null);
          }}
        />
      )}

      {toast}
    </div>
  );
}

function CardButton({ onClick, disabled, children }: { onClick: () => void; disabled?: boolean; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} disabled={disabled} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border bg-surface px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-hover disabled:pointer-events-none disabled:opacity-50">
      {children}
    </button>
  );
}

function AmbassadorProfile({
  ambassador: a,
  stats,
  owed,
  onClose,
  onCopy,
  onPay,
}: {
  ambassador: Ambassador;
  stats: ReferralStats;
  owed: number;
  onClose: () => void;
  onCopy: () => void;
  onPay: () => void;
}) {
  return (
    <SlideOver
      open
      onClose={onClose}
      icon={Megaphone}
      title={a.name}
      subtitle={`${a.id} · ${a.kind} ambassador since ${formatDay(a.joined)}`}
      footer={
        <div className="flex gap-2">
          <button type="button" onClick={onCopy} className={cn(buttonSecondary, "flex-1")}><Copy className="size-4" /> Copy link</button>
          <button type="button" onClick={onPay} disabled={!owed} className={cn(buttonPrimary, "flex-1")}><Banknote className="size-4" /> Pay {money(owed)}</button>
        </div>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="grid grid-cols-4 gap-2">
          {[
            ["Referred", stats.total],
            ["In progress", stats.open],
            ["Enrolled", stats.enrolled],
            ["Paid", money(a.paid)],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-surface-muted px-3 py-2.5">
              <p className="text-lg font-bold tabular-nums text-foreground">{v}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>

        <dl className="grid grid-cols-[110px_1fr] gap-x-3 gap-y-2.5 text-xs">
          <dt className="text-muted-foreground">Email</dt><dd className="text-foreground"><a href={`mailto:${a.email}`} className="hover:text-primary">{a.email}</a></dd>
          <dt className="text-muted-foreground">Phone</dt><dd className="text-foreground">{a.phone}</dd>
          <dt className="text-muted-foreground">Affiliation</dt><dd className="text-foreground">{a.affiliation}</dd>
          <dt className="text-muted-foreground">City</dt><dd className="text-foreground">{a.city}</dd>
          <dt className="text-muted-foreground">Referral link</dt><dd className="break-all font-mono text-foreground">{referralLink(a.code)}</dd>
          <dt className="text-muted-foreground">Reward</dt><dd className="text-foreground">{money(a.reward)} per enrolled student</dd>
          <dt className="text-muted-foreground">Managed by</dt><dd className="text-foreground">{a.manager}</dd>
        </dl>

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">Referred applicants</p>
          {stats.recent.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {stats.recent.map((r) => (
                <li key={r.id}>
                  <Link href={`/applications/${r.id}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs transition-colors hover:bg-surface-hover">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{r.applicant}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{r.university} · {formatDay(r.createdAt)}</span>
                    </span>
                    <span className={cn("shrink-0 text-[11px] font-medium", r.stage === "Enrolled" ? "text-success" : "text-muted-foreground")}>{r.stage}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">No one has applied with this link yet.</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">Payouts</p>
          {a.payouts.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {a.payouts.map((p, i) => (
                <li key={i} className="flex items-center justify-between px-3.5 py-2.5 text-xs">
                  <span className="text-foreground">{formatDay(p.at)} <span className="text-muted-foreground">· {p.by}</span></span>
                  <span className="font-semibold tabular-nums text-foreground">{money(p.amount)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No payouts yet.</p>
          )}
        </div>
      </div>
    </SlideOver>
  );
}

function codeFrom(name: string, taken: string[]) {
  const base = (name.split(" ")[0] || "REF").toUpperCase().replace(/[^A-Z]/g, "").slice(0, 8) || "REF";
  let code = base;
  for (let n = 2; taken.includes(code); n++) code = `${base}${n}`;
  return code;
}

function AmbassadorDialog({
  ambassador,
  defaultManager,
  existing,
  onClose,
  onSave,
}: {
  ambassador?: Ambassador;
  defaultManager: string;
  existing: Ambassador[];
  onClose: () => void;
  onSave: (a: Ambassador, isNew: boolean) => void;
}) {
  const [f, setF] = useState({
    name: ambassador?.name ?? "",
    email: ambassador?.email ?? "",
    phone: ambassador?.phone ?? "",
    kind: ambassador?.kind ?? ("Student" as AmbassadorKind),
    affiliation: ambassador?.affiliation ?? "",
    city: ambassador?.city ?? "London",
    reward: String(ambassador?.reward ?? 150),
    code: ambassador?.code ?? "",
    manager: ambassador?.manager ?? (relationshipManagers.includes(defaultManager) ? defaultManager : relationshipManagers[0]),
  });
  const [tried, setTried] = useState(false);
  const set = <K extends keyof typeof f>(k: K, v: (typeof f)[K]) => setF((x) => ({ ...x, [k]: v }));
  const others = existing.filter((a) => a.id !== ambassador?.id);
  const code = (f.code || codeFrom(f.name, others.map((a) => a.code))).toUpperCase();

  const errors: Record<string, string> = {};
  if (!f.name.trim()) errors.name = "Enter their name";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(f.email.trim())) errors.email = "Enter a valid email";
  else if (others.some((a) => a.email.toLowerCase() === f.email.trim().toLowerCase())) errors.email = "Already an ambassador";
  if (!/^[A-Z0-9]{3,12}$/.test(code)) errors.code = "3–12 letters or numbers";
  else if (others.some((a) => a.code === code)) errors.code = "Code already in use";
  if (!(Number(f.reward) > 0)) errors.reward = "Enter a reward";
  const err = (k: string) => (tried ? errors[k] : undefined);

  const save = () => {
    setTried(true);
    if (Object.keys(errors).length) return;
    const max = Math.max(0, ...existing.map((a) => Number(a.id.slice(4))));
    onSave(
      {
        id: ambassador?.id ?? `AMB-${String(max + 1).padStart(2, "0")}`,
        name: f.name.trim(),
        email: f.email.trim().toLowerCase(),
        phone: f.phone.trim(),
        kind: f.kind,
        affiliation: f.affiliation.trim() || (f.kind === "Community" ? "Community partner" : "—"),
        city: f.city.trim(),
        code,
        reward: Number(f.reward),
        manager: f.manager,
        status: ambassador?.status ?? "Invited",
        joined: ambassador?.joined ?? today,
        paid: ambassador?.paid ?? 0,
        payouts: ambassador?.payouts ?? [],
      },
      !ambassador
    );
  };

  return (
    <Modal
      open
      onClose={onClose}
      icon={ambassador ? PencilLine : UserPlus}
      title={ambassador ? `Edit ${ambassador.name}` : "Invite an ambassador"}
      subtitle={ambassador ? "Changes apply to future referrals." : "They get an email with their personal referral link."}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="button" onClick={save} className={buttonPrimary}>{ambassador ? "Save" : <><Send className="size-4" /> Send invite</>}</button>
        </div>
      }
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field label="Type" className="sm:col-span-2">
          <PillGroup options={kinds.map((k) => ({ value: k, label: k }))} value={f.kind} onChange={(v) => set("kind", v)} />
        </Field>
        <Field label="Full name" required>
          <TextInput value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="e.g. Tanvir Ahmed" aria-invalid={!!err("name")} className={cn(err("name") && "border-danger")} />
          <Hint msg={err("name")} />
        </Field>
        <Field label="Email" required>
          <TextInput type="email" value={f.email} onChange={(e) => set("email", e.target.value)} placeholder="name@example.com" aria-invalid={!!err("email")} className={cn(err("email") && "border-danger")} />
          <Hint msg={err("email")} />
        </Field>
        <Field label="Phone / WhatsApp">
          <TextInput type="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} placeholder="+44 7700 900000" />
        </Field>
        <Field label="City">
          <TextInput value={f.city} onChange={(e) => set("city", e.target.value)} />
        </Field>
        <Field label={f.kind === "Community" ? "Organisation" : "University & course"} className="sm:col-span-2">
          <TextInput value={f.affiliation} onChange={(e) => set("affiliation", e.target.value)} placeholder={f.kind === "Community" ? "e.g. Bangladeshi Welfare Association, Luton" : "e.g. University of Greenwich · BSc Business"} />
        </Field>
        <Field label="Referral code" hint={`bheuni.com/apply?ref=${code || "…"}`}>
          <TextInput value={f.code} onChange={(e) => set("code", e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ""))} placeholder={code || "Auto from name"} aria-invalid={!!err("code")} className={cn("font-mono", err("code") && "border-danger")} />
          <Hint msg={err("code")} />
        </Field>
        <Field label="Reward per enrolment (£)">
          <TextInput inputMode="numeric" value={f.reward} onChange={(e) => set("reward", e.target.value.replace(/\D/g, "").slice(0, 4))} aria-invalid={!!err("reward")} className={cn(err("reward") && "border-danger")} />
          <Hint msg={err("reward")} />
        </Field>
        <Field label="Managed by" className="sm:col-span-2">
          <Select value={f.manager} onChange={(e) => set("manager", e.target.value)}>
            {relationshipManagers.map((m) => <option key={m}>{m}</option>)}
          </Select>
        </Field>
      </div>
    </Modal>
  );
}

function PayoutDialog({ ambassador, owed, by, onClose, onPay }: { ambassador: Ambassador; owed: number; by: string; onClose: () => void; onPay: (amount: number) => void }) {
  const [amount, setAmount] = useState(String(owed));
  const n = Number(amount);
  const valid = n > 0 && n <= owed;
  return (
    <Modal
      open
      onClose={onClose}
      icon={Banknote}
      size="sm"
      title={`Pay ${ambassador.name}`}
      subtitle={`${money(owed)} owed · ${money(ambassador.reward)} per enrolment`}
      footer={
        <div className="flex justify-end gap-2">
          <button type="button" onClick={onClose} className={buttonSecondary}>Cancel</button>
          <button type="button" onClick={() => onPay(n)} disabled={!valid} className={buttonPrimary}>Record payout</button>
        </div>
      }
    >
      <Field label="Amount (£)" hint={valid ? `Recorded by ${by} on ${formatDay(today)}.` : `Enter up to ${money(owed)}.`}>
        <TextInput inputMode="numeric" value={amount} onChange={(e) => setAmount(e.target.value.replace(/\D/g, "").slice(0, 5))} />
      </Field>
    </Modal>
  );
}

function Hint({ msg }: { msg?: string }) {
  return msg ? <span className="text-[11px] font-medium text-danger">{msg}</span> : null;
}
