import { prisma } from "./prisma";

// The category list lives in the Category table (managed at /admin/categories)
// and is the single source of truth for the form, validation and the
// directory's category buttons.
export async function getCategoryNames(): Promise<string[]> {
  const rows = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return rows.map((r) => r.name);
}
