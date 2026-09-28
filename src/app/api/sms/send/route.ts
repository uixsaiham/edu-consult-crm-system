import { hasOptOutText, segmentInfo, toE164, unfilledTokens, type SmsCategory } from "@/lib/sms/rules";
import { sendSms, smsConfig, smsState, TEST_DAILY_LIMIT, TwilioError } from "@/lib/sms/twilio.server";

const fail = (status: number, error: string, extra?: object) => Response.json({ error, ...extra }, { status });

/**
 * Sends one SMS. The CRM checks consent before calling this; the server re-checks everything
 * it can on its own, so a bug or a crafted request still can't reach an unapproved number.
 */
export async function POST(request: Request) {
  // Only the CRM's own pages may call this.
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return fail(403, "Cross-site request refused");

  const cfg = smsConfig();
  if (cfg.mode === "off") return fail(403, "SMS sending is switched off (SMS_MODE=off)");
  if (!cfg.configured) return fail(503, "Twilio isn't connected", { missing: cfg.missing });
  if (cfg.mode === "live") return fail(403, "Live sending stays locked until CRM sign-in is in place — see rollout phase 3 in docs/sms-twilio.md");

  const input = (await request.json().catch(() => null)) as { to?: string; body?: string; category?: SmsCategory } | null;
  const to = toE164(input?.to ?? "");
  const body = (input?.body ?? "").trim();
  const category = input?.category;
  if (!to) return fail(400, "Not a valid mobile number");
  if (category !== "service" && category !== "marketing") return fail(400, "Category must be service or marketing");
  if (!body) return fail(400, "Message is empty");
  if (segmentInfo(body).segments > 6) return fail(400, "Message is longer than 6 SMS parts");
  if (unfilledTokens(body).length) return fail(400, `Fill in ${unfilledTokens(body).map((t) => `{${t}}`).join(", ")} before sending`);
  if (category === "marketing" && !hasOptOutText(body)) return fail(400, "Marketing messages must tell people how to opt out (Reply STOP)");
  if (category === "marketing" && !cfg.marketingSid) return fail(400, "No marketing Messaging Service set (TWILIO_MARKETING_MESSAGING_SID)");

  if (cfg.mode === "test") {
    if (!cfg.allowlist.includes(to)) return fail(403, "Test mode: only numbers on SMS_TEST_ALLOWLIST can receive messages", { blocked: true });
    const day = new Date().toISOString().slice(0, 10);
    if (smsState.sentToday.day !== day) smsState.sentToday = { day, count: 0 };
    if (smsState.sentToday.count >= TEST_DAILY_LIMIT) return fail(429, `Test mode daily limit of ${TEST_DAILY_LIMIT} reached`);
  }
  if (smsState.optedOut.has(to)) return fail(409, "This number replied STOP", { blocked: true });

  try {
    const sent = await sendSms(to, body, category);
    smsState.sentToday.count++;
    smsState.statuses.set(sent.sid, { status: sent.status, at: new Date().toISOString() });
    return Response.json(sent);
  } catch (e) {
    const err = e as TwilioError;
    if (err.code === "21610") smsState.optedOut.set(to, { at: new Date().toISOString(), via: "Twilio block list" });
    return fail(502, err.message, { code: err.code, blocked: err.code === "21610" });
  }
}
