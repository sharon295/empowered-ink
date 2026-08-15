import { NextResponse } from "next/server";
import Stripe from "stripe";
import { stripe } from "@/lib/stripe";
import { prisma } from "@/lib/prisma";
import { lastDayOfCurrentMonth } from "@/lib/categories";

export async function POST(req: Request) {
  const body = await req.text();
  const signature = req.headers.get("stripe-signature");
  const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET;

  let event: Stripe.Event;
  try {
    if (!signature || !webhookSecret) throw new Error("Missing signature or webhook secret");
    event = stripe.webhooks.constructEvent(body, signature, webhookSecret);
  } catch (err) {
    return NextResponse.json({ error: `Webhook signature verification failed: ${err}` }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object as Stripe.Checkout.Session;
    const bookId = session.metadata?.bookId;
    if (bookId) {
      const featured = session.metadata?.featured === "true";
      const categoryAddon = session.metadata?.categoryAddon === "true";

      await prisma.book.update({
        where: { id: bookId },
        data: {
          // Featured bundles all 3 categories for free, so it also unlocks
          // categoryAddonPaid; categoryAddon is the separate $35 path for a
          // Standard listing (mutually exclusive with featured, see /api/submit).
          ...(featured ? { isFeatured: true, featuredUntil: lastDayOfCurrentMonth(), categoryAddonPaid: true } : {}),
          ...(categoryAddon ? { categoryAddonPaid: true } : {}),
        },
      });
    }
  }

  return NextResponse.json({ received: true });
}
