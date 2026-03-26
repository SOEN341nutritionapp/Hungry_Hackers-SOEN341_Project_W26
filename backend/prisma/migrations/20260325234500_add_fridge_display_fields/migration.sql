-- AlterTable
ALTER TABLE "FridgeItem"
ADD COLUMN "rawName" TEXT,
ADD COLUMN "sizeLabel" TEXT,
ADD COLUMN "imageUrl" TEXT;

-- Backfill raw names for existing rows
UPDATE "FridgeItem"
SET "rawName" = "name"
WHERE "rawName" IS NULL;

-- AlterTable
ALTER TABLE "FridgeItem"
ALTER COLUMN "rawName" SET NOT NULL;
