"use client";

import type { ReactNode } from "react";
import Link from "next/link";
import { BookOpen, Briefcase, CalendarDays, Clock3, Coins, FileCheck2, Globe, GraduationCap, Languages, MapPin, PencilLine, Plus, Sparkles } from "lucide-react";
import { SlideOver } from "@/components/ui/slide-over";
import { buttonSecondary } from "@/components/ui/button-styles";
import { formatDay } from "@/components/people/people-ui";
import { getApplications } from "@/lib/mock/applications";
import { durationLabel, formatFee, getCategories, getLevels, openIntakes, type Course, type CourseStatus } from "@/lib/mock/courses";
import { cn } from "@/lib/utils";

export function CategoryChip({ id }: { id: string }) {
  const c = getCategories().find((x) => x.id === id);
  return (
    <span className="inline-flex items-center gap-1.5 whitespace-nowrap rounded-full border border-border px-2 py-0.5 text-[11px] font-medium text-foreground">
      <span className={cn("size-1.5 rounded-full", c?.color ?? "bg-muted-foreground")} />
      {c?.name ?? "Uncategorised"}
    </span>
  );
}

export function LevelBadge({ name }: { name: string }) {
  const l = getLevels().find((x) => x.name === name);
  return (
    <span className="inline-flex items-center gap-1 whitespace-nowrap rounded-md bg-surface-muted px-1.5 py-0.5 text-[11px] font-semibold text-foreground">
      <span className={cn("size-1.5 rounded-full", l?.color ?? "bg-muted-foreground")} />
      {l?.short ?? name}
    </span>
  );
}

const statusStyle: Record<CourseStatus, string> = {
  Published: "bg-success-soft text-success",
  Draft: "bg-warning-soft text-warning",
  Closed: "bg-surface-hover text-muted-foreground",
};
export const courseStatusDot: Record<CourseStatus, string> = { Published: "bg-success", Draft: "bg-warning", Closed: "bg-muted-foreground" };

export function CourseStatusBadge({ status }: { status: CourseStatus }) {
  return (
    <span className={cn("inline-flex items-center gap-1.5 whitespace-nowrap rounded-full px-2 py-0.5 text-[11px] font-semibold", statusStyle[status])}>
      <span className={cn("size-1.5 rounded-full", courseStatusDot[status])} />
      {status}
    </span>
  );
}

export function CourseDetail({ course: c, onClose }: { course: Course; onClose: () => void }) {
  const apps = getApplications().filter((a) => a.university === c.institution && a.course === c.name);
  const recent = [...apps].sort((a, b) => b.createdAt.localeCompare(a.createdAt)).slice(0, 5);
  const enrolled = apps.filter((a) => a.stage === "Enrolled").length;
  const open = openIntakes(c);

  return (
    <SlideOver
      open
      onClose={onClose}
      icon={BookOpen}
      title={c.name}
      subtitle={`${c.code} · ${c.institution}`}
      footer={
        <Link href="/applications/new" className={cn(buttonSecondary, "w-full")}>
          <Plus className="size-4" /> Start an application
        </Link>
      }
    >
      <div className="flex flex-col gap-6">
        <div className="flex flex-wrap items-center gap-1.5">
          <Link href={`/courses/${c.id}/edit`} className="inline-flex h-8 items-center gap-1.5 rounded-full bg-primary px-3.5 text-xs font-semibold text-primary-foreground hover:bg-primary-hover"><PencilLine className="size-3.5" /> Edit</Link>
          <CourseStatusBadge status={c.status} />
          <LevelBadge name={c.level} />
          <CategoryChip id={c.categoryId} />
          {c.featured && <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-2 py-0.5 text-[11px] font-semibold text-amber-600 dark:text-amber-400"><Sparkles className="size-3" /> Featured</span>}
        </div>

        {c.description && <p className="text-sm leading-relaxed text-foreground">{c.description}</p>}

        <div className="grid grid-cols-3 gap-2">
          {[
            ["International fee", c.intlFee ? `${formatFee(c.intlFee, c.currency)}/yr` : "Home only"],
            ["Deposit", c.deposit ? formatFee(c.deposit, c.currency) : "None"],
            ["Applications", `${apps.length} · ${enrolled} enrolled`],
          ].map(([l, v]) => (
            <div key={l} className="rounded-xl bg-surface-muted px-3 py-2.5">
              <p className="truncate text-sm font-bold tabular-nums text-foreground">{v}</p>
              <p className="text-[11px] text-muted-foreground">{l}</p>
            </div>
          ))}
        </div>

        <dl className="grid grid-cols-1 gap-3 text-sm">
          <Row icon={MapPin} label="Campus">{c.campuses.join(", ") || "—"} · {c.country}</Row>
          <Row icon={Clock3} label="Duration">{durationLabel(c.duration)} · {c.modes.join(", ")}{c.placement ? " · with placement" : ""}</Row>
          <Row icon={CalendarDays} label="Intakes">
            <span className="flex flex-wrap gap-1">
              {c.intakes.map((i) => <span key={i} className={cn("rounded-full px-2 py-0.5 text-[11px] font-medium", open.includes(i) ? "bg-primary-soft text-primary" : "bg-surface-hover text-muted-foreground line-through")}>{i}</span>)}
            </span>
          </Row>
          {c.deadline && <Row icon={CalendarDays} label="Apply by">{formatDay(c.deadline)}</Row>}
          <Row icon={Coins} label="Fees">
            {c.intlFee ? `International ${formatFee(c.intlFee, c.currency)}` : "Not open to international students"}
            {c.homeFee ? ` · Home ${formatFee(c.homeFee, c.currency)}` : ""}
            {c.studentFinance && <span className="ml-1 rounded-full bg-success-soft px-1.5 text-[11px] font-semibold text-success">Student Finance</span>}
          </Row>
          {c.scholarship && <Row icon={Sparkles} label="Scholarship">{c.scholarship}</Row>}
          <Row icon={GraduationCap} label="Academic">{c.academicRequirement}</Row>
          <Row icon={Languages} label="English">IELTS {c.ieltsOverall} overall ({c.ieltsMin} each){c.moiAccepted ? " · MOI accepted" : ""}</Row>
          {c.workExperience && <Row icon={Briefcase} label="Experience">{c.workExperience}</Row>}
          <Row icon={Globe} label="Website">{c.onWebsite && c.status === "Published" ? "Listed on bheuni.com" : "Not listed"}</Row>
        </dl>

        <div>
          <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-foreground"><FileCheck2 className="size-3.5" /> Documents to apply</p>
          <div className="flex flex-wrap gap-1.5">
            {c.documents.map((d) => <span key={d} className="rounded-full bg-surface-muted px-2.5 py-1 text-[11px] text-foreground">{d}</span>)}
          </div>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold text-foreground">Latest applications</p>
          {recent.length ? (
            <ul className="divide-y divide-border rounded-2xl border border-border">
              {recent.map((a) => (
                <li key={a.id}>
                  <Link href={`/applications/${a.id}`} className="flex items-center justify-between gap-3 px-3.5 py-2.5 text-xs transition-colors hover:bg-surface-hover">
                    <span className="min-w-0">
                      <span className="block truncate font-medium text-foreground">{a.applicant}</span>
                      <span className="block truncate text-[11px] text-muted-foreground">{a.intake} · {a.counsellor}</span>
                    </span>
                    <span className={cn("shrink-0 text-[11px] font-medium", a.stage === "Enrolled" ? "text-success" : "text-muted-foreground")}>{a.stage}</span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <p className="rounded-2xl border border-dashed border-border px-4 py-5 text-center text-xs text-muted-foreground">No applications for this course yet.</p>
          )}
        </div>

        <p className="text-[11px] text-muted-foreground">Last updated {formatDay(c.updatedAt)} by {c.updatedBy}</p>
      </div>
    </SlideOver>
  );
}

function Row({ icon: Icon, label, children }: { icon: typeof MapPin; label: string; children: ReactNode }) {
  return (
    <div className="flex items-start gap-3">
      <Icon className="mt-0.5 size-4 shrink-0 text-muted-foreground" />
      <dt className="w-24 shrink-0 text-xs text-muted-foreground">{label}</dt>
      <dd className="min-w-0 flex-1 break-words text-sm text-foreground">{children}</dd>
    </div>
  );
}

