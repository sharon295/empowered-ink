import { prisma } from "./prisma";
import { endOfMonth, monthKeyOf } from "./month";

// The category list lives in the Category table (managed at /admin/categories)
// and is the single source of truth for the form, validation and the
// directory's category buttons.
export async function getCategoryNames(): Promise<string[]> {
  const rows = await prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] });
  return rows.map((r) => r.name);
}

export const FEATURED_PRICE_CENTS = 7500;
export const CATEGORY_ADDON_PRICE_CENTS = 3500;

// End of the current month in America/Denver time.
export function lastDayOfCurrentMonth(from: Date = new Date()): Date {
  return endOfMonth(monthKeyOf(from));
}
