import { NextResponse } from "next/server";
import type { Book, Prisma } from "@prisma/client";
import { prisma } from "./prisma";
import { getCategoryNames } from "./categories";
import { uploadCoverImage } from "./cloudinary";
import { ACCEPTED_IMAGE_TYPES } from "./validation";
import { adminBookSchema, adminInputFromForm, toBookUpdate } from "./book-writes";
import { derivedFields } from "./normalize.mjs";

type Issue = { path: (string | number)[]; message: string };

const invalid = (issues: Issue[]) => NextResponse.json({ error: "validation", issues }, { status: 400 });

// Handles both the JSON approve/reject calls and the multipart edit/add form.
// Returns the saved book, or an error response.
export async function saveAdminBook(req: Request, existing: Book | null): Promise<NextResponse> {
  const isMultipart = req.headers.get("content-type")?.includes("multipart/form-data");
  const form = isMultipart ? await req.formData() : null;
  const raw: Record<string, unknown> = form ? adminInputFromForm(form) : await req.json();

  const categories = await getCategoryNames();
  // Existing books may carry a category that has since been removed; let
  // them keep it rather than blocking every other edit.
  const allowed = existing
    ? [...new Set([...categories, existing.primaryCategory, ...JSON.parse(existing.secondaryCategories || "[]")])]
    : categories;
  const parsed = adminBookSchema(allowed).safeParse(raw);
  if (!parsed.success) return invalid(parsed.error.issues as Issue[]);
  const input = parsed.data;

  if (!existing) {
    const missing = (["title", "author", "purchaseLink", "primaryCategory"] as const).filter((k) => !input[k]);
    if (missing.length) return invalid(missing.map((k) => ({ path: [k], message: "Required" })));
  }

  const data = toBookUpdate(existing, input);

  const cover = form?.get("coverImage");
  if (cover instanceof File && cover.size > 0) {
    if (!ACCEPTED_IMAGE_TYPES.includes(cover.type)) {
      return invalid([{ path: ["coverImage"], message: "Cover image must be a JPG or PNG file." }]);
    }
    data.coverImageUrl = await uploadCoverImage(Buffer.from(await cover.arrayBuffer()), cover.type);
  } else if (form?.get("removeCover") === "true") {
    data.coverImageUrl = null;
  }

  const merged = {
    title: (data.title as string | undefined) ?? existing?.title ?? "",
    author: (data.author as string | undefined) ?? existing?.author ?? "",
    primaryCategory: (data.primaryCategory as string | undefined) ?? existing?.primaryCategory ?? "",
    secondaryCategories: (data.secondaryCategories as string | undefined) ?? existing?.secondaryCategories ?? "[]",
    categoryAddonPaid: (data.categoryAddonPaid as boolean | undefined) ?? existing?.categoryAddonPaid ?? false,
    otherCategoryLabel:
      data.otherCategoryLabel !== undefined ? (data.otherCategoryLabel as string | null) : existing?.otherCategoryLabel ?? null,
  };
  Object.assign(data, derivedFields(merged));

  const book = existing
    ? await prisma.book.update({ where: { id: existing.id }, data })
    : await prisma.book.create({
        data: {
          ...(data as Prisma.BookCreateInput),
          ...merged,
          email: input.email ?? "",
          phone: input.phone ?? "",
          purchaseLink: input.purchaseLink!,
          status: input.status ?? "approved",
          approvedAt:
            (data.approvedAt as Date | null | undefined) ??
            ((input.status ?? "approved") === "approved" ? new Date() : null),
        },
      });
  return NextResponse.json({ book });
}
