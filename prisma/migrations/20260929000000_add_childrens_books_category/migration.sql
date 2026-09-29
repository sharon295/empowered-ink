-- Add a "Children's Books" category next to "Children & Young Adult".
-- Does nothing if the owner has already added it in /admin/categories.
INSERT INTO "Category" ("id", "name", "sortOrder")
VALUES ('cat_childrens_books', 'Children''s Books', 10)
ON CONFLICT ("name") DO NOTHING;
