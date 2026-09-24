"use client";

import { useEffect, useRef, useState, type FormEvent, type ReactNode } from "react";
import { Globe2, ImagePlus, X } from "lucide-react";
import { Field, Select, Textarea, TextInput } from "@/components/ui/form-controls";
import { countryList } from "@/lib/mock/country-list";
import type { CountryRecord } from "@/lib/mock/directory";
import { cn } from "@/lib/utils";
import { buttonPrimary, buttonSecondary } from "@/components/ui/button-styles";

const regions: CountryRecord["region"][] = ["Europe", "North America", "Oceania", "Asia"];

const currencies = [
  "GBP (£)", "EUR (€)", "USD ($)", "CAD ($)", "AUD ($)", "NZD ($)", "SGD ($)", "MYR (RM)",
  "KRW (₩)", "JPY (¥)", "CNY (¥)", "AED (د.إ)", "CHF (Fr)", "SEK (kr)", "NOK (kr)", "DKK (kr)",
  "PLN (zł)", "HUF (Ft)", "CZK (Kč)", "TRY (₺)", "INR (₹)", "BDT (৳)",
];

// Suggested currency and region for common study destinations (alpha-2 code).
const destinationDefaults: Record<string, { currency: string; region: CountryRecord["region"] }> = {
  GB: { currency: "GBP (£)", region: "Europe" },
  IE: { currency: "EUR (€)", region: "Europe" },
  DE: { currency: "EUR (€)", region: "Europe" },
  FR: { currency: "EUR (€)", region: "Europe" },
  NL: { currency: "EUR (€)", region: "Europe" },
  ES: { currency: "EUR (€)", region: "Europe" },
  IT: { currency: "EUR (€)", region: "Europe" },
  FI: { currency: "EUR (€)", region: "Europe" },
  MT: { currency: "EUR (€)", region: "Europe" },
  CY: { currency: "EUR (€)", region: "Europe" },
  LT: { currency: "EUR (€)", region: "Europe" },
  HU: { currency: "HUF (Ft)", region: "Europe" },
  PL: { currency: "PLN (zł)", region: "Europe" },
  CZ: { currency: "CZK (Kč)", region: "Europe" },
  SE: { currency: "SEK (kr)", region: "Europe" },
  NO: { currency: "NOK (kr)", region: "Europe" },
  DK: { currency: "DKK (kr)", region: "Europe" },
  CH: { currency: "CHF (Fr)", region: "Europe" },
  TR: { currency: "TRY (₺)", region: "Europe" },
  US: { currency: "USD ($)", region: "North America" },
  CA: { currency: "CAD ($)", region: "North America" },
  AU: { currency: "AUD ($)", region: "Oceania" },
  NZ: { currency: "NZD ($)", region: "Oceania" },
  SG: { currency: "SGD ($)", region: "Asia" },
  MY: { currency: "MYR (RM)", region: "Asia" },
  KR: { currency: "KRW (₩)", region: "Asia" },
  JP: { currency: "JPY (¥)", region: "Asia" },
  CN: { currency: "CNY (¥)", region: "Asia" },
  AE: { currency: "AED (د.إ)", region: "Asia" },
};

function flagFor(code: string) {
  return String.fromCodePoint(...[...code].map((ch) => 0x1f1e6 + ch.charCodeAt(0) - 65));
}

const quotaFields = [
  { key: "partnerUniversities", label: "Total universities", initial: 10 },
  { key: "directApplications", label: "Direct applications", initial: 25 },
  { key: "agentApplications", label: "Agent applications", initial: 15 },
  { key: "leadInProgress", label: "Leads in progress", initial: 12 },
  { key: "completedLeads", label: "Completed leads", initial: 28 },
  { key: "rejectedLeads", label: "Rejected leads", initial: 3 },
] as const;
type QuotaKey = (typeof quotaFields)[number]["key"];

export function AddRepresentedCountry({
  existing,
  onClose,
  onCreate,
}: {
  existing: CountryRecord[];
  onClose: () => void;
  onCreate: (country: CountryRecord) => void;
}) {
  const representedNames = new Set(existing.map((c) => c.name.toLowerCase()));
  const options = countryList.filter((c) => !representedNames.has(c.name.toLowerCase()));

  const [countryCode, setCountryCode] = useState("");
  const [region, setRegion] = useState<CountryRecord["region"]>("Europe");
  const [currency, setCurrency] = useState("");
  const [livingCost, setLivingCost] = useState("");
  const [flagImage, setFlagImage] = useState<{ url: string; name: string } | null>(null);
  const [bannerImage, setBannerImage] = useState<{ url: string; name: string } | null>(null);
  const [avgTuition, setAvgTuition] = useState("");
  const [minIelts, setMinIelts] = useState("6.0 overall");
  const [visaRequirements, setVisaRequirements] = useState("");
  const [partTimeWork, setPartTimeWork] = useState("");
  const [accommodation, setAccommodation] = useState("");
  const [benefits, setBenefits] = useState("");
  const [quota, setQuota] = useState<Record<QuotaKey, number>>(
    () => Object.fromEntries(quotaFields.map((f) => [f.key, f.initial])) as Record<QuotaKey, number>
  );

  const selected = countryList.find((c) => c.code === countryCode);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    document.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [onClose]);

  function chooseCountry(code: string) {
    setCountryCode(code);
    const defaults = destinationDefaults[code];
    if (defaults) {
      setCurrency(defaults.currency);
      setRegion(defaults.region);
    }
  }

  function submit(e: FormEvent) {
    e.preventDefault();
    if (!selected || !currency) return;
    onCreate({
      id: selected.code,
      name: selected.name,
      code: selected.code,
      flag: flagFor(selected.code),
      region,
      currency,
      avgTuition: avgTuition.trim() || "—",
      minIelts: minIelts.trim() || "—",
      visaSuccessRate: 0,
      processingDays: "—",
      popularIntakes: ["September", "January"],
      status: "Active",
      isActive: true,
      ...quota,
      monthlyLivingCost: livingCost ? Number(livingCost) : undefined,
      flagImage: flagImage?.url,
      bannerImage: bannerImage?.url,
      visaRequirements: visaRequirements.trim() || undefined,
      partTimeWork: partTimeWork.trim() || undefined,
      accommodation: accommodation.trim() || undefined,
      benefits: benefits.trim() || undefined,
    });
  }

  const currencySymbol = currency.match(/\((.+)\)/)?.[1] ?? "";

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto p-4 sm:items-center">
      <div className="fixed inset-0 bg-black/40 backdrop-blur-[1px] animate-fade-in" onClick={onClose} />
      <form
        onSubmit={submit}
        role="dialog"
        aria-modal="true"
        aria-labelledby="add-country-title"
        className="relative flex max-h-[calc(100vh-2rem)] w-full max-w-3xl flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl animate-fade-in"
      >
        {/* Header */}
        <div className="flex shrink-0 items-center gap-3 border-b border-border px-6 py-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary">
            <Globe2 className="size-[18px]" />
          </span>
          <div className="min-w-0 flex-1">
            <h3 id="add-country-title" className="text-[15px] font-semibold tracking-tight text-foreground">
              Add represented country
            </h3>
            <p className="mt-0.5 truncate text-xs text-muted-foreground">
              Set up a new study destination and its starting pipeline.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className="flex size-8 shrink-0 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-surface-hover hover:text-foreground"
          >
            <X className="size-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto px-6 py-5">
          <div className="flex flex-col gap-6">
            <Section title="Country">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Country" required>
                  <Select required value={countryCode} placeholder="Select country" onChange={(e) => chooseCountry(e.target.value)}>
                    {options.map((c) => (
                      <option key={c.code} value={c.code}>
                        {c.name}
                      </option>
                    ))}
                  </Select>
                </Field>
                <Field label="Region" required>
                  <Select value={region} onChange={(e) => setRegion(e.target.value as CountryRecord["region"])}>
                    {regions.map((r) => (
                      <option key={r}>{r}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Currency type" required>
                  <Select required value={currency} placeholder="Select currency" onChange={(e) => setCurrency(e.target.value)}>
                    {currencies.map((c) => (
                      <option key={c}>{c}</option>
                    ))}
                  </Select>
                </Field>
                <Field label="Monthly living cost" hint="Average for a student, in the local currency.">
                  <div className="relative">
                    {currencySymbol && (
                      <span className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                        {currencySymbol}
                      </span>
                    )}
                    <TextInput
                      type="number"
                      min={0}
                      inputMode="numeric"
                      value={livingCost}
                      onChange={(e) => setLivingCost(e.target.value)}
                      placeholder="e.g. 1200"
                      className={cn(currencySymbol && (currencySymbol.length > 1 ? "pl-11" : "pl-8"))}
                    />
                  </div>
                </Field>
              </div>
            </Section>

            <Section title="Images">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Country flag">
                  <ImageUpload
                    value={flagImage}
                    onChange={setFlagImage}
                    hint="PNG or SVG, square"
                    fallback={selected ? <span className="text-2xl leading-none">{flagFor(selected.code)}</span> : undefined}
                  />
                </Field>
                <Field label="Country banner image">
                  <ImageUpload value={bannerImage} onChange={setBannerImage} hint="JPG or PNG, 1600 × 600 recommended" wide />
                </Field>
              </div>
            </Section>

            <Section title="Study requirements">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Average tuition">
                  <TextInput value={avgTuition} onChange={(e) => setAvgTuition(e.target.value)} placeholder="e.g. £14,000 – £20,000" />
                </Field>
                <Field label="Minimum IELTS">
                  <TextInput value={minIelts} onChange={(e) => setMinIelts(e.target.value)} placeholder="e.g. 6.0 overall" />
                </Field>
              </div>
            </Section>

            <Section title="Country information">
              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                <Field label="Visa requirements">
                  <Textarea rows={3} value={visaRequirements} onChange={(e) => setVisaRequirements(e.target.value)} placeholder="Documents, funds and timelines…" />
                </Field>
                <Field label="Part-time work details">
                  <Textarea rows={3} value={partTimeWork} onChange={(e) => setPartTimeWork(e.target.value)} placeholder="Hours allowed during term and holidays…" />
                </Field>
                <Field label="Accommodation details">
                  <Textarea rows={3} value={accommodation} onChange={(e) => setAccommodation(e.target.value)} placeholder="Halls, private rentals, typical rent…" />
                </Field>
                <Field label="Country benefits">
                  <Textarea rows={3} value={benefits} onChange={(e) => setBenefits(e.target.value)} placeholder="Post-study work, scholarships, lifestyle…" />
                </Field>
              </div>
            </Section>

            <Section title="Initial quota & applications">
              <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                {quotaFields.map((f) => (
                  <Field key={f.key} label={f.label}>
                    <TextInput
                      type="number"
                      min={0}
                      value={quota[f.key]}
                      onChange={(e) => setQuota((q) => ({ ...q, [f.key]: Math.max(0, Number(e.target.value)) }))}
                    />
                  </Field>
                ))}
              </div>
            </Section>
          </div>
        </div>

        {/* Footer */}
        <div className="flex shrink-0 items-center justify-end gap-2 border-t border-border px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className={buttonSecondary}
          >
            Cancel
          </button>
          <button
            type="submit"
            className={buttonPrimary}
          >
            Add country
          </button>
        </div>
      </form>
    </div>
  );
}

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="flex flex-col gap-4 border-b border-border pb-6 last:border-0 last:pb-0">
      <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</h4>
      {children}
    </section>
  );
}

function ImageUpload({
  value,
  onChange,
  hint,
  wide = false,
  fallback,
}: {
  value: { url: string; name: string } | null;
  onChange: (value: { url: string; name: string } | null) => void;
  hint: string;
  wide?: boolean;
  fallback?: ReactNode;
}) {
  const inputRef = useRef<HTMLInputElement>(null);

  return (
    <div className="flex items-center gap-3 rounded-xl border border-dashed border-border-strong bg-surface-muted/40 p-2.5">
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0];
          if (file) onChange({ url: URL.createObjectURL(file), name: file.name });
          e.target.value = "";
        }}
      />
      <span
        className={cn(
          "flex shrink-0 items-center justify-center overflow-hidden bg-surface text-muted-foreground",
          wide ? "h-11 w-20 rounded-lg" : "size-11 rounded-full"
        )}
      >
        {value ? (
          // eslint-disable-next-line @next/next/no-img-element -- local object URL preview
          <img src={value.url} alt="" className="size-full object-cover" />
        ) : (
          fallback ?? <ImagePlus className="size-4" />
        )}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-xs font-medium text-foreground">{value ? value.name : "No file chosen"}</span>
        <span className="block truncate text-[11px] text-muted-foreground">{hint}</span>
      </span>
      {value ? (
        <button
          type="button"
          aria-label="Remove image"
          onClick={() => onChange(null)}
          className="shrink-0 rounded-md p-1.5 text-muted-foreground transition-colors hover:bg-danger-soft hover:text-danger"
        >
          <X className="size-4" />
        </button>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="h-8 shrink-0 rounded-full border border-border bg-surface px-3 text-xs font-medium text-foreground transition-colors hover:bg-surface-hover"
        >
          Upload
        </button>
      )}
    </div>
  );
}
