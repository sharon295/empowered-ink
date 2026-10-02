import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import SubmissionForm from "@/components/SubmissionForm";
import EmbedResizer from "@/components/EmbedResizer";
import { getCategoryNames } from "@/lib/categories";
import { SUBMISSION_TYPES, submissionTypeOf } from "@/lib/submission-types";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submit Your Book — Empowered Ink",
};

// One form, three shareable links (see lib/submission-types.ts). Works as a
// standalone page, or embedded in another page with &embed=1, which drops
// this page's own header and footer (same approach as the directory).
export default async function SubmissionFormPage({ searchParams }: PageProps<"/book-feature-submission-form">) {
  const params = await searchParams;
  const type = submissionTypeOf(params.type);
  const embedded = params.embed === "1";
  const copy = type ? SUBMISSION_TYPES[type] : null;
  const categories = await getCategoryNames();

  return (
    <>
      {!embedded && <SiteNav />}
      <main id="ei-root">
        <EmbedResizer />
        <section className="bg-plum py-14 text-ivory sm:py-18">
          <div className="mx-auto max-w-2xl px-8">
            <p className="label text-[15px] text-cover">Our Author Community</p>
            <h1 className="font-display mt-2 text-[36px] italic leading-tight sm:text-[46px]">
              {copy?.heading ?? "Submit Your Book"}
            </h1>
            <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cover">
              {copy?.intro ?? "Get your book in front of the Possible Woman community."} Every submission is reviewed
              before it appears in Empowered Ink.
            </p>
          </div>
        </section>
        <SubmissionForm categories={categories} type={type} embedded={embedded} />
      </main>
      {!embedded && <SiteFooter />}
    </>
  );
}
