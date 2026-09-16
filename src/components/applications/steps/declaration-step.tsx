"use client";

import { ShieldCheck } from "lucide-react";
import { ApplicationReview } from "@/components/applications/application-review";
import { Checkbox, Field, PillGroup, SectionHeading, TextInput } from "@/components/ui/form-controls";
import type {
  CourseEntry,
  DeclarationData,
  DocumentEntry,
  EducationEntry,
  LanguageEntry,
  PersonalDetailsData,
  WorkExperienceEntry,
  YesNo,
} from "@/lib/mock/applications";
import { fundingSources } from "@/lib/mock/applications";

const yesNoOptions: { value: YesNo; label: string }[] = [
  { value: "no", label: "No" },
  { value: "yes", label: "Yes" },
];

export function DeclarationStep({
  data,
  onChange,
  personal,
  courses,
  education,
  work,
  documents,
  language,
  onEditStep,
}: {
  data: DeclarationData;
  onChange: (patch: Partial<DeclarationData>) => void;
  personal: PersonalDetailsData;
  courses: CourseEntry[];
  education: EducationEntry[];
  work: WorkExperienceEntry[];
  documents: DocumentEntry[];
  language: LanguageEntry[];
  onEditStep: (stepIndex: number) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <SectionHeading
          title="Review Your Application"
          description="Check every section below before submitting — click Edit to make changes"
        />
        <ApplicationReview
          personal={personal}
          courses={courses}
          education={education}
          work={work}
          documents={documents}
          language={language}
          onEdit={onEditStep}
        />
      </div>

      <div>
        <SectionHeading title="Immigration" description="Standard declaration questions for international applicants" />
        <div className="flex flex-col gap-5">
          <Field label="Have you ever had any visa refusal?" required>
            <PillGroup options={yesNoOptions} value={data.visaRefusal} onChange={(v) => onChange({ visaRefusal: v })} />
          </Field>
          <Field label="Have you previously studied abroad?" required>
            <PillGroup options={yesNoOptions} value={data.studiedAbroad} onChange={(v) => onChange({ studiedAbroad: v })} />
          </Field>
          <Field label="Did you apply to any other universities?" required>
            <PillGroup
              options={yesNoOptions}
              value={data.appliedOtherUniversities}
              onChange={(v) => onChange({ appliedOtherUniversities: v })}
            />
          </Field>
          <Field label="Have you arranged for your tuition and living expenses?" required>
            <PillGroup options={yesNoOptions} value={data.fundsArranged} onChange={(v) => onChange({ fundsArranged: v })} />
          </Field>

          <Field label="How will your fees be paid?" required>
            <div className="flex flex-wrap items-center gap-3">
              <PillGroup
                options={fundingSources.map((f) => ({ value: f, label: f }))}
                value={data.feesPayment}
                onChange={(v) => onChange({ feesPayment: v })}
              />
            </div>
            {data.feesPayment === "Other" && (
              <TextInput
                className="mt-2 max-w-xs"
                placeholder="Please specify"
                value={data.feesPaymentOther}
                onChange={(e) => onChange({ feesPaymentOther: e.target.value })}
              />
            )}
          </Field>

          <Field label="Do you have any dependents who will be included in your visa application under the University license?" required>
            <PillGroup options={yesNoOptions} value={data.dependents} onChange={(v) => onChange({ dependents: v })} />
          </Field>
          <Field label="Have you lived continuously in the UK or EU in the last 3 years?" required>
            <PillGroup options={yesNoOptions} value={data.livedInUkEu} onChange={(v) => onChange({ livedInUkEu: v })} />
          </Field>

          <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Field label="Disabilities" required>
              <PillGroup options={yesNoOptions} value={data.disabilities} onChange={(v) => onChange({ disabilities: v })} />
            </Field>
            <Field label="Criminal Convictions" required>
              <PillGroup
                options={yesNoOptions}
                value={data.criminalConvictions}
                onChange={(v) => onChange({ criminalConvictions: v })}
              />
            </Field>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-border bg-surface-muted/40 p-4">
        <div className="mb-3 flex items-center gap-2">
          <ShieldCheck className="size-4 text-primary" />
          <p className="text-sm font-bold text-foreground">Declaration</p>
        </div>
        <p className="text-xs leading-relaxed text-muted-foreground">
          I agree to Boost Education Service T/A BHE Uni processing my personal data contained in this form or other
          data which Boost Education Service T/A BHE Uni may obtain from other people. I agree to the processing of
          such data for any purposes connected with my studies or my health and safety whilst on the premises or for
          any legitimate reason including communication with me following the completion of my studies. I hereby
          authorize Boost Education Service T/A BHE Uni to share my application details and relevant information with
          educational institutions, as required for the application process. The final decision lies with the
          respective educational institutions.
        </p>

        <div className="mt-4 flex flex-col gap-3">
          <Checkbox
            checked={data.acceptStatement}
            onChange={(v) => onChange({ acceptStatement: v })}
            label="I understand and accept this statement"
            required
          />
          <Checkbox
            checked={data.confirmAccurate}
            onChange={(v) => onChange({ confirmAccurate: v })}
            label="I confirm that the information I have provided on this application is true, complete and accurate"
            required
          />
          <Checkbox
            checked={data.confirmQualifications}
            onChange={(v) => onChange({ confirmQualifications: v })}
            label="I confirm that I have declared all previous study and have listed my highest qualification"
            required
          />
          <Checkbox
            checked={data.sendConsent}
            onChange={(v) => onChange({ sendConsent: v })}
            label="Send consent to student"
          />
        </div>
      </div>
    </div>
  );
}
