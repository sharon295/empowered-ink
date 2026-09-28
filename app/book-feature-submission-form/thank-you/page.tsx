import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import { DIRECTORY_PAGE_URL } from "@/lib/site-links";

export const metadata = {
  title: "Thank You — Empowered Ink",
};

export default function ThankYouPage() {
  return (
    <>
      <SiteNav />
      <section className="mx-auto max-w-2xl px-8 py-24 text-center">
        <p className="label text-[15px] text-brass-text">Submission Received</p>
        <h1 className="font-display mb-4 mt-2 text-[34px] italic">Thank you for submitting your book.</h1>
        <p className="mb-8 text-[15px] leading-relaxed text-soft">
          Your submission is now pending review. Once approved, it will appear in the Empowered Ink directory.
          If you purchased an upgrade, it will be reflected as soon as payment is confirmed.
        </p>
        <a href={DIRECTORY_PAGE_URL} className="inline-block bg-ink px-6 py-3.5 text-[14px] text-ivory hover:bg-brass-text">
          Back to the Directory
        </a>
      </section>
      <SiteFooter />
    </>
  );
}
