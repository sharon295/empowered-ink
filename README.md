# Empowered Ink

Book directory and submission flow for [Possible Woman Magazine](https://possiblewomanmagazine.com). Replaces the
static GHL directory page with a real, data-backed directory (`/empowered-ink`) and a submission form
(`/book-feature-submission-form`) that handles Standard / Featured / category-add-on pricing via Stripe Checkout.

Design reference for layout, copy tone, and interaction behavior: `empowered-ink-directory-mockup.html` in the repo root
(kept for reference only — the live pages are the Next.js routes below).

## Stack

Next.js (App Router) + TypeScript + Tailwind v4 + Prisma + Stripe + Cloudinary (with a local-disk fallback for
low-traffic/dev use). SQLite locally, Postgres in production.

## Local development

```bash
npm install
cp .env.local.example .env.local   # fill in real keys as you get them; placeholders are fine to start
npx prisma migrate dev             # creates prisma/dev.db and applies the schema
npx prisma db seed                 # seeds 30 sample books (3 active Featured, 1 lapsed, 1 pending)
npm run dev
```

Visit `http://localhost:3000/empowered-ink` for the directory, `/book-feature-submission-form` for the submission
form, and `/admin` for the review queue (password = `ADMIN_PASSWORD` env var).

### Cover image uploads without Cloudinary

`lib/cloudinary.ts` checks whether real `CLOUDINARY_*` env vars are set. If not, it saves uploads to
`public/uploads/` on local disk instead, so the submission form works end-to-end without a Cloudinary account.
This is also a legitimate low-traffic production option per Render's own-disk guidance (see Deploying, below) —
just leave the Cloudinary vars unset and attach a persistent disk to the Render service.

### Payments locally

Without a real `STRIPE_SECRET_KEY`, the free-submission path (no upgrades selected) works fully. Selecting
Featured and/or the category add-on will hit Stripe and fail cleanly with a 502 until you set real **test mode**
Stripe keys — see stripe.com/docs/keys. To exercise the webhook locally, use the Stripe CLI:

```bash
stripe listen --forward-to localhost:3000/api/webhooks/stripe
```

and put the `whsec_...` it prints into `STRIPE_WEBHOOK_SECRET`.

## Data model

Single `Book` table (`prisma/schema.prisma`). Only `status = "approved"` rows are ever returned to the public
directory (`lib/books.ts`); everything else is admin-gated. `isFeatured` / `featuredUntil` are only set by the
Stripe webhook on payment success, never at submit time — a Featured purchase on the 30th still runs through the
full following month because `featuredUntil` is computed at the moment payment clears, not at submission.
`secondaryCategories` are stored at submission time but only surfaced publicly once `categoryAddonPaid` is true.

The 16-category list lives in `lib/categories.ts` — it's the single source of truth for the form, the directory
filter, and validation.

## Deploying to Render

1. **Push to GitHub.** Render deploys from a GitHub repo on push to `main`.
2. **Switch the datasource for Postgres.** In `prisma/schema.prisma`, change:
   ```diff
   - provider = "sqlite"
   + provider = "postgresql"
   ```
   (Local dev intentionally uses SQLite for a zero-setup `npm install && npm run dev`; Render Postgres needs the
   `postgresql` provider. This is a one-line change before your first deploy.)
3. **Create a Render Postgres instance** (Render dashboard → New → PostgreSQL). Copy its internal connection
   string.
4. **Create a Render Web Service** connected to this repo:
   - Build command: `npm install && npx prisma migrate deploy && npm run build`
   - Start command: `npm run start`
   - Auto-deploy: on push to `main`
5. **Set environment variables** on the Web Service (Render dashboard → Environment — never commit these):
   - `DATABASE_URL` — the Render Postgres connection string from step 3
   - `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET` — from your Stripe dashboard (live keys for production)
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — if using Cloudinary. If you'd rather
     use a Render persistent disk instead (fine for this traffic level), leave these unset, attach a disk mounted
     at `/opt/render/project/src/public/uploads`, and covers will be written there instead.
   - `ADMIN_PASSWORD` — password for `/admin`
   - `NEXT_PUBLIC_SITE_URL` — the service's public URL (used to build Stripe success/cancel redirect URLs)
6. **Point Stripe's webhook** at `https://<your-render-url>/api/webhooks/stripe` for the `checkout.session.completed`
   event, and put the resulting signing secret into `STRIPE_WEBHOOK_SECRET`.

## Embedding on the GHL site

Preferred: point the GHL nav items ("Empowered Ink", "Book Feature Submission") straight at the Render URL (or a
custom subdomain like `empowered-ink.possiblewomanmagazine.com`) rather than embedding. This app has no vh-based
heights or `overflow` rules on its own containers, and pagination keeps each view a bounded height — so if it does
get embedded via iframe, add an iframe-resizer (postMessage-based) so the parent GHL page's scrollbar is used
instead of the iframe getting its own internal one. That's the same fix needed on the `community-events` page.

## Admin review

`/admin` is a single password gate (`ADMIN_PASSWORD`) with no per-user accounts — appropriate for one or two people
moderating submissions. It lists every `pending` book with Approve/Reject buttons; only `approved` rows are ever
queried by the public directory.
