import { NextRequest, NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getAuthenticatedUser } from "@/lib/auth-helpers";
import { getPair, isLiveTradable } from "@/lib/symbols";
import {
  resolveOkxCredentials,
  CredentialError,
} from "@/lib/exchange/credentials";
import {
  getAccountConfig,
  getSwapInstrument,
  baseSizeToContracts,
  setLeverage,
  placeMarketSwapOrder,
  OkxApiError,
} from "@/lib/exchange/okx";

export async function GET(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  const status = request.nextUrl.searchParams.get("status");

  const positions = await db.position.findMany({
    where: {
      userId: user!.id,
      ...(status ? { status } : {}),
    },
    orderBy: { openedAt: "desc" },
  });

  return NextResponse.json(positions);
}

export async function POST(request: NextRequest) {
  const { user, error } = await getAuthenticatedUser();
  if (error) return error;

  try {
    const {
      asset,
      side,
      size,
      entry,
      stopLoss,
      takeProfit,
      trailingDistance,
      botId,
      mode: rawMode,
      leverage,
      marginMode,
    } = await request.json();

    if (!asset || !side || !size || !entry) {
      return NextResponse.json(
        { error: "asset, side, size, and entry are required" },
        { status: 400 }
      );
    }

    if (side !== "LONG" && side !== "SHORT") {
      return NextResponse.json(
        { error: "side must be LONG or SHORT" },
        { status: 400 }
      );
    }

    const mode = rawMode === "live" ? "live" : "paper";

    // If botId provided, verify it belongs to this user before tagging
    let validatedBotId: string | null = null;
    if (botId) {
      const bot = await db.tradingBot.findFirst({
        where: { id: String(botId), userId: user!.id },
        select: { id: true },
      });
      if (bot) validatedBotId = bot.id;
    }

    // ── LIVE: place a real OKX perpetual market order first. We only
    //    persist the Position row if the exchange accepted the order,
    //    so the DB never shows a live position that doesn't exist on
    //    OKX. (Close-side / SL-TP reconciliation is Phase 3.)
    let exchange: string | null = null;
    let exchangeOrderId: string | null = null;

    if (mode === "live") {
      if (!isLiveTradable(asset)) {
        return NextResponse.json(
          { error: `${asset} is not available for live trading on OKX` },
          { status: 400 }
        );
      }

      const pair = getPair(asset);
      const instId = pair.okxSwap;

      try {
        const creds = await resolveOkxCredentials(user!.id, {
          requireTradeEnabled: true,
        });

        const lev =
          Number.isFinite(leverage) && leverage > 0
            ? Math.min(Math.floor(leverage), 125)
            : 3;
        const mgnMode: "isolated" | "cross" =
          marginMode === "cross" ? "cross" : "isolated";

        // posSide is only valid in long_short (hedge) mode
        const config = await getAccountConfig(creds);
        const hedgeMode = config.posMode === "long_short_mode";

        const inst = await getSwapInstrument(creds, instId);
        const contracts = baseSizeToContracts(Number(size), inst);

        // Best-effort leverage set; ignore "already set" style errors
        try {
          await setLeverage(creds, {
            instId,
            lever: lev,
            mgnMode,
            posSide: hedgeMode
              ? side === "LONG"
                ? "long"
                : "short"
              : undefined,
          });
        } catch (e) {
          if (!(e instanceof OkxApiError)) throw e;
          // continue — leverage may already be configured
        }

        const order = await placeMarketSwapOrder(creds, {
          instId,
          side,
          contracts,
          tdMode: mgnMode,
          hedgeMode,
        });

        exchange = "okx";
        exchangeOrderId = order.ordId;
      } catch (e) {
        if (e instanceof CredentialError) {
          return NextResponse.json(
            { error: e.message },
            { status: e.httpStatus }
          );
        }
        if (e instanceof OkxApiError) {
          return NextResponse.json(
            { error: `OKX: ${e.message}` },
            { status: 502 }
          );
        }
        return NextResponse.json(
          {
            error:
              e instanceof Error
                ? e.message
                : "Failed to place live OKX order",
          },
          { status: 500 }
        );
      }
    }

    const position = await db.position.create({
      data: {
        userId: user!.id,
        botId: validatedBotId,
        asset,
        side,
        size,
        entry,
        stopLoss: stopLoss ?? null,
        takeProfit: takeProfit ?? null,
        trailingDistance:
          typeof trailingDistance === "number" && trailingDistance > 0
            ? trailingDistance
            : null,
        trailingHighWater:
          typeof trailingDistance === "number" && trailingDistance > 0
            ? entry
            : null,
        mode,
        exchange,
        exchangeOrderId,
      },
    });

    return NextResponse.json(position, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Failed to create position" },
      { status: 500 }
    );
  }
}
