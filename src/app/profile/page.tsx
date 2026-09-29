"use client";

export const dynamic = 'force-dynamic';

import { Suspense, useMemo } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { Bell, Briefcase, Building2, CalendarDays, History, LayoutDashboard, Languages, Mail, PencilLine, Phone, ShieldCheck, UserRound } from "lucide-react";
import { Card } from "@/components/ui/card";
import { buttonPrimary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { formatDay } from "@/components/people/people-ui";
import { UserAvatar } from "@/components/layout/avatar";
import { useUser } from "@/components/layout/user-context";
import { ProfileOverview } from "@/components/profile/overview";
import { ProfileDetails } from "@/components/profile/details";
import { ProfileSecurity } from "@/components/profile/security";
import { ProfileNotifications } from "@/components/profile/notifications";
import { getStaff, getStaffMember } from "@/lib/mock/staff";
import { presenceStatuses } from "@/lib/mock/user";
import { allAuditEvents, auditStore } from "@/lib/settings/audit";
import { useSettingsStore } from "@/lib/settings/store";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "overview", label: "Overview", icon: LayoutDashboard },
  { id: "details", label: "Personal details", icon: UserRound },
  { id: "security", label: "Password & security", icon: ShieldCheck },
  { id: "notifications", label: "Notifications", icon: Bell },
  { id: "activity", label: "My activity", icon: History },
] as const;
type Tab = (typeof tabs)[number]["id"];

function ProfilePageInner() {
  return (
    <Suspense>
      <Profile />
    </Suspense>
  );
}

function Profile() {
  const params = useSearchParams();
  const router = useRouter();
  const tab = (tabs.find((t) => t.id === params.get("tab"))?.id ?? "overview") as Tab;
  const { user } = useUser();
  const [toast, notify] = useToast();
  const staff = getStaffMember(user.staffId);
  const reports = getStaff().filter((s) => s.reportsTo === user.staffId && s.status !== "Inactive").length;
  const status = presenceStatuses.find((p) => p.value === user.status)!;
  const go = (t: Tab) => router.replace(t === "overview" ? "/profile" : `/profile?tab=${t}`, { scroll: false });

  return (
    <div className="flex flex-col gap-4">
      <Card className="relative overflow-hidden">
        {/* Soft brand wash instead of a heavy banner. */}
        <div aria-hidden className="pointer-events-none absolute inset-0 bg-gradient-to-br from-primary/[0.09] via-violet-500/[0.05] to-transparent" />
        <div aria-hidden className="pointer-events-none absolute -right-24 -top-24 size-72 rounded-full bg-primary/10 blur-3xl" />

        <div className="relative flex flex-col gap-6 p-5 sm:p-7 lg:flex-row lg:items-center">
          <div className="flex min-w-0 flex-1 flex-col gap-5 sm:flex-row sm:items-center">
            <UserAvatar user={user} size="xl" className="self-start rounded-full shadow-lg ring-4 ring-surface sm:self-center" />
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-2">
                <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[28px]">{user.name}</h2>
                <span className="inline-flex items-center gap-1.5 rounded-full border border-border bg-surface/80 px-2.5 py-1 text-[11px] font-medium text-foreground backdrop-blur">
                  <span className={cn("size-2 rounded-full", status.dot)} />{user.status}
                </span>
              </div>
              <p className="mt-1 text-sm text-muted-foreground">
                {user.jobTitle}{user.role !== user.jobTitle && <> ({user.role})</>} <span className="px-0.5 text-muted-foreground/50">•</span> {user.branch}
                {user.statusMessage && <><span className="px-0.5 text-muted-foreground/50"> • </span><span className="italic">{user.statusMessage}</span></>}
              </p>
              {user.bio && <p className="mt-3 max-w-xl text-sm leading-relaxed text-foreground/80">{user.bio}</p>}
              <div className="mt-4 flex flex-wrap gap-2">
                <Chip icon={Mail} href={`mailto:${user.email}`}>{user.email}</Chip>
                {user.phone && <Chip icon={Phone} href={`tel:${user.phone.replace(/\s/g, "")}`}>{user.phone}</Chip>}
                <Chip icon={Languages}>{user.languages.join(", ")}</Chip>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-4 lg:w-80 lg:shrink-0 lg:items-end">
            <dl className="grid w-full grid-cols-3 divide-x divide-border rounded-2xl border border-border bg-surface/80 backdrop-blur">
              <Fact icon={Building2} label="Staff ID" value={user.staffId} />
              <Fact icon={CalendarDays} label="Joined" value={staff ? formatDay(staff.joined).replace(/^\d+ /, "") : "—"} />
              <Fact icon={Briefcase} label="Team" value={`${reports} ${reports === 1 ? "person" : "people"}`} />
            </dl>
            {tab !== "details" && (
              <button type="button" onClick={() => go("details")} className={cn(buttonPrimary, "w-full justify-center lg:w-auto")}><PencilLine className="size-4" /> Edit profile</button>
            )}
          </div>
        </div>
      </Card>

      <nav aria-label="Profile sections" className="-mx-1 overflow-x-auto px-1">
        <div className="inline-flex gap-1 rounded-full border border-border bg-surface p-1 card-shadow">
          {tabs.map((t) => (
            <button key={t.id} type="button" onClick={() => go(t.id)} aria-current={tab === t.id ? "page" : undefined} className={cn("inline-flex shrink-0 items-center gap-2 whitespace-nowrap rounded-full px-4 py-2 text-sm font-medium transition-colors", tab === t.id ? "bg-primary text-primary-foreground shadow-xs" : "text-muted-foreground hover:bg-surface-hover hover:text-foreground")}>
              <t.icon className="size-4" />{t.label}
            </button>
          ))}
        </div>
      </nav>

      {tab === "overview" && <ProfileOverview user={user} />}
      {tab === "details" && <ProfileDetails notify={notify} />}
      {tab === "security" && <ProfileSecurity notify={notify} />}
      {tab === "notifications" && <ProfileNotifications notify={notify} />}
      {tab === "activity" && <MyActivity name={user.name} />}
      {toast}
    </div>
  );
}

function Chip({ icon: Icon, href, children }: { icon: typeof Mail; href?: string; children: React.ReactNode }) {
  const cls = "inline-flex max-w-full items-center gap-1.5 rounded-full border border-border bg-surface/80 px-3 py-1.5 text-xs text-foreground backdrop-blur";
  const body = <><Icon className="size-3.5 shrink-0 text-muted-foreground" /><span className="truncate">{children}</span></>;
  return href ? <a href={href} className={cn(cls, "transition-colors hover:border-primary/40 hover:text-primary")}>{body}</a> : <span className={cls}>{body}</span>;
}

function Fact({ icon: Icon, label, value }: { icon: typeof Mail; label: string; value: string }) {
  return (
    <div className="min-w-0 px-3 py-3 text-center">
      <dt className="flex items-center justify-center gap-1 text-[10px] font-medium uppercase tracking-wider text-muted-foreground"><Icon className="size-3" />{label}</dt>
      <dd className="mt-1 truncate text-[13px] font-semibold text-foreground" title={value}>{value}</dd>
    </div>
  );
}

function MyActivity({ name }: { name: string }) {
  const recorded = useSettingsStore(auditStore);
  const mine = useMemo(() => allAuditEvents(recorded).filter((e) => e.actor === name), [recorded, name]);
  return (
    <Card className="overflow-hidden">
      <div className="flex flex-wrap items-center justify-between gap-2 px-5 pt-5">
        <div>
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">My activity</h3>
          <p className="text-xs text-muted-foreground">{mine.length} recorded action{mine.length === 1 ? "" : "s"} — the same entries admins see in the audit log.</p>
        </div>
        <Link href="/settings/audit-logs" className="text-xs font-semibold text-primary hover:underline">Open audit logs</Link>
      </div>
      <ol className="mt-3 divide-y divide-border border-t border-border">
        {mine.map((e) => (
          <li key={e.id} className="flex items-start gap-3 px-5 py-3">
            <span className="w-24 shrink-0 text-xs tabular-nums text-muted-foreground">{formatDay(e.at)}<span className="block">{e.at.slice(11, 16)}</span></span>
            <span className="min-w-0 flex-1">
              <span className="text-[11px] font-semibold text-muted-foreground">{e.action} · {e.module}{e.entityId ? ` · ${e.entityId}` : ""}</span>
              <span className="block text-sm text-foreground">{e.summary}</span>
              {e.changes?.length ? <span className="block truncate text-[11px] text-muted-foreground">{e.changes.map((c) => `${c.field}: ${c.from} → ${c.to}`).join(" · ")}</span> : null}
            </span>
            <span className="hidden shrink-0 text-right text-[11px] text-muted-foreground sm:block">{e.device}</span>
          </li>
        ))}
        {!mine.length && <li className="px-5 py-12 text-center text-sm text-muted-foreground">Nothing yet.</li>}
      </ol>
    </Card>
  );
}

export default function ProfilePage() { return <Suspense><ProfilePageInner /></Suspense>; }
