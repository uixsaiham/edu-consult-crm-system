import { toE164 } from "@/lib/sms/rules";
import { smsConfig, smsState, validSignature } from "@/lib/sms/twilio.server";

/**
 * Replies to the marketing number. Twilio Advanced Opt-Out handles STOP / START / HELP and sends
 * the confirmation text itself; this records the change so the CRM stops offering that contact.
 */
export async function POST(request: Request) {
  const params = Object.fromEntries((await request.formData()).entries()) as Record<string, string>;
  const { publicBaseUrl } = smsConfig();
  const url = publicBaseUrl ? `${publicBaseUrl}${new URL(request.url).pathname}` : request.url;
  if (!validSignature(url, params, request.headers.get("x-twilio-signature"))) return new Response("Invalid signature", { status: 403 });

  const from = toE164(params.From ?? "");
  const type = (params.OptOutType ?? "").toUpperCase();
  if (from && type === "STOP") smsState.optedOut.set(from, { at: new Date().toISOString(), via: `Replied "${(params.Body ?? "STOP").slice(0, 20)}"` });
  if (from && type === "START") smsState.optedOut.delete(from);

  return new Response("<Response></Response>", { headers: { "Content-Type": "text/xml" } });
}
