-- AlterTable
ALTER TABLE "Listing" ADD COLUMN     "boostActiveUntil" TIMESTAMP(3);

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "referralRewardGrantedAt" TIMESTAMP(3);
