"use client";

import { useMemo } from "react";
import Link from "next/link";
import { ArrowRight, Award, CalendarClock, FileText, GraduationCap, Target, Users2 } from "lucide-react";
import { Card } from "@/components/ui/card";
import { StatCard, StatGrid } from "@/components/ui/stat-card";
import { formatDay } from "@/components/people/people-ui";
import type { CurrentUser } from "@/lib/mock/user";
import { getLeads } from "@/lib/mock/leads";
import { applicationStages, applicationStageStyles, getApplications } from "@/lib/mock/applications";
import { followUpToday, getFollowUps } from "@/lib/mock/follow-ups";
import { getStaff, getStaffMember } from "@/lib/mock/staff";
import { getCourses, getEnrolments, getPlaylists, getVideos, playlistCompletion, statusOf, type VideoSession } from "@/lib/mock/training";
import { allAuditEvents, auditStore } from "@/lib/settings/audit";
import { useSettingsStore } from "@/lib/settings/store";
import { scopeFor } from "@/lib/profile/scope";
import { cn, initialsFor } from "@/lib/utils";

const closed = ["Enrolled", "Rejected", "Withdrawn"];

export function ProfileOverview({ user }: { user: CurrentUser }) {
  const recorded = useSettingsStore(auditStore);
  const { role, branch, name, staffId } = user;
  const { label } = scopeFor(user);

  const data = useMemo(() => {
    const { match } = scopeFor({ role, branch, name });
    const leads = getLeads().filter((l) => l.status !== "Converted" && l.status !== "Lost" && match(l.branch, l.counsellor));
    const apps = getApplications().filter((a) => match(a.branch, a.counsellor));
    const active = apps.filter((a) => !closed.includes(a.stage));
    const enrolled = apps.filter((a) => a.stage === "Enrolled" && /2026$/.test(a.intake));
    const followUps = getFollowUps().filter((f) => f.status === "Pending" && match(f.branch, f.counsellor)).sort((a, b) => `${a.date}${a.time}`.localeCompare(`${b.date}${b.time}`));
    const due = followUps.filter((f) => f.date <= followUpToday);
    const pipeline = applicationStages.filter((s) => !closed.includes(s)).map((s) => ({ stage: s, count: active.filter((a) => a.stage === s).length }));

    const courses = new Map(getCourses().map((c) => [c.id, c]));
    const mine = getEnrolments().filter((e) => e.staffId === staffId && courses.has(e.courseId));
    const statuses = mine.map((e) => statusOf(e, courses.get(e.courseId)!));
    const videos = getVideos();
    const certs = getPlaylists().filter((p) => playlistCompletion(p.videoIds.map((id) => videos.find((v) => v.id === id)).filter((v): v is VideoSession => !!v), staffId).earned).length;

    const staff = getStaffMember(staffId);
    const manager = staff?.reportsTo ? getStaffMember(staff.reportsTo) : undefined;
    const reports = getStaff().filter((s) => s.reportsTo === staffId && s.status !== "Inactive");
    return { leads, active, enrolled, followUps, due, pipeline, training: { total: mine.length, done: statuses.filter((s) => s === "Completed" || s === "Expiring").length, overdue: statuses.filter((s) => s === "Overdue" || s === "Expired").length, certs }, staff, manager, reports };
  }, [role, branch, name, staffId]);

  const activity = useMemo(() => allAuditEvents(recorded).filter((e) => e.actor === user.name).slice(0, 6), [recorded, user.name]);
  const maxStage = Math.max(1, ...data.pipeline.map((p) => p.count));
  const target = data.staff?.monthlyTarget ?? 0;

  return (
    <div className="flex flex-col gap-4">
      <p className="text-xs text-muted-foreground">Numbers are {label} — your role&apos;s data scope.</p>
      <StatGrid>
        <StatCard icon={Users2} label="Open leads" value={data.leads.length} note={`${data.leads.filter((l) => !l.counsellor).length} unassigned`} />
        <StatCard icon={FileText} tone="violet" label="Active applications" value={data.active.length} />
        <StatCard icon={CalendarClock} tone={data.due.length ? "warning" : "success"} label="Follow-ups due" value={data.due.length} note="incl. overdue" />
        <StatCard icon={Target} tone="success" label="Enrolled (2026)" value={data.enrolled.length} note={target ? `target ${target}/mo` : undefined} />
      </StatGrid>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card className="p-5">
          <Head title="Upcoming follow-ups" href="/leads/follow-ups" />
          <ul className="mt-3 divide-y divide-border">
            {data.followUps.slice(0, 6).map((f) => {
              const late = f.date < followUpToday;
              return (
                <li key={f.id} className="flex items-center gap-3 py-2.5">
                  <span className={cn("w-16 shrink-0 text-xs font-semibold tabular-nums", late ? "text-danger" : f.date === followUpToday ? "text-warning" : "text-muted-foreground")}>{late ? "Overdue" : f.date === followUpToday ? "Today" : formatDay(f.date).replace(/ \d{4}$/, "")}<span className="block text-[10px] font-normal">{f.time}</span></span>
                  <span className="min-w-0 flex-1"><span className="block truncate text-sm text-foreground">{f.leadName}</span><span className="block truncate text-[11px] text-muted-foreground">{f.note}</span></span>
                  <span className="hidden shrink-0 text-[11px] text-muted-foreground sm:block">{f.counsellor}</span>
                </li>
              );
            })}
            {!data.followUps.length && <li className="py-8 text-center text-xs text-muted-foreground">Nothing scheduled.</li>}
          </ul>
        </Card>

        <Card className="p-5">
          <Head title="Application pipeline" href="/applications" />
          <ul className="mt-4 flex flex-col gap-2.5">
            {data.pipeline.map((p) => (
              <li key={p.stage} className="grid grid-cols-[130px_1fr_40px] items-center gap-3 text-xs">
                <span className="text-muted-foreground">{p.stage}</span>
                <span className="h-2 overflow-hidden rounded-full bg-surface-muted"><span className={cn("block h-full rounded-full", applicationStageStyles[p.stage].dot)} style={{ width: `${(p.count / maxStage) * 100}%` }} /></span>
                <span className="text-right font-semibold tabular-nums text-foreground">{p.count}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-3">
        <Card className="p-5">
          <Head title="My training" href="/bhe-training" />
          <div className="mt-4 grid grid-cols-3 gap-2 text-center">
            <Mini label="Courses done" value={`${data.training.done}/${data.training.total}`} />
            <Mini label="Overdue" value={data.training.overdue} tone={data.training.overdue ? "text-danger" : undefined} />
            <Mini label="Certificates" value={data.training.certs} icon={<Award className="size-3.5 text-amber-500" />} />
          </div>
          <Link href="/bhe-training/videos" className="mt-4 flex items-center gap-2 rounded-xl bg-surface-muted px-3 py-2.5 text-xs text-foreground hover:bg-surface-hover"><GraduationCap className="size-4 text-primary" /> Continue video sessions <ArrowRight className="ml-auto size-3.5" /></Link>
        </Card>

        <Card className="p-5">
          <h3 className="text-[15px] font-semibold tracking-tight text-foreground">My team</h3>
          {data.manager && (
            <div className="mt-3">
              <p className="text-[11px] font-semibold text-muted-foreground">Reports to</p>
              <Person name={data.manager.name} sub={data.manager.jobTitle} href={`/people/${data.manager.id}`} />
            </div>
          )}
          <p className="mt-3 text-[11px] font-semibold text-muted-foreground">Direct reports · {data.reports.length}</p>
          <div className="mt-1 flex flex-col">
            {data.reports.slice(0, 4).map((r) => <Person key={r.id} name={r.name} sub={`${r.jobTitle} · ${r.branch}`} href={`/people/${r.id}`} />)}
            {data.reports.length > 4 && <Link href="/people" className="mt-1 text-xs font-semibold text-primary hover:underline">+{data.reports.length - 4} more</Link>}
            {!data.reports.length && <p className="text-xs text-muted-foreground">No direct reports.</p>}
          </div>
        </Card>

        <Card className="p-5">
          <Head title="My recent activity" href="/profile?tab=activity" />
          <ul className="mt-3 flex flex-col gap-2.5">
            {activity.map((e) => (
              <li key={e.id} className="text-xs">
                <p className="text-foreground">{e.summary}</p>
                <p className="text-[11px] text-muted-foreground">{e.module} · {formatDay(e.at)} {e.at.slice(11, 16)}</p>
              </li>
            ))}
            {!activity.length && <li className="text-xs text-muted-foreground">No activity yet.</li>}
          </ul>
        </Card>
      </div>
    </div>
  );
}

function Head({ title, href }: { title: string; href: string }) {
  return (
    <div className="flex items-center justify-between gap-2">
      <h3 className="text-[15px] font-semibold tracking-tight text-foreground">{title}</h3>
      <Link href={href} className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline">View all <ArrowRight className="size-3.5" /></Link>
    </div>
  );
}

function Mini({ label, value, tone, icon }: { label: string; value: string | number; tone?: string; icon?: React.ReactNode }) {
  return (
    <div className="rounded-xl border border-border px-2 py-2.5">
      <p className={cn("inline-flex items-center gap-1 text-lg font-bold tabular-nums text-foreground", tone)}>{icon}{value}</p>
      <p className="text-[10px] text-muted-foreground">{label}</p>
    </div>
  );
}

function Person({ name, sub, href }: { name: string; sub: string; href: string }) {
  return (
    <Link href={href} className="-mx-2 flex items-center gap-2.5 rounded-xl px-2 py-1.5 hover:bg-surface-hover">
      <span className="flex size-8 items-center justify-center rounded-full bg-surface-hover text-[11px] font-semibold text-muted-foreground">{initialsFor(name)}</span>
      <span className="min-w-0"><span className="block truncate text-sm text-foreground">{name}</span><span className="block truncate text-[11px] text-muted-foreground">{sub}</span></span>
    </Link>
  );
}
