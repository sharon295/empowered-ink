import { prisma } from "./prisma";
import type { Book } from "@prisma/client";

export type PublicBook = {
  id: string;
  title: string;
  author: string;
  description: string | null;
  coverImageUrl: string | null;
  purchaseLink: string;
  primaryCategory: string;
  secondaryCategories: string[];
  otherCategoryLabel: string | null;
  isFeatured: boolean;
  featuredUntil: string | null;
};

function toPublicBook(book: Book): PublicBook {
  const secondaryCategories: string[] = book.categoryAddonPaid
    ? (JSON.parse(book.secondaryCategories) as string[])
    : [];
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    description: book.description,
    coverImageUrl: book.coverImageUrl,
    purchaseLink: book.purchaseLink,
    primaryCategory: book.primaryCategory,
    secondaryCategories,
    otherCategoryLabel: book.otherCategoryLabel,
    isFeatured: book.isFeatured,
    featuredUntil: book.featuredUntil ? book.featuredUntil.toISOString() : null,
  };
}

export async function getApprovedBooks(): Promise<PublicBook[]> {
  const books = await prisma.book.findMany({
    where: { status: "approved" },
    orderBy: { title: "asc" },
  });
  return books.map(toPublicBook);
}
