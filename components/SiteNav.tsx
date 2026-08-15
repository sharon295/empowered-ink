import Link from "next/link";

function Crest({ color }: { color: string }) {
  return (
    <svg viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg" className="h-[22px] w-[22px]">
      <circle cx="20" cy="20" r="18.5" stroke={color} strokeWidth="1" />
      <path d="M20 6 L23 18 L35 20 L23 22 L20 34 L17 22 L5 20 L17 18 Z" stroke={color} strokeWidth="1" fill="none" />
    </svg>
  );
}

export default function SiteNav({ active }: { active?: "directory" | "submit" }) {
  return (
    <header className="sticky top-0 z-50 bg-midnight-plum border-b border-warm-white/10">
      <div className="mx-auto flex max-w-6xl items-center justify-between px-8 py-4">
        <Link href="/empowered-ink" className="flex items-center gap-2.5 text-warm-white">
          <Crest color="#d7af72" />
          <span className="font-display text-[15px] tracking-[0.14em]">
            POSSIBLE <b className="font-semibold text-champagne-gold-light">WOMAN</b>
          </span>
        </Link>
        <nav className="hidden items-center gap-7 text-[12.5px] tracking-wide text-warm-white/70 md:flex">
          <Link href="https://possiblewomanmagazine.com">Home</Link>
          <Link
            href="/empowered-ink"
            className={active === "directory" ? "text-champagne-gold-light" : ""}
          >
            Empowered Ink
          </Link>
          <Link href="https://possiblewomanmagazine.com">HERstory Unveiled</Link>
          <Link href="https://possiblewomanmagazine.com/contact">Contact</Link>
        </nav>
        <Link
          href="/book-feature-submission-form"
          className="rounded-sm bg-champagne-gold px-[18px] py-[9px] text-[12px] font-bold uppercase tracking-wider text-midnight-plum"
        >
          Submit Your Book
        </Link>
      </div>
    </header>
  );
}
