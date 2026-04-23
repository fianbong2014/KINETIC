-- CreateTable
CREATE TABLE "CustomIndicator" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "expression" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#00ffff',
    "overlay" BOOLEAN NOT NULL DEFAULT true,
    "enabled" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomIndicator_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "CustomIndicator_userId_idx" ON "CustomIndicator"("userId");

-- AddForeignKey
ALTER TABLE "CustomIndicator" ADD CONSTRAINT "CustomIndicator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
