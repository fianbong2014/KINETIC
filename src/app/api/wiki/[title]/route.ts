import { NextResponse } from "next/server";
import { PAIRS } from "@/lib/symbols";

// Only allow Wikipedia titles we've explicitly mapped from a trading pair.
const ALLOWED = new Set(
  PAIRS.map((p) => p.wikipediaTitle).filter((t): t is string => !!t),
);

const REVALIDATE = 86_400; // Wiki summaries change slowly — 1 day is fine.

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ title: string }> },
) {
  const { title } = await params;
  const decoded = decodeURIComponent(title);
  if (!ALLOWED.has(decoded)) {
    return NextResponse.json(
      { error: "Unknown title" },
      { status: 400 },
    );
  }

  try {
    const res = await fetch(
      `https://en.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(
        decoded,
      )}`,
      {
        headers: { Accept: "application/json" },
        next: { revalidate: REVALIDATE },
      },
    );
    if (!res.ok) {
      return NextResponse.json(
        { error: `Upstream ${res.status}` },
        { status: 502 },
      );
    }
    const data = await res.json();
    return NextResponse.json(
      {
        title: data.title ?? decoded,
        extract: data.extract ?? "",
        thumbnail: data.thumbnail?.source ?? null,
        url:
          data.content_urls?.desktop?.page ??
          `https://en.wikipedia.org/wiki/${encodeURIComponent(decoded)}`,
      },
      {
        headers: {
          "Cache-Control": `public, max-age=3600, s-maxage=${REVALIDATE}`,
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
