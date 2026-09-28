import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { courseListSchema, sanitizeCourses, type FinderEvent, type ResearchFocus } from "./types";

// Course finder agent. Claude searches the university's own website with Anthropic's server-side
// web tools and returns course names through one client tool. Progress is emitted as it happens.

const MODEL = "claude-opus-5";
const RECORD_TOOL = "record_courses";
const MAX_CONTINUATIONS = 6;

const SYSTEM = `You find the courses a university currently offers, for BHE Uni, an education consultancy.

Use the university's official website only: its course finder, A–Z course list or subject pages. List course titles exactly as the university writes them, including the award (e.g. "MSc Data Science", "BA (Hons) Business Management"). Only include courses open for upcoming intakes. Don't invent titles; if a list is paginated, read enough pages to cover it.

When done, call ${RECORD_TOOL} once with the course names, their levels and the page URLs you used. Don't write the list out as text.`;

export interface FinderOptions {
  university: string;
  country: string;
  domain: string;
  focus: ResearchFocus;
  signal: AbortSignal;
  emit: (e: FinderEvent) => void;
}

export async function findCourses({ university, country, domain, focus, signal, emit }: FinderOptions) {
  const client = new Anthropic();
  // Keep the agent on the university's own site when we know its domain.
  const scope = /^[a-z0-9.-]+\.[a-z]{2,}$/.test(domain) ? { allowed_domains: [domain] } : {};
  const tools: Anthropic.Beta.BetaToolUnion[] = [
    { type: "web_search_20260209", name: "web_search", max_uses: 6, ...scope },
    { type: "web_fetch_20260209", name: "web_fetch", max_uses: 10, max_content_tokens: 40000, ...scope },
    {
      name: RECORD_TOOL,
      description: "Save the university's course names to the CRM. Call once at the end.",
      input_schema: courseListSchema as unknown as Anthropic.Beta.BetaTool.InputSchema,
      eager_input_streaming: true,
    },
  ];
  const levelText = focus === "All levels" ? "all levels (foundation, undergraduate, postgraduate, research)" : `${focus.toLowerCase()} level only`;
  const messages: Anthropic.Beta.BetaMessageParam[] = [
    { role: "user", content: `University: ${university}${country ? ` (${country})` : ""}${domain ? `\nOfficial website: ${domain}` : ""}\n\nList its courses at ${levelText}.` },
  ];

  let nudged = false;
  emit({ type: "status", message: `Looking at ${domain || university}` });

  for (let turn = 0; turn <= MAX_CONTINUATIONS; turn++) {
    const stream = client.beta.messages.stream(
      { model: MODEL, max_tokens: 64000, system: SYSTEM, tools, messages, betas: ["server-side-fallback-2026-07-01"], fallbacks: "default" },
      { signal }
    );
    stream.on("contentBlock", (block) => {
      if (block.type !== "server_tool_use") return;
      const input = block.input as { query?: string; url?: string };
      if (block.name === "web_search" && input.query) emit({ type: "search", query: input.query });
      if (block.name === "web_fetch" && input.url) emit({ type: "fetch", url: input.url });
    });

    let message: Anthropic.Beta.BetaMessage;
    try {
      message = await stream.finalMessage();
    } catch (err) {
      // An unparseable tool input rejects finalMessage; retry the turn. API errors go to the caller.
      if (err instanceof Anthropic.APIError || turn >= MAX_CONTINUATIONS) throw err;
      continue;
    }

    if (message.stop_reason === "refusal") return emit({ type: "error", message: "The model declined this request." });

    const record = message.content.find((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use" && b.name === RECORD_TOOL);
    if (record) {
      if (message.stop_reason === "max_tokens") return emit({ type: "error", message: "The list was cut off — try one level at a time." });
      const { courses, sources } = sanitizeCourses(record.input);
      if (!courses.length) return emit({ type: "error", message: "No courses were found on the university's website." });
      return emit({ type: "result", courses, sources });
    }
    if (message.stop_reason === "pause_turn") {
      messages.push({ role: "assistant", content: message.content });
      continue;
    }
    if (!nudged) {
      nudged = true;
      messages.push({ role: "assistant", content: message.content });
      messages.push({ role: "user", content: `Please call ${RECORD_TOOL} now with the courses you found.` });
      continue;
    }
    return emit({ type: "error", message: "The agent finished without returning any courses." });
  }
  emit({ type: "error", message: "The search took too many steps and was stopped." });
}
