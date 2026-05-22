import { NextResponse } from "next/server";
import { PAIRS } from "@/lib/symbols";

// Whitelist of permitted CoinGecko ids — derived from the trading pair list
// so the proxy can't be used to fetch arbitrary upstream resources.
const ALLOWED_IDS = new Set(PAIRS.map((p) => p.coingeckoId).filter(Boolean));

// Cache window (seconds). CoinGecko's free tier is rate-limited (~10–30
// rpm) so we serve from the Next data cache for 5 minutes.
const REVALIDATE_SECONDS = 300;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  if (!ALLOWED_IDS.has(id)) {
    return NextResponse.json(
      { error: "Unknown coin id" },
      { status: 400 },
    );
  }

  const url = new URL(`https://api.coingecko.com/api/v3/coins/${id}`);
  url.searchParams.set("localization", "false");
  url.searchParams.set("tickers", "false");
  url.searchParams.set("market_data", "true");
  url.searchParams.set("community_data", "true");
  url.searchParams.set("developer_data", "true");
  url.searchParams.set("sparkline", "true");

  try {
    const upstream = await fetch(url, {
      headers: { Accept: "application/json" },
      next: { revalidate: REVALIDATE_SECONDS, tags: [`coin:${id}`] },
    });
    if (!upstream.ok) {
      return NextResponse.json(
        { error: `Upstream ${upstream.status}` },
        { status: 502 },
      );
    }
    const data = await upstream.json();

    // Slim payload — only the fields the symbol page actually renders.
    const md = data.market_data ?? {};
    const links = data.links ?? {};
    const community = data.community_data ?? {};
    const dev = data.developer_data ?? {};

    const slim = {
      id: data.id,
      symbol: data.symbol,
      name: data.name,
      image: data.image?.large ?? data.image?.small ?? data.image?.thumb ?? "",
      marketCapRank: data.market_cap_rank ?? null,
      categories: (data.categories ?? []).filter(Boolean),
      descriptionEn: data.description?.en ?? "",
      hashingAlgorithm: data.hashing_algorithm ?? null,
      genesisDate: data.genesis_date ?? null,

      market: {
        priceUsd: md.current_price?.usd ?? null,
        marketCapUsd: md.market_cap?.usd ?? null,
        fdvUsd: md.fully_diluted_valuation?.usd ?? null,
        volume24hUsd: md.total_volume?.usd ?? null,
        athUsd: md.ath?.usd ?? null,
        athChangePct: md.ath_change_percentage?.usd ?? null,
        athDate: md.ath_date?.usd ?? null,
        atlUsd: md.atl?.usd ?? null,
        atlChangePct: md.atl_change_percentage?.usd ?? null,
        atlDate: md.atl_date?.usd ?? null,
        circulatingSupply: md.circulating_supply ?? null,
        totalSupply: md.total_supply ?? null,
        maxSupply: md.max_supply ?? null,
        priceChangePct: {
          h1: md.price_change_percentage_1h_in_currency?.usd ?? null,
          h24: md.price_change_percentage_24h_in_currency?.usd ?? null,
          d7: md.price_change_percentage_7d_in_currency?.usd ?? null,
          d14: md.price_change_percentage_14d_in_currency?.usd ?? null,
          d30: md.price_change_percentage_30d_in_currency?.usd ?? null,
          d60: md.price_change_percentage_60d_in_currency?.usd ?? null,
          d200: md.price_change_percentage_200d_in_currency?.usd ?? null,
          y1: md.price_change_percentage_1y_in_currency?.usd ?? null,
        },
        sparkline7d: md.sparkline_7d?.price ?? [],
      },

      sentiment: {
        upPct: data.sentiment_votes_up_percentage ?? null,
        downPct: data.sentiment_votes_down_percentage ?? null,
      },

      community: {
        twitterFollowers: community.twitter_followers ?? null,
        redditSubscribers: community.reddit_subscribers ?? null,
        redditAvgPosts48h: community.reddit_average_posts_48h ?? null,
        redditAvgComments48h: community.reddit_average_comments_48h ?? null,
        redditActiveUsers48h: community.reddit_accounts_active_48h ?? null,
        telegramUserCount: community.telegram_channel_user_count ?? null,
      },

      developer: {
        forks: dev.forks ?? null,
        stars: dev.stars ?? null,
        subscribers: dev.subscribers ?? null,
        totalIssues: dev.total_issues ?? null,
        closedIssues: dev.closed_issues ?? null,
        prsMerged: dev.pull_requests_merged ?? null,
        prContributors: dev.pull_request_contributors ?? null,
        commits4w: dev.commit_count_4_weeks ?? null,
      },

      links: {
        homepage: (links.homepage ?? []).filter(Boolean),
        blockchainSites: (links.blockchain_site ?? []).filter(Boolean),
        forum: (links.official_forum_url ?? []).filter(Boolean),
        chat: (links.chat_url ?? []).filter(Boolean),
        announcement: (links.announcement_url ?? []).filter(Boolean),
        twitter: links.twitter_screen_name ?? "",
        facebook: links.facebook_username ?? "",
        telegram: links.telegram_channel_identifier ?? "",
        subreddit: links.subreddit_url ?? "",
        github: (links.repos_url?.github ?? []).filter(Boolean),
      },
    };

    return NextResponse.json(slim, {
      headers: {
        "Cache-Control": `public, max-age=60, s-maxage=${REVALIDATE_SECONDS}, stale-while-revalidate=600`,
      },
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Fetch failed" },
      { status: 500 },
    );
  }
}
