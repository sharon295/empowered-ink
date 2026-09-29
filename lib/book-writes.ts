import type { Book, Prisma } from "@prisma/client";
import { z } from "zod";
import { prisma } from "./prisma";
import { endOfMonth, isMonthKey } from "./month";
import { derivedFields } from "./normalize.mjs";

export async function refreshDerivedFields(bookId: string) {
  const book = await prisma.book.findUnique({ where: { id: bookId } });
  if (!book) return;
  await prisma.book.update({ where: { id: bookId }, data: derivedFields(book) });
}

// isFeatured / featuredUntil are kept in step with the placement so older
// readers of those columns (and the admin list) agree with the directory.
export function featuredColumnsFor(
  placement: Book["placement"],
  placementMonth: string | null
): Pick<Prisma.BookUpdateInput, "isFeatured" | "featuredUntil"> {
  if (placement === "featured" && placementMonth) {
    return { isFeatured: true, featuredUntil: endOfMonth(placementMonth) };
  }
  return { isFeatured: false, featuredUntil: null };
}

const optionalText = z
  .string()
  .trim()
  .transform((v) => v || null)
  .nullable();

// Every field the owner can edit in /admin. All fields are optional so the
// same schema serves "create" (checked for required fields separately) and
// partial edits.
export const adminBookSchema = (categories: string[]) =>
  z
    .object({
      title: z.string().trim().min(1, "Title is required"),
      author: z.string().trim().min(1, "Author is required"),
      email: z.string().trim(),
      phone: z.string().trim(),
      description: optionalText,
      purchaseLink: z.string().trim().url("Enter a valid URL, including https://"),
      primaryCategory: z.string().refine((c) => categories.includes(c), "Choose a category from the list"),
      secondaryCategories: z
        .array(z.string().refine((c) => categories.includes(c), "Choose a category from the list"))
        .max(2),
      otherCategoryLabel: optionalText,
      categoryAddonPaid: z.boolean(),
      status: z.enum(["pending", "approved", "rejected"]),
      placement: z.enum(["featured", "new_on_shelf"]).nullable(),
      placementMonth: z
        .string()
        .nullable()
        .refine((v) => v === null || isMonthKey(v), "Choose a month"),
      approvedAt: z
        .string()
        .nullable()
        .refine((v) => v === null || !Number.isNaN(Date.parse(v)), "Enter a valid date"),
    })
    .partial()
    .superRefine((data, ctx) => {
      if (data.placement && !data.placementMonth) {
        ctx.addIssue({ code: "custom", path: ["placementMonth"], message: "Choose the month this book shows" });
      }
    });

export type AdminBookInput = z.infer<ReturnType<typeof adminBookSchema>>;

// Reads the admin book form (multipart, so a cover can be attached).
export function adminInputFromForm(form: FormData): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  const text = ["title", "author", "email", "phone", "description", "purchaseLink", "primaryCategory", "otherCategoryLabel", "status"];
  for (const key of text) if (form.has(key)) out[key] = String(form.get(key));
  if (form.has("secondaryCategories")) {
    out.secondaryCategories = form.getAll("secondaryCategories").map(String).filter(Boolean);
  }
  if (form.has("categoryAddonPaid")) out.categoryAddonPaid = form.get("categoryAddonPaid") === "true";
  if (form.has("placement")) out.placement = String(form.get("placement")) || null;
  if (form.has("placementMonth")) out.placementMonth = String(form.get("placementMonth")) || null;
  if (form.has("approvedAt")) out.approvedAt = String(form.get("approvedAt")) || null;
  return out;
}

// Turns validated admin input into a Prisma update, applying the rules that
// have to hold whatever was edited:
//  - approving a book that wasn't approved stamps approvedAt (unless the owner
//    set one by hand in the same save);
//  - placement and the featured columns stay in step;
//  - "no placement" clears the month.
export function toBookUpdate(existing: Book | null, input: AdminBookInput): Prisma.BookUpdateInput {
  const data: Prisma.BookUpdateInput = {};
  const copy = [
    "title", "author", "email", "phone", "description", "purchaseLink",
    "primaryCategory", "otherCategoryLabel", "categoryAddonPaid", "status",
  ] as const;
  for (const key of copy) if (input[key] !== undefined) (data as Record<string, unknown>)[key] = input[key];
  if (input.secondaryCategories !== undefined) data.secondaryCategories = JSON.stringify(input.secondaryCategories);

  if (input.approvedAt !== undefined) {
    data.approvedAt = input.approvedAt ? new Date(input.approvedAt) : null;
  } else if (input.status === "approved" && existing?.status !== "approved") {
    data.approvedAt = new Date();
  }

  if (input.placement !== undefined || input.placementMonth !== undefined) {
    const placement = input.placement !== undefined ? input.placement : existing?.placement ?? null;
    const month = placement
      ? (input.placementMonth !== undefined ? input.placementMonth : existing?.placementMonth) ?? null
      : null;
    data.placement = placement;
    data.placementMonth = month;
    Object.assign(data, featuredColumnsFor(placement, month));
  }
  return data;
}

// Renames a category everywhere it's used, in one transaction.
export async function renameCategory(from: string, to: string) {
  await prisma.$transaction(async (tx) => {
    await tx.category.update({ where: { name: from }, data: { name: to } });
    const books = await tx.book.findMany({
      where: { OR: [{ primaryCategory: from }, { secondaryCategories: { contains: JSON.stringify(from) } }] },
    });
    for (const book of books) {
      const secondary = (JSON.parse(book.secondaryCategories || "[]") as string[]).map((c) => (c === from ? to : c));
      const next = {
        ...book,
        primaryCategory: book.primaryCategory === from ? to : book.primaryCategory,
        secondaryCategories: JSON.stringify(secondary),
      };
      await tx.book.update({
        where: { id: book.id },
        data: {
          primaryCategory: next.primaryCategory,
          secondaryCategories: next.secondaryCategories,
          ...derivedFields(next),
        },
      });
    }
  });
}

export async function categoryUsage(): Promise<Record<string, number>> {
  // One category per book, so a book counts only toward its own category.
  const books = await prisma.book.findMany({ select: { primaryCategory: true } });
  const counts: Record<string, number> = {};
  for (const b of books) counts[b.primaryCategory] = (counts[b.primaryCategory] ?? 0) + 1;
  return counts;
}
