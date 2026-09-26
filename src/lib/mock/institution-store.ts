// In-memory store for institutions changed this session (added, edited,
// activated, published). Replace with API calls once the backend exists.
import { mockInstitutions, type InstitutionDetails, type InstitutionRecord } from "./directory";

const added: InstitutionRecord[] = [];
const patches = new Map<string, Partial<InstitutionRecord>>();
let lastChange: { id: string; kind: "added" | "updated" } | null = null;

// Sample institutions ship with a few switched off so the toggles have something to show.
const defaults: Record<string, Partial<InstitutionRecord>> = {
  "INS-07": { showOnWebsite: false },
  "INS-08": { active: false, showOnWebsite: false },
};

export function getInstitutions(): InstitutionRecord[] {
  return [...added, ...mockInstitutions].map((i) => ({ ...i, ...defaults[i.id], ...patches.get(i.id) }));
}

export function getInstitution(id: string) {
  return getInstitutions().find((i) => i.id === id);
}

export function addInstitution(record: InstitutionRecord) {
  added.unshift(record);
  lastChange = { id: record.id, kind: "added" };
}

export function updateInstitution(id: string, patch: Partial<InstitutionRecord>) {
  patches.set(id, { ...patches.get(id), ...patch });
}

/** Remember a form save so the list can highlight the row it returns to. */
export function markUpdated(id: string) {
  lastChange = { id, kind: "updated" };
}

export function getLastChange() {
  return lastChange;
}

export function clearLastChange() {
  lastChange = null;
}

export function nextInstitutionId() {
  const max = getInstitutions().reduce((m, i) => Math.max(m, Number(i.id.replace(/\D/g, "")) || 0), 0);
  return `INS-${String(max + 1).padStart(2, "0")}`;
}

export const isActive = (i: InstitutionRecord) => i.active !== false;
export const isOnWebsite = (i: InstitutionRecord) => isActive(i) && i.showOnWebsite !== false;

const sampleDomains: Record<string, string> = {
  "University of Hertfordshire": "herts.ac.uk",
  "Coventry University": "coventry.ac.uk",
  "University of Greenwich": "gre.ac.uk",
  "Ulster University": "ulster.ac.uk",
  "De Montfort University": "dmu.ac.uk",
  "BPP University": "bpp.com",
  "Northeastern University": "northeastern.edu",
  "York University": "yorku.ca",
  "Deakin University": "deakin.edu.au",
  "National College of Ireland": "ncirl.ie",
};

const tierRate: Record<InstitutionRecord["commissionTier"], string> = {
  "Tier 1 (15-18%)": "16",
  "Tier 2 (12-15%)": "13",
  "Tier 3 (10-12%)": "11",
};

/** Full profile for an institution; sample records get sensible defaults. */
export function detailsFor(i: InstitutionRecord): InstitutionDetails {
  if (i.details) return i.details;
  const domain = sampleDomains[i.name] ?? `${i.name.toLowerCase().replace(/[^a-z]+/g, "")}.ac.uk`;
  const [city, ...campuses] = i.city.split(/\s*[&,]\s*/);
  return {
    name: i.name,
    shortName: i.logoText,
    type: i.type ?? "University",
    country: i.country,
    city,
    campuses: campuses.join(", "),
    website: i.website ?? `www.${domain}`,
    established: "",
    ranking: i.ranking,
    logo: "",
    agreementType: i.agreementType,
    aggregator: i.agreementType === "Consortium / Aggregator" ? "Study Group" : "",
    commissionRate: String(i.commissionRate ?? tierRate[i.commissionTier]),
    paymentTerms: "30 days after census",
    startDate: "2024-09-01",
    endDate: "2027-08-31",
    agreementDoc: `${i.logoText}-BHE-agreement-2024.pdf`,
    intakes: i.openIntakes,
    tat: i.tatDays,
    levels: ["Undergraduate", "Postgraduate"],
    ieltsMin: "6.0",
    altTests: ["PTE Academic", "TOEFL iBT"],
    applicationFee: "0",
    deposit: i.country === "United Kingdom" ? "3000" : "",
    scholarships: i.featured,
    scholarshipMax: i.featured ? "3000" : "",
    programsCount: String(i.programsCount),
    contactName: i.contactName ?? "International Partnerships Team",
    contactRole: "Partnerships",
    contactEmail: i.contactEmail ?? `partnerships@${domain}`,
    contactPhone: "",
    admissionsEmail: `international@${domain}`,
    status: i.status ?? "Active",
    featured: i.featured,
    notes: "",
  };
}
