import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { stripe } from "@/lib/stripe";
import { uploadCoverImage } from "@/lib/cloudinary";
import { submitBookSchema, ACCEPTED_IMAGE_TYPES } from "@/lib/validation";
import { FEATURED_PRICE_CENTS, CATEGORY_ADDON_PRICE_CENTS } from "@/lib/categories";

export async function POST(req: Request) {
  const form = await req.formData();

  const raw = {
    author: String(form.get("author") ?? ""),
    email: String(form.get("email") ?? ""),
    phone: String(form.get("phone") ?? ""),
    title: String(form.get("title") ?? ""),
    description: String(form.get("description") ?? ""),
    purchaseLink: String(form.get("purchaseLink") ?? ""),
    primaryCategory: String(form.get("primaryCategory") ?? ""),
    secondaryCategories: JSON.parse(String(form.get("secondaryCategories") ?? "[]")),
    otherCategoryLabel: String(form.get("otherCategoryLabel") ?? ""),
    isFeatured: form.get("isFeatured") === "true",
    addCategories: form.get("addCategories") === "true",
    consent: form.get("consent") === "true",
  };

  const parsed = submitBookSchema.safeParse(raw);
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

  const wantsFeatured = data.isFeatured;
  const wantsAddon = data.addCategories && data.secondaryCategories.length > 0;

  const book = await prisma.book.create({
    data: {
      title: data.title,
      author: data.author,
      email: data.email,
      phone: data.phone,
      description: data.description || null,
      coverImageUrl,
      purchaseLink: data.purchaseLink,
      primaryCategory: data.primaryCategory,
      secondaryCategories: JSON.stringify(data.secondaryCategories),
      otherCategoryLabel: data.otherCategoryLabel || null,
      isFeatured: false,
      featuredUntil: null,
      categoryAddonPaid: false,
      status: "pending",
    },
  });

  if (!wantsFeatured && !wantsAddon) {
    return NextResponse.json({ free: true, bookId: book.id });
  }

  const lineItems: { price_data: { currency: string; product_data: { name: string; description: string }; unit_amount: number }; quantity: number }[] = [];
  if (wantsFeatured) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Featured Placement",
          description: "Empowered Ink Featured Placement — runs through the end of this month",
        },
        unit_amount: FEATURED_PRICE_CENTS,
      },
      quantity: 1,
    });
  }
  if (wantsAddon) {
    lineItems.push({
      price_data: {
        currency: "usd",
        product_data: {
          name: "Additional Categories",
          description: "Empowered Ink — up to 2 additional category placements",
        },
        unit_amount: CATEGORY_ADDON_PRICE_CENTS,
      },
      quantity: 1,
    });
  }

  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  try {
    const session = await stripe.checkout.sessions.create({
      mode: "payment",
      line_items: lineItems,
      success_url: `${siteUrl}/book-feature-submission-form/thank-you?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${siteUrl}/book-feature-submission-form?canceled=1`,
      metadata: {
        bookId: book.id,
        featured: String(wantsFeatured),
        categoryAddon: String(wantsAddon),
      },
    });

    await prisma.book.update({
      where: { id: book.id },
      data: { stripeSessionId: session.id },
    });

    return NextResponse.json({ free: false, checkoutUrl: session.url, bookId: book.id });
  } catch {
    await prisma.book.delete({ where: { id: book.id } });
    return NextResponse.json(
      { error: "checkout", message: "We couldn't start checkout for your upgrade. Please try again." },
      { status: 502 }
    );
  }
}
