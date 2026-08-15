"use client";

import { useEffect, useMemo, useState } from "react";
import { CATEGORIES } from "@/lib/categories";
import type { PublicBook } from "@/lib/books";
import BookCover from "./BookCover";

const PAGE_SIZE = 16;

function isActiveFeatured(book: PublicBook): boolean {
  if (!book.isFeatured || !book.featuredUntil) return false;
  return new Date() <= new Date(book.featuredUntil);
}

function formatUntil(dateStr: string) {
  return new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric" });
}

function catLabel(book: PublicBook, cat: string) {
  return cat === "Other" && book.otherCategoryLabel ? `Other · ${book.otherCategoryLabel}` : cat;
}

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

export default function DirectoryClient({ books }: { books: PublicBook[] }) {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounced(query, 200);
  const [category, setCategory] = useState("all");
  const [sort, setSort] = useState<"az" | "za">("az");
  const [page, setPage] = useState(1);

  // Reset to page 1 whenever the filters change. Adjusted synchronously during
  // render (React's recommended pattern for derived state, using state rather
  // than a ref since refs can't be written during render) instead of a
  // useEffect, which would cause an extra cascading render.
  const filterKey = `${debouncedQuery}|${category}|${sort}`;
  const [prevFilterKey, setPrevFilterKey] = useState(filterKey);
  if (prevFilterKey !== filterKey) {
    setPrevFilterKey(filterKey);
    if (page !== 1) setPage(1);
  }

  const filtered = useMemo(() => {
    const q = debouncedQuery.trim().toLowerCase();
    return books.filter((b) => {
      const matchesQ = !q || b.title.toLowerCase().includes(q) || b.author.toLowerCase().includes(q);
      const matchesCat =
        category === "all" || b.primaryCategory === category || b.secondaryCategories.includes(category);
      return matchesQ && matchesCat;
    });
  }, [books, debouncedQuery, category]);

  const featured = useMemo(() => filtered.filter(isActiveFeatured), [filtered]);

  const standard = useMemo(() => {
    const nonFeatured = filtered
      .filter((b) => !isActiveFeatured(b))
      .slice()
      .sort((a, b) => a.title.localeCompare(b.title));
    if (sort === "za") nonFeatured.reverse();
    return nonFeatured;
  }, [filtered, sort]);

  const totalPages = Math.max(1, Math.ceil(standard.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pageItems = standard.slice((safePage - 1) * PAGE_SIZE, safePage * PAGE_SIZE);

  const pageNumbers = useMemo(() => {
    const pages: (number | "…")[] = [];
    for (let p = 1; p <= totalPages; p++) {
      if (p === 1 || p === totalPages || Math.abs(p - safePage) <= 1) pages.push(p);
      else if (pages[pages.length - 1] !== "…") pages.push("…");
    }
    return pages;
  }, [totalPages, safePage]);

  function goToPage(p: number) {
    setPage(p);
    document.getElementById("allBooksSection")?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  const groups = useMemo(() => {
    if (sort !== "az") return [{ letter: null as string | null, items: pageItems }];
    const result: { letter: string | null; items: PublicBook[] }[] = [];
    for (const b of pageItems) {
      const letter = b.title.charAt(0).toUpperCase();
      const last = result[result.length - 1];
      if (last && last.letter === letter) last.items.push(b);
      else result.push({ letter, items: [b] });
    }
    return result;
  }, [pageItems, sort]);

  return (
    <>
      <div className="sticky top-[57px] z-40 border-b border-warm-white/10 bg-midnight-plum">
        <div className="mx-auto flex max-w-6xl flex-wrap items-center gap-3.5 px-8 py-4">
          <div className="flex flex-col gap-1">
            <label htmlFor="searchAuthor" className="text-[10px] uppercase tracking-wider text-champagne-gold-light">
              Search by author or title
            </label>
            <input
              id="searchAuthor"
              type="text"
              placeholder="e.g. Sharon Ringier"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="min-w-[190px] rounded-sm border border-warm-white/20 bg-warm-white/[0.06] px-3 py-[9px] text-[13px] text-warm-white placeholder:text-warm-white/40 focus:outline focus:outline-1 focus:outline-champagne-gold-light"
            />
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="filterCategory" className="text-[10px] uppercase tracking-wider text-champagne-gold-light">
              Category
            </label>
            <select
              id="filterCategory"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="min-w-[180px] rounded-sm border border-warm-white/20 bg-warm-white/[0.06] px-3 py-[9px] text-[13px] text-warm-white focus:outline focus:outline-1 focus:outline-champagne-gold-light"
            >
              <option value="all">All categories</option>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1">
            <label htmlFor="sortOrder" className="text-[10px] uppercase tracking-wider text-champagne-gold-light">
              Sort
            </label>
            <select
              id="sortOrder"
              value={sort}
              onChange={(e) => setSort(e.target.value as "az" | "za")}
              className="min-w-[180px] rounded-sm border border-warm-white/20 bg-warm-white/[0.06] px-3 py-[9px] text-[13px] text-warm-white focus:outline focus:outline-1 focus:outline-champagne-gold-light"
            >
              <option value="az">Title, A–Z</option>
              <option value="za">Title, Z–A</option>
            </select>
          </div>
          <div className="ml-auto self-end pb-[9px] text-[12px] text-warm-white/60">
            <b className="text-warm-white">{standard.length}</b> books found
            {totalPages > 1 && (
              <>
                {" "}
                · page {safePage} of {totalPages}
              </>
            )}
          </div>
        </div>
      </div>

      <main className="mx-auto max-w-6xl px-8" id="directory">
        {featured.length > 0 && (
          <>
            <section className="py-14" id="featuredSection">
              <div className="mb-7 flex flex-wrap items-baseline justify-between gap-2.5">
                <div>
                  <div className="flex items-center gap-2.5 text-[11.5px] font-bold uppercase tracking-[0.2em] text-deep-plum">
                    <span className="h-px w-[26px] bg-champagne-gold" />
                    Featured Books
                  </div>
                  <h2 className="mt-1.5 text-[30px] font-medium">This issue&rsquo;s spotlight</h2>
                </div>
                <p className="max-w-[360px] text-right text-[13px] text-[#6b5865]">
                  Paid placement for the current issue — upgraded cover, top-of-page position, and a full author
                  description. Runs through the end of the month, then rolls into the standard directory
                  automatically.
                </p>
              </div>
              <div className="grid grid-cols-1 gap-[18px] sm:grid-cols-2 lg:grid-cols-3">
                {featured.map((b) => (
                  <div key={b.id} className="relative flex flex-col overflow-hidden rounded-sm border border-black/10 bg-white">
                    <span className="absolute left-2.5 top-2.5 z-10 rounded-sm bg-champagne-gold px-2 py-1 text-[9px] font-extrabold uppercase tracking-wider text-midnight-plum">
                      Featured
                    </span>
                    {b.featuredUntil && (
                      <span className="absolute right-2.5 top-2.5 z-10 rounded-sm bg-midnight-plum/80 px-2 py-1 text-[9px] font-semibold text-warm-white">
                        Through {formatUntil(b.featuredUntil)}
                      </span>
                    )}
                    <div className="aspect-[4/5] w-full">
                      <BookCover title={b.title} coverImageUrl={b.coverImageUrl} size="large" />
                    </div>
                    <div className="flex flex-col gap-[7px] px-4 pb-4 pt-3.5">
                      <div className="flex flex-wrap gap-1.5">
                        <span className="rounded-full bg-deep-plum/10 px-[7px] py-0.5 text-[9px] font-bold uppercase tracking-wide text-deep-plum">
                          {catLabel(b, b.primaryCategory)}
                        </span>
                        {b.secondaryCategories.map((c) => (
                          <span
                            key={c}
                            className="rounded-full border border-deep-plum/30 px-[7px] py-0.5 text-[9px] font-semibold uppercase tracking-wide text-[#6b5865]"
                          >
                            {catLabel(b, c)}
                          </span>
                        ))}
                      </div>
                      <h3 className="font-display text-[15.5px] leading-tight">{b.title}</h3>
                      <div className="text-[11.5px] text-[#8a7a86]">by {b.author}</div>
                      {b.description && (
                        <p className="line-clamp-4 text-[12px] leading-relaxed text-[#3f2a3a]">{b.description}</p>
                      )}
                      <a
                        href={b.purchaseLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wide text-deep-plum"
                      >
                        View Book →
                      </a>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="flex items-center gap-4 pt-1.5">
              <div className="h-px flex-1 bg-black/10" />
              <span className="h-[26px] w-[26px] text-deep-plum">✦</span>
              <div className="h-px flex-1 bg-black/10" />
            </div>
          </>
        )}

        <section className="py-14" id="allBooksSection">
          <div className="mb-7 flex flex-wrap items-baseline justify-between gap-2.5">
            <div>
              <div className="flex items-center gap-2.5 text-[11.5px] font-bold uppercase tracking-[0.2em] text-deep-plum">
                <span className="h-px w-[26px] bg-champagne-gold" />
                All Books
              </div>
              <h2 className="mt-1.5 text-[30px] font-medium">The full directory</h2>
            </div>
            <p className="max-w-[360px] text-right text-[13px] text-[#6b5865]">
              Ordered alphabetically by book title. Use search or the category filter above to narrow it down.
            </p>
          </div>

          {pageItems.length === 0 ? (
            <div className="py-12 text-center text-[14px] text-[#8a7a86]">
              No books match your search yet — try a different name or category.
            </div>
          ) : (
            <div className="max-w-[840px]">
              {groups.map((group, gi) => (
                <div key={group.letter ?? `flat-${gi}`}>
                  {group.letter && (
                    <div className="font-accent mb-3.5 mt-9 border-b border-black/10 pb-2 text-[24px] text-deep-plum first:mt-0">
                      {group.letter}
                    </div>
                  )}
                  <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-3 lg:grid-cols-4 lg:gap-3.5">
                    {group.items.map((b) => (
                      <div key={b.id} className="flex flex-col gap-1.5">
                        <div className="aspect-[3/4] w-full overflow-hidden rounded-sm border border-black/10">
                          <BookCover title={b.title} coverImageUrl={b.coverImageUrl} size="small" />
                        </div>
                        <h4 className="text-[12px] font-semibold leading-tight">{b.title}</h4>
                        <div className="text-[10.5px] text-[#8a7a86]">by {b.author}</div>
                        <a
                          href={b.purchaseLink}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[9.5px] font-bold uppercase tracking-wide text-deep-plum"
                        >
                          View →
                        </a>
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          )}

          {totalPages > 1 && (
            <nav className="mt-9 flex flex-wrap items-center justify-center gap-1.5" aria-label="Book directory pages">
              <button
                disabled={safePage === 1}
                onClick={() => goToPage(safePage - 1)}
                className="min-w-[38px] rounded-sm border border-black/10 px-[13px] py-2 text-[12.5px] font-semibold disabled:opacity-35 enabled:hover:border-deep-plum enabled:hover:text-deep-plum"
              >
                ‹ Prev
              </button>
              {pageNumbers.map((p, i) =>
                p === "…" ? (
                  <span key={`dots-${i}`} className="px-1 text-[12.5px] text-[#8a7a86]">
                    …
                  </span>
                ) : (
                  <button
                    key={p}
                    onClick={() => goToPage(p)}
                    className={
                      p === safePage
                        ? "min-w-[38px] cursor-default rounded-sm border border-deep-plum bg-deep-plum px-[13px] py-2 text-[12.5px] font-semibold text-warm-white"
                        : "min-w-[38px] rounded-sm border border-black/10 px-[13px] py-2 text-[12.5px] font-semibold hover:border-deep-plum hover:text-deep-plum"
                    }
                  >
                    {p}
                  </button>
                )
              )}
              <button
                disabled={safePage === totalPages}
                onClick={() => goToPage(safePage + 1)}
                className="min-w-[38px] rounded-sm border border-black/10 px-[13px] py-2 text-[12.5px] font-semibold disabled:opacity-35 enabled:hover:border-deep-plum enabled:hover:text-deep-plum"
              >
                Next ›
              </button>
            </nav>
          )}
        </section>
      </main>
    </>
  );
}
