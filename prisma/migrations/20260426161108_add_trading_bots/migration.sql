-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "botId" TEXT;

-- CreateTable
CREATE TABLE "TradingBot" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "symbols" TEXT[] DEFAULT ARRAY[]::TEXT[],
    "triggerType" TEXT NOT NULL DEFAULT 'mtf_aligned',
    "tfFilter" TEXT NOT NULL DEFAULT '4h',
    "minConfidence" INTEGER NOT NULL DEFAULT 70,
    "side" TEXT NOT NULL DEFAULT 'ANY',
    "positionSizePct" DOUBLE PRECISION NOT NULL DEFAULT 5,
    "stopLossPct" DOUBLE PRECISION,
    "takeProfitPct" DOUBLE PRECISION,
    "trailingPct" DOUBLE PRECISION,
    "maxOpenPositions" INTEGER NOT NULL DEFAULT 1,
    "cooldownMinutes" INTEGER NOT NULL DEFAULT 60,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "lastRunAt" TIMESTAMP(3),
    "lastTradeAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TradingBot_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TradingBot_userId_enabled_idx" ON "TradingBot"("userId", "enabled");

-- CreateIndex
CREATE INDEX "Position_botId_idx" ON "Position"("botId");

-- AddForeignKey
ALTER TABLE "Position" ADD CONSTRAINT "Position_botId_fkey" FOREIGN KEY ("botId") REFERENCES "TradingBot"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TradingBot" ADD CONSTRAINT "TradingBot_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
