-- AlterTable
ALTER TABLE "Position" ADD COLUMN     "exchange" TEXT,
ADD COLUMN     "exchangeAlgoId" TEXT,
ADD COLUMN     "exchangeOrderId" TEXT,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'paper';

-- AlterTable
ALTER TABLE "TradingBot" ADD COLUMN     "exchange" TEXT,
ADD COLUMN     "leverage" INTEGER,
ADD COLUMN     "marginMode" TEXT,
ADD COLUMN     "mode" TEXT NOT NULL DEFAULT 'paper';

-- CreateTable
CREATE TABLE "ExchangeCredential" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "exchange" TEXT NOT NULL,
    "label" TEXT,
    "apiKeyCipher" TEXT NOT NULL,
    "apiKeyIv" TEXT NOT NULL,
    "apiKeyTag" TEXT NOT NULL,
    "apiSecretCipher" TEXT NOT NULL,
    "apiSecretIv" TEXT NOT NULL,
    "apiSecretTag" TEXT NOT NULL,
    "passphraseCipher" TEXT,
    "passphraseIv" TEXT,
    "passphraseTag" TEXT,
    "apiKeyHint" TEXT,
    "tradeEnabled" BOOLEAN NOT NULL DEFAULT false,
    "lastTestedAt" TIMESTAMP(3),
    "lastTestOk" BOOLEAN,
    "lastTestError" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ExchangeCredential_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeCredential_userId_exchange_key" ON "ExchangeCredential"("userId", "exchange");

-- AddForeignKey
ALTER TABLE "ExchangeCredential" ADD CONSTRAINT "ExchangeCredential_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
