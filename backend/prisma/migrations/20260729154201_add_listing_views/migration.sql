-- CreateTable
CREATE TABLE "ListingView" (
    "id" TEXT NOT NULL,
    "listingId" TEXT NOT NULL,
    "visitorKey" TEXT NOT NULL,
    "viewedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ListingView_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ListingView_listingId_idx" ON "ListingView"("listingId");

-- CreateIndex
CREATE INDEX "ListingView_visitorKey_idx" ON "ListingView"("visitorKey");

-- CreateIndex
CREATE INDEX "ListingView_listingId_visitorKey_viewedAt_idx" ON "ListingView"("listingId", "visitorKey", "viewedAt");

-- AddForeignKey
ALTER TABLE "ListingView" ADD CONSTRAINT "ListingView_listingId_fkey" FOREIGN KEY ("listingId") REFERENCES "Listing"("id") ON DELETE CASCADE ON UPDATE CASCADE;
