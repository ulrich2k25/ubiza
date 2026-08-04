-- AlterTable
ALTER TABLE "Commission" ADD COLUMN     "cancellationReason" TEXT,
ADD COLUMN     "cancelledAt" TIMESTAMP(3),
ADD COLUMN     "cancelledByAdminId" TEXT;
