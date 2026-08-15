import { z } from "zod";
import { CATEGORIES } from "./categories";

export function countWords(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

const categoryEnum = z.enum(CATEGORIES);

export const submitBookSchema = z
  .object({
    author: z.string().trim().min(1, "Author's name is required"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().min(7, "Enter a valid phone number"),
    title: z.string().trim().min(1, "Book title is required"),
    description: z.string().trim().optional().default(""),
    purchaseLink: z.string().trim().url("Enter a valid purchase URL"),
    primaryCategory: categoryEnum,
    secondaryCategories: z.array(categoryEnum).max(2).default([]),
    otherCategoryLabel: z.string().trim().optional().default(""),
    isFeatured: z.coerce.boolean().default(false),
    addCategories: z.coerce.boolean().default(false),
    consent: z.coerce.boolean(),
  })
  .superRefine((data, ctx) => {
    const needsOtherLabel =
      data.primaryCategory === "Other" || data.secondaryCategories.includes("Other");
    if (needsOtherLabel && !data.otherCategoryLabel.trim()) {
      ctx.addIssue({
        code: "custom",
        path: ["otherCategoryLabel"],
        message: "Please specify your book's genre or category.",
      });
    }
    if (data.addCategories && data.secondaryCategories.length === 0) {
      ctx.addIssue({
        code: "custom",
        path: ["secondaryCategories"],
        message: "Choose at least one secondary category, or turn the toggle off.",
      });
    }
    if (data.isFeatured) {
      const words = countWords(data.description);
      if (words < 75 || words > 100) {
        ctx.addIssue({
          code: "custom",
          path: ["description"],
          message: "Featured listings require a 75–100 word description.",
        });
      }
    }
    if (!data.consent) {
      ctx.addIssue({
        code: "custom",
        path: ["consent"],
        message: "You must agree to the terms to submit.",
      });
    }
  });

export type SubmitBookInput = z.infer<typeof submitBookSchema>;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
