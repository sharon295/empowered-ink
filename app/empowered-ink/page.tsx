import type { Metadata } from "next";
import DirectoryClient from "@/components/DirectoryClient";
import EmbedResizer from "@/components/EmbedResizer";
import BookCard from "@/components/BookCard";
import NewOnShelf from "@/components/NewOnShelf";
import { NEW_ON_SHELF_PREVIEW, getCategoryFacets, getSpotlight, listBooks } from "@/lib/books";
import { currentMonthKey } from "@/lib/month";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Empowered Ink Books — Possible Woman Magazine",
  description: "Books by the Possible Woman author community, A to Z.",
};

const SUBMIT_URL = process.env.NEXT_PUBLIC_SUBMIT_URL || "/book-feature-submission-form";

// Shown in the "For Authors" band at the bottom of the directory.
const CATEGORY_EMAIL = "sharon@impossiblewec.com";
const AUTHOR_NOTES = [
  "All submissions, featured and non-featured, run for one month.",
  "Whichever month you submit in, your book appears in the following month’s issue.",
  "Every book must be approved once it is submitted.",
  "Featured submissions are $75. Once paid, a link will be sent to you to submit your book.",
];

function param(value: string | string[] | undefined): string {
  return (Array.isArray(value) ? value[0] : value)?.slice(0, 200) ?? "";
}

// The directory is designed to be embedded between the magazine's own header,
// hero and footer (see README, "Embedding"), so it renders only the book
// sections and a closing submit band.
export default async function EmpoweredInkPage({ searchParams }: PageProps<"/empowered-ink">) {
  const params = await searchParams;
  const filters = { q: param(params.q), category: param(params.category) };
  const after = param(params.after) || null;
  const month = currentMonthKey();

  const [spotlight, firstPage, categories] = await Promise.all([
    getSpotlight(month),
    listBooks({ ...filters, after }, month),
    getCategoryFacets(month),
  ]);

  const spotlightSections = (
    <>
      {spotlight.featured.length > 0 && (
        <section aria-labelledby="featured-heading" className="mx-auto max-w-[1200px] px-4 pt-14 sm:px-8 sm:pt-20">
          <p className="label text-[12px] text-brass-text">Featured</p>
          <h2 id="featured-heading" className="font-display mt-1 text-[21px] leading-tight sm:text-[25px]">
            Featured This Month
          </h2>
          <p className="mt-1.5 max-w-2xl text-[12.5px] leading-snug text-soft">
            Featured listings rotate monthly and move into the full list when the month ends.
          </p>
          <ul className="mt-7 grid grid-cols-1 gap-x-6 gap-y-9 sm:grid-cols-2 desk:grid-cols-4">
            {spotlight.featured.map((book) => (
              <li key={book.id}>
                <BookCard book={book} size="featured" eager />
              </li>
            ))}
          </ul>
        </section>
      )}

      {spotlight.newOnShelf.length > 0 && (
        <section aria-labelledby="new-heading" className="mt-14 bg-tint sm:mt-20">
          <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-8 sm:py-20">
            <p className="label text-[12px] text-brass-text">New This Month</p>
            <h2 id="new-heading" className="font-display mt-1 text-[21px] leading-tight sm:text-[25px]">
              New on the Shelf
            </h2>
            <p className="mt-1.5 max-w-2xl text-[12.5px] leading-snug text-soft">
              Newly added to Empowered Ink this month. On the first of next month, each book moves into the full
              list below.
            </p>
            <NewOnShelf books={spotlight.newOnShelf} preview={NEW_ON_SHELF_PREVIEW} />
          </div>
        </section>
      )}
    </>
  );

  return (
    <main id="ei-root">
      <EmbedResizer />
      <DirectoryClient
        key={`${month}|${filters.q}|${filters.category}|${after ?? ""}`}
        initialPage={firstPage}
        initialFilters={filters}
        categories={categories}
        spotlight={spotlightSections}
        startedAfter={Boolean(after)}
      />

      <section className="bg-plum text-ivory">
        <div className="mx-auto max-w-[1200px] px-4 py-14 sm:px-8">
          <div className="flex flex-col items-start gap-6 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="label text-[12px] text-cover">For Authors</p>
              <h2 className="font-display mt-1 text-[19px] italic leading-tight sm:text-[22px]">
                Share your book with our community
              </h2>
            </div>
            <a
              href={SUBMIT_URL}
              target="_top"
              className="border border-ivory bg-ivory px-4 py-2 text-[12.5px] font-medium text-ink hover:border-brass hover:bg-brass hover:text-ink"
            >
              Submit Your Book
            </a>
          </div>

          <ul className="mt-8 grid max-w-4xl list-disc gap-x-10 gap-y-2.5 border-t border-white/15 pl-4 pt-7 text-[13px] leading-snug text-cover marker:text-brass sm:grid-cols-2">
            {AUTHOR_NOTES.map((note) => (
              <li key={note} className="pl-1">
                {note}
              </li>
            ))}
            <li className="pl-1">
              If your category isn&rsquo;t listed, please choose &ldquo;Other&rdquo;. You can also email{" "}
              <a
                href={`mailto:${CATEGORY_EMAIL}`}
                target="_top"
                className="text-ivory underline decoration-1 underline-offset-4 hover:text-brass"
              >
                {CATEGORY_EMAIL}
              </a>{" "}
              to suggest a category; if we receive enough submissions for it, it will be added.
            </li>
          </ul>
        </div>
      </section>
    </main>
  );
}
