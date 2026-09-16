"use client";

import { Field, Select, SectionHeading, TextInput, Checkbox } from "@/components/ui/form-controls";
import {
  applicationTypes,
  branches,
  counsellors,
  countries,
  genders,
  leadSources,
  maritalStatuses,
  nationalities,
  titles,
  type AddressData,
  type PersonalDetailsData,
} from "@/lib/mock/applications";

function AddressFields({
  data,
  onChange,
  disabled,
}: {
  data: AddressData;
  onChange: (patch: Partial<AddressData>) => void;
  disabled?: boolean;
}) {
  return (
    <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
      <Field label="House Number / Name and Street" required className="lg:col-span-2">
        <TextInput
          disabled={disabled}
          value={data.line1}
          onChange={(e) => onChange({ line1: e.target.value })}
          placeholder="e.g. 42 Baker Street"
        />
      </Field>
      <Field label="Address Line 2" className="lg:col-span-2">
        <TextInput
          disabled={disabled}
          value={data.line2}
          onChange={(e) => onChange({ line2: e.target.value })}
        />
      </Field>
      <Field label="Town / City" required>
        <TextInput disabled={disabled} value={data.city} onChange={(e) => onChange({ city: e.target.value })} />
      </Field>
      <Field label="State / Province">
        <TextInput disabled={disabled} value={data.state} onChange={(e) => onChange({ state: e.target.value })} />
      </Field>
      <Field label="Postcode / ZIP Code" required>
        <TextInput
          disabled={disabled}
          value={data.postcode}
          onChange={(e) => onChange({ postcode: e.target.value })}
        />
      </Field>
      <Field label="Country" required>
        <Select
          disabled={disabled}
          placeholder="Select"
          value={data.country}
          onChange={(e) => onChange({ country: e.target.value })}
        >
          {countries.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </Select>
      </Field>
    </div>
  );
}

export function PersonalDetailsStep({
  data,
  onChange,
}: {
  data: PersonalDetailsData;
  onChange: (patch: Partial<PersonalDetailsData>) => void;
}) {
  return (
    <div className="flex flex-col gap-8">
      <div>
        <SectionHeading title="Application Setup" description="Where and how this application originated" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Branch" required>
            <Select placeholder="Select" value={data.branch} onChange={(e) => onChange({ branch: e.target.value })}>
              {branches.map((b) => (
                <option key={b} value={b}>
                  {b}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Counsellor name" required>
            <Select
              placeholder="Select"
              value={data.counsellor}
              onChange={(e) => onChange({ counsellor: e.target.value })}
            >
              {counsellors.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Lead source" required>
            <Select
              placeholder="Select lead source"
              value={data.leadSource}
              onChange={(e) => onChange({ leadSource: e.target.value })}
            >
              {leadSources.map((s) => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Application type" required>
            <Select
              placeholder="Select"
              value={data.applicationType}
              onChange={(e) => onChange({ applicationType: e.target.value })}
            >
              {applicationTypes.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
        </div>
      </div>

      <div>
        <SectionHeading title="Basic Details" description="The applicant's identity & contact information" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Title">
            <Select placeholder="Title" value={data.title} onChange={(e) => onChange({ title: e.target.value })}>
              {titles.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="First name" required>
            <TextInput value={data.firstName} onChange={(e) => onChange({ firstName: e.target.value })} />
          </Field>
          <Field label="Middle name">
            <TextInput value={data.middleName} onChange={(e) => onChange({ middleName: e.target.value })} />
          </Field>
          <Field label="Last name" required>
            <TextInput value={data.lastName} onChange={(e) => onChange({ lastName: e.target.value })} />
          </Field>
          <Field label="Phone" required>
            <TextInput
              type="tel"
              value={data.phone}
              onChange={(e) => onChange({ phone: e.target.value })}
              placeholder="+880 1XXX XXXXXX"
            />
          </Field>
          <Field label="Email address" required>
            <TextInput
              type="email"
              value={data.email}
              onChange={(e) => onChange({ email: e.target.value })}
              placeholder="name@example.com"
            />
          </Field>
          <Field label="Gender" required>
            <Select placeholder="Select" value={data.gender} onChange={(e) => onChange({ gender: e.target.value })}>
              {genders.map((g) => (
                <option key={g} value={g}>
                  {g}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Date of birth" required>
            <TextInput type="date" value={data.dob} onChange={(e) => onChange({ dob: e.target.value })} />
          </Field>
          <Field label="Nationality" required>
            <Select
              placeholder="Select"
              value={data.nationality}
              onChange={(e) => onChange({ nationality: e.target.value })}
            >
              {nationalities.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="Marital status">
            <Select
              placeholder="Select"
              value={data.maritalStatus}
              onChange={(e) => onChange({ maritalStatus: e.target.value })}
            >
              {maritalStatuses.map((m) => (
                <option key={m} value={m}>
                  {m}
                </option>
              ))}
            </Select>
          </Field>
          <Field label="First language">
            <TextInput value={data.firstLanguage} onChange={(e) => onChange({ firstLanguage: e.target.value })} />
          </Field>
          <Field label="Passport/ID No">
            <TextInput value={data.passportNo} onChange={(e) => onChange({ passportNo: e.target.value })} />
          </Field>
          <Field label="Passport issue date">
            <TextInput
              type="date"
              value={data.passportIssueDate}
              onChange={(e) => onChange({ passportIssueDate: e.target.value })}
            />
          </Field>
          <Field label="Passport expiry date">
            <TextInput
              type="date"
              value={data.passportExpiryDate}
              onChange={(e) => onChange({ passportExpiryDate: e.target.value })}
            />
          </Field>
        </div>
      </div>

      <div>
        <SectionHeading title="Present Address" description="Where the applicant currently lives" />
        <AddressFields
          data={data.presentAddress}
          onChange={(patch) => onChange({ presentAddress: { ...data.presentAddress, ...patch } })}
        />
      </div>

      <div>
        <SectionHeading
          title="Permanent Address"
          description="Home address on official documents"
          action={
            <Checkbox
              checked={data.sameAsPresent}
              onChange={(v) =>
                onChange({
                  sameAsPresent: v,
                  permanentAddress: v ? { ...data.presentAddress } : data.permanentAddress,
                })
              }
              label="Same as Present Address"
            />
          }
        />
        <AddressFields
          data={data.sameAsPresent ? data.presentAddress : data.permanentAddress}
          onChange={(patch) => onChange({ permanentAddress: { ...data.permanentAddress, ...patch } })}
          disabled={data.sameAsPresent}
        />
      </div>
    </div>
  );
}
