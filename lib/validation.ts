import { z } from "zod";

export function countWords(text: string): number {
  return text.trim().length === 0 ? 0 : text.trim().split(/\s+/).length;
}

// Built per request from the current category list (lib/categories.ts), so
// categories renamed or added in /admin are accepted immediately.
export const submitBookSchema = (categories: string[]) => {
  const categoryEnum = z.string().refine((c) => categories.includes(c), "Choose a category from the list.");
  return z
  .object({
    author: z.string().trim().min(1, "Author's name is required"),
    email: z.string().trim().email("Enter a valid email"),
    phone: z.string().trim().min(7, "Enter a valid phone number"),
    title: z.string().trim().min(1, "Book title is required"),
    purchaseLink: z.string().trim().url("Enter a valid purchase URL"),
    primaryCategory: categoryEnum,
    consent: z.coerce.boolean(),
  })
  .superRefine((data, ctx) => {
    if (!data.consent) {
      ctx.addIssue({
        code: "custom",
        path: ["consent"],
        message: "You must agree to the terms to submit.",
      });
    }
  });
};

export type SubmitBookInput = z.infer<ReturnType<typeof submitBookSchema>>;

export const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png"];
