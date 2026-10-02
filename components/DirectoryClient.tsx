"use client";

import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { BookPage, PublicBook } from "@/lib/books";
import { hostViewport, isEmbedded, onHostViewport, postToHost, scrollToElement } from "@/lib/embed-client";
import BookCard from "./BookCard";

// Start loading the next batch when the end of the list is this close.
const PRELOAD_PX = 600;
const RESTORE_KEY = "ei-directory-v1";
const RESTORE_MAX_AGE_MS = 30 * 60 * 1000;

type Filters = { q: string; category: string };
type LoadState = "idle" | "loading" | "error";

type Saved = BookPage & { key: string; scrollY: number; at: number };

const filterKey = (f: Filters) => JSON.stringify([f.q.trim().toLowerCase(), f.category]);

function useDebounced<T>(value: T, delay: number): T {
  const [debounced, setDebounced] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return debounced;
}

function readSaved(): Saved | null {
  try {
    const raw = sessionStorage.getItem(RESTORE_KEY);
    return raw ? (JSON.parse(raw) as Saved) : null;
  } catch {
    return null;
  }
}

function writeSaved(value: Saved) {
  try {
    sessionStorage.setItem(RESTORE_KEY, JSON.stringify(value));
  } catch {}
}

async function fetchPage(filters: Filters, after: string | null): Promise<BookPage> {
  const params = new URLSearchParams();
  if (filters.q.trim()) params.set("q", filters.q.trim());
  if (filters.category) params.set("category", filters.category);
  if (after) params.set("after", after);
  const res = await fetch(`/api/books?${params}`, { cache: "no-store" });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

function mergeUnique(existing: PublicBook[], incoming: PublicBook[]): PublicBook[] {
  const seen = new Set(existing.map((b) => b.id));
  return [...existing, ...incoming.filter((b) => !seen.has(b.id))];
}

export default function DirectoryClient({
  initialPage,
  initialFilters,
  categories,
  spotlight,
  startedAfter,
}: {
  initialPage: BookPage;
  initialFilters: Filters;
  categories: string[];
  spotlight: ReactNode;
  startedAfter: boolean;
}) {
  const [query, setQuery] = useState(initialFilters.q);
  const [category, setCategory] = useState(initialFilters.category);
  const debouncedQuery = useDebounced(query, 250);
  const applied: Filters = { q: debouncedQuery, category };
  const appliedKey = filterKey(applied);

  const [books, setBooks] = useState(initialPage.books);
  const [nextCursor, setNextCursor] = useState(initialPage.nextCursor);
  const [total, setTotal] = useState(initialPage.total);
  const [loadState, setLoadState] = useState<LoadState>("idle");
  const [refreshing, setRefreshing] = useState(false);
  const [showTop, setShowTop] = useState(false);
  const [topButtonOffset, setTopButtonOffset] = useState<number | null>(null);

  const listTopRef = useRef<HTMLDivElement>(null);
  const sentinelRef = useRef<HTMLDivElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const requestSeq = useRef(0);
  const lastAppliedKey = useRef(appliedKey);

  // Latest values for callbacks that outlive a render (observers, listeners).
  const live = useRef({ books, nextCursor, total, loadState, refreshing, applied });
  useEffect(() => {
    live.current = { books, nextCursor, total, loadState, refreshing, applied };
  });

  const filtersActive = Boolean(applied.q.trim() || applied.category);

  // --- Restore the list after the reader comes back with the Back button ---
  useEffect(() => {
    if (startedAfter) return;
    const saved = readSaved();
    if (!saved || saved.key !== filterKey(initialFilters) || Date.now() - saved.at > RESTORE_MAX_AGE_MS) return;
    if (saved.books.length <= initialPage.books.length) return;
    const frame = requestAnimationFrame(() => {
      setBooks(saved.books);
      setNextCursor(saved.nextCursor);
      setTotal(saved.total);
      if (!isEmbedded()) requestAnimationFrame(() => window.scrollTo(0, saved.scrollY));
    });
    return () => cancelAnimationFrame(frame);
    // Runs once on mount by design.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    const save = () => {
      const s = live.current;
      writeSaved({
        key: filterKey(s.applied),
        books: s.books,
        nextCursor: s.nextCursor,
        total: s.total,
        scrollY: window.scrollY,
        at: Date.now(),
      });
    };
    const onVisibility = () => document.visibilityState === "hidden" && save();
    window.addEventListener("pagehide", save);
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      window.removeEventListener("pagehide", save);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, []);

  // --- Search / category change: reset to the first batch from the server ---
  const loadFirstBatch = useCallback((filters: Filters) => {
    const seq = ++requestSeq.current;
    setRefreshing(true);
    setLoadState("loading");
    fetchPage(filters, null)
      .then((page) => {
        if (seq !== requestSeq.current) return;
        setBooks(page.books);
        setNextCursor(page.nextCursor);
        setTotal(page.total);
        setLoadState("idle");
        setRefreshing(false);
        const top = listTopRef.current;
        if (top && top.getBoundingClientRect().top < 0) scrollToElement(top);
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        setLoadState("error");
      });
  }, []);

  useEffect(() => {
    if (lastAppliedKey.current === appliedKey) return;
    lastAppliedKey.current = appliedKey;

    const url = new URL(window.location.href);
    const q = debouncedQuery.trim();
    if (q) url.searchParams.set("q", q);
    else url.searchParams.delete("q");
    if (category) url.searchParams.set("category", category);
    else url.searchParams.delete("category");
    url.searchParams.delete("after");
    window.history.replaceState(window.history.state, "", url);
    postToHost("state", { q, category });

    loadFirstBatch({ q, category });
  }, [appliedKey, debouncedQuery, category, loadFirstBatch]);

  // --- Continuous scroll ---
  const loadMore = useCallback(() => {
    const s = live.current;
    if (!s.nextCursor || s.loadState === "loading" || s.refreshing) return;
    const seq = ++requestSeq.current;
    // Mark in-flight now, before the re-render, so an observer and a host
    // scroll message firing in the same frame can't request the batch twice.
    s.loadState = "loading";
    setLoadState("loading");
    fetchPage(s.applied, s.nextCursor)
      .then((page) => {
        if (seq !== requestSeq.current) return;
        setBooks((prev) => mergeUnique(prev, page.books));
        setNextCursor(page.nextCursor);
        setTotal(page.total);
        setLoadState("idle");
      })
      .catch(() => {
        if (seq !== requestSeq.current) return;
        setLoadState("error");
      });
  }, []);

  const checkSentinel = useCallback(() => {
    const s = live.current;
    const sentinel = sentinelRef.current;
    if (!sentinel || !s.nextCursor || s.loadState !== "idle" || s.refreshing) return;
    const top = sentinel.getBoundingClientRect().top;
    const host = isEmbedded() ? hostViewport() : null;
    // Embedded: the iframe is as tall as its content, so measure against the
    // host page's viewport instead of the iframe's own.
    const visibleBottom = host ? host.viewportHeight - host.iframeTop : window.innerHeight;
    if (top < visibleBottom + PRELOAD_PX) loadMore();
  }, [loadMore]);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      (entries) => {
        if (entries.some((e) => e.isIntersecting) && !(isEmbedded() && hostViewport())) checkSentinel();
      },
      { rootMargin: `0px 0px ${PRELOAD_PX}px 0px` }
    );
    observer.observe(sentinel);
    const off = onHostViewport(checkSentinel);
    return () => {
      observer.disconnect();
      off();
    };
  }, [checkSentinel]);

  // After each batch lands, the sentinel may still be on screen (tall
  // screens, fast scrolling), and an observer won't fire again on its own.
  useEffect(() => {
    if (loadState === "idle" && !refreshing) checkSentinel();
  }, [books.length, loadState, refreshing, checkSentinel]);

  // --- Back to top ---
  useEffect(() => {
    const update = () => {
      const host = isEmbedded() ? hostViewport() : null;
      if (host) {
        const scrolled = -host.iframeTop;
        setShowTop(scrolled > host.viewportHeight * 2.5);
        // Keep it inside the content so it never makes the iframe taller.
        const contentHeight = document.getElementById("ei-root")?.offsetHeight ?? 0;
        setTopButtonOffset(Math.max(0, Math.min(scrolled + host.viewportHeight - 72, contentHeight - 56)));
      } else {
        setShowTop(window.scrollY > window.innerHeight * 2.5);
        setTopButtonOffset(null);
      }
    };
    update();
    window.addEventListener("scroll", update, { passive: true });
    const off = onHostViewport(update);
    return () => {
      window.removeEventListener("scroll", update);
      off();
    };
  }, []);

  function backToTop() {
    const root = document.getElementById("ei-root");
    if (isEmbedded() && hostViewport()) postToHost("scroll-to", { top: 0 });
    else if (root) window.scrollTo({ top: 0, behavior: "smooth" });
    searchRef.current?.focus({ preventScroll: true });
  }

  function clearFilters() {
    setQuery("");
    setCategory("");
    searchRef.current?.focus();
  }

  const noscriptHref = (() => {
    if (!initialPage.nextCursor) return null;
    const params = new URLSearchParams();
    if (initialFilters.q) params.set("q", initialFilters.q);
    if (initialFilters.category) params.set("category", initialFilters.category);
    params.set("after", initialPage.nextCursor);
    return `?${params}`;
  })();

  return (
    <>
      {!filtersActive && !startedAfter && spotlight}

      <section aria-labelledby="all-books-heading" className="mx-auto max-w-[1200px] px-4 py-14 sm:px-8 sm:py-20">
        <div ref={listTopRef} className="scroll-mt-4">
          <p className="label text-[12px] text-brass-text">The Full Collection</p>
          <h2 id="all-books-heading" className="font-display mt-1 text-[21px] leading-tight sm:text-[25px]">
            All Empowered Ink Books
          </h2>
        </div>

        <div className="mt-6 border-y border-hairline py-5">
          <label htmlFor="ei-search" className="label block text-[12px] text-soft">
            Search books
          </label>
          <input
            ref={searchRef}
            id="ei-search"
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Title, author or category"
            autoComplete="off"
            className="mt-2 w-full max-w-xl border border-hairline bg-white px-3 py-2 text-[13px] text-ink placeholder:text-muted-text focus:border-ink focus:outline-none"
          />

          <div role="group" aria-label="Filter by category" className="mt-4 flex flex-wrap gap-1.5 sm:mt-5 sm:gap-2">
            {["", ...categories].map((c) => {
              const active = category === c;
              return (
                <button
                  key={c || "all"}
                  type="button"
                  aria-pressed={active}
                  onClick={() => setCategory(c)}
                  className={`whitespace-nowrap border px-2.5 py-1.5 text-[12px] ${
                    active
                      ? "border-plum bg-plum text-ivory"
                      : "border-hairline bg-transparent text-soft hover:border-brass hover:text-brass-text"
                  }`}
                >
                  {c || "All"}
                </button>
              );
            })}
          </div>
        </div>

        <p aria-live="polite" className="mt-3.5 text-[12px] text-muted-text">
          {total === 0 && !refreshing
            ? ""
            : `Showing ${books.length} of ${total} ${total === 1 ? "book" : "books"} · A to Z by title`}
        </p>

        {books.length === 0 && !refreshing ? (
          <div className="py-16 text-center">
            <p className="font-display text-[22px]">No books match that search</p>
            <button
              type="button"
              onClick={clearFilters}
              className="mt-3 text-[14px] underline decoration-1 underline-offset-4 hover:text-brass-text"
            >
              Clear search and filters
            </button>
          </div>
        ) : (
          <ul
            aria-busy={refreshing}
            className={`mt-5 grid grid-cols-2 gap-x-4 gap-y-6 sm:grid-cols-4 sm:gap-x-4 desk:grid-cols-8 desk:gap-x-4 ${
              refreshing ? "opacity-50" : ""
            }`}
          >
            {books.map((book, i) => (
              <li key={book.id}>
                <BookCard book={book} size="compact" eager={i < 8} />
              </li>
            ))}
          </ul>
        )}

        <div ref={sentinelRef} aria-hidden="true" className="h-px" />

        <div aria-live="polite" className="mt-10 text-center text-[13px] text-muted-text">
          {loadState === "loading" && !refreshing && (
            <>
              <span className="sr-only">Loading more books</span>
              <div aria-hidden="true" className="-mt-4 grid grid-cols-2 gap-x-4 sm:grid-cols-4 sm:gap-x-4 desk:grid-cols-8 desk:gap-x-4">
                {Array.from({ length: 8 }, (_, i) => (
                  <div key={i} className={i >= 4 ? "hidden desk:block" : i >= 2 ? "hidden sm:block" : ""}>
                    <div className="skeleton aspect-[2/3] bg-cover" />
                    <div className="skeleton mt-3 h-3 w-2/3 bg-cover" />
                    <div className="skeleton mt-2 h-3 w-1/2 bg-cover" />
                  </div>
                ))}
              </div>
            </>
          )}
          {loadState === "error" && (
            <p>
              Couldn&rsquo;t load more books.{" "}
              <button
                type="button"
                onClick={() => (refreshing ? loadFirstBatch(live.current.applied) : loadMore())}
                className="underline decoration-1 underline-offset-4 hover:text-brass-text"
              >
                Try again
              </button>
            </p>
          )}
          {!nextCursor && books.length > 0 && loadState === "idle" && !refreshing && (
            <p className="font-display italic text-[15px] text-soft">You&rsquo;ve reached the end of the shelf</p>
          )}
        </div>

        {noscriptHref && (
          <noscript>
            <p className="mt-6 text-center">
              <a href={noscriptHref} className="text-[14px] underline decoration-1 underline-offset-4">
                Load more books
              </a>
            </p>
          </noscript>
        )}
        {startedAfter && (
          <p className="mt-6 text-center">
            <a href="?" className="text-[14px] underline decoration-1 underline-offset-4">
              Back to the start of the list
            </a>
          </p>
        )}
      </section>

      {showTop && (
        <button
          type="button"
          onClick={backToTop}
          style={topButtonOffset !== null ? { position: "absolute", top: topButtonOffset, bottom: "auto" } : undefined}
          className="fixed bottom-5 right-4 z-20 border border-hairline bg-ivory px-3.5 py-2 text-[13px] text-soft shadow-sm hover:border-brass hover:text-brass-text sm:right-8"
        >
          Back to top <span aria-hidden="true">↑</span>
        </button>
      )}
    </>
  );
}
