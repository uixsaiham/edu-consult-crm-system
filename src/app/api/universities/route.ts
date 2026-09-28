// University name search for the course finder. Proxies the free, worldwide Hipolabs universities
// directory (about 10,000 institutions) so the browser gets HTTPS, a small result set and a cache.

interface Hipolabs {
  name: string;
  country: string;
  domains: string[];
  web_pages: string[];
  "state-province": string | null;
}

export interface UniversityOption {
  name: string;
  country: string;
  domain: string;
  website: string;
}

const g = globalThis as typeof globalThis & { __uniCache?: Map<string, { at: number; items: UniversityOption[] }> };
const cache = (g.__uniCache ??= new Map());
const DAY = 86_400_000;

export async function GET(request: Request) {
  const q = (new URL(request.url).searchParams.get("q") ?? "").replace(/\s+/g, " ").trim().slice(0, 80);
  if (q.length < 2) return Response.json({ items: [] });
  const key = q.toLowerCase();
  const hit = cache.get(key);
  if (hit && Date.now() - hit.at < DAY) return Response.json({ items: hit.items });

  try {
    const res = await fetch(`http://universities.hipolabs.com/search?name=${encodeURIComponent(q)}`, { signal: AbortSignal.timeout(8000), cache: "no-store" });
    if (!res.ok) throw new Error(String(res.status));
    const rows = (await res.json()) as Hipolabs[];
    const seen = new Set<string>();
    const items = rows
      .filter((r) => r.name && !seen.has(`${r.name}|${r.country}`) && seen.add(`${r.name}|${r.country}`))
      // Names that start with the query first, then shorter names.
      .sort((a, b) => Number(!a.name.toLowerCase().includes(` ${key}`) && !a.name.toLowerCase().startsWith(key)) - Number(!b.name.toLowerCase().includes(` ${key}`) && !b.name.toLowerCase().startsWith(key)) || a.name.length - b.name.length)
      .slice(0, 25)
      .map<UniversityOption>((r) => ({ name: r.name.trim(), country: r.country, domain: (r.domains[0] ?? "").toLowerCase(), website: (r.web_pages[0] ?? "").replace(/^http:\/\//, "https://") }));
    cache.set(key, { at: Date.now(), items });
    return Response.json({ items });
  } catch {
    return Response.json({ items: [], error: "The universities directory didn't respond — try again, or type the name and search courses anyway." }, { status: 502 });
  }
}
