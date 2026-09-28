# Empowered Ink

Book directory and submission flow for [Possible Woman Magazine](https://possiblewomanmagazine.com).

- `/empowered-ink` — the directory, built to be **embedded** in the magazine page between its own header, hero
  and footer (see [Embedding](#embedding-on-the-magazine-site)).
- `/book-feature-submission-form` — the free author submission form, with three shareable links (like the member
  directory's `/join?tier=…` links):
  - `?type=featured` — Featured Author Submission
  - `?type=new` — Book of the Month (New on the Shelf) Submission
  - `?type=list` — Add Your Book (A–Z list)

  Authors enter their name, email and phone (private), title, cover, purchase link and one category. Every
  submission waits in `/admin` as pending, marked with the link it came from and with Approve preset to match;
  the owner can still place it anywhere. Add `&embed=1` to embed the form in another page (it then drops its own
  header and footer), using the same iframe + `embed.js` snippet as the directory.
- `/admin` — the owner's review and editing screens, behind a single password.

## Stack

Next.js (App Router) + TypeScript + Tailwind v4 + Prisma + Postgres + Cloudinary (with a local-disk
fallback for covers).

## Local development

You need a Postgres database (any local install, Docker, or a Render dev database).

```bash
npm install
cp .env.local.example .env.local   # set DATABASE_URL; placeholders are fine for the rest
cp .env.local.example .env         # Prisma's CLI reads .env, Next reads .env.local
npx prisma migrate dev             # applies the schema
npx prisma db seed                 # sample books placed relative to the current month
npm run dev
```

The seed always exercises every section: 3 Featured this month, 14 New on the Shelf (more than the 12 shown before
"Show all"), a lapsed Featured book, a book scheduled for next month, a pending and a rejected submission, and enough
A–Z books for several batches of scroll.

## How the directory decides where a book goes

Every approved book appears in exactly one place, computed **when the page loads** from the book's `placement`,
its `placementMonth` ("YYYY-MM") and the current month in **America/Denver** time. Nothing runs on a schedule and
nothing is edited when a month rolls over.

| The book's placement month is… | It shows in |
| --- | --- |
| a later month | nowhere yet (scheduled) |
| this month | its section: **Featured This Month** or **New on the Shelf** |
| an earlier month, or no placement | **All Empowered Ink Books** (A to Z) |

- The owner chooses the section and month in `/admin` when approving or adding a book, and can change either at
  any time. Approving defaults to New on the Shelf for the current month. There is no payment: placement is always
  the owner's choice.
- With a search or category active, both spotlight sections are hidden and every visible book is searched in one
  A–Z list, so a reader looking for a featured or new title always finds it.
- Empty sections are hidden. New on the Shelf shows 12 books, then "Show all N new books".

Logic: `lib/books.ts` (`sectionOf` and the queries), `lib/month.ts` (Denver months).

## Alphabetical order

Each book stores a `sortTitle` (lowercased, accents removed, punctuation and a leading "The", "A" or "An"
ignored), recomputed on every create, edit and category rename, and the database sorts on `(sortTitle, id)`. The
rules live in `lib/normalize.mjs`. `npm start` runs `scripts/backfill.mjs` first, which recomputes any stale
`sortTitle` / `searchText` / `categories` values, so a fresh migration or a rule change needs no manual step.

## Continuous scroll

The A–Z list renders its first 24 books on the server, then loads 24 more from `GET /api/books` as the reader
nears the end (about 600px early), using a keyset cursor on `(sortTitle, id)`, so books approved mid-visit cause no
duplicates or skips. Search (`?q=`) and category (`?category=`) run on the server against the whole list and are
kept in the URL. The list restores itself and the scroll position when the reader comes back with Back, shows
"You've reached the end of the shelf" and stops requesting at the end, and falls back to a "Load more books" link
without JavaScript. Component: `components/DirectoryClient.tsx`.

## Admin

`/admin` (password = `ADMIN_PASSWORD`; the session cookie is signed, so it can't be forged by hand):

- **Books** — Pending / Approved / Rejected / All; approve with a section and month, reject or unpublish, feature
  or un-feature, and edit every field including the cover and the approved date. Each book shows which section it
  is in right now.
- **Add a Featured book** — `/admin/add?placement=featured`
- **Add a New on the Shelf book** — `/admin/add?placement=new`
- **Add to the A–Z list** — `/admin/add?placement=list` (for books already on the site; no spotlight month)

  Books added here are approved immediately, and the form reopens empty for the next one. Pick a later month to
  schedule a Featured or New on the Shelf book.
- **Categories** — rename (updates every book), add, and see how many books use each. This list feeds the
  submission form, validation and the directory's category buttons (a button only appears once a visible book
  uses the category).

## Embedding on the magazine site

Paste this where the directory should appear, between the page's header/hero and footer (replace `YOUR-APP` with
the app's address):

```html
<iframe id="empowered-ink" src="https://YOUR-APP/empowered-ink"
        title="Empowered Ink book directory"
        style="display:block;width:100%;border:0;min-height:900px"></iframe>
<script src="https://YOUR-APP/embed.js" defer></script>
```

`embed.js` sizes the iframe to its content (no inner scrollbar), tells the directory where the reader is on the
page so continuous scroll and "Back to top" work, copies `?q=` / `?category=` into the magazine page's address bar
so searches can be shared, and returns the reader to the same place when they come back.

"Learn more" opens the book's link in a new tab; "Submit Your Book" opens the submission form in the whole window.

## Deploying to Render

1. **Create a Render Postgres instance** and copy its internal connection string.
2. **Create a Render Web Service** connected to this repo:
   - Build command: `npm install && npx prisma migrate deploy && npm run build`
   - Start command: `npm run start` (runs the backfill, then the app)
3. **Environment variables** (Render dashboard → Environment — never commit these):
   - `DATABASE_URL` — the Render Postgres connection string
   - `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET` — or leave unset and attach a disk at
     `/opt/render/project/src/public/uploads`
   - `ADMIN_PASSWORD` — password for `/admin`; optionally `ADMIN_SESSION_SECRET` to sign sessions with a
     separate secret
   - `NEXT_PUBLIC_DIRECTORY_PAGE_URL` — the magazine page that embeds the directory ("Back to the Directory")

Any Stripe variables or webhook left over from the earlier version can be deleted; the app no longer uses them.

The `directory_sections` migration only adds columns and a table. It stamps existing approved books as approved on
their submission date and keeps any Featured listing that is still running in Featured, so no existing book shows
up as New on the Shelf. The old Stripe columns (`stripeSessionId`, `categoryAddonPaid`) stay in the table so no data
is lost; `categoryAddonPaid` now just means "show the extra categories".
