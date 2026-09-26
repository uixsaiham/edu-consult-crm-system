"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import {
  Activity,
  ArrowLeft,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Copy,
  Download,
  Eye,
  FileSignature,
  FolderOpen,
  Mail,
  MessageCircle,
  Phone,
  Send,
  UserRound,
  Workflow,
  XCircle,
  type LucideIcon,
} from "lucide-react";
import { Modal } from "@/components/ui/modal";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { useToast } from "@/components/ui/toast";
import { useUser } from "@/components/layout/user-context";
import { saveApplication, type ApplicationRow, type ApplicationStage, type FundingStatus } from "@/lib/mock/applications";
import { getProfile, saveProfile, type ApplicationProfile } from "@/lib/mock/application-profile";
import { downloadCsv } from "@/lib/csv";
import { cn, initialsFor } from "@/lib/utils";
import { journey } from "../list/application-drawer";
import { CourseManager } from "../list/course-manager";
import * as courseOps from "../list/course-ops";
import { DocumentRequestModal, FollowUpModal, MeetingModal } from "../list/action-modals";
import { formatCreated, whatsappLink } from "../list/format";
import {
  AcademicSection,
  ActivitiesSection,
  buildActivities,
  ContactSection,
  CoursesSection,
  DeclarationSection,
  DocumentsSection,
  FollowUpsSection,
  FundingPicker,
  LanguageSection,
  MeetingsSection,
  NotesSection,
  OverviewSection,
  PersonalSection,
  RequestsSection,
  StagePicker,
  StatusSection,
  WorkSection,
  type SectionKey,
} from "./sections";
import { fmtDate, Tag } from "./ui";

const NOW = "2026-09-17T11:00:00Z";

const groups: { title: string; icon: LucideIcon; items: [SectionKey, string][] }[] = [
  {
    title: "Application",
    icon: UserRound,
    items: [
      ["personal", "Personal details"],
      ["courses", "Courses"],
      ["academic", "Academic qualifications"],
      ["work", "Work experience"],
      ["language", "Language proficiency"],
      ["declaration", "Declaration"],
      ["overview", "Application overview"],
    ],
  },
  { title: "Documents", icon: FolderOpen, items: [["documents", "Documents"], ["requests", "Request document"]] },
  { title: "Status", icon: Activity, items: [["status", "Application status"]] },
  {
    title: "Processing",
    icon: Workflow,
    items: [
      ["notes", "Application notes"],
      ["followups", "Follow-ups"],
      ["meetings", "Meetings & appointments"],
      ["contact", "Direct contact / email"],
      ["activities", "Activities"],
    ],
  },
];
const sectionKeys = groups.flatMap((g) => g.items.map(([k]) => k));

export function ApplicationDetails({ initial, allCounsellors }: { initial: ApplicationRow; allCounsellors: string[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const params = useSearchParams();
  const { user } = useUser();
  const [app, setApp] = useState(initial);
  const [profile, setProfile] = useState<ApplicationProfile>(() => getProfile(initial));
  const [dialog, setDialog] = useState<"courses" | "docs" | "followUp" | "meeting" | "contract" | null>(null);
  const [toast, notify] = useToast();

  const requested = params.get("section") as SectionKey | null;
  const section: SectionKey = requested && sectionKeys.includes(requested) ? requested : "personal";
  // Only "Application" starts open, plus whichever category holds a linked section
  const [collapsed, setCollapsed] = useState<Set<string>>(
    () => new Set(groups.filter((g) => g.title !== "Application" && !g.items.some(([k]) => k === section)).map((g) => g.title))
  );
  const toggleGroup = (title: string) =>
    setCollapsed((prev) => {
      const next = new Set(prev);
      if (next.has(title)) next.delete(title);
      else next.add(title);
      return next;
    });
  const go = (key: SectionKey) => {
    // Opening a section always reveals its category in the menu
    const owner = groups.find((g) => g.items.some(([k]) => k === key));
    if (owner && collapsed.has(owner.title)) toggleGroup(owner.title);
    router.replace(`${pathname}?section=${key}`, { scroll: false });
  };

  const patchApp = (fn: (a: ApplicationRow) => Partial<ApplicationRow>) => {
    const next = { ...app, ...fn(app), updatedAt: "2026-09-17" };
    setApp(next);
    saveApplication(next);
    return next;
  };
  const patchProfile = (fn: (p: ApplicationProfile) => Partial<ApplicationProfile>) => {
    const next = { ...profile, ...fn(profile) };
    setProfile(next);
    saveProfile(app.id, next);
  };

  const setStage = (stage: ApplicationStage) => {
    patchApp(() => ({ stage }));
    patchProfile((p) => ({ history: [...p.history, { stage, at: NOW, by: user.name }] }));
    notify(`Status changed to ${stage}`);
  };
  const setFunding = (funding: FundingStatus) => {
    patchApp(() => ({ funding }));
    notify(`Funding set to ${funding}`);
  };

  const step = journey.findIndex((j) => j.stages.includes(app.stage));
  const closed = app.stage === "Rejected" || app.stage === "Withdrawn";
  const docsOutstanding = profile.documents.filter((d) => d.status !== "Verified").length;
  const badges: Partial<Record<SectionKey, number>> = {
    courses: 1 + app.courseOptions.length,
    documents: docsOutstanding,
    requests: app.documentRequests.filter((d) => d.status === "Requested").length,
    notes: app.notes.length,
    followups: app.followUps.filter((f) => !f.done).length,
    meetings: app.meetings.length,
  };

  const downloadHistory = () => {
    downloadCsv(
      `${app.id}-history.csv`,
      buildActivities(app, profile).map((a) => ({ date: formatCreated(a.at), type: a.kind, activity: a.title, detail: a.detail, by: a.by }))
    );
    notify("History downloaded");
  };

  const contract = profile.contract;
  const contractLink = contract.token ? `/student-contract/${contract.token}` : "";

  return (
    <div className="flex flex-col gap-4">
      <nav className="flex items-center gap-2 text-xs text-muted-foreground" aria-label="Breadcrumb">
        <Link href="/applications" className="inline-flex items-center gap-1 font-medium hover:text-primary">
          <ArrowLeft className="size-3.5" /> Applications
        </Link>
        <span>/</span>
        <span className="font-mono text-foreground">{app.id}</span>
      </nav>

      {/* Summary */}
      <section className="card-shadow overflow-hidden rounded-3xl border border-border bg-surface">
        <div className="grid grid-cols-1 xl:grid-cols-[minmax(0,340px)_minmax(0,1fr)]">
          <div className="flex flex-col gap-4 border-b border-border p-5 sm:p-6 xl:border-b-0 xl:border-r">
            <div className="flex items-center gap-3.5">
              <span className="flex size-14 shrink-0 items-center justify-center rounded-2xl bg-primary-soft text-lg font-bold text-primary">{app.initials}</span>
              <div className="min-w-0">
                <h1 className="truncate text-xl font-semibold tracking-tight text-foreground">{app.applicant}</h1>
                <button
                  type="button"
                  onClick={() => { void navigator.clipboard?.writeText(app.id); notify("Application ID copied"); }}
                  className="mt-0.5 inline-flex items-center gap-1 font-mono text-xs text-muted-foreground hover:text-primary"
                >
                  {app.id} <Copy className="size-3" />
                </button>
              </div>
            </div>
            <div className="flex flex-wrap gap-1.5">
              <StagePicker value={app.stage} onChange={setStage} size="sm" />
              <FundingPicker value={app.funding} onChange={setFunding} size="sm" />
            </div>
            <ul className="flex flex-col gap-1 text-sm">
              <li className="flex items-center gap-2 text-foreground">
                <Phone className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{app.phone}</span>
                <a href={`tel:${app.phone.replace(/[^\d+]/g, "")}`} className={iconButton} aria-label="Call" title="Call"><Phone className="size-3.5" /></a>
                <a href={whatsappLink(app.phone)} target="_blank" rel="noreferrer" className={iconButton} aria-label="WhatsApp" title="WhatsApp"><MessageCircle className="size-3.5" /></a>
              </li>
              <li className="flex items-center gap-2 text-foreground">
                <Mail className="size-4 shrink-0 text-muted-foreground" />
                <span className="min-w-0 flex-1 truncate">{app.email}</span>
                <button type="button" onClick={() => go("contact")} className={iconButton} aria-label="Email" title="Email"><Mail className="size-3.5" /></button>
              </li>
            </ul>
            <button type="button" onClick={downloadHistory} className={cn(buttonSecondary, "mt-auto min-h-9 w-full whitespace-nowrap px-3 py-2")}>
              <Download className="size-4" /> Download full history
            </button>
          </div>

          <div className="flex flex-col justify-between gap-5 p-5 sm:p-6">
            <dl className="grid grid-cols-2 gap-x-6 gap-y-4 lg:grid-cols-4">
              <Fact label="Application type" value={profile.applicationType} />
              <Fact label="Current stage" value={closed ? app.stage : `${journey[step]?.label ?? app.stage} · step ${step + 1} of ${journey.length}`} />
              <Fact label="Applied courses">
                <button type="button" onClick={() => go("courses")} className="font-semibold text-primary hover:underline">{1 + app.courseOptions.length} course{app.courseOptions.length ? "s" : ""}</button>
              </Fact>
              <Fact label="Intake" value={app.intake} />
              <Fact label="Branch" value={app.branch} />
              <Fact label="Assigned counsellor" value={app.counsellor} />
              <Fact label="Application source" value={app.partner ? `${app.source} · ${app.partner}` : app.source} />
              <Fact label="Created" value={formatCreated(app.createdAt)} />
              <div className="col-span-2">
                <Fact label="Main course" value={`${app.course} · ${app.level}`} />
              </div>
              <Fact label="University" value={app.university} />
              <Fact label="Campus" value={`${app.campus} · ${app.mode}`} />
            </dl>

            {/* Contract */}
            <div className="flex flex-col gap-3 rounded-2xl bg-surface-muted p-3 pl-4 sm:flex-row sm:items-center">
              <div className="flex min-w-0 flex-1 items-center gap-3">
              <span className={cn("flex size-9 shrink-0 items-center justify-center rounded-xl", contract.status === "Approved" ? "bg-success-soft text-success" : contract.status === "Awaiting signature" ? "bg-warning-soft text-warning" : "bg-surface text-muted-foreground")}>
                <FileSignature className="size-4" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="flex flex-wrap items-center gap-2 text-sm font-semibold text-foreground">
                  Student contract
                  <Tag tone={contract.status === "Approved" ? "success" : contract.status === "Awaiting signature" ? "warning" : "muted"}>
                    {contract.status === "Approved" ? <CheckCircle2 className="size-3" /> : contract.status === "Awaiting signature" ? <Clock3 className="size-3" /> : <XCircle className="size-3" />}
                    {contract.status}
                  </Tag>
                </p>
                <p className={cn("truncate text-[11px] text-muted-foreground", contractLink && "font-mono")}>{contractLink || "Not sent to the student yet."}</p>
              </div>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {contractLink && (
                  <button type="button" onClick={() => { void navigator.clipboard?.writeText(contractLink); notify("Contract link copied"); }} className={miniButton}>
                    <Copy className="size-3.5" /> Copy link
                  </button>
                )}
                <button type="button" onClick={() => setDialog("contract")} className={miniButton}>
                  <Eye className="size-3.5" /> Preview
                </button>
                {contract.status === "Not sent" && (
                  <button
                    type="button"
                    onClick={() => {
                      patchProfile(() => ({ contract: { status: "Awaiting signature", token: Math.random().toString(36).slice(2, 14) + Math.random().toString(36).slice(2, 14), sentAt: NOW } }));
                      notify(`Contract sent to ${app.email}`);
                    }}
                    className={miniPrimary}
                  >
                    <Send className="size-3.5" /> Send
                  </button>
                )}
                {contract.status === "Awaiting signature" && (
                  <button
                    type="button"
                    onClick={() => { patchProfile((p) => ({ contract: { ...p.contract, status: "Approved" } })); notify("Contract approved"); }}
                    className={miniSuccess}
                  >
                    <Check className="size-3.5" /> Approve
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Journey */}
        <div className="border-t border-border px-5 py-4 sm:px-6">
          {closed ? (
            <p className="flex items-center gap-2 text-sm text-foreground">
              <XCircle className="size-4 text-danger" /> Application <span className="font-semibold">{app.stage.toLowerCase()}</span>
              {app.notes[0] && <span className="text-muted-foreground">— {app.notes[0].text}</span>}
            </p>
          ) : (
            <ol className="flex items-start" aria-label="Application progress">
              {journey.map((j, i) => {
                const done = i < step;
                const current = i === step;
                return (
                  <li key={j.label} className="relative flex flex-1 flex-col items-center gap-1.5 text-center">
                    {i > 0 && <span className={cn("absolute right-1/2 top-3 h-0.5 w-full -translate-y-1/2", i <= step ? "bg-primary" : "bg-border")} />}
                    <span className={cn("relative z-10 flex size-6 items-center justify-center rounded-full text-[10px] font-bold", done || current ? "bg-primary text-primary-foreground" : "bg-surface-hover text-muted-foreground", current && "ring-4 ring-primary/20")}>
                      {done ? <Check className="size-3" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className={cn("text-[11px] font-medium", current ? "text-primary" : done ? "text-foreground" : "text-muted-foreground")}>{j.label}</span>
                  </li>
                );
              })}
            </ol>
          )}
        </div>
      </section>

      {/* Mobile section picker */}
      <div className="no-scrollbar -mx-1 flex gap-1.5 overflow-x-auto px-1 lg:hidden">
        {groups.flatMap((g) => g.items).map(([key, label]) => (
          <button
            key={key}
            type="button"
            onClick={() => go(key)}
            className={cn("shrink-0 rounded-full border px-3 py-1.5 text-xs font-medium", section === key ? "border-primary bg-primary text-primary-foreground" : "border-border bg-surface text-muted-foreground")}
          >
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 items-start gap-4 lg:grid-cols-[250px_minmax(0,1fr)]">
        <aside className="card-shadow no-scrollbar sticky top-0 hidden max-h-[calc(100vh-7rem)] flex-col gap-2 overflow-y-auto rounded-3xl border border-border bg-surface p-3 lg:flex">
          <div className="flex items-center justify-between px-2.5 pt-1">
            <span className="text-[11px] font-semibold text-muted-foreground">Sections</span>
            <button
              type="button"
              onClick={() => setCollapsed(collapsed.size === groups.length ? new Set() : new Set(groups.map((g) => g.title)))}
              className="text-[11px] font-semibold text-primary hover:underline"
            >
              {collapsed.size === groups.length ? "Expand all" : "Collapse all"}
            </button>
          </div>
          {groups.map((g) => {
            const open = !collapsed.has(g.title);
            const holdsActive = g.items.some(([k]) => k === section);
            const panelId = `nav-${g.title.toLowerCase()}`;
            return (
              <div key={g.title}>
                <button
                  type="button"
                  onClick={() => toggleGroup(g.title)}
                  aria-expanded={open}
                  aria-controls={panelId}
                  className={cn(
                    "flex w-full items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-left text-[11px] font-semibold uppercase tracking-wide transition-colors hover:bg-surface-hover",
                    holdsActive && !open ? "text-primary" : "text-muted-foreground"
                  )}
                >
                  <g.icon className="size-3.5" />
                  <span className="flex-1">{g.title}</span>
                  {!open && (
                    <span className="rounded-full bg-surface-hover px-1.5 text-[10px] normal-case tracking-normal tabular-nums">
                      {g.items.length}
                    </span>
                  )}
                  <ChevronDown className={cn("size-3.5 transition-transform", !open && "-rotate-90")} />
                </button>
                <div id={panelId} className={cn("grid transition-[grid-template-rows] duration-200", open ? "grid-rows-[1fr]" : "grid-rows-[0fr]")}>
                  <ul className="flex min-h-0 flex-col gap-0.5 overflow-hidden pt-0.5" inert={!open}>
                    {g.items.map(([key, label]) => {
                      const active = section === key;
                      const badge = badges[key];
                      return (
                        <li key={key}>
                          <button
                            type="button"
                            onClick={() => go(key)}
                            aria-current={active ? "page" : undefined}
                            className={cn(
                              "flex w-full items-center gap-2 rounded-xl px-2.5 py-2 text-left text-[13px] transition-colors",
                              active ? "bg-primary-soft font-semibold text-primary" : "text-foreground/80 hover:bg-surface-hover hover:text-foreground"
                            )}
                          >
                            <span className={cn("h-4 w-0.5 rounded-full", active ? "bg-primary" : "bg-transparent")} />
                            <span className="flex-1 truncate">{label}</span>
                            {!!badge && <span className={cn("rounded-full px-1.5 text-[10px] font-semibold tabular-nums", active ? "bg-primary text-primary-foreground" : "bg-surface-hover text-muted-foreground")}>{badge}</span>}
                          </button>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              </div>
            );
          })}
        </aside>

        <div className="min-w-0">
          {section === "personal" && (
            <PersonalSection
              app={app}
              profile={profile}
              onSave={(d) => {
                patchApp(() => ({ applicant: d.personal.fullName.trim(), initials: initialsFor(d.personal.fullName.trim()), phone: d.phone.trim(), email: d.email.trim() }));
                patchProfile(() => ({ personal: d.personal, presentAddress: d.present, permanentAddress: d.same ? d.present : d.permanent, sameAddress: d.same }));
                notify("Personal details saved");
              }}
            />
          )}
          {section === "courses" && (
            <CoursesSection
              app={app}
              onManage={() => setDialog("courses")}
              onPatch={(id, patch) => { patchApp((a) => courseOps.patchCourse(a, id, patch)); notify("Course updated"); }}
            />
          )}
          {section === "academic" && <AcademicSection profile={profile} />}
          {section === "work" && <WorkSection profile={profile} />}
          {section === "language" && <LanguageSection profile={profile} />}
          {section === "declaration" && <DeclarationSection profile={profile} />}
          {section === "overview" && <OverviewSection app={app} profile={profile} onGo={go} />}
          {section === "documents" && (
            <DocumentsSection
              profile={profile}
              onRequest={() => setDialog("docs")}
              onUpload={(id, file) => {
                const ok = /\.(pdf|docx?|jpe?g|png|gif)$/i.test(file.name) && file.size <= 10 * 1024 * 1024;
                if (!ok) return notify("Use a PDF, DOC, DOCX, JPG, PNG or GIF under 10MB", "error");
                patchProfile((p) => ({
                  documents: p.documents.map((d) =>
                    d.id === id ? { ...d, fileName: file.name, size: `${(file.size / 1024 / 1024).toFixed(1)} MB`, uploadedAt: NOW, status: "Pending review" } : d
                  ),
                }));
                notify(`${file.name} uploaded — pending review`);
              }}
              onStatus={(id, status) => {
                patchProfile((p) => ({ documents: p.documents.map((d) => (d.id === id ? { ...d, status } : d)) }));
                notify(status === "Verified" ? "Document verified" : "Document rejected — ask the student to re-upload");
              }}
            />
          )}
          {section === "requests" && (
            <RequestsSection
              app={app}
              onNew={() => setDialog("docs")}
              onReceived={(id) => { patchApp((a) => ({ documentRequests: a.documentRequests.map((d) => (d.id === id ? { ...d, status: "Received" } : d)) })); notify("Marked as received"); }}
            />
          )}
          {section === "status" && <StatusSection app={app} profile={profile} onStage={setStage} onFunding={setFunding} />}
          {section === "notes" && (
            <NotesSection
              app={app}
              onAdd={(text) => { patchApp((a) => ({ notes: [{ text, author: user.name, at: NOW }, ...a.notes] })); notify("Note added"); }}
            />
          )}
          {section === "followups" && (
            <FollowUpsSection
              app={app}
              onNew={() => setDialog("followUp")}
              onToggle={(id) => patchApp((a) => ({ followUps: a.followUps.map((f) => (f.id === id ? { ...f, done: !f.done } : f)) }))}
            />
          )}
          {section === "meetings" && <MeetingsSection app={app} onNew={() => setDialog("meeting")} />}
          {section === "contact" && (
            <ContactSection
              app={app}
              profile={profile}
              me={user.name}
              onSend={(email) => { patchProfile((p) => ({ emails: [email, ...p.emails] })); notify(`Email sent to ${email.to}`); }}
            />
          )}
          {section === "activities" && <ActivitiesSection app={app} profile={profile} />}
        </div>
      </div>

      {dialog === "courses" && (
        <CourseManager
          app={app}
          onClose={() => setDialog(null)}
          onSave={(draft, id) => { patchApp((a) => courseOps.saveCourse(a, draft, id)); notify(id ? "Course updated" : `Added ${draft.course}`); }}
          onDelete={(id) => { patchApp((a) => courseOps.deleteCourse(a, id)); notify("Course removed"); }}
          onMakeMain={(id) => { patchApp((a) => courseOps.makeMain(a, id)); notify("Main course updated"); }}
          onPatch={(id, patch) => patchApp((a) => courseOps.patchCourse(a, id, patch))}
        />
      )}
      {dialog === "docs" && (
        <DocumentRequestModal
          app={app}
          by={user.name}
          onClose={() => setDialog(null)}
          onSend={(r) => {
            patchApp((a) => ({ documentRequests: [r, ...a.documentRequests] }));
            setDialog(null);
            notify(`Request sent via ${r.channels.join(" & ")}`);
            go("requests");
          }}
        />
      )}
      {dialog === "followUp" && (
        <FollowUpModal
          app={app}
          by={user.name}
          onClose={() => setDialog(null)}
          onSave={(f) => {
            patchApp((a) => ({ followUps: [...a.followUps, f].sort((x, y) => x.at.localeCompare(y.at)) }));
            setDialog(null);
            notify(`Follow-up scheduled for ${formatCreated(f.at)}`);
          }}
        />
      )}
      {dialog === "meeting" && (
        <MeetingModal
          app={app}
          counsellors={allCounsellors}
          onClose={() => setDialog(null)}
          onSave={(m) => {
            patchApp((a) => ({ meetings: [...a.meetings, m].sort((x, y) => x.at.localeCompare(y.at)) }));
            setDialog(null);
            notify(`Meeting booked with ${m.counsellor}`);
          }}
        />
      )}
      {dialog === "contract" && (
        <Modal
          open
          onClose={() => setDialog(null)}
          icon={FileSignature}
          title="Student services agreement"
          subtitle={`${app.applicant} · ${contract.status}`}
          footer={
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setDialog(null)} className={buttonSecondary}>Close</button>
              {contract.status === "Awaiting signature" && (
                <button type="button" onClick={() => { patchProfile((p) => ({ contract: { ...p.contract, status: "Approved" } })); setDialog(null); notify("Contract approved"); }} className={buttonPrimary}>
                  <Check className="size-4" /> Approve contract
                </button>
              )}
            </div>
          }
        >
          <ContractPreview app={app} profile={profile} />
        </Modal>
      )}
      {toast}
    </div>
  );
}

const iconButton =
  "flex size-8 shrink-0 items-center justify-center rounded-full border border-border text-muted-foreground transition-colors hover:border-primary/40 hover:bg-primary-soft hover:text-primary";
const miniBase = "inline-flex h-8 items-center gap-1.5 rounded-full px-3 text-xs font-semibold transition-colors";
const miniButton = `${miniBase} border border-border bg-surface text-foreground hover:border-primary/40 hover:text-primary`;
const miniPrimary = `${miniBase} bg-primary text-primary-foreground hover:bg-primary-hover`;
const miniSuccess = `${miniBase} bg-success text-white hover:opacity-90`;

function Fact({ label, value, children }: { label: string; value?: string; children?: ReactNode }) {
  return (
    <div className="min-w-0">
      <dt className="text-[11px] font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-0.5 break-words text-sm font-medium text-foreground">{children ?? value}</dd>
    </div>
  );
}

function ContractPreview({ app, profile }: { app: ApplicationRow; profile: ApplicationProfile }) {
  const rows: [string, string][] = [
    ["Student", `${profile.personal.title} ${app.applicant}`],
    ["Date of birth", fmtDate(profile.personal.dob)],
    ["Programme", `${app.course} (${app.level})`],
    ["Institution", `${app.university}, ${app.campus}`],
    ["Intake", app.intake],
    ["Tuition fees paid by", profile.feesPayment],
    ["Counsellor", `${app.counsellor} · ${app.branch}`],
  ];
  return (
    <div className="flex flex-col gap-4 text-sm">
      <p className="text-muted-foreground">
        This agreement confirms that BHE will support the student with their application, documents and enrolment for the programme below, free of charge to the student.
      </p>
      <dl className="divide-y divide-border rounded-2xl border border-border">
        {rows.map(([k, v]) => (
          <div key={k} className="grid grid-cols-[140px_minmax(0,1fr)] gap-3 px-4 py-2.5">
            <dt className="text-xs text-muted-foreground">{k}</dt>
            <dd className="text-sm font-medium text-foreground">{v}</dd>
          </div>
        ))}
      </dl>
      <ul className="list-disc space-y-1 pl-5 text-xs text-muted-foreground">
        <li>The student confirms all documents supplied are genuine and complete.</li>
        <li>The student agrees to attend interviews and reply to requests within 5 working days.</li>
        <li>Personal data is shared only with the institution and relevant authorities.</li>
      </ul>
      <p className="rounded-xl bg-surface-muted px-4 py-3 text-xs text-muted-foreground">
        {profile.contract.status === "Approved"
          ? `Signed electronically by ${app.applicant}${profile.contract.sentAt ? ` · sent ${formatCreated(profile.contract.sentAt)}` : ""}`
          : profile.contract.status === "Awaiting signature"
          ? "Waiting for the student to sign."
          : "Not sent to the student yet."}
      </p>
    </div>
  );
}
