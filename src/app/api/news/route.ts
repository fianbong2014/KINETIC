import { NextResponse } from "next/server";

// Public crypto news RSS feeds — no key required, both ToS allow personal /
// non-commercial reuse with attribution. We fetch on the server, do a
// regex-based item extraction (avoiding adding an XML parser dep), filter
// by keyword, and serve a slim JSON payload with 5-minute cache.
const FEEDS = [
  { source: "CoinDesk", url: "https://www.coindesk.com/arc/outboundfeeds/rss/?outputType=xml" },
  { source: "CoinTelegraph", url: "https://cointelegraph.com/rss" },
];

const REVALIDATE = 300;

export interface NewsItem {
  source: string;
  title: string;
  link: string;
  publishedAt: string; // ISO
}

function stripCdata(s: string): string {
  return s.replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").trim();
}

function decode(s: string): string {
  return s
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'");
}

function extractItems(xml: string, source: string): NewsItem[] {
  const items: NewsItem[] = [];
  const itemRegex = /<item\b[^>]*>([\s\S]*?)<\/item>/gi;
  let m: RegExpExecArray | null;
  while ((m = itemRegex.exec(xml)) !== null) {
    const block = m[1];
    const title = block.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] ?? "";
    const link = block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] ?? "";
    const pub = block.match(/<pubDate[^>]*>([\s\S]*?)<\/pubDate>/i)?.[1] ?? "";
    const t = decode(stripCdata(title));
    const l = decode(stripCdata(link));
    if (!t || !l) continue;
    const iso = pub ? new Date(stripCdata(pub)).toISOString() : "";
    items.push({ source, title: t, link: l, publishedAt: iso });
  }
  return items;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const keyword = (url.searchParams.get("keyword") || "").toLowerCase().trim();

  try {
    const results = await Promise.all(
      FEEDS.map(async (f) => {
        try {
          const res = await fetch(f.url, {
            headers: { Accept: "application/rss+xml, application/xml" },
            next: { revalidate: REVALIDATE },
          });
          if (!res.ok) return [] as NewsItem[];
          const xml = await res.text();
          return extractItems(xml, f.source);
        } catch {
          return [] as NewsItem[];
        }
      }),
    );

    let merged = results.flat();
    if (keyword) {
      merged = merged.filter((i) =>
        i.title.toLowerCase().includes(keyword),
      );
    }
    // Sort by publishedAt desc, then cap.
    merged.sort((a, b) =>
      (b.publishedAt || "").localeCompare(a.publishedAt || ""),
    );
    merged = merged.slice(0, 12);

    return NextResponse.json(
      { items: merged },
      {
        headers: {
          "Cache-Control": `public, max-age=60, s-maxage=${REVALIDATE}`,
        },
      },
    );
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fetch failed" },
      { status: 500 },
    );
  }
}
