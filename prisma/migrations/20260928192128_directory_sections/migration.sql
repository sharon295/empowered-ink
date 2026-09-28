-- CreateEnum
CREATE TYPE "Placement" AS ENUM ('featured', 'new_on_shelf');

-- AlterTable
ALTER TABLE "Book" ADD COLUMN     "approvedAt" TIMESTAMP(3),
ADD COLUMN     "categories" TEXT[] DEFAULT ARRAY[]::TEXT[],
ADD COLUMN     "placement" "Placement",
ADD COLUMN     "placementMonth" TEXT,
ADD COLUMN     "searchText" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "sortTitle" TEXT NOT NULL DEFAULT '',
ADD COLUMN     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- CreateTable
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");

-- CreateIndex
CREATE INDEX "Book_status_sortTitle_id_idx" ON "Book"("status", "sortTitle", "id");

-- CreateIndex
CREATE INDEX "Book_placement_placementMonth_idx" ON "Book"("placement", "placementMonth");

-- Backfill ---------------------------------------------------------------
-- Existing approved books count as approved when they were submitted.
UPDATE "Book" SET "approvedAt" = "submittedAt" WHERE "status" = 'approved' AND "approvedAt" IS NULL;

-- Paid Featured listings that are still running keep their spot for the
-- month they were paid for (America/Denver). Everything else starts in the
-- A–Z list, so no existing book shows up as "New on the Shelf".
UPDATE "Book"
SET "placement" = 'featured',
    "placementMonth" = to_char(("featuredUntil" AT TIME ZONE 'UTC') AT TIME ZONE 'America/Denver', 'YYYY-MM')
WHERE "isFeatured" = true AND "featuredUntil" IS NOT NULL AND "featuredUntil" >= CURRENT_TIMESTAMP;

-- Starting category list (the list the submission form used before this
-- migration), plus any category already on a book.
INSERT INTO "Category" ("id", "name", "sortOrder") VALUES
  ('cat_business', 'Business & Entrepreneurship', 1),
  ('cat_leadership', 'Leadership', 2),
  ('cat_personal_dev', 'Personal Development', 3),
  ('cat_mindset', 'Mindset & Motivation', 4),
  ('cat_empowerment', 'Women''s Empowerment', 5),
  ('cat_faith', 'Faith & Spirituality', 6),
  ('cat_health', 'Health & Wellness', 7),
  ('cat_finance', 'Finance & Wealth', 8),
  ('cat_relationships', 'Relationships & Family', 9),
  ('cat_children', 'Children & Young Adult', 10),
  ('cat_memoir', 'Memoir & Inspirational', 11),
  ('cat_fiction', 'Fiction', 12),
  ('cat_poetry', 'Poetry', 13),
  ('cat_lifestyle', 'Lifestyle', 14),
  ('cat_social_impact', 'Social Impact', 15),
  ('cat_other', 'Other', 999)
ON CONFLICT ("name") DO NOTHING;

INSERT INTO "Category" ("id", "name", "sortOrder")
SELECT 'cat_' || md5("primaryCategory"), "primaryCategory", 500
FROM (SELECT DISTINCT "primaryCategory" FROM "Book") b
ON CONFLICT ("name") DO NOTHING;

-- sortTitle, searchText and categories are filled in by scripts/backfill.mjs,
-- which runs before the app starts (see "start" in package.json), so the
-- normalization rules live in one place (lib/normalize.mjs).
