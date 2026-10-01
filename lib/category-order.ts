// Categories are always shown A to Z, with "Other" last, wherever they
// appear: directory buttons, form dropdowns and the admin category manager.
const LAST = "other";

export function compareCategoryNames(a: string, b: string): number {
  const aLast = a.trim().toLowerCase() === LAST;
  const bLast = b.trim().toLowerCase() === LAST;
  if (aLast !== bLast) return aLast ? 1 : -1;
  return a.localeCompare(b, "en", { sensitivity: "base" });
}

export function sortCategoryNames(names: string[]): string[] {
  return [...names].sort(compareCategoryNames);
}
