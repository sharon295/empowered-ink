-- CreateTable
CREATE TABLE "Book" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "title" TEXT NOT NULL,
    "author" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "description" TEXT,
    "coverImageUrl" TEXT,
    "purchaseLink" TEXT NOT NULL,
    "primaryCategory" TEXT NOT NULL,
    "secondaryCategories" TEXT NOT NULL DEFAULT '[]',
    "otherCategoryLabel" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "featuredUntil" DATETIME,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "submittedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "stripeSessionId" TEXT,
    "categoryAddonPaid" BOOLEAN NOT NULL DEFAULT false
);

-- CreateIndex
CREATE INDEX "Book_status_idx" ON "Book"("status");

-- CreateIndex
CREATE INDEX "Book_isFeatured_featuredUntil_idx" ON "Book"("isFeatured", "featuredUntil");
