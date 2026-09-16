"use client";

import type { ReactNode } from "react";
import { BookOpen, Briefcase, FileText, GraduationCap, Languages, Pencil, UserRound, type LucideIcon } from "lucide-react";
import type {
  CourseEntry,
  DocumentEntry,
  EducationEntry,
  LanguageEntry,
  PersonalDetailsData,
  WorkExperienceEntry,
} from "@/lib/mock/applications";

function ReviewCard({
  title,
  icon: Icon,
  count,
  onEdit,
  className,
  children,
}: {
  title: string;
  icon: LucideIcon;
  count?: number;
  onEdit: () => void;
  className?: string;
  children: ReactNode;
}) {
  return (
    <div className={`rounded-2xl border border-border bg-surface ${className ?? ""}`}>
      <div className="flex items-center justify-between gap-3 border-b border-border/70 px-4 py-3">
        <div className="flex min-w-0 items-center gap-2.5">
          <span className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-primary-soft text-primary">
            <Icon className="size-4" />
          </span>
          <div className="min-w-0">
            <p className="truncate text-sm font-bold text-foreground">{title}</p>
            {typeof count === "number" && (
              <p className="text-[11px] text-muted-foreground">
                {count} {count === 1 ? "entry" : "entries"}
              </p>
            )}
          </div>
        </div>
        <button
          type="button"
          onClick={onEdit}
          className="inline-flex shrink-0 items-center gap-1 rounded-full border border-border px-2.5 py-1 text-[11px] font-semibold text-muted-foreground transition-colors hover:border-primary hover:text-primary"
        >
          <Pencil className="size-3" />
          Edit
        </button>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

function ReviewField({ label, value }: { label: string; value?: string }) {
  return (
    <div className="min-w-0">
      <p className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-foreground">{value || "—"}</p>
    </div>
  );
}

function EmptyNote({ text }: { text: string }) {
  return <p className="text-xs italic text-muted-foreground">{text}</p>;
}

function ReviewRow({
  title,
  subtitle,
  meta,
}: {
  title: string;
  subtitle?: string;
  meta?: { label: string; value: string }[];
}) {
  return (
    <div className="rounded-xl border border-border/70 bg-surface-muted/40 p-3">
      <p className="text-sm font-semibold text-foreground">{title}</p>
      {subtitle && <p className="text-xs text-muted-foreground">{subtitle}</p>}
      {meta && meta.length > 0 && (
        <div className="mt-1.5 flex flex-wrap gap-1.5">
          {meta.map((m) => (
            <span
              key={m.label}
              className="rounded-full border border-border/70 bg-surface px-2 py-0.5 text-[11px] font-medium text-muted-foreground"
            >
              {m.label}: <span className="text-foreground">{m.value}</span>
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function ApplicationReview({
  personal,
  courses,
  education,
  work,
  documents,
  language,
  onEdit,
}: {
  personal: PersonalDetailsData;
  courses: CourseEntry[];
  education: EducationEntry[];
  work: WorkExperienceEntry[];
  documents: DocumentEntry[];
  language: LanguageEntry[];
  onEdit: (stepIndex: number) => void;
}) {
  const fullName = [personal.title, personal.firstName, personal.middleName, personal.lastName]
    .filter(Boolean)
    .join(" ");
  const permanent = personal.sameAsPresent ? personal.presentAddress : personal.permanentAddress;
  const presentLine = [
    personal.presentAddress.line1,
    personal.presentAddress.line2,
    personal.presentAddress.city,
    personal.presentAddress.state,
    personal.presentAddress.postcode,
    personal.presentAddress.country,
  ]
    .filter(Boolean)
    .join(", ");
  const permanentLine = [permanent.line1, permanent.line2, permanent.city, permanent.state, permanent.postcode, permanent.country]
    .filter(Boolean)
    .join(", ");

  return (
    <div className="flex flex-col gap-4">
      <ReviewCard title="Personal Details" icon={UserRound} onEdit={() => onEdit(0)}>
        <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
          <ReviewField label="Applicant" value={fullName} />
          <ReviewField label="Email" value={personal.email} />
          <ReviewField label="Phone" value={personal.phone} />
          <ReviewField label="Gender" value={personal.gender} />
          <ReviewField label="Date of birth" value={personal.dob} />
          <ReviewField label="Nationality" value={personal.nationality} />
          <ReviewField label="Branch" value={personal.branch} />
          <ReviewField label="Counsellor" value={personal.counsellor} />
          <ReviewField label="Lead source" value={personal.leadSource} />
          <ReviewField label="Application type" value={personal.applicationType} />
          <ReviewField label="Passport / ID No" value={personal.passportNo} />
          <ReviewField label="First language" value={personal.firstLanguage} />
        </div>
        <div className="mt-4 grid grid-cols-1 gap-4 border-t border-border/70 pt-4 sm:grid-cols-2">
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Present Address
            </p>
            <p className="text-sm text-foreground">{presentLine || "—"}</p>
          </div>
          <div>
            <p className="mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
              Permanent Address
            </p>
            <p className="text-sm text-foreground">{permanentLine || "—"}</p>
          </div>
        </div>
      </ReviewCard>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <ReviewCard title="Courses" icon={BookOpen} count={courses.length} onEdit={() => onEdit(1)}>
          {courses.length === 0 ? (
            <EmptyNote text="No courses added." />
          ) : (
            <div className="flex flex-col gap-2">
              {courses.map((c) => (
                <ReviewRow
                  key={c.id}
                  title={c.courseName}
                  subtitle={`${c.university} · ${c.country}`}
                  meta={[
                    { label: "Level", value: c.courseLevel },
                    { label: "Mode", value: c.deliveryMode },
                    { label: "Intake", value: c.intake },
                  ]}
                />
              ))}
            </div>
          )}
        </ReviewCard>

        <ReviewCard title="Academic Qualifications" icon={GraduationCap} count={education.length} onEdit={() => onEdit(2)}>
          {education.length === 0 ? (
            <EmptyNote text="No qualifications added." />
          ) : (
            <div className="flex flex-col gap-2">
              {education.map((e) => (
                <ReviewRow
                  key={e.id}
                  title={`${e.level} · ${e.specialisation}`}
                  subtitle={e.institute}
                  meta={[
                    { label: "Status", value: e.status },
                    { label: "Result", value: e.gradeAverage },
                  ]}
                />
              ))}
            </div>
          )}
        </ReviewCard>

        <ReviewCard title="Work Experience" icon={Briefcase} count={work.length} onEdit={() => onEdit(3)}>
          {work.length === 0 ? (
            <EmptyNote text="No work experience added." />
          ) : (
            <div className="flex flex-col gap-2">
              {work.map((w) => (
                <ReviewRow
                  key={w.id}
                  title={`${w.designation} at ${w.employer}`}
                  meta={[
                    { label: "Status", value: w.status },
                    { label: "Type", value: w.workType },
                  ]}
                />
              ))}
            </div>
          )}
        </ReviewCard>

        <ReviewCard title="Documents" icon={FileText} count={documents.length} onEdit={() => onEdit(4)}>
          {documents.length === 0 ? (
            <EmptyNote text="No documents uploaded." />
          ) : (
            <div className="flex flex-col gap-2">
              {documents.map((d) => (
                <ReviewRow key={d.id} title={d.title} subtitle={d.fileName} meta={[{ label: "Type", value: d.type }]} />
              ))}
            </div>
          )}
        </ReviewCard>

        <ReviewCard
          title="Language Proficiency"
          icon={Languages}
          count={language.length}
          onEdit={() => onEdit(5)}
          className="lg:col-span-2"
        >
          {language.length === 0 ? (
            <EmptyNote text="No test results added." />
          ) : (
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              {language.map((l) => (
                <ReviewRow
                  key={l.id}
                  title={l.testType}
                  meta={[
                    { label: "Status", value: l.testStatus },
                    ...(l.overallScore ? [{ label: "Score", value: l.overallScore }] : []),
                  ]}
                />
              ))}
            </div>
          )}
        </ReviewCard>
      </div>
    </div>
  );
}
