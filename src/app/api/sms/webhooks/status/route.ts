import type { SmsStatus } from "@/lib/sms/rules";
import { smsConfig, smsState, validSignature } from "@/lib/sms/twilio.server";

/** Twilio delivery receipts (queued → sent → delivered / undelivered / failed). */
export async function POST(request: Request) {
  const params = Object.fromEntries((await request.formData()).entries()) as Record<string, string>;
  const { publicBaseUrl } = smsConfig();
  const url = publicBaseUrl ? `${publicBaseUrl}${new URL(request.url).pathname}` : request.url;
  if (!validSignature(url, params, request.headers.get("x-twilio-signature"))) return new Response("Invalid signature", { status: 403 });

  if (params.MessageSid && params.MessageStatus) {
    smsState.statuses.set(params.MessageSid, { status: params.MessageStatus as SmsStatus, errorCode: params.ErrorCode || undefined, at: new Date().toISOString() });
  }
  return new Response(null, { status: 204 });
}
