/*
  Warnings:

  - A unique constraint covering the columns `[paymentId]` on the table `Boost` will be added. If there are existing duplicate values, this will fail.
  - Added the required column `durationMinutes` to the `Boost` table without a default value. This is not possible if the table is not empty.
  - Added the required column `source` to the `Boost` table without a default value. This is not possible if the table is not empty.

*/
-- CreateEnum
CREATE TYPE "BoostSource" AS ENUM ('REFERRAL_CREDIT', 'PURCHASE', 'ADMIN');

-- CreateEnum
CREATE TYPE "PremiumPlan" AS ENUM ('TRIAL_7_DAYS', 'DAY_1', 'DAYS_7', 'DAYS_30');

-- CreateEnum
CREATE TYPE "PremiumSource" AS ENUM ('TRIAL', 'PURCHASE', 'ADMIN');

-- CreateEnum
CREATE TYPE "PremiumSubscriptionStatus" AS ENUM ('PENDING', 'ACTIVE', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "PaymentProvider" AS ENUM ('KPAY', 'CINETPAY', 'MANUAL');

-- CreateEnum
CREATE TYPE "PaymentPurpose" AS ENUM ('PREMIUM', 'BOOST');

-- CreateEnum
CREATE TYPE "PaymentStatus" AS ENUM ('PENDING', 'PROCESSING', 'SUCCESS', 'FAILED', 'CANCELLED', 'EXPIRED');

-- DropForeignKey
ALTER TABLE "Boost" DROP CONSTRAINT "Boost_currencyId_fkey";

-- AlterTable
ALTER TABLE "Boost" ADD COLUMN     "creditCost" INTEGER NOT NULL DEFAULT 0,
ADD COLUMN     "durationMinutes" INTEGER NOT NULL,
ADD COLUMN     "paymentId" TEXT,
ADD COLUMN     "source" "BoostSource" NOT NULL,
ALTER COLUMN "currencyId" DROP NOT NULL,
ALTER COLUMN "amount" DROP NOT NULL;

-- AlterTable
ALTER TABLE "User" ADD COLUMN     "premiumActiveUntil" TIMESTAMP(3),
ADD COLUMN     "premiumTrialStartedAt" TIMESTAMP(3),
ADD COLUMN     "premiumTrialUsed" BOOLEAN NOT NULL DEFAULT false;

-- CreateTable
CREATE TABLE "PremiumSubscription" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "plan" "PremiumPlan" NOT NULL,
    "source" "PremiumSource" NOT NULL,
    "status" "PremiumSubscriptionStatus" NOT NULL DEFAULT 'PENDING',
    "startsAt" TIMESTAMP(3) NOT NULL,
    "endsAt" TIMESTAMP(3) NOT NULL,
    "amount" DECIMAL(12,2),
    "currencyId" TEXT,
    "paymentId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "PremiumSubscription_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "currencyId" TEXT NOT NULL,
    "provider" "PaymentProvider" NOT NULL,
    "purpose" "PaymentPurpose" NOT NULL,
    "status" "PaymentStatus" NOT NULL DEFAULT 'PENDING',
    "amount" DECIMAL(12,2) NOT NULL,
    "externalReference" TEXT,
    "providerTransactionId" TEXT,
    "customerPhone" TEXT,
    "providerData" JSONB,
    "failureReason" TEXT,
    "initiatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "paidAt" TIMESTAMP(3),
    "failedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "expiresAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "PremiumSubscription_paymentId_key" ON "PremiumSubscription"("paymentId");

-- CreateIndex
CREATE INDEX "PremiumSubscription_userId_idx" ON "PremiumSubscription"("userId");

-- CreateIndex
CREATE INDEX "PremiumSubscription_plan_idx" ON "PremiumSubscription"("plan");

-- CreateIndex
CREATE INDEX "PremiumSubscription_source_idx" ON "PremiumSubscription"("source");

-- CreateIndex
CREATE INDEX "PremiumSubscription_status_idx" ON "PremiumSubscription"("status");

-- CreateIndex
CREATE INDEX "PremiumSubscription_startsAt_idx" ON "PremiumSubscription"("startsAt");

-- CreateIndex
CREATE INDEX "PremiumSubscription_endsAt_idx" ON "PremiumSubscription"("endsAt");

-- CreateIndex
CREATE INDEX "PremiumSubscription_userId_status_idx" ON "PremiumSubscription"("userId", "status");

-- CreateIndex
CREATE INDEX "PremiumSubscription_currencyId_idx" ON "PremiumSubscription"("currencyId");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_externalReference_key" ON "Payment"("externalReference");

-- CreateIndex
CREATE UNIQUE INDEX "Payment_providerTransactionId_key" ON "Payment"("providerTransactionId");

-- CreateIndex
CREATE INDEX "Payment_userId_idx" ON "Payment"("userId");

-- CreateIndex
CREATE INDEX "Payment_provider_idx" ON "Payment"("provider");

-- CreateIndex
CREATE INDEX "Payment_purpose_idx" ON "Payment"("purpose");

-- CreateIndex
CREATE INDEX "Payment_status_idx" ON "Payment"("status");

-- CreateIndex
CREATE INDEX "Payment_currencyId_idx" ON "Payment"("currencyId");

-- CreateIndex
CREATE INDEX "Payment_createdAt_idx" ON "Payment"("createdAt");

-- CreateIndex
CREATE INDEX "Payment_userId_status_idx" ON "Payment"("userId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Boost_paymentId_key" ON "Boost"("paymentId");

-- CreateIndex
CREATE INDEX "Boost_source_idx" ON "Boost"("source");

-- CreateIndex
CREATE INDEX "Boost_startsAt_idx" ON "Boost"("startsAt");

-- CreateIndex
CREATE INDEX "Boost_endsAt_idx" ON "Boost"("endsAt");

-- CreateIndex
CREATE INDEX "Boost_currencyId_idx" ON "Boost"("currencyId");

-- CreateIndex
CREATE INDEX "User_premiumActiveUntil_idx" ON "User"("premiumActiveUntil");

-- CreateIndex
CREATE INDEX "User_premiumTrialUsed_idx" ON "User"("premiumTrialUsed");

-- AddForeignKey
ALTER TABLE "Boost" ADD CONSTRAINT "Boost_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Boost" ADD CONSTRAINT "Boost_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremiumSubscription" ADD CONSTRAINT "PremiumSubscription_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremiumSubscription" ADD CONSTRAINT "PremiumSubscription_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "PremiumSubscription" ADD CONSTRAINT "PremiumSubscription_paymentId_fkey" FOREIGN KEY ("paymentId") REFERENCES "Payment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_currencyId_fkey" FOREIGN KEY ("currencyId") REFERENCES "Currency"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
