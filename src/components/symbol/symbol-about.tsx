"use client";

import { useState } from "react";
import {
  Info,
  Users,
  Code2,
  GitBranch,
  ThumbsUp,
  ThumbsDown,
  ExternalLink,
  Globe,
  Hash,
  MessageCircle,
} from "lucide-react";
import type { CoinInfo } from "@/hooks/use-coin-info";

function compactNum(n: number | null): string {
  if (n === null || !Number.isFinite(n)) return "—";
  const abs = Math.abs(n);
  if (abs >= 1e9) return `${(n / 1e9).toFixed(2)}B`;
  if (abs >= 1e6) return `${(n / 1e6).toFixed(2)}M`;
  if (abs >= 1e3) return `${(n / 1e3).toFixed(1)}K`;
  return n.toLocaleString("en-US", { maximumFractionDigits: 0 });
}

function stripHtml(html: string): string {
  // Remove <a href="...">…</a> tags but keep their text. Keep newlines.
  return html
    .replace(/<a [^>]*>(.*?)<\/a>/gi, "$1")
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<[^>]+>/g, "")
    .trim();
}

function Section({
  icon: Icon,
  title,
  children,
}: {
  icon: typeof Info;
  title: string;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-surface-container-low p-5 flex flex-col gap-3">
      <div className="flex items-center gap-2">
        <Icon className="w-4 h-4 text-cyan" />
        <h2 className="font-heading text-sm font-bold tracking-widest uppercase text-on-surface">
          {title}
        </h2>
      </div>
      {children}
    </section>
  );
}

function StatRow({
  label,
  value,
}: {
  label: string;
  value: React.ReactNode;
}) {
  return (
    <div className="bg-surface-container px-3 py-2 flex items-center justify-between">
      <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
        {label}
      </span>
      <span className="text-xs text-on-surface font-mono tabular-nums">
        {value}
      </span>
    </div>
  );
}

function LinkPill({
  href,
  icon: Icon,
  label,
}: {
  href: string;
  icon: typeof Globe;
  label: string;
}) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="inline-flex items-center gap-2 bg-surface-container hover:bg-surface-container-high text-on-surface px-3 py-2 text-xs transition-colors"
    >
      <Icon className="w-3.5 h-3.5 text-cyan" />
      <span className="truncate max-w-[180px]">{label}</span>
      <ExternalLink className="w-3 h-3 text-on-surface-variant" />
    </a>
  );
}

function shortenUrl(url: string): string {
  try {
    const u = new URL(url);
    return u.hostname.replace(/^www\./, "") + (u.pathname === "/" ? "" : u.pathname);
  } catch {
    return url;
  }
}

// ─── Sub-cards exposed for fine-grained composition ───────────────────

export function AboutCard({ coin }: { coin: CoinInfo }) {
  const [expanded, setExpanded] = useState(false);
  const description = stripHtml(coin.descriptionEn || "");
  const desc =
    expanded || description.length <= 420
      ? description
      : description.slice(0, 420).replace(/\s+\S*$/, "") + "…";
  return (
    <Section icon={Info} title={`About ${coin.name}`}>
      {description ? (
        <>
          <p className="text-xs leading-relaxed text-on-surface-variant whitespace-pre-wrap">
            {desc}
          </p>
          {description.length > 420 && (
            <button
              onClick={() => setExpanded((v) => !v)}
              className="text-[10px] font-bold uppercase tracking-widest text-cyan hover:text-on-surface self-start"
            >
              {expanded ? "Show less" : "Read more"}
            </button>
          )}
        </>
      ) : (
        <p className="text-xs text-on-surface-variant">
          No description available.
        </p>
      )}
      {coin.categories.length > 0 && (
        <div className="flex flex-wrap gap-1.5 pt-1">
          {coin.categories.slice(0, 8).map((cat) => (
            <span
              key={cat}
              className="text-[10px] tracking-wider uppercase font-bold text-on-surface-variant bg-surface-container px-2 py-1"
            >
              {cat}
            </span>
          ))}
        </div>
      )}
      {(coin.hashingAlgorithm || coin.genesisDate) && (
        <div className="grid grid-cols-2 gap-2 pt-1">
          {coin.hashingAlgorithm && (
            <StatRow label="Algorithm" value={coin.hashingAlgorithm} />
          )}
          {coin.genesisDate && (
            <StatRow label="Genesis" value={coin.genesisDate} />
          )}
        </div>
      )}
    </Section>
  );
}

export function CommunityCard({ coin }: { coin: CoinInfo }) {
  const sentimentUp = coin.sentiment.upPct ?? null;
  const sentimentDown = coin.sentiment.downPct ?? null;
  return (
    <Section icon={Users} title="Community">
      {sentimentUp !== null && sentimentDown !== null && (
        <div className="bg-surface-container p-3 flex flex-col gap-2">
          <span className="text-[10px] font-bold uppercase tracking-widest text-on-surface-variant">
            Sentiment (CoinGecko votes)
          </span>
          <div className="flex h-2 overflow-hidden">
            <div
              className="bg-emerald-accent"
              style={{ width: `${sentimentUp}%` }}
            />
            <div
              className="bg-crimson"
              style={{ width: `${sentimentDown}%` }}
            />
          </div>
          <div className="flex items-center justify-between text-[10px] font-mono tabular-nums">
            <span className="text-emerald-accent flex items-center gap-1">
              <ThumbsUp className="w-3 h-3" />
              {sentimentUp.toFixed(1)}%
            </span>
            <span className="text-crimson flex items-center gap-1">
              {sentimentDown.toFixed(1)}%
              <ThumbsDown className="w-3 h-3" />
            </span>
          </div>
        </div>
      )}
      <div className="grid grid-cols-2 gap-2">
        <StatRow label="Twitter" value={compactNum(coin.community.twitterFollowers)} />
        <StatRow
          label="Reddit Subs"
          value={compactNum(coin.community.redditSubscribers)}
        />
        <StatRow
          label="Reddit Active 48h"
          value={compactNum(coin.community.redditActiveUsers48h)}
        />
        <StatRow label="Telegram" value={compactNum(coin.community.telegramUserCount)} />
      </div>
    </Section>
  );
}

export function DeveloperCard({ coin }: { coin: CoinInfo }) {
  return (
    <Section icon={Code2} title="Developer Activity">
      <div className="grid grid-cols-2 gap-2">
        <StatRow label="GitHub Stars" value={compactNum(coin.developer.stars)} />
        <StatRow label="Forks" value={compactNum(coin.developer.forks)} />
        <StatRow label="Commits (4w)" value={compactNum(coin.developer.commits4w)} />
        <StatRow label="PRs Merged" value={compactNum(coin.developer.prsMerged)} />
        <StatRow
          label="Contributors"
          value={compactNum(coin.developer.prContributors)}
        />
        <StatRow
          label="Open Issues"
          value={compactNum(
            coin.developer.totalIssues !== null &&
              coin.developer.closedIssues !== null
              ? coin.developer.totalIssues - coin.developer.closedIssues
              : null,
          )}
        />
      </div>
    </Section>
  );
}

export function ResourcesCard({ coin }: { coin: CoinInfo }) {
  return (
    <Section icon={ExternalLink} title="Resources">
      <div className="flex flex-wrap gap-2">
        {coin.links.homepage.slice(0, 2).map((url) => (
          <LinkPill key={url} href={url} icon={Globe} label={shortenUrl(url)} />
        ))}
        {coin.links.twitter && (
          <LinkPill
            href={`https://twitter.com/${coin.links.twitter}`}
            icon={Hash}
            label={`@${coin.links.twitter}`}
          />
        )}
        {coin.links.subreddit && (
          <LinkPill
            href={coin.links.subreddit}
            icon={MessageCircle}
            label={shortenUrl(coin.links.subreddit)}
          />
        )}
        {coin.links.github.slice(0, 2).map((url) => (
          <LinkPill
            key={url}
            href={url}
            icon={GitBranch}
            label={shortenUrl(url)}
          />
        ))}
        {coin.links.blockchainSites.slice(0, 3).map((url) => (
          <LinkPill
            key={url}
            href={url}
            icon={ExternalLink}
            label={shortenUrl(url)}
          />
        ))}
      </div>
    </Section>
  );
}

// Composite — used by the three-panel workspace.
export function SymbolAbout({
  coin,
  loading,
}: {
  coin: CoinInfo | null;
  loading: boolean;
}) {
  if (loading && !coin) {
    return (
      <section className="bg-surface-container-low p-5">
        <span className="text-[10px] text-on-surface-variant tracking-widest uppercase">
          Loading…
        </span>
      </section>
    );
  }
  if (!coin) return null;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-3 lg:gap-6">
      <AboutCard coin={coin} />
      <CommunityCard coin={coin} />
      <DeveloperCard coin={coin} />
      <ResourcesCard coin={coin} />
    </div>
  );
}
