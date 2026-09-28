import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { uploadCoverImage } from "@/lib/cloudinary";
import { submitBookSchema, ACCEPTED_IMAGE_TYPES } from "@/lib/validation";
import { getCategoryNames } from "@/lib/categories";
import { derivedFields } from "@/lib/normalize.mjs";
import { SUBMISSION_TYPES, submissionTypeOf } from "@/lib/submission-types";

// Author submissions are free and limited to the essentials: author, contact
// details, title, cover, purchase link and one category. Descriptions and
// extra categories are only ever set by the owner in /admin, so anything
// else sent here is ignored. Every submission is saved as pending; the owner
// approves it and chooses Featured, New on the Shelf or the A–Z list.
export async function POST(req: Request) {
  const form = await req.formData();

  const raw = {
    author: String(form.get("author") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    title: String(form.get("title") ?? ""),
    purchaseLink: String(form.get("purchaseLink") ?? ""),
    primaryCategory: String(form.get("primaryCategory") ?? ""),
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

  const fields = {
    title: data.title,
    author: data.author,
    primaryCategory: data.primaryCategory,
    secondaryCategories: "[]",
    // Extra categories the owner adds in /admin show without a further step.
    categoryAddonPaid: true,
    otherCategoryLabel: data.primaryCategory === "Other" ? data.otherCategoryLabel || null : null,
  };

  const book = await prisma.book.create({
    data: {
      ...fields,
      ...derivedFields(fields),
      email: data.email,
      phone: data.phone,
      description: null,
      coverImageUrl,
      purchaseLink: data.purchaseLink,
      status: "pending",
      requestedPlacement: (() => {
        const type = submissionTypeOf(form.get("type"));
        return type ? SUBMISSION_TYPES[type].requested : null;
      })(),
    },
  });

  return NextResponse.json({ bookId: book.id });
}
