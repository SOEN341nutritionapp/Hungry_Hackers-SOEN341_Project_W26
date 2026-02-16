-- AlterTable
ALTER TABLE "Recipe" ADD COLUMN     "dietaryTags" TEXT[] DEFAULT ARRAY[]::TEXT[];
