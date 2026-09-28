import Anthropic from "@anthropic-ai/sdk";
import { findCourses } from "@/lib/research/agent.server";
import type { FinderEvent, ResearchFocus } from "@/lib/research/types";

// Reading a university's course pages takes a minute or two.
export const maxDuration = 300;

const g = globalThis as typeof globalThis & { __bheFinderRuns?: number[] };
const HOURLY_LIMIT = 40;

/** Whether an API key is configured — the key itself never leaves the server. */
export async function GET() {
  return Response.json({ configured: !!(process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_AUTH_TOKEN) });
}

/** Finds one university's course names and streams progress as newline-delimited JSON. */
export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (origin && new URL(origin).host !== request.headers.get("host")) return Response.json({ error: "Cross-site request refused" }, { status: 403 });
  if (!process.env.ANTHROPIC_API_KEY && !process.env.ANTHROPIC_AUTH_TOKEN) {
    return Response.json({ error: "No Claude API key on the server. Add ANTHROPIC_API_KEY to .env.local and restart." }, { status: 503 });
  }

  const input = (await request.json().catch(() => null)) as { university?: string; country?: string; domain?: string; focus?: ResearchFocus } | null;
  const university = (input?.university ?? "").replace(/\s+/g, " ").trim().slice(0, 150);
  if (university.length < 3) return Response.json({ error: "Choose a university" }, { status: 400 });
  const country = (input?.country ?? "").trim().slice(0, 60);
  const domain = (input?.domain ?? "").trim().toLowerCase().slice(0, 100);
  const focus: ResearchFocus = input?.focus === "Undergraduate" || input?.focus === "Postgraduate" ? input.focus : "All levels";

  // Each run costs API credit, so cap runs per hour until the CRM has sign-in.
  const now = Date.now();
  g.__bheFinderRuns = (g.__bheFinderRuns ?? []).filter((t) => now - t < 3_600_000);
  if (g.__bheFinderRuns.length >= HOURLY_LIMIT) return Response.json({ error: `Limit of ${HOURLY_LIMIT} searches per hour reached` }, { status: 429 });
  g.__bheFinderRuns.push(now);

  const encoder = new TextEncoder();
  const body = new ReadableStream<Uint8Array>({
    async start(controller) {
      const emit = (e: FinderEvent) => {
        try {
          controller.enqueue(encoder.encode(`${JSON.stringify(e)}\n`));
        } catch {
          /* client went away */
        }
      };
      try {
        await findCourses({ university, country, domain, focus, signal: request.signal, emit });
      } catch (err) {
        if (!request.signal.aborted) {
          emit({
            type: "error",
            message:
              err instanceof Anthropic.AuthenticationError ? "The Claude API key was rejected — check ANTHROPIC_API_KEY."
              : err instanceof Anthropic.RateLimitError ? "Claude API rate limit reached — wait a minute and try again."
              : err instanceof Anthropic.APIError ? `Claude API error ${err.status ?? ""}: ${err.message}`
              : "Course search failed unexpectedly.",
          });
        }
      } finally {
        try {
          controller.close();
        } catch {
          /* already closed */
        }
      }
    },
  });
  return new Response(body, { headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store", "X-Accel-Buffering": "no" } });
}
