import { toE164 } from "@/lib/sms/rules";
import { smsState } from "@/lib/sms/twilio.server";

/** Which of the given numbers have texted STOP (recorded from Twilio's inbound webhook). */
export async function POST(request: Request) {
  const input = (await request.json().catch(() => null)) as { numbers?: string[] } | null;
  const numbers = (input?.numbers ?? []).slice(0, 2000).map(toE164).filter(Boolean);
  return Response.json({ optedOut: numbers.filter((n) => smsState.optedOut.has(n)).map((n) => ({ number: n, ...smsState.optedOut.get(n) })) });
}
