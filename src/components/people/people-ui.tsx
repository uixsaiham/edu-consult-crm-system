"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { Briefcase, Building2, CalendarDays, Clock3, Languages, Mail, PencilLine, Phone, ShieldCheck, ShieldOff, UserRound, Users } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { buttonPrimary } from "@/components/ui/button-styles";
import { getRoles, getStaffMember, getTeams, type StaffMember, type StaffStatus } from "@/lib/mock/staff";
import { cn, initialsFor } from "@/lib/utils";

const avatarTones = [
  "bg-primary-soft text-primary",
  "bg-teal-500/10 text-teal-600 dark:text-teal-400",
  "bg-violet-500/10 text-violet-600 dark:text-violet-400",
  "bg-amber-500/10 text-amber-600 dark:text-amber-400",
  "bg-rose-500/10 text-rose-600 dark:text-rose-400",
  "bg-sky-500/10 text-sky-600 dark:text-sky-400",
];

export function Avatar({ name, size = "md", className }: { name: string; size?: "xs" | "sm" | "md" | "lg"; className?: string }) {
  const tone = avatarTones[[...name].reduce((n, c) => n + c.charCodeAt(0), 0) % avatarTones.length];
  const sizes = { xs: "size-6 text-[9px]", sm: "size-8 text-[10px]", md: "size-9 text-xs", lg: "size-14 text-lg" };
  return <span className={cn("flex shrink-0 items-center justify-center rounded-full font-bold", tone, sizes[size], className)}>{initialsFor(name)}</span>;
}

/** Overlapping avatars with a "+N" chip. */
export function AvatarStack({ names, max = 5 }: { names: string[]; max?: number }) {
  return (
    <div className="flex items-center">
      {names.slice(0, max).map((n) => (
        <Avatar key={n} name={n} size="sm" className="-ml-2 ring-2 ring-surface first:ml-0" />
      ))}
      {names.length > max && (
        <span className="-ml-2 flex size-8 items-center justify-center rounded-full bg-surface-hover text-[10px] font-semibold text-muted-foreground ring-2 ring-surface">+{names.length - max}</span>
      )}
    </div>
  );
}

const statusStyles: Record<StaffStatus, string> = {
  Active: "bg-success-soft text-success",
  "On leave": "bg-warning-soft text-warning",
  Invited: "bg-primary-soft text-primary",
  Inactive: "bg-surface-hover text-muted-foreground",
};
const statusDots: Record<StaffStatus, string> = { Active: "bg-success", "On leave": "bg-warning", Invited: "bg-primary", Inactive: "bg-muted-foreground" };

export function StaffStatusBadge({ status }: { status: StaffStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyles[status])}>
      <span className={cn("size-1.5 rounded-full", statusDots[status])} />
      {status}
    </span>
  );
}
export const staffStatusDot = statusDots;

export function RoleChip({ roleId }: { roleId: string }) {
  const role = getRoles().find((r) => r.id === roleId);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
      <span className={cn("size-1.5 rounded-full", role?.color ?? "bg-muted-foreground")} />
      {role?.name ?? "No role"}
    </span>
  );
}

/** "12 min ago", "3 h ago", "2 d ago" relative to the demo's "now" (17 Sep 2026, 11:00). */
export function lastSeen(iso: string) {
  if (!iso) return "Never signed in";
  const mins = Math.round((Date.parse("2026-09-17T11:00:00Z") - Date.parse(iso)) / 60000);
  if (mins < 5) return "Online now";
  if (mins < 60) return `${mins} min ago`;
  if (mins < 60 * 24) return `${Math.round(mins / 60)} h ago`;
  return `${Math.round(mins / 1440)} d ago`;
}

export function formatDay(iso: string) {
  return iso ? new Date(`${iso.slice(0, 10)}T00:00:00Z`).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric", timeZone: "UTC" }) : "—";
}

export function Meter({ value, max, tone = "primary" }: { value: number; max: number; tone?: "primary" | "warning" | "danger" | "success" }) {
  const pct = max > 0 ? Math.min(100, Math.round((value / max) * 100)) : 0;
  const colors = { primary: "bg-primary", warning: "bg-warning", danger: "bg-danger", success: "bg-success" };
  return (
    <span className="block h-1.5 w-full overflow-hidden rounded-full bg-surface-hover">
      <span className={cn("block h-full rounded-full", colors[tone])} style={{ width: `${pct}%` }} />
    </span>
  );
}

export function loadTone(open: number, capacity: number): "primary" | "warning" | "danger" {
  if (!capacity) return "primary";
  const r = open / capacity;
  return r >= 1 ? "danger" : r >= 0.8 ? "warning" : "primary";
}

export function StaffProfile({
  person,
  load,
  onClose,
}: {
  person: StaffMember;
  load?: { open: number; enrolled: number; total: number; thisMonth: number };
  onClose: () => void;
}) {
  const manager = person.reportsTo ? getStaffMember(person.reportsTo) : undefined;
  const role = getRoles().find((r) => r.id === person.roleId);
  const teams = getTeams().filter((t) => t.memberIds.includes(person.id));
  const counts = load ?? { open: 0, enrolled: 0, total: 0, thisMonth: 0 };

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={UserRound}
      title={person.name}
      subtitle={`${person.id} · ${person.jobTitle}`}
      footer={
        <Link href={`/people/${person.id}/edit`} className={cn(buttonPrimary, "w-full")}>
          <PencilLine className="size-4" /> Edit profile
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex items-center gap-4">
          <Avatar name={person.name} size="lg" />
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <StaffStatusBadge status={person.status} />
              <RoleChip roleId={person.roleId} />
            </div>
            <p className="mt-1.5 text-xs text-muted-foreground">{lastSeen(person.lastActive)}</p>
          </div>
        </div>

        {person.notes && <p className="rounded-xl bg-warning-soft px-3 py-2 text-xs text-foreground">{person.notes}</p>}

        {counts.total > 0 || person.capacity > 0 ? (
          <div className="grid grid-cols-3 gap-2">
            {[
              ["Open cases", `${counts.open}${person.capacity ? ` / ${person.capacity}` : ""}`],
              ["Enrolled", counts.enrolled],
              ["New this month", counts.thisMonth],
            ].map(([l, v]) => (
              <div key={l} className="rounded-xl bg-surface-muted px-3 py-2.5">
                <p className="text-lg font-bold tabular-nums text-foreground">{v}</p>
                <p className="text-[11px] text-muted-foreground">{l}</p>
              </div>
            ))}
          </div>
        ) : null}

        <dl className="grid grid-cols-1 gap-3 text-sm">
          <Row icon={Mail} label="Email"><a href={`mailto:${person.email}`} className="hover:text-primary">{person.email}</a></Row>
          <Row icon={Phone} label="Phone">{person.phone}</Row>
          <Row icon={Building2} label="Branch">{person.branch}</Row>
          <Row icon={Briefcase} label="Employment">{person.employment} · joined {formatDay(person.joined)}</Row>
          <Row icon={UserRound} label="Reports to">{manager ? `${manager.name} (${manager.jobTitle})` : "—"}</Row>
          <Row icon={Users} label="Teams">{teams.length ? teams.map((t) => t.name).join(", ") : "Not in a team"}</Row>
          <Row icon={Languages} label="Languages">{person.languages.join(", ")}</Row>
          <Row icon={CalendarDays} label="Monthly target">{person.monthlyTarget ? `${person.monthlyTarget} enrolments` : "No sales target"}</Row>
          <Row icon={Clock3} label="Capacity">{person.capacity ? `${person.capacity} open cases` : "Doesn't take cases"}</Row>
          <Row icon={person.twoFactor ? ShieldCheck : ShieldOff} label="Two-factor sign-in">
            <span className={person.twoFactor ? "text-success" : "text-warning"}>{person.twoFactor ? "On" : "Off — required from 1 Oct"}</span>
          </Row>
        </dl>

        {role && (
          <div className="rounded-2xl border border-border p-4">
            <p className="text-xs font-semibold text-foreground">{role.name} access</p>
            <p className="mt-0.5 text-xs text-muted-foreground">{role.description} Data scope: {role.scope.toLowerCase()}.</p>
            <div className="mt-3 flex flex-wrap gap-1.5">
              {Object.entries(role.permissions)
                .filter(([, a]) => a.length)
                .map(([m, a]) => (
                  <span key={m} className="rounded-full bg-surface-muted px-2 py-0.5 text-[11px] text-foreground">
                    {m} <span className="text-muted-foreground">· {a.length === 5 ? "full" : a.join(", ").toLowerCase()}</span>
                  </span>
                ))}
            </div>
          </div>
        )}
      </div>
    </SlideOver>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof Mail; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <dt className="w-32 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}
