// Recomputes sortTitle, searchText and categories for every book whose stored
// values are out of date. Safe to run any number of times; runs before the
// app starts (package.json "start") so a fresh migration never serves books
// with empty sort keys.
import { PrismaClient } from "@prisma/client";
import { derivedFields } from "../lib/normalize.mjs";

const prisma = new PrismaClient();

try {
  const books = await prisma.book.findMany();
  let updated = 0;
  for (const book of books) {
    const next = derivedFields(book);
    const same =
      book.sortTitle === next.sortTitle &&
      book.searchText === next.searchText &&
      book.categories.join("\u0000") === next.categories.join("\u0000");
    if (same) continue;
    await prisma.book.update({ where: { id: book.id }, data: next });
    updated++;
  }
  console.log(`backfill: ${updated} of ${books.length} books updated`);
} finally {
  await prisma.$disconnect();
}
