-- CreateTable
CREATE TABLE "FridgeItem" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "normalizedName" TEXT NOT NULL,
    "quantity" INTEGER NOT NULL,
    "unit" TEXT,
    "unitFactor" INTEGER,
    "source" TEXT NOT NULL DEFAULT 'metro',
    "syncedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "FridgeItem_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FridgeItem_userId_idx" ON "FridgeItem"("userId");

-- CreateIndex
CREATE INDEX "FridgeItem_userId_normalizedName_idx" ON "FridgeItem"("userId", "normalizedName");

-- AddForeignKey
ALTER TABLE "FridgeItem" ADD CONSTRAINT "FridgeItem_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
