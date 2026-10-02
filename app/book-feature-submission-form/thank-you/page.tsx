import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import EmbedResizer from "@/components/EmbedResizer";
import { DIRECTORY_PAGE_URL } from "@/lib/site-links";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Thank You — Empowered Ink",
};

export default async function ThankYouPage({ searchParams }: PageProps<"/book-feature-submission-form/thank-you">) {
  const embedded = (await searchParams).embed === "1";
  return (
    <>
      {!embedded && <SiteNav />}
      <main id="ei-root">
        <EmbedResizer />
        <section className="mx-auto max-w-2xl px-8 py-24 text-center">
          <p className="label text-[15px] text-brass-text">Submission Received</p>
          <h1 className="font-display mb-4 mt-2 text-[34px] italic">Thank you for submitting your book.</h1>
          <p className="mb-8 text-[15px] leading-relaxed text-soft">
            Your submission is now pending review. Once approved, it will appear in the Empowered Ink directory.
          </p>
          <a
            href={DIRECTORY_PAGE_URL}
            target="_top"
            className="inline-block bg-plum px-6 py-3.5 text-[14px] text-ivory hover:bg-brass-text"
          >
            Back to the Directory
          </a>
        </section>
      </main>
      {!embedded && <SiteFooter />}
    </>
  );
}
