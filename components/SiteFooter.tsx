import { FOOTER_LINKS } from "@/lib/site-links";

export default function SiteFooter() {
  return (
    <footer className="mt-auto bg-plum text-cover">
      <div className="mx-auto max-w-[1200px] px-4 py-12 sm:px-8">
        <p className="font-display text-[22px] text-ivory">Possible Woman</p>
        <p className="mt-2 font-display italic text-[15px]">Because possible isn&rsquo;t a word. It&rsquo;s a way of life.</p>
        <nav aria-label="Footer" className="mt-6 flex flex-wrap gap-x-6 gap-y-2 text-[13.5px]">
          {FOOTER_LINKS.map((l) => (
            <a key={l.label} href={l.href} className="hover:text-brass">
              {l.label}
            </a>
          ))}
        </nav>
        <p className="mt-8 border-t border-white/15 pt-6 text-[12.5px]">
          © 2026 Possible Woman, LLC. Colorado Springs, CO.
        </p>
      </div>
    </footer>
  );
}
