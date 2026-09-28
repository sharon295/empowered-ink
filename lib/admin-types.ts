import type { Book } from "@prisma/client";
import type { Section } from "./books";

// A book as the admin screens see it (plain JSON, safe to pass to the client).
export type AdminBook = {
  id: string;
  title: string;
  author: string;
  email: string;
  phone: string;
  description: string | null;
  coverImageUrl: string | null;
  purchaseLink: string;
  primaryCategory: string;
  secondaryCategories: string[];
  otherCategoryLabel: string | null;
  categoryAddonPaid: boolean;
  status: "pending" | "approved" | "rejected";
  placement: "featured" | "new_on_shelf" | null;
  placementMonth: string | null;
  approvedAt: string | null;
  submittedAt: string;
  paidFeatured: boolean;
  section: Section;
};

export function toAdminBook(book: Book, section: Section): AdminBook {
  return {
    id: book.id,
    title: book.title,
    author: book.author,
    email: book.email,
    phone: book.phone,
    description: book.description,
    coverImageUrl: book.coverImageUrl,
    purchaseLink: book.purchaseLink,
    primaryCategory: book.primaryCategory,
    secondaryCategories: JSON.parse(book.secondaryCategories || "[]"),
    otherCategoryLabel: book.otherCategoryLabel,
    categoryAddonPaid: book.categoryAddonPaid,
    status: book.status,
    placement: book.placement,
    placementMonth: book.placementMonth,
    approvedAt: book.approvedAt?.toISOString() ?? null,
    submittedAt: book.submittedAt.toISOString(),
    paidFeatured: Boolean(book.stripeSessionId && book.isFeatured),
    section,
  };
}
