"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Building2,
  CalendarOff,
  Clock3,
  DoorOpen,
  Download,
  Eye,
  FileText,
  Mail,
  MapPin,
  MessageCircle,
  PencilLine,
  Phone,
  Plus,
  Users,
  UsersRound,
} from "lucide-react";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { FilterBar, ResetFilters, SearchField, SelectFilter } from "@/components/ui/filter-dropdown";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { SlideOver } from "@/components/ui/slide-over";
import { useToast } from "@/components/ui/toast";
import { Avatar, formatDay } from "@/components/people/people-ui";
import { BranchDialog } from "@/components/office/branch-dialog";
import { EmptyState, OpenPill } from "@/components/office/office-ui";
import { getApplications } from "@/lib/mock/applications";
import { getLeads } from "@/lib/mock/leads";
import { getStaff, getStaffMember } from "@/lib/mock/staff";
import { getBranches, getVisits, localTime, officeToday, openState, saveBranches, type Branch } from "@/lib/mock/office";
import { useNow } from "@/lib/use-now";
import { downloadCsv } from "@/lib/csv";
import { cn } from "@/lib/utils";

const month = officeToday.slice(0, 7);

function branchStats(name: string) {
  const staff = getStaff().filter((s) => s.branch === name && s.status !== "Inactive");
  const leads = getLeads().filter((l) => l.branch === name);
  const apps = getApplications().filter((a) => a.branch === name);
  return {
    staff,
    leadsMonth: leads.filter((l) => l.createdDate.startsWith(month)).length,
    appsMonth: apps.filter((a) => a.createdAt.startsWith(month)).length,
    apps: apps.length,
    enrolled: apps.filter((a) => a.stage === "Enrolled").length,
    visitorsToday: getVisits().filter((v) => v.branch === name && v.checkedInAt).length,
  };
}

export default function BranchOfficePage() {
  const [list, setList] = useState<Branch[]>(getBranches);
  const [search, setSearch] = useState("");
  const [country, setCountry] = useState("");
  const [status, setStatus] = useState("");
  const [viewingId, setViewingId] = useState<string | null>(null);
  const [editing, setEditing] = useState<Branch | "new" | null>(null);
  const [toast, notify] = useToast();
  const now = useNow();

  useEffect(() => saveBranches(list), [list]);

  const stats = useMemo(() => new Map(list.map((b) => [b.id, branchStats(b.name)])), [list]);
  const filtered = list.filter((b) => {
    const q = search.trim().toLowerCase();
    return (!country || b.country === country) && (!status || b.status === status) && (!q || `${b.name} ${b.city} ${b.address} ${b.email} ${b.phone}`.toLowerCase().includes(q));
  });
  const openNow = now ? list.filter((b) => openState(b, new Date(now)).open).length : null;
  const totals = [...stats.values()].reduce((t, s) => ({ staff: t.staff + s.staff.length, leads: t.leads + s.leadsMonth, apps: t.apps + s.appsMonth }), { staff: 0, leads: 0, apps: 0 });
  const viewing = list.find((b) => b.id === viewingId);

  const exportCsv = () =>
    downloadCsv(
      "branch-offices.csv",
      filtered.map((b) => {
        const s = stats.get(b.id)!;
        return {
          id: b.id, branch: b.name, type: b.type, status: b.status, address: b.address, city: b.city, country: b.country, phone: b.phone, whatsapp: b.whatsapp, email: b.email,
          manager: getStaffMember(b.managerId)?.name ?? "", staff: s.staff.length, rooms: b.rooms, leadsThisMonth: s.leadsMonth, applicationsThisMonth: s.appsMonth, enrolled: s.enrolled,
          hours: b.hours.map((h) => `${h.day} ${h.closed ? "closed" : `${h.open}-${h.close}`}`).join("; "),
        };
      })
    );

  return (
    <div className="flex flex-col gap-4">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h2 className="text-2xl font-semibold tracking-tight text-foreground">Branch Offices</h2>
          <p className="mt-1 text-sm text-muted-foreground">Where BHE operates — contact details, opening hours, teams and how each branch is performing.</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button type="button" onClick={exportCsv} className={buttonSecondary}><Download className="size-4" /> Export</button>
          <button type="button" onClick={() => setEditing("new")} className={buttonPrimary}><Plus className="size-4" /> Add branch</button>
        </div>
      </header>

      <StatGrid>
        <StatCard icon={DoorOpen} tone="success" label="Open right now" value={openNow ?? "…"} note={`of ${list.length}`} />
        <StatCard icon={Users} label="Team members" value={totals.staff} />
        <StatCard icon={UsersRound} tone="primary" label="Leads this month" value={totals.leads} />
        <StatCard icon={FileText} tone="violet" label="Applications this month" value={totals.apps} />
      </StatGrid>

      <FilterBar>
        <SearchField value={search} onChange={setSearch} placeholder="Branch, city, address…" label="Search branches" />
        <SelectFilter label="Country" value={country} onChange={setCountry} allLabel="All countries" options={[...new Set(list.map((b) => b.country))]} />
        <SelectFilter label="Status" value={status} onChange={setStatus} allLabel="Any status" options={["Open", "Temporarily closed", "Inactive"]} />
        {(search || country || status) && <ResetFilters onClick={() => { setSearch(""); setCountry(""); setStatus(""); }} />}
      </FilterBar>

      {filtered.length === 0 ? (
        <EmptyState icon={Building2} title="No branches match" body="Try another country, status or search." />
      ) : (
        <div className="grid grid-cols-1 gap-3 lg:grid-cols-2">
          {filtered.map((b) => {
            const s = stats.get(b.id)!;
            const manager = getStaffMember(b.managerId);
            return (
              <article key={b.id} className={cn("card-shadow flex flex-col gap-4 rounded-3xl border border-border bg-surface p-5", b.status === "Inactive" && "opacity-60")}>
                <div className="flex items-start gap-3">
                  <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-primary"><Building2 className="size-5" /></span>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => setViewingId(b.id)} className="truncate text-base font-semibold text-foreground hover:text-primary">{b.name}</button>
                      <span className="rounded-full border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">{b.type}</span>
                    </div>
                    <p className="mt-0.5 flex items-start gap-1 text-xs text-muted-foreground"><MapPin className="mt-0.5 size-3 shrink-0" /> {b.address}</p>
                  </div>
                  <div className="flex shrink-0 flex-col items-end gap-1">
                    <OpenPill branch={b} now={now} />
                    {now && <span className="text-[11px] tabular-nums text-muted-foreground">{localTime(b, new Date(now))} local</span>}
                  </div>
                </div>

                {b.notes && <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-foreground">{b.notes}</p>}

                <div className="grid grid-cols-4 gap-2">
                  {[
                    ["Team", s.staff.length],
                    ["Leads", s.leadsMonth],
                    ["Apps", s.appsMonth],
                    ["Enrolled", s.enrolled],
                  ].map(([l, v]) => (
                    <div key={l} className="rounded-xl bg-surface-muted px-3 py-2">
                      <p className="text-base font-bold tabular-nums text-foreground">{v}</p>
                      <p className="text-[11px] text-muted-foreground">{l}{l === "Leads" || l === "Apps" ? " · Sep" : ""}</p>
                    </div>
                  ))}
                </div>

                <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs">
                  <a href={`tel:${b.phone.replace(/\s/g, "")}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"><Phone className="size-3.5" /> {b.phone}</a>
                  <a href={`mailto:${b.email}`} className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-primary"><Mail className="size-3.5" /> {b.email}</a>
                </div>

                <div className="mt-auto flex items-center gap-2 border-t border-border pt-3">
                  {manager ? (
                    <span className="flex min-w-0 items-center gap-2">
                      <Avatar name={manager.name} size="sm" />
                      <span className="min-w-0">
                        <span className="block truncate text-xs font-semibold text-foreground">{manager.name}</span>
                        <span className="block text-[11px] text-muted-foreground">Branch manager</span>
                      </span>
                    </span>
                  ) : (
                    <span className="text-xs text-muted-foreground">No manager assigned</span>
                  )}
                  <div className="ml-auto flex items-center gap-1.5">
                    <IconButton label={`View ${b.name}`} onClick={() => setViewingId(b.id)}><Eye className="size-4" /></IconButton>
                    <IconButton label={`Edit ${b.name}`} onClick={() => setEditing(b)}><PencilLine className="size-4" /></IconButton>
                    <Link href={`/office/front-office?branch=${encodeURIComponent(b.name)}`} className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-foreground transition-colors hover:bg-surface-hover">
                      Front desk{s.visitorsToday ? ` · ${s.visitorsToday}` : ""}
                    </Link>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}

      {viewing && <BranchDetail branch={viewing} now={now} onClose={() => setViewingId(null)} onEdit={() => setEditing(viewing)} />}

      {editing && (
        <BranchDialog
          key={editing === "new" ? "new" : editing.id}
          branch={editing === "new" ? undefined : editing}
          existing={list}
          onClose={() => setEditing(null)}
          onSave={(b) => {
            const isNew = !list.some((x) => x.id === b.id);
            setList((prev) => (isNew ? [...prev, b] : prev.map((x) => (x.id === b.id ? b : x))));
            notify(isNew ? `${b.name} added` : `${b.name} saved`);
            setEditing(null);
          }}
        />
      )}
      {toast}
    </div>
  );
}

function IconButton({ label, onClick, children }: { label: string; onClick: () => void; children: ReactNode }) {
  return (
    <button type="button" onClick={onClick} aria-label={label} title={label.split(" ")[0]} className="flex size-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:bg-primary-soft hover:text-primary">
      {children}
    </button>
  );
}

function BranchDetail({ branch: b, now, onClose, onEdit }: { branch: Branch; now: number | null; onClose: () => void; onEdit: () => void }) {
  const s = branchStats(b.name);
  const manager = getStaffMember(b.managerId);
  const todayName = now ? new Date(now).toLocaleDateString("en-GB", { weekday: "short", timeZone: b.timezone }) : "";
  const upcoming = [...b.holidays].filter((h) => h.date >= officeToday).sort((x, y) => x.date.localeCompare(y.date));
  const conversion = s.apps ? Math.round((s.enrolled / s.apps) * 100) : 0;

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={Building2}
      title={b.name}
      subtitle={`${b.type} · ${b.city}, ${b.country} · since ${formatDay(b.openedOn)}`}
      footer={
        <Link href={`/people?branch=${encodeURIComponent(b.name)}`} className={cn(buttonSecondary, "w-full")}>
          <Users className="size-4" /> View team in People
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={onEdit} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"><PencilLine className="size-3.5" /> Edit</button>
          <a href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(b.address)}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><MapPin className="size-3.5" /> Map</a>
          {b.whatsapp && <a href={`https://wa.me/${b.whatsapp.replace(/\D/g, "")}`} target="_blank" rel="noreferrer" className="inline-flex h-8 items-center gap-1.5 rounded-full border border-border px-3 text-xs font-semibold text-foreground hover:bg-surface-hover"><MessageCircle className="size-3.5" /> WhatsApp</a>}
          <span className="ml-auto"><OpenPill branch={b} now={now} /></span>
        </div>

        {b.notes && <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-foreground">{b.notes}</p>}

        <div className="grid grid-cols-3 gap-2">
          {[
            ["Applications", s.apps],
            ["Enrolled", s.enrolled],
            ["Conversion", `${conversion}%`],
            ["Leads · Sep", s.leadsMonth],
            ["Rooms", b.rooms],
            ["Visitors today", s.visitorsToday],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-surface-muted px-3 py-2.5">
              <p className="text-lg font-bold tabular-nums text-foreground">{v}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>

        <dl className="grid grid-cols-[100px_1fr] gap-x-3 gap-y-2.5 text-xs">
          <dt className="text-muted-foreground">Address</dt><dd className="text-foreground">{b.address}</dd>
          <dt className="text-muted-foreground">Phone</dt><dd className="text-foreground">{b.phone}</dd>
          <dt className="text-muted-foreground">WhatsApp</dt><dd className="text-foreground">{b.whatsapp || "—"}</dd>
          <dt className="text-muted-foreground">Email</dt><dd className="text-foreground">{b.email}</dd>
          <dt className="text-muted-foreground">Manager</dt><dd className="text-foreground">{manager ? `${manager.name} · ${manager.phone}` : "Not assigned"}</dd>
        </dl>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground"><Clock3 className="size-3.5" /> Opening hours <span className="font-normal text-muted-foreground">· {b.timezone === "Asia/Dhaka" ? "Bangladesh time" : "UK time"}</span></p>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {b.hours.map((h) => (
              <li key={h.day} className={cn("flex items-center justify-between px-3.5 py-2 text-xs", h.day === todayName && "bg-primary-soft/60")}>
                <span className={cn("font-medium", h.day === todayName ? "text-primary" : "text-foreground")}>{h.day}{h.day === todayName && " · today"}</span>
                <span className={h.closed ? "text-muted-foreground" : "tabular-nums text-foreground"}>{h.closed ? "Closed" : `${h.open} – ${h.close}`}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground"><CalendarOff className="size-3.5" /> Upcoming closures</p>
          {upcoming.length ? (
            <ul className="flex flex-col gap-1.5">
              {upcoming.map((h) => (
                <li key={h.date + h.label} className="flex items-center justify-between rounded-xl bg-surface-muted px-3 py-2 text-xs">
                  <span className="text-foreground">{h.label}</span>
                  <span className="text-muted-foreground">{formatDay(h.date)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-muted-foreground">No closures planned.</p>
          )}
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">Services</p>
          <div className="flex flex-wrap gap-1.5">
            {b.services.map((x) => <span key={x} className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] text-foreground">{x}</span>)}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">Team · {s.staff.length}</p>
          <ul className="divide-y divide-border rounded-2xl border border-border">
            {s.staff.map((p) => (
              <li key={p.id} className="flex items-center gap-3 px-3.5 py-2">
                <Avatar name={p.name} size="sm" />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-semibold text-foreground">{p.name}</span>
                  <span className="block truncate text-[11px] text-muted-foreground">{p.jobTitle}</span>
                </span>
                {p.status !== "Active" && <span className="text-[11px] text-muted-foreground">{p.status}</span>}
              </li>
            ))}
            {s.staff.length === 0 && <li className="px-3.5 py-4 text-center text-xs text-muted-foreground">No one is assigned to this branch yet.</li>}
          </ul>
        </div>
      </div>
    </SlideOver>
  );
}
