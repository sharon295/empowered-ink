import { DIRECTORY_PAGE_URL, MAGAZINE_HOME } from "@/lib/site-links";

// Slim header for the standalone submission pages.
export default function SiteNav() {
  return (
    <header className="border-b border-hairline bg-ivory">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between gap-4 px-4 py-5 sm:px-8">
        <a href={MAGAZINE_HOME} className="font-display text-[20px] tracking-[0.02em] text-ink hover:text-brass-text sm:text-[22px]">
          Possible Woman
        </a>
        <a href={DIRECTORY_PAGE_URL} className="text-[13.5px] text-soft underline decoration-1 underline-offset-4 hover:text-brass-text">
          Browse Empowered Ink
        </a>
      </div>
    </header>
  );
}
