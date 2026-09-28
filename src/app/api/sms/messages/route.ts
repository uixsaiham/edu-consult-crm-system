import { finalStatuses } from "@/lib/sms/rules";
import { fetchMessage, smsConfig, smsState } from "@/lib/sms/twilio.server";

/** Latest delivery status for up to 50 message SIDs — from webhooks when they've arrived, else asked of Twilio. */
export async function GET(request: Request) {
  const sids = (new URL(request.url).searchParams.get("sids") ?? "").split(",").filter(Boolean).slice(0, 50);
  const cfg = smsConfig();
  const out = await Promise.all(
    sids.map(async (sid) => {
      const known = smsState.statuses.get(sid);
      if ((known && finalStatuses.includes(known.status)) || !cfg.configured) return { sid, ...known };
      try {
        const m = await fetchMessage(sid);
        smsState.statuses.set(sid, { status: m.status, errorCode: m.errorCode, at: new Date().toISOString() });
        return { sid, status: m.status, errorCode: m.errorCode, price: m.price };
      } catch {
        return { sid, ...known };
      }
    })
  );
  return Response.json({ messages: out });
}
