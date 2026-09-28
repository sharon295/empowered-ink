import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadCoverImage } from "@/lib/cloudinary";
import { submitBookSchema, ACCEPTED_IMAGE_TYPES } from "@/lib/validation";
import { getCategoryNames } from "@/lib/categories";
import { derivedFields } from "@/lib/normalize.mjs";

// Author submissions are free. Every one is saved as pending; the owner
// approves it in /admin and chooses Featured, New on the Shelf or the A–Z list.
export async function POST(req: Request) {
  const form = await req.formData();

  let secondaryCategories: unknown = [];
  try {
    secondaryCategories = JSON.parse(String(form.get("secondaryCategories") ?? "[]"));
  } catch {}

  const raw = {
    author: String(form.get("author") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    title: String(form.get("title") ?? ""),
    description: String(form.get("description") ?? ""),
    purchaseLink: String(form.get("purchaseLink") ?? ""),
    primaryCategory: String(form.get("primaryCategory") ?? ""),
    secondaryCategories,
    otherCategoryLabel: String(form.get("otherCategoryLabel") ?? ""),
    consent: form.get("consent") === "true",
  };

  const parsed = submitBookSchema(await getCategoryNames()).safeParse(raw);
  if (!parsed.success) {
    return NextResponse.json({ error: "validation", issues: parsed.error.issues }, { status: 400 });
  }
  const data = parsed.data;

  const coverImage = form.get("coverImage");
  if (!(coverImage instanceof File) || coverImage.size === 0) {
    return NextResponse.json(
      { error: "validation", issues: [{ path: ["coverImage"], message: "A cover image is required." }] },
      { status: 400 }
    );
  }
  if (!ACCEPTED_IMAGE_TYPES.includes(coverImage.type)) {
    return NextResponse.json(
      {
        error: "validation",
        issues: [{ path: ["coverImage"], message: "Cover image must be a JPG or PNG file." }],
      },
      { status: 400 }
    );
  }

  const buffer = Buffer.from(await coverImage.arrayBuffer());
  const coverImageUrl = await uploadCoverImage(buffer, coverImage.type);

  const secondary = data.secondaryCategories.filter((c) => c !== data.primaryCategory);
  const fields = {
    title: data.title,
    author: data.author,
    primaryCategory: data.primaryCategory,
    secondaryCategories: JSON.stringify(secondary),
    // Extra categories are free, so they're shown as soon as the book is approved.
    categoryAddonPaid: secondary.length > 0,
    otherCategoryLabel: data.otherCategoryLabel || null,
  };

  const book = await prisma.book.create({
    data: {
      ...fields,
      ...derivedFields(fields),
      email: data.email,
      phone: data.phone,
      description: data.description || null,
      coverImageUrl,
      purchaseLink: data.purchaseLink,
      status: "pending",
    },
  });

  return NextResponse.json({ bookId: book.id });
}
