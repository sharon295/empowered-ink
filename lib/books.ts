import type { Book, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { currentMonthKey } from "./month";
import { sortCategoryNames } from "./category-order";
import { foldText } from "./normalize.mjs";

export const BATCH_SIZE = 24;
export const NEW_ON_SHELF_PREVIEW = 12;

export type Section = "featured" | "new" | "main" | "scheduled";

export type PublicBook = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverImageUrl: string | null;
  purchaseLink: string;
  categoryLabel: string;
};

export type BookPage = {
  books: PublicBook[];
  nextCursor: string | null;
  total: number;
};

// ---------------------------------------------------------------------------
// Sections. Computed from placement + placementMonth against the current
// Denver month on every read, so a month rolling over needs no job or edit:
//   placementMonth in the future  -> hidden (scheduled)
//   placementMonth = this month   -> its section (Featured / New on the Shelf)
//   placementMonth in the past, or no placement -> the A–Z list

export function sectionOf(
  book: Pick<Book, "placement" | "placementMonth">,
  month: string = currentMonthKey()
): Section {
  if (!book.placement || !book.placementMonth || book.placementMonth < month) return "main";
  if (book.placementMonth > month) return "scheduled";
  return book.placement === "featured" ? "featured" : "new";
}

const approved: Prisma.BookWhereInput = { status: "approved" };

function inMonthSection(placement: "featured" | "new_on_shelf", month: string): Prisma.BookWhereInput {
  return { AND: [approved, { placement, placementMonth: month }] };
}

function mainList(month: string): Prisma.BookWhereInput {
  return {
    AND: [approved, { OR: [{ placement: null }, { placementMonth: null }, { placementMonth: { lt: month } }] }],
  };
}

// Everything a reader can see right now: every section, but not books
// scheduled for a later month.
function visible(month: string): Prisma.BookWhereInput {
  return {
    AND: [approved, { OR: [{ placement: null }, { placementMonth: null }, { placementMonth: { lte: month } }] }],
  };
}

const alphabetical: Prisma.BookOrderByWithRelationInput[] = [{ sortTitle: "asc" }, { id: "asc" }];

function toPublicBook(book: Book): PublicBook {
  const primary = book.categories[0] ?? book.primaryCategory;
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    coverImageUrl: book.coverImageUrl,
    purchaseLink: book.purchaseLink,
    categoryLabel: primary === "Other" && book.otherCategoryLabel ? book.otherCategoryLabel : primary,
  };
}

export async function getSpotlight(month: string = currentMonthKey()) {
  const [featured, newOnShelf] = await Promise.all([
    prisma.book.findMany({ where: inMonthSection("featured", month), orderBy: alphabetical }),
    prisma.book.findMany({ where: inMonthSection("new_on_shelf", month), orderBy: alphabetical }),
  ]);
  return { featured: featured.map(toPublicBook), newOnShelf: newOnShelf.map(toPublicBook) };
}

// ---------------------------------------------------------------------------
// The A–Z list, paginated with a keyset cursor on (sortTitle, id) so books
// approved mid-visit can't cause duplicates or skipped books.

export type ListFilters = { q?: string; category?: string };

export function hasActiveFilters({ q, category }: ListFilters): boolean {
  return Boolean(q?.trim() || category);
}

function encodeCursor(book: Pick<Book, "sortTitle" | "id">): string {
  return Buffer.from(JSON.stringify([book.sortTitle, book.id])).toString("base64url");
}

function decodeCursor(cursor: string | null | undefined): [string, string] | null {
  if (!cursor) return null;
  try {
    const value = JSON.parse(Buffer.from(cursor, "base64url").toString("utf8"));
    if (Array.isArray(value) && value.length === 2 && value.every((v) => typeof v === "string")) {
      return value as [string, string];
    }
  } catch {}
  return null;
}

function listWhere(filters: ListFilters, month: string): Prisma.BookWhereInput {
  // With a search or category active, search every visible book (including
  // Featured and New on the Shelf) in one list; otherwise only the A–Z list.
  const base = hasActiveFilters(filters) ? visible(month) : mainList(month);
  const and: Prisma.BookWhereInput[] = [base];
  if (filters.category) and.push({ categories: { has: filters.category } });
  for (const word of foldText(filters.q).split(" ").filter(Boolean)) {
    and.push({ searchText: { contains: word } });
  }
  return { AND: and };
}

export async function listBooks(
  filters: ListFilters & { after?: string | null; limit?: number },
  month: string = currentMonthKey()
): Promise<BookPage> {
  const limit = Math.min(Math.max(filters.limit ?? BATCH_SIZE, 1), 60);
  const where = listWhere(filters, month);
  const cursor = decodeCursor(filters.after);
  const pageWhere: Prisma.BookWhereInput = cursor
    ? {
        AND: [
          where,
          { OR: [{ sortTitle: { gt: cursor[0] } }, { sortTitle: cursor[0], id: { gt: cursor[1] } }] },
        ],
      }
    : where;

  const [rows, total] = await Promise.all([
    prisma.book.findMany({ where: pageWhere, orderBy: alphabetical, take: limit + 1 }),
    prisma.book.count({ where }),
  ]);
  const hasMore = rows.length > limit;
  const page = hasMore ? rows.slice(0, limit) : rows;
  return {
    books: page.map(toPublicBook),
    nextCursor: hasMore ? encodeCursor(page[page.length - 1]) : null,
    total,
  };
}

// Category buttons: every category with at least one visible book, A to Z
// with "Other" last.
export async function getCategoryFacets(month: string = currentMonthKey()): Promise<string[]> {
  const books = await prisma.book.findMany({ where: visible(month), select: { categories: true } });
  return sortCategoryNames([...new Set(books.flatMap((b) => b.categories))]);
}
