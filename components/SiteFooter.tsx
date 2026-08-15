export default function SiteFooter() {
  return (
    <footer className="bg-midnight-plum py-7 text-[12px] text-warm-white/55">
      <div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3.5 px-8">
        <div>© {new Date().getFullYear()} Sharon Ringier. All Rights Reserved.</div>
        <div className="flex gap-4.5">
          <a href="#" className="text-warm-white/75">
            Instagram
          </a>
          <a href="#" className="text-warm-white/75">
            LinkedIn
          </a>
          <a href="#" className="text-warm-white/75">
            YouTube
          </a>
        </div>
      </div>
    </footer>
  );
}
