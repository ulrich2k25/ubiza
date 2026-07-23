-- CreateEnum
CREATE TYPE "TrustLevel" AS ENUM ('NEW', 'BASIC', 'TRUSTED', 'RESTRICTED');

-- CreateEnum
CREATE TYPE "ContactAccessStatus" AS ENUM ('GRANTED', 'DENIED', 'BLOCKED');

-- CreateEnum
CREATE TYPE "ContactMethod" AS ENUM ('PHONE', 'WHATSAPP', 'TELEGRAM', 'INSTAGRAM');

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "acceptedRulesAt" TIMESTAMP(3),
ADD COLUMN     "contactAccessEnabled" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "phoneVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "trustLevel" "TrustLevel" NOT NULL DEFAULT 'NEW',
ADD COLUMN     "trustScore" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "trustUpdatedAt" TIMESTAMP(3);

-- CreateTable
CREATE TABLE "ContactAccess" (
    "id" TEXT NOT NULL,
    "requesterId" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "method" "ContactMethod" NOT NULL,
    "status" "ContactAccessStatus" NOT NULL DEFAULT 'GRANTED',
    "trustScoreSnapshot" INTEGER NOT NULL,
    "trustLevelSnapshot" "TrustLevel" NOT NULL,
    "denialReason" TEXT,
    "grantedAt" TIMESTAMP(3),
    "deniedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ContactAccess_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ContactAccess_requesterId_idx" ON "ContactAccess"("requesterId");

-- CreateIndex
CREATE INDEX "ContactAccess_listingId_idx" ON "ContactAccess"("listingId");

-- CreateIndex
CREATE INDEX "ContactAccess_status_idx" ON "ContactAccess"("status");

-- CreateIndex
CREATE INDEX "ContactAccess_createdAt_idx" ON "ContactAccess"("createdAt");

-- CreateIndex
CREATE INDEX "User_trustLevel_idx" ON "User"("trustLevel");

-- CreateIndex
CREATE INDEX "User_trustScore_idx" ON "User"("trustScore");

-- CreateIndex
CREATE INDEX "User_contactAccessEnabled_idx" ON "User"("contactAccessEnabled");

-- AddForeignKey
ALTER TABLE "ContactAccess" ADD CONSTRAINT "ContactAccess_requesterId_fkey" FOREIGN KEY ("requesterId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ContactAccess" ADD CONSTRAINT "ContactAccess_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
