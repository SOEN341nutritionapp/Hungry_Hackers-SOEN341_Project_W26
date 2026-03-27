ALTER TABLE "FridgeItem"
ADD COLUMN "availableAmount" DOUBLE PRECISION NOT NULL DEFAULT 0;

ALTER TABLE "FridgeItem"
ALTER COLUMN "unitFactor" TYPE DOUBLE PRECISION;

UPDATE "FridgeItem"
SET "availableAmount" = CASE
  WHEN "unitFactor" IS NOT NULL AND "unitFactor" > 0 THEN "quantity"::DOUBLE PRECISION * "unitFactor"::DOUBLE PRECISION
  ELSE "quantity"::DOUBLE PRECISION
END;

WITH duplicates AS (
  SELECT
    "userId",
    "normalizedName",
    "source",
    MIN("id") AS keep_id,
    SUM("quantity") AS total_quantity,
    SUM("availableAmount") AS total_available_amount
  FROM "FridgeItem"
  GROUP BY "userId", "normalizedName", "source"
  HAVING COUNT(*) > 1
)
UPDATE "FridgeItem" AS target
SET
  "quantity" = duplicates.total_quantity,
  "availableAmount" = duplicates.total_available_amount
FROM duplicates
WHERE target."id" = duplicates.keep_id;

WITH duplicates AS (
  SELECT
    "userId",
    "normalizedName",
    "source",
    MIN("id") AS keep_id
  FROM "FridgeItem"
  GROUP BY "userId", "normalizedName", "source"
  HAVING COUNT(*) > 1
)
DELETE FROM "FridgeItem" AS target
USING duplicates
WHERE target."userId" = duplicates."userId"
  AND target."normalizedName" = duplicates."normalizedName"
  AND target."source" = duplicates."source"
  AND target."id" <> duplicates.keep_id;

CREATE TABLE "FridgeSyncState" (
  "id" TEXT NOT NULL,
  "userId" TEXT NOT NULL,
  "source" TEXT NOT NULL,
  "normalizedName" TEXT NOT NULL,
  "lastSyncedQuantity" INTEGER NOT NULL DEFAULT 0,
  "updatedAt" TIMESTAMP(3) NOT NULL,

  CONSTRAINT "FridgeSyncState_pkey" PRIMARY KEY ("id")
);

CREATE TABLE "MealPlanConsumption" (
  "id" TEXT NOT NULL,
  "mealPlanId" TEXT NOT NULL,
  "fridgeItemId" TEXT,
  "ingredientName" TEXT NOT NULL,
  "amountConsumed" DOUBLE PRECISION NOT NULL,
  "unit" TEXT NOT NULL,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

  CONSTRAINT "MealPlanConsumption_pkey" PRIMARY KEY ("id")
);

INSERT INTO "FridgeSyncState" ("id", "userId", "source", "normalizedName", "lastSyncedQuantity", "updatedAt")
SELECT
  md5(random()::TEXT || clock_timestamp()::TEXT || "userId" || "normalizedName" || "source"),
  "userId",
  "source",
  "normalizedName",
  "quantity",
  NOW()
FROM "FridgeItem";

CREATE UNIQUE INDEX "FridgeItem_userId_normalizedName_source_key"
ON "FridgeItem"("userId", "normalizedName", "source");

CREATE UNIQUE INDEX "FridgeSyncState_userId_source_normalizedName_key"
ON "FridgeSyncState"("userId", "source", "normalizedName");

CREATE INDEX "FridgeSyncState_userId_source_idx"
ON "FridgeSyncState"("userId", "source");

CREATE INDEX "MealPlanConsumption_mealPlanId_idx"
ON "MealPlanConsumption"("mealPlanId");

CREATE INDEX "MealPlanConsumption_fridgeItemId_idx"
ON "MealPlanConsumption"("fridgeItemId");

ALTER TABLE "FridgeSyncState"
ADD CONSTRAINT "FridgeSyncState_userId_fkey"
FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MealPlanConsumption"
ADD CONSTRAINT "MealPlanConsumption_mealPlanId_fkey"
FOREIGN KEY ("mealPlanId") REFERENCES "MealPlan"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "MealPlanConsumption"
ADD CONSTRAINT "MealPlanConsumption_fridgeItemId_fkey"
FOREIGN KEY ("fridgeItemId") REFERENCES "FridgeItem"("id") ON DELETE SET NULL ON UPDATE CASCADE;
