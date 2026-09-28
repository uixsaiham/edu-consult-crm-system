// SMS rules shared by the CRM screens and the /api/sms server routes:
// who may be messaged, how long a message is, and roughly what it costs.

export type SmsCategory = "service" | "marketing";
export const serviceTopics = ["Application status", "Document request", "Appointment reminder", "Other service"] as const;
export type ServiceTopic = (typeof serviceTopics)[number];

/** Service messages: allowed while the contact has a live enquiry or application, unless they texted STOP. */
export type ServiceConsent = "active" | "opted-out";
/** Marketing (PECR): only with a recorded opt-in that hasn't been withdrawn. */
export type MarketingConsent = "granted" | "not-asked" | "withdrawn";

export interface ConsentRecord {
  service: ServiceConsent;
  marketing: MarketingConsent;
  /** Where the marketing opt-in came from, e.g. "Website enquiry form", "Expo sign-up sheet". */
  marketingSource?: string;
  marketingAt?: string;
  optedOutAt?: string;
}

/** Appended to every marketing message; UK PECR requires a simple, free way to opt out. */
export const MARKETING_OPT_OUT = "Reply STOP to opt out";

export const hasOptOutText = (body: string) => /\bSTOP\b/.test(body);

export function eligibility(consent: ConsentRecord, category: SmsCategory, phone: string): { ok: true } | { ok: false; reason: string } {
  if (!toE164(phone)) return { ok: false, reason: "No valid mobile number" };
  if (consent.service === "opted-out") return { ok: false, reason: "Texted STOP — no SMS of any kind" };
  if (category === "marketing") {
    if (consent.marketing === "withdrawn") return { ok: false, reason: "Withdrew marketing consent" };
    if (consent.marketing !== "granted") return { ok: false, reason: "No marketing consent recorded" };
  }
  return { ok: true };
}

/** Normalises UK and Bangladeshi numbers to E.164; returns "" when it can't be a mobile number. */
export function toE164(raw: string) {
  let n = raw.replace(/[\s\-()]/g, "");
  if (n.startsWith("00")) n = `+${n.slice(2)}`;
  if (/^07\d{9}$/.test(n)) n = `+44${n.slice(1)}`;
  if (/^01\d{9}$/.test(n)) n = `+880${n.slice(1)}`;
  if (/^\+447\d{9}$/.test(n)) return n;
  if (/^\+8801\d{9}$/.test(n)) return n;
  if (/^\+\d{8,15}$/.test(n) && !n.startsWith("+44") && !n.startsWith("+880")) return n;
  return "";
}

export function countryOf(e164: string) {
  return e164.startsWith("+44") ? "United Kingdom" : e164.startsWith("+880") ? "Bangladesh" : "Other";
}

// --- Length & segments --------------------------------------------------------------

const GSM_BASIC = "@£$¥èéùìòÇ\nØø\rÅåΔ_ΦΓΛΩΠΨΣΘΞÆæßÉ !\"#¤%&'()*+,-./0123456789:;<=>?¡ABCDEFGHIJKLMNOPQRSTUVWXYZÄÖÑÜ§¿abcdefghijklmnopqrstuvwxyzäöñüà";
const GSM_EXTENDED = "^{}\\[~]|€";

/** GSM-7 fits 160 characters (153 per part when split); any other character forces UCS-2 at 70 (67). */
export function segmentInfo(body: string) {
  const chars = [...body];
  const gsm = chars.every((c) => GSM_BASIC.includes(c) || GSM_EXTENDED.includes(c));
  const units = gsm ? chars.reduce((n, c) => n + (GSM_EXTENDED.includes(c) ? 2 : 1), 0) : chars.length;
  const single = gsm ? 160 : 70;
  const multi = gsm ? 153 : 67;
  const segments = units === 0 ? 0 : units <= single ? 1 : Math.ceil(units / multi);
  const culprits = gsm ? [] : [...new Set(chars.filter((c) => !GSM_BASIC.includes(c) && !GSM_EXTENDED.includes(c)))];
  return { encoding: gsm ? "GSM-7" : "Unicode", units, segments, perSegment: segments > 1 ? multi : single, culprits };
}

// --- Cost -------------------------------------------------------------------------------

/**
 * Twilio list prices per outbound segment in USD, from twilio.com/en-us/sms/pricing (checked Sept 2026).
 * Your account may have different rates — the Setup page reads the account's own pricing when connected.
 */
export const smsRatesUsd: Record<string, number> = {
  "United Kingdom": 0.056,
  Bangladesh: 0.5962,
  Other: 0.1,
};
export const FAILED_FEE_USD = 0.001;
export const USD_TO_GBP = 0.79;

export function estimateCost(phones: string[], segments: number) {
  const byCountry: Record<string, { count: number; usd: number }> = {};
  for (const p of phones) {
    const c = countryOf(p);
    const usd = (smsRatesUsd[c] ?? smsRatesUsd.Other) * segments;
    byCountry[c] = { count: (byCountry[c]?.count ?? 0) + 1, usd: (byCountry[c]?.usd ?? 0) + usd };
  }
  const usd = Object.values(byCountry).reduce((n, x) => n + x.usd, 0);
  return { usd, gbp: usd * USD_TO_GBP, byCountry };
}

export const formatGbp = (n: number) => `£${n < 10 ? n.toFixed(2) : n.toLocaleString("en-GB", { maximumFractionDigits: 0 })}`;

// --- Templates -----------------------------------------------------------------------------

export function fillTemplate(template: string, values: Record<string, string | undefined>) {
  return template.replace(/\{(\w+)\}/g, (m, key: string) => values[key] ?? m);
}
export const unfilledTokens = (body: string) => [...body.matchAll(/\{(\w+)\}/g)].map((m) => m[1]);

/** UK marketing sends are kept to 9am–8pm Monday–Saturday. */
export function withinMarketingHours(d: Date) {
  const h = d.getHours();
  return d.getDay() !== 0 && h >= 9 && h < 20;
}

// --- Delivery status -------------------------------------------------------------------------

/** Twilio message statuses plus CRM-only ones: blocked (stopped by consent rules) and simulated (Twilio not connected). */
export type SmsStatus = "queued" | "sending" | "sent" | "delivered" | "undelivered" | "failed" | "blocked" | "simulated";
export const finalStatuses: SmsStatus[] = ["delivered", "undelivered", "failed", "blocked", "simulated"];

/** The Twilio error codes staff are most likely to see, in plain English. */
export const twilioErrors: Record<string, string> = {
  "21211": "Invalid phone number",
  "21408": "Sending to this country isn't enabled on the Twilio account",
  "21610": "Recipient has replied STOP — Twilio blocked the message",
  "21612": "This sender can't reach that number",
  "21614": "Not a mobile number",
  "30003": "Handset unreachable (switched off or out of coverage)",
  "30005": "Unknown or inactive number",
  "30006": "Landline or unreachable carrier",
  "30007": "Filtered by the carrier as possible spam",
  "30008": "Unknown delivery error",
};
