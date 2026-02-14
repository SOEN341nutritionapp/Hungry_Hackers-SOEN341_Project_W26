-- AlterTable
ALTER TABLE "User" ADD COLUMN     "allergies" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "dateOfBirth" TIMESTAMP(3),
ADD COLUMN     "dietaryPreferences" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "heightCm" INTEGER,
ADD COLUMN     "sex" TEXT,
ADD COLUMN     "weightKg" INTEGER;
