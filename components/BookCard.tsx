import type { PublicBook } from "@/lib/books";
import BookCover from "./BookCover";
import FeaturedDescription from "./FeaturedDescription";

type Size = "featured" | "shelf" | "compact";

const STYLES: Record<Size, { title: string; author: string; label: string; gap: string; cover: string }> = {
  featured: { title: "text-[18px] leading-tight", author: "text-[13px] leading-snug", label: "text-[13px] leading-tight", gap: "gap-1", cover: "text-[16px]" },
  shelf: { title: "text-[15px] leading-tight", author: "text-[12.5px] leading-snug", label: "text-[12.5px] leading-tight", gap: "gap-1", cover: "text-[14px]" },
  compact: { title: "text-[13.5px] leading-tight", author: "text-[12px] leading-snug", label: "text-[12px] leading-tight", gap: "gap-0.5", cover: "text-[12px]" },
};

// The whole card is one link to the book's page, opening in a new tab.
// Featured cards are the exception: their description has a "Read more"
// button, which can't sit inside a link, so the cover/title block and the
// "Learn more" link are separate links around it.
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
  if (size === "featured") {
    return (
      <div className="flex h-full flex-col text-ink">
        <a href={book.purchaseLink} target="_blank" rel="noopener noreferrer" className="group flex flex-col">
          <BookCover
            title={book.title}
            author={book.author}
            coverImageUrl={book.coverImageUrl}
            eager={eager}
            titleSize={s.cover}
          />
          <span className={`flex flex-col pt-2 ${s.gap}`}>
            <span className={`label text-brass-text ${s.label}`}>{book.categoryLabel}</span>
            <span className={`font-display text-ink group-hover:text-brass-text ${s.title}`}>{book.title}</span>
            <span className={`text-soft ${s.author}`}>By {book.author}</span>
          </span>
          <span className="sr-only"> (opens in a new tab)</span>
        </a>
        {book.description && (
          <div className="pt-2">
            <FeaturedDescription text={book.description} title={book.title} />
          </div>
        )}
        <a
          href={book.purchaseLink}
          target="_blank"
          rel="noopener noreferrer"
          aria-hidden="true"
          tabIndex={-1}
          className="mt-auto self-start pt-2 text-[12.5px] underline decoration-1 underline-offset-4 hover:text-brass-text"
        >
          Learn more
        </a>
      </div>
    );
  }
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
      <div className={`flex flex-1 flex-col pt-2 ${s.gap}`}>
        <span className={`label text-brass-text ${s.label}`}>{book.categoryLabel}</span>
        <span className={`font-display text-ink group-hover:text-brass-text ${s.title}`}>{book.title}</span>
        <span className={`text-soft ${s.author}`}>{book.author}</span>
        <span
          className={`mt-auto pt-1 underline decoration-1 underline-offset-4 group-hover:text-brass-text ${
            size === "compact" ? "text-[12px]" : "text-[12.5px]"
          }`}
        >
          Learn more<span className="sr-only"> about {book.title} (opens in a new tab)</span>
        </span>
      </div>
    </a>
  );
}
