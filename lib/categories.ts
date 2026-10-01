import { prisma } from "./prisma";
import { sortCategoryNames } from "./category-order";

// The category list lives in the Category table (managed at /admin/categories)
// and is the single source of truth for the form, validation and the
// directory's category buttons. Always A to Z with "Other" last.
export async function getCategoryNames(): Promise<string[]> {
  const rows = await prisma.category.findMany({ select: { name: true } });
  return sortCategoryNames(rows.map((r) => r.name));
}
