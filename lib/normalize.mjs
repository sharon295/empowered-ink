// Plain JS (not TS) so scripts/backfill.mjs can use exactly the same rules as
// the app without a build step. Imported from TypeScript via allowJs.

const SPECIAL_LETTERS = { ß: "ss", æ: "ae", œ: "oe", ø: "o", ł: "l", đ: "d", ð: "d", þ: "th" };

/**
 * Lowercase, strip accents, and collapse whitespace, so "Élan" and "elan"
 * compare equal for both sorting and search.
 * @param {string | null | undefined} text
 * @returns {string}
 */
export function foldText(text) {
  return (text ?? "")
    .normalize("NFKD")
    .replace(/\p{M}+/gu, "")
    .toLowerCase()
    .replace(/[ßæœøłđðþ]/g, (ch) => SPECIAL_LETTERS[/** @type {keyof typeof SPECIAL_LETTERS} */ (ch)])
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * The key the A–Z list sorts on. Ignores case, accents, punctuation, and a
 * leading "The", "A" or "An", so "The Badass Blueprint" sorts under B.
 * @param {string} title
 * @returns {string}
 */
export function sortTitleOf(title) {
  const words = foldText(title)
    .replace(/['’‘`]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .trim();
  const withoutArticle = words.replace(/^(the|an|a) /, "");
  return withoutArticle || words;
}

/**
 * The categories a book is shown under publicly. Secondary categories only
 * count once they've been paid for (Featured bundles them).
 * @param {string} primaryCategory
 * @param {string} secondaryCategoriesJson
 * @param {boolean} categoryAddonPaid
 * @returns {string[]}
 */
export function publicCategoriesOf(primaryCategory, secondaryCategoriesJson, categoryAddonPaid) {
  /** @type {string[]} */
  let secondary = [];
  if (categoryAddonPaid) {
    try {
      const parsed = JSON.parse(secondaryCategoriesJson || "[]");
      if (Array.isArray(parsed)) secondary = parsed.filter((c) => typeof c === "string" && c);
    } catch {
      secondary = [];
    }
  }
  return [...new Set([primaryCategory, ...secondary].filter(Boolean))];
}

/**
 * @param {{ title: string, author: string, categories: string[], otherCategoryLabel?: string | null }} book
 * @returns {string}
 */
export function searchTextOf(book) {
  return foldText([book.title, book.author, ...book.categories, book.otherCategoryLabel ?? ""].join(" | "));
}

/**
 * Every derived column, computed from the fields a person edits.
 * @param {{ title: string, author: string, primaryCategory: string, secondaryCategories: string, categoryAddonPaid: boolean, otherCategoryLabel?: string | null }} book
 */
export function derivedFields(book) {
  const categories = publicCategoriesOf(book.primaryCategory, book.secondaryCategories, book.categoryAddonPaid);
  return {
    sortTitle: sortTitleOf(book.title),
    categories,
    searchText: searchTextOf({ ...book, categories }),
  };
}
