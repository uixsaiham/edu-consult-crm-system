"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  BookOpen,
  Briefcase,
  FileText,
  GraduationCap,
  Languages,
  ShieldCheck,
  SkipForward,
  UserRound,
} from "lucide-react";
import { Card, CardHeader } from "@/components/ui/card";
import { ProgressRing } from "@/components/applications/progress-ring";
import { WizardStepper, type WizardStepMeta } from "@/components/applications/wizard-stepper";
import { SuccessScreen } from "@/components/applications/success-screen";
import { PersonalDetailsStep } from "@/components/applications/steps/personal-details-step";
import { CoursesStep } from "@/components/applications/steps/courses-step";
import { AcademicStep } from "@/components/applications/steps/academic-step";
import { WorkExperienceStep } from "@/components/applications/steps/work-experience-step";
import { DocumentsStep } from "@/components/applications/steps/documents-step";
import { LanguageStep } from "@/components/applications/steps/language-step";
import { DeclarationStep } from "@/components/applications/steps/declaration-step";
import {
  emptyDeclaration,
  emptyPersonalDetails,
  type CourseEntry,
  type DeclarationData,
  type DocumentEntry,
  type EducationEntry,
  type LanguageEntry,
  type PersonalDetailsData,
  type WorkExperienceEntry,
} from "@/lib/mock/applications";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";
import { cn } from "@/lib/utils";

const steps: WizardStepMeta[] = [
  { key: "personal", label: "Personal Details", description: "Applicant bio & contact", icon: UserRound },
  { key: "courses", label: "Courses", description: "Programme choices", icon: BookOpen },
  { key: "academic", label: "Academic Qualifications", description: "Education history", icon: GraduationCap, optional: true },
  { key: "work", label: "Work Experience", description: "Employment history", icon: Briefcase, optional: true },
  { key: "documents", label: "Documents", description: "Supporting files", icon: FileText, optional: true },
  { key: "language", label: "Language Proficiency", description: "Test scores", icon: Languages, optional: true },
  { key: "declaration", label: "Declaration", description: "Consent & review", icon: ShieldCheck },
];

function isPersonalValid(d: PersonalDetailsData) {
  const present = d.presentAddress;
  const permanent = d.sameAsPresent ? d.presentAddress : d.permanentAddress;
  const presentOk = !!(present.line1 && present.city && present.postcode && present.country);
  const permanentOk = !!(permanent.line1 && permanent.city && permanent.postcode && permanent.country);
  return !!(
    d.branch &&
    d.counsellor &&
    d.leadSource &&
    d.applicationType &&
    d.firstName &&
    d.lastName &&
    d.phone &&
    d.email &&
    d.gender &&
    d.dob &&
    d.nationality &&
    presentOk &&
    permanentOk
  );
}

function isDeclarationValid(d: DeclarationData) {
  const answered = [
    d.visaRefusal,
    d.studiedAbroad,
    d.appliedOtherUniversities,
    d.fundsArranged,
    d.dependents,
    d.livedInUkEu,
    d.disabilities,
    d.criminalConvictions,
  ].every(Boolean);
  const feesOk = !!d.feesPayment && (d.feesPayment !== "Other" || d.feesPaymentOther.trim().length > 0);
  return !!(answered && feesOk && d.acceptStatement && d.confirmAccurate && d.confirmQualifications);
}

function generateReference() {
  return `APP-2026-${Math.floor(1000 + Math.random() * 9000)}`;
}

export function ApplicationWizard() {
  const [stepIndex, setStepIndex] = useState(0);
  const [furthest, setFurthest] = useState(0);

  const [personal, setPersonal] = useState<PersonalDetailsData>(emptyPersonalDetails);
  const [courses, setCourses] = useState<CourseEntry[]>([]);
  const [education, setEducation] = useState<EducationEntry[]>([]);
  const [work, setWork] = useState<WorkExperienceEntry[]>([]);
  const [documents, setDocuments] = useState<DocumentEntry[]>([]);
  const [language, setLanguage] = useState<LanguageEntry[]>([]);
  const [declaration, setDeclaration] = useState<DeclarationData>(emptyDeclaration);

  const [submitted, setSubmitted] = useState(false);
  const [reference, setReference] = useState("");

  const isValid = useMemo(
    () => (index: number) => {
      switch (index) {
        case 0:
          return isPersonalValid(personal);
        case 1:
          return courses.length > 0;
        case 2:
          return education.length > 0;
        case 3:
          return work.length > 0;
        case 4:
          return documents.length > 0;
        case 5:
          return language.length > 0;
        case 6:
          return isDeclarationValid(declaration);
        default:
          return false;
      }
    },
    [personal, courses, education, work, documents, language, declaration]
  );

  const percent = (steps.filter((_, i) => isValid(i)).length / steps.length) * 100;
  const currentStep = steps[stepIndex];
  const isLastStep = stepIndex === steps.length - 1;

  function goTo(index: number) {
    setStepIndex(index);
    setFurthest((f) => Math.max(f, index));
  }

  function goNext() {
    if (isLastStep) return;
    goTo(stepIndex + 1);
  }

  function goPrev() {
    if (stepIndex === 0) return;
    goTo(stepIndex - 1);
  }

  function handleSubmit() {
    if (!isDeclarationValid(declaration)) return;
    setReference(generateReference());
    setSubmitted(true);
  }

  function handleReset() {
    setPersonal(emptyPersonalDetails());
    setCourses([]);
    setEducation([]);
    setWork([]);
    setDocuments([]);
    setLanguage([]);
    setDeclaration(emptyDeclaration());
    setStepIndex(0);
    setFurthest(0);
    setSubmitted(false);
  }

  const applicantName = [personal.firstName, personal.lastName].filter(Boolean).join(" ");
  const initials =
    (personal.firstName?.[0] ?? "").toUpperCase() + (personal.lastName?.[0] ?? "").toUpperCase() || "—";

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <Link
            href="/applications"
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="size-3.5" />
            Applications
          </Link>
          <div className="mt-1.5 flex items-center gap-2.5">
            {applicantName && (
              <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-bold text-primary-foreground">
                {initials}
              </span>
            )}
            <h2 className="text-2xl font-bold tracking-tight text-foreground sm:text-3xl">
              {applicantName || "New Application"}
            </h2>
          </div>
          <p className="mt-0.5 text-sm text-muted-foreground">
            Complete the {steps.length} steps below — required steps are marked, the rest can be finished later.
          </p>
        </div>

        {!submitted && (
          <div className="flex shrink-0 items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-2.5 card-shadow">
            <ProgressRing percent={percent} />
            <div className="text-xs">
              <p className="font-semibold text-foreground">Application progress</p>
              <p className="text-muted-foreground">
                Step {stepIndex + 1} of {steps.length}
              </p>
            </div>
          </div>
        )}
      </div>

      {submitted ? (
        <SuccessScreen referenceId={reference} applicantName={applicantName} onReset={handleReset} />
      ) : (
        <>
          <div className="md:hidden">
            <WizardStepper steps={steps} currentIndex={stepIndex} isValid={isValid} furthest={furthest} onSelect={goTo} />
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-12">
            <div className="hidden md:col-span-3 md:block">
              <div className="sticky top-0">
                <Card className="p-5">
                  <WizardStepper
                    steps={steps}
                    currentIndex={stepIndex}
                    isValid={isValid}
                    furthest={furthest}
                    onSelect={goTo}
                  />
                </Card>
              </div>
            </div>

            <div className="md:col-span-9">
              <Card className="flex flex-col">
                <CardHeader
                  icon={currentStep.icon}
                  title={currentStep.label}
                  subtitle={currentStep.description}
                  action={
                    currentStep.optional ? (
                      <span className="rounded-full bg-surface-muted px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-muted-foreground">
                        Optional
                      </span>
                    ) : undefined
                  }
                />

                <div className="px-5 pb-2 pt-5 sm:px-6">
                  {stepIndex === 0 && (
                    <PersonalDetailsStep data={personal} onChange={(patch) => setPersonal((d) => ({ ...d, ...patch }))} />
                  )}
                  {stepIndex === 1 && (
                    <CoursesStep
                      entries={courses}
                      onAdd={(entry) => setCourses((list) => [...list, entry])}
                      onRemove={(id) => setCourses((list) => list.filter((e) => e.id !== id))}
                    />
                  )}
                  {stepIndex === 2 && (
                    <AcademicStep
                      entries={education}
                      onAdd={(entry) => setEducation((list) => [...list, entry])}
                      onRemove={(id) => setEducation((list) => list.filter((e) => e.id !== id))}
                    />
                  )}
                  {stepIndex === 3 && (
                    <WorkExperienceStep
                      entries={work}
                      onAdd={(entry) => setWork((list) => [...list, entry])}
                      onRemove={(id) => setWork((list) => list.filter((e) => e.id !== id))}
                    />
                  )}
                  {stepIndex === 4 && (
                    <DocumentsStep
                      entries={documents}
                      onAdd={(entry) => setDocuments((list) => [...list, entry])}
                      onRemove={(id) => setDocuments((list) => list.filter((e) => e.id !== id))}
                    />
                  )}
                  {stepIndex === 5 && (
                    <LanguageStep
                      entries={language}
                      onAdd={(entry) => setLanguage((list) => [...list, entry])}
                      onRemove={(id) => setLanguage((list) => list.filter((e) => e.id !== id))}
                    />
                  )}
                  {stepIndex === 6 && (
                    <DeclarationStep
                      data={declaration}
                      onChange={(patch) => setDeclaration((d) => ({ ...d, ...patch }))}
                      personal={personal}
                      courses={courses}
                      education={education}
                      work={work}
                      documents={documents}
                      language={language}
                      onEditStep={goTo}
                    />
                  )}
                </div>

                <div className="mt-6 flex items-center justify-between gap-3 border-t border-border px-5 py-4 sm:px-6">
                  <button
                    type="button"
                    onClick={goPrev}
                    disabled={stepIndex === 0}
                    className={cn(buttonSecondary, "disabled:cursor-not-allowed")}
                  >
                    <ArrowLeft className="size-4" />
                    Previous
                  </button>

                  <div className="flex items-center gap-2.5">
                    {currentStep.optional && !isLastStep && (
                      <button
                        type="button"
                        onClick={goNext}
                        className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-warning/40 bg-warning-soft px-4 py-2 text-xs font-semibold text-warning transition-all hover:brightness-95"
                      >
                        <SkipForward className="size-3.5" />
                        Skip &amp; Continue
                      </button>
                    )}

                    {isLastStep ? (
                      <button
                        type="button"
                        onClick={handleSubmit}
                        disabled={!isValid(6)}
                        className={cn(buttonPrimary, "disabled:cursor-not-allowed")}
                      >
                        Submit Application
                      </button>
                    ) : (
                      <button
                        type="button"
                        onClick={goNext}
                        disabled={!currentStep.optional && !isValid(stepIndex)}
                        className={cn(buttonPrimary, "disabled:cursor-not-allowed")}
                      >
                        Save &amp; Continue
                      </button>
                    )}
                  </div>
                </div>
              </Card>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
