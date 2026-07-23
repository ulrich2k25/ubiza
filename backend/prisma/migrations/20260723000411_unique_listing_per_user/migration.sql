/*
  Warnings:

  - A unique constraint covering the columns `[userId]` on the table `Listing` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "Listing_userId_key" ON "Listing"("userId");
