import type { PublicBook } from "@/lib/books";
import BookCover from "./BookCover";

type Size = "featured" | "shelf" | "compact";

const STYLES: Record<Size, { title: string; author: string; label: string; gap: string; cover: string }> = {
  featured: { title: "text-[20px] leading-tight", author: "text-[13.5px]", label: "text-[14.5px]", gap: "gap-2", cover: "text-[18px]" },
  shelf: { title: "text-[17px] leading-snug", author: "text-[13px]", label: "text-[14px]", gap: "gap-1.5", cover: "text-[15px]" },
  compact: { title: "text-[15px] leading-snug", author: "text-[12.5px]", label: "text-[13.5px]", gap: "gap-1", cover: "text-[13px]" },
};

// The whole card is one link to the book's page, opening in a new tab.
export default function BookCard({
  book,
  size,
  eager = false,
}: {
  book: PublicBook;
  size: Size;
  eager?: boolean;
}) {
  const s = STYLES[size];
  return (
    <a
      href={book.purchaseLink}
      target="_blank"
      rel="noopener noreferrer"
      className="group flex h-full flex-col text-ink"
    >
      <BookCover
        title={book.title}
        author={book.author}
        coverImageUrl={book.coverImageUrl}
        eager={eager}
        titleSize={s.cover}
      />
      <div className={`flex flex-1 flex-col pt-3 ${s.gap}`}>
        <span className={`label text-brass-text ${s.label}`}>{book.categoryLabel}</span>
        <span className={`font-display text-ink group-hover:text-brass-text ${s.title}`}>{book.title}</span>
        <span className={`text-soft ${s.author}`}>{size === "featured" ? `By ${book.author}` : book.author}</span>
        {size === "featured" && book.description && (
          <span className="line-clamp-1 text-[13.5px] text-soft">{book.description}</span>
        )}
        <span
          className={`mt-auto pt-1.5 underline decoration-1 underline-offset-4 group-hover:text-brass-text ${
            size === "compact" ? "text-[12.5px]" : "text-[13px]"
          }`}
        >
          Learn more<span className="sr-only"> about {book.title} (opens in a new tab)</span>
        </span>
      </div>
    </a>
  );
}
