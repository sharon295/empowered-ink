// A 2:3 cover. Without an uploaded image, shows the title on the cover
// placeholder colour so the grid still reads as a shelf.
export default function BookCover({
  title,
  author,
  coverImageUrl,
  eager = false,
  titleSize = "text-[13px]",
}: {
  title: string;
  author: string;
  coverImageUrl?: string | null;
  eager?: boolean;
  titleSize?: string;
}) {
  const alt = `Cover of ${title} by ${author}`;
  return (
    <div className="relative aspect-[2/3] w-full overflow-hidden bg-cover">
      {coverImageUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={coverImageUrl}
          alt={alt}
          width={400}
          height={600}
          loading={eager ? "eager" : "lazy"}
          decoding="async"
          className="absolute inset-0 h-full w-full object-cover"
        />
      ) : (
        <div role="img" aria-label={alt} className="absolute inset-0 flex items-center justify-center p-[12%] text-center">
          <span aria-hidden="true" className={`font-display italic leading-snug text-soft ${titleSize}`}>
            {title}
          </span>
        </div>
      )}
    </div>
  );
}
