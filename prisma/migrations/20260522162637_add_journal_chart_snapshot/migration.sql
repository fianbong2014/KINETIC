-- AlterTable
ALTER TABLE "JournalEntry" ADD COLUMN     "chartSnapshot" TEXT,
ADD COLUMN     "chartSnapshotMeta" JSONB;
