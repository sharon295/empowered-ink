import Link from "next/link";
import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";

export const metadata = {
  title: "Thank You — Empowered Ink",
};

export default function ThankYouPage() {
  return (
    <>
      <SiteNav />
      <section className="mx-auto max-w-2xl px-8 py-24 text-center">
        <div className="mb-3 flex items-center justify-center gap-2.5 text-[11.5px] uppercase tracking-[0.22em] text-deep-plum">
          <span className="h-px w-[34px] bg-champagne-gold" /> Submission Received
        </div>
        <h1 className="mb-4 font-display text-[34px] font-medium">Thank you for submitting your book.</h1>
        <p className="mb-8 text-[15px] leading-relaxed text-[#6b5865]">
          Your submission is now pending review. Once approved, it will appear in the Empowered Ink directory.
          If you purchased an upgrade, it will be reflected as soon as payment is confirmed.
        </p>
        <Link
          href="/empowered-ink"
          className="inline-flex items-center gap-2 rounded-sm bg-deep-plum px-6 py-3.5 text-[12.5px] font-bold uppercase tracking-wider text-warm-white"
        >
          Back to the Directory
        </Link>
      </section>
      <SiteFooter />
    </>
  );
}
