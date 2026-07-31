/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `Commission` will be added. If there are existing duplicate values, this will fail.

*/
-- AlterTable
ALTER TABLE "Ambassador" ADD COLUMN     "identityVerifiedAt" TIMESTAMP(3),
ADD COLUMN     "minimumPayout" DECIMAL(12,2) NOT NULL DEFAULT 5000;

-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "paymentId" TEXT;

-- AlterTable
ALTER TABLE "Referral" ADD COLUMN     "firstPurchaseRewardGranted" BOOLEAN NOT NULL DEFAULT false,
ADD COLUMN     "firstPurchaseRewardGrantedAt" TIMESTAMP(3);

-- CreateIndex
CREATE UNIQUE INDEX "Commission_paymentId_key" ON "Commission"("paymentId");

-- CreateIndex
CREATE INDEX "Referral_firstPurchaseRewardGranted_idx" ON "Referral"("firstPurchaseRewardGranted");

-- AddForeignKey
ALTER TABLE "Commission" ADD CONSTRAINT "Commission_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;
