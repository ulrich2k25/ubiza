-- DropIndex
DROP INDEX "PayoutItem_commissionId_key";

-- CreateIndex
CREATE INDEX "PayoutItem_commissionId_idx" ON "PayoutItem"("commissionId");
