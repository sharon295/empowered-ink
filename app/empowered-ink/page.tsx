import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import DirectoryClient from "@/components/DirectoryClient";
import { CATEGORIES } from "@/lib/categories";
import { getApprovedBooks } from "@/lib/books";

export const revalidate = 0;

export default async function EmpoweredInkPage() {
  const books = await getApprovedBooks();
  const featuredCount = books.filter(
    (b) => b.isFeatured && b.featuredUntil && new Date() <= new Date(b.featuredUntil)
  ).length;

  return (
    <>
      <SiteNav active="directory" />

      <section className="relative overflow-hidden bg-gradient-to-b from-midnight-plum to-deep-plum py-18 pb-14 text-warm-white">
        <div className="mx-auto max-w-6xl px-8">
          <div className="mb-4.5 flex items-center gap-2.5 text-[11.5px] uppercase tracking-[0.22em] text-champagne-gold-light">
            <span className="h-px w-[34px] bg-champagne-gold-light" /> Empowered Ink · Book Directory
          </div>
          <h1 className="mb-4.5 max-w-xl font-display text-[42px] font-medium leading-[1.05] sm:text-[56px]">
            Every book has a <em className="font-accent text-champagne-gold-light">story</em>. So does its author.
          </h1>
          <p className="mb-7 max-w-lg text-[16.5px] leading-relaxed text-warm-white/80">
            Browse the women entrepreneurs and authors we&rsquo;ve featured — searchable by category and author,
            and ordered alphabetically so every book gets found.
          </p>
          <div className="mb-8 flex flex-wrap gap-9">
            <div>
              <b className="font-display block text-[26px]">{books.length}</b>
              <span className="text-[11px] uppercase tracking-wide text-warm-white/55">Books Listed</span>
            </div>
            <div>
              <b className="font-display block text-[26px]">{CATEGORIES.length - 1}</b>
              <span className="text-[11px] uppercase tracking-wide text-warm-white/55">Categories</span>
            </div>
            <div>
              <b className="font-display block text-[26px]">{featuredCount}</b>
              <span className="text-[11px] uppercase tracking-wide text-warm-white/55">Featured This Issue</span>
            </div>
          </div>
          <div className="flex flex-wrap gap-3.5">
            <Link
              href="/book-feature-submission-form"
              className="inline-flex items-center gap-2 rounded-sm bg-champagne-gold px-[26px] py-3.5 text-[12.5px] font-bold uppercase tracking-wider text-midnight-plum"
            >
              Submit Your Book
            </Link>
            <a
              href="#directory"
              className="inline-flex items-center gap-2 rounded-sm border border-warm-white/35 px-6 py-[13px] text-[12.5px] font-bold uppercase tracking-wider text-warm-white"
            >
              Browse the Directory
            </a>
          </div>
        </div>
      </section>

      <DirectoryClient books={books} />

      <section className="bg-midnight-plum">
        <div className="mx-auto max-w-6xl px-8 py-14">
          <div className="mb-7 flex flex-wrap items-baseline justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2.5 text-[11.5px] font-bold uppercase tracking-[0.2em] text-champagne-gold-light">
                <span className="h-px w-[26px] bg-champagne-gold-light" /> Submit Your Book
              </div>
              <h2 className="mt-1.5 font-display text-[30px] font-medium text-warm-white">
                Three ways to be featured
              </h2>
            </div>
            <p className="max-w-[360px] text-right text-[13px] text-warm-white/55">
              Every submission starts with the standard listing — the upgrades below are optional add-ons.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-px border border-warm-white/10 bg-warm-white/10 md:grid-cols-3">
            <div className="flex flex-col gap-4 bg-midnight-plum p-7">
              <div className="text-[11px] uppercase tracking-wider text-champagne-gold-light">Included</div>
              <h3 className="font-display text-[24px] font-medium text-warm-white">Standard Listing</h3>
              <div className="font-display text-[34px] text-champagne-gold-light">Free</div>
              <ul className="flex flex-col gap-2.5">
                {[
                  "Flat cover image",
                  "Title, author & purchase link",
                  "Placed alphabetically by title",
                  "1 free primary category, included in search",
                ].map((li) => (
                  <li key={li} className="flex gap-2.5 text-[13px] leading-relaxed text-warm-white/75">
                    <span className="font-bold text-champagne-gold-light">✓</span> {li}
                  </li>
                ))}
              </ul>
              <Link
                href="/book-feature-submission-form"
                className="mt-auto rounded-sm border border-warm-white/35 px-6 py-[13px] text-center text-[12.5px] font-bold uppercase tracking-wider text-warm-white"
              >
                Submit for Free
              </Link>
            </div>

            <div className="flex flex-col gap-4 bg-[#3a2440] p-7">
              <div className="text-[11px] uppercase tracking-wider text-champagne-gold-light">Most popular</div>
              <h3 className="font-display text-[24px] font-medium text-warm-white">Featured Placement</h3>
              <div className="font-display text-[34px] text-champagne-gold-light">
                $75 <span className="font-body text-[13px] text-warm-white/50">/ 1 month</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {[
                  "Upgraded, larger cover image",
                  "Top-of-page placement above standard listings",
                  "75–100 word author & book description",
                  "Runs through the end of the current month, then automatically moves into the standard directory",
                ].map((li) => (
                  <li key={li} className="flex gap-2.5 text-[13px] leading-relaxed text-warm-white/75">
                    <span className="font-bold text-champagne-gold-light">✓</span> {li}
                  </li>
                ))}
              </ul>
              <Link
                href="/book-feature-submission-form"
                className="mt-auto rounded-sm bg-champagne-gold px-6 py-3.5 text-center text-[12.5px] font-bold uppercase tracking-wider text-midnight-plum"
              >
                Get Featured
              </Link>
            </div>

            <div className="flex flex-col gap-4 bg-midnight-plum p-7">
              <div className="text-[11px] uppercase tracking-wider text-champagne-gold-light">Add-on</div>
              <h3 className="font-display text-[24px] font-medium text-warm-white">Category Placement</h3>
              <div className="font-display text-[34px] text-champagne-gold-light">
                $35 <span className="font-body text-[13px] text-warm-white/50">/ up to 2 extra categories</span>
              </div>
              <ul className="flex flex-col gap-2.5">
                {[
                  "Every listing includes 1 free primary category",
                  "Add up to 2 more for $35 (3 total)",
                  "Makes your book easier to discover by genre",
                  "Stack with Standard or Featured listings",
                ].map((li) => (
                  <li key={li} className="flex gap-2.5 text-[13px] leading-relaxed text-warm-white/75">
                    <span className="font-bold text-champagne-gold-light">✓</span> {li}
                  </li>
                ))}
              </ul>
              <Link
                href="/book-feature-submission-form"
                className="mt-auto rounded-sm border border-warm-white/35 px-6 py-[13px] text-center text-[12.5px] font-bold uppercase tracking-wider text-warm-white"
              >
                Add Categories
              </Link>
            </div>
          </div>
        </div>
      </section>

      <SiteFooter />
    </>
  );
}
