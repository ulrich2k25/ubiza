-- AlterTable
ALTER TABLE "Ambassador" ADD COLUMN     "country" TEXT,
ADD COLUMN     "fullName" TEXT,
ADD COLUMN     "identityNumber" TEXT,
ADD COLUMN     "mobileMoneyNumber" TEXT,
ADD COLUMN     "rejectedAt" TIMESTAMP(3),
ADD COLUMN     "rejectionReason" TEXT,
ADD COLUMN     "termsAcceptedAt" TIMESTAMP(3);
