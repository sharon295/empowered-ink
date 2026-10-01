"use client";

import { useRef, useState } from "react";
import type { PublicBook } from "@/lib/books";
import BookCard from "./BookCard";

// First `preview` books (already alphabetical), with a link that expands the
// rest in place. Focus moves to the first newly shown book so keyboard users
// continue from where the link was.
export default function NewOnShelf({ books, preview }: { books: PublicBook[]; preview: number }) {
  const [expanded, setExpanded] = useState(false);
  const listRef = useRef<HTMLUListElement>(null);
  const shown = expanded ? books : books.slice(0, preview);

  function expand() {
    setExpanded(true);
    requestAnimationFrame(() => {
      listRef.current?.querySelectorAll("a")[preview]?.focus();
    });
  }

  return (
    <>
      <ul ref={listRef} className="mt-7 grid grid-cols-2 gap-x-5 gap-y-8 sm:grid-cols-3 sm:gap-x-5 desk:grid-cols-6">
        {shown.map((book) => (
          <li key={book.id}>
            <BookCard book={book} size="shelf" />
          </li>
        ))}
      </ul>
      {!expanded && books.length > preview && (
        <p className="mt-10 text-center">
          <button
            type="button"
            onClick={expand}
            className="text-[14px] underline decoration-1 underline-offset-4 hover:text-brass-text"
          >
            Show all {books.length} new books
          </button>
        </p>
      )}
    </>
  );
}
