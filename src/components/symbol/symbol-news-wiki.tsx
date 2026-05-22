"use client";

import { Newspaper, BookOpen, ExternalLink } from "lucide-react";
import { useNews } from "@/hooks/use-news";
import { useWikipedia } from "@/hooks/use-wikipedia";

function timeAgo(iso: string): string {
  if (!iso) return "";
  const ms = Date.now() - new Date(iso).getTime();
  if (!Number.isFinite(ms) || ms < 0) return "";
  const m = Math.floor(ms / 60000);
  if (m < 1) return "just now";
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export function NewsCard({ keyword }: { keyword: string }) {
  const { items, loading } = useNews(keyword);
  return (
    <section className="bg-surface-container-low p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Newspaper className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Headlines
          </h2>
        </div>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          CoinDesk + CoinTelegraph
        </span>
      </div>
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : items.length === 0 ? (
        <p className="text-xs text-on-surface-variant">
          No recent headlines mentioning &quot;{keyword}&quot;.
        </p>
      ) : (
        <ul className="flex flex-col">
          {items.slice(0, 8).map((it, i) => (
            <li
              key={`${it.link}-${i}`}
              className="border-b border-outline-variant/10 last:border-b-0"
            >
              <a
                href={it.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-start gap-3 py-2.5 hover:bg-surface-container px-1 -mx-1 transition-colors"
              >
                <span className="text-[10px] font-bold uppercase tracking-widest text-cyan shrink-0 w-20 pt-0.5">
                  {it.source}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-xs text-on-surface leading-relaxed line-clamp-2">
                    {it.title}
                  </p>
                  <span className="text-[10px] text-on-surface-variant tracking-wider">
                    {timeAgo(it.publishedAt)}
                  </span>
                </div>
                <ExternalLink className="w-3 h-3 text-on-surface-variant shrink-0 mt-1" />
              </a>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

export function WikipediaCard({ title }: { title: string }) {
  const { data, loading } = useWikipedia(title);

  return (
    <section className="bg-surface-container-low p-5 flex flex-col gap-3">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <BookOpen className="w-4 h-4 text-cyan" />
          <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
            Wikipedia
          </h2>
        </div>
        <span className="text-[10px] text-on-surface-variant uppercase tracking-widest">
          en.wikipedia
        </span>
      </div>
      {loading ? (
        <p className="text-xs text-on-surface-variant">Loading…</p>
      ) : !data || !data.extract ? (
        <p className="text-xs text-on-surface-variant">No summary available.</p>
      ) : (
        <div className="flex gap-3">
          {data.thumbnail && (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={data.thumbnail}
              alt={data.title}
              className="w-20 h-20 object-cover shrink-0"
            />
          )}
          <div className="min-w-0 flex flex-col gap-2">
            <p className="text-xs text-on-surface-variant leading-relaxed">
              {data.extract}
            </p>
            <a
              href={data.url}
              target="_blank"
              rel="noopener noreferrer"
              className="self-start inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-cyan hover:text-on-surface"
            >
              Read on Wikipedia
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </div>
      )}
    </section>
  );
}

export function SymbolNewsWiki({
  newsKeyword,
  wikipediaTitle,
}: {
  newsKeyword?: string;
  wikipediaTitle?: string;
}) {
  if (!newsKeyword && !wikipediaTitle) return null;
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
      {newsKeyword && <NewsCard keyword={newsKeyword} />}
      {wikipediaTitle && <WikipediaCard title={wikipediaTitle} />}
    </div>
  );
}
