-- CreateTable
CREATE TABLE "ExtensionSession" (
    "id" TEXT NOT NULL,
    "jti" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "userAgent" TEXT,
    "label" TEXT,

    CONSTRAINT "ExtensionSession_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "ExtensionSession_jti_key" ON "ExtensionSession"("jti");

-- CreateIndex
CREATE INDEX "ExtensionSession_userId_idx" ON "ExtensionSession"("userId");

-- AddForeignKey
ALTER TABLE "ExtensionSession" ADD CONSTRAINT "ExtensionSession_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;
