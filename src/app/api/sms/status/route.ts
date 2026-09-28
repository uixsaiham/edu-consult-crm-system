import { mask, maskPhone, reviewAccount, smsConfig } from "@/lib/sms/twilio.server";

/** Connection state for the CRM screens. `?review=1` adds a read-only review of the Twilio account. */
export async function GET(request: Request) {
  const cfg = smsConfig();
  const summary = {
    configured: cfg.configured,
    missing: cfg.missing,
    mode: cfg.mode,
    account: mask(cfg.accountSid),
    usingApiKey: !cfg.auth.startsWith(cfg.accountSid),
    serviceSid: mask(cfg.serviceSid),
    marketingSid: mask(cfg.marketingSid),
    allowlist: cfg.allowlist.map(maskPhone),
    webhooks: { signing: !!cfg.authToken, publicUrl: !!cfg.publicBaseUrl },
  };
  if (!cfg.configured || new URL(request.url).searchParams.get("review") !== "1") return Response.json(summary);
  // Account details (balance, numbers) stay local until the CRM has sign-in.
  if (process.env.NODE_ENV === "production") return Response.json({ ...summary, reviewError: "Account review is only available when running locally until CRM sign-in is in place" });
  try {
    return Response.json({ ...summary, review: await reviewAccount() });
  } catch (e) {
    return Response.json({ ...summary, reviewError: (e as Error).message });
  }
}
