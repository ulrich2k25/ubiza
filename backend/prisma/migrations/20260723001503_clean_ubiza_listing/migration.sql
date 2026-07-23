/*
  Warnings:

  - The values [SOLD,ARCHIVED] on the enum `ListingStatus` will be removed. If these variants are still used in the database, this will fail.
  - You are about to drop the column `archivedAt` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `currencyId` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `price` on the `Listing` table. All the data in the column will be lost.
  - You are about to drop the column `soldAt` on the `Listing` table. All the data in the column will be lost.

*/
-- AlterEnum
BEGIN;
CREATE TYPE "ListingStatus_new" AS ENUM ('DRAFT', 'PUBLISHED', 'PAUSED', 'REJECTED', 'DELETED');
ALTER TABLE "public"."Listing" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Listing" ALTER COLUMN "status" TYPE "ListingStatus_new" USING ("status"::text::"ListingStatus_new");
ALTER TYPE "ListingStatus" RENAME TO "ListingStatus_old";
ALTER TYPE "ListingStatus_new" RENAME TO "ListingStatus";
DROP TYPE "public"."ListingStatus_old";
ALTER TABLE "Listing" ALTER COLUMN "status" SET DEFAULT 'DRAFT';
COMMIT;

-- DropForeignKey
ALTER TABLE "Listing" DROP CONSTRAINT "Listing_currencyId_fkey";

-- DropIndex
DROP INDEX "Listing_currencyId_idx";

-- DropIndex
DROP INDEX "Listing_price_idx";

-- DropIndex
DROP INDEX "Listing_userId_idx";

-- AlterTable
ALTER TABLE "Listing" DROP COLUMN "archivedAt",
DROP COLUMN "currencyId",
DROP COLUMN "price",
DROP COLUMN "soldAt",
ADD COLUMN     "pausedAt" TIMESTAMP(3),
ALTER COLUMN "availableNow" SET DEFAULT false;
