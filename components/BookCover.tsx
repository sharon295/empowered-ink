const PALETTE = ["#54274e", "#2c1a2e", "#6d335e", "#8a5a72", "#3a2440", "#4b2440", "#6b4560"];

function colorFor(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) hash = (hash * 31 + seed.charCodeAt(i)) >>> 0;
  return PALETTE[hash % PALETTE.length];
}

export default function BookCover({
  title,
  coverImageUrl,
  size = "large",
}: {
  title: string;
  coverImageUrl?: string | null;
  size?: "large" | "small";
}) {
  if (coverImageUrl) {
    // eslint-disable-next-line @next/next/no-img-element
    return <img src={coverImageUrl} alt={`Cover of ${title}`} className="h-full w-full object-cover" />;
  }
  const bg = colorFor(title);
  return (
    <div
      className="flex h-full w-full items-center justify-center p-3.5 text-center"
      style={{ background: `linear-gradient(155deg, ${bg} 0%, #2c1a2e 130%)` }}
    >
      <span
        className={`font-accent leading-tight text-white/95 ${size === "large" ? "text-[15px]" : "text-[10.5px]"}`}
      >
        {title}
      </span>
    </div>
  );
}
