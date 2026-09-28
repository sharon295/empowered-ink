import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import SubmissionForm from "@/components/SubmissionForm";
import { getCategoryNames } from "@/lib/categories";

export const dynamic = "force-dynamic";

export const metadata = {
  title: "Submit Your Book — Empowered Ink",
};

export default async function SubmissionFormPage() {
  const categories = await getCategoryNames();
  return (
    <>
      <SiteNav />
      <section className="bg-ink py-14 text-ivory sm:py-18">
        <div className="mx-auto max-w-2xl px-8">
          <p className="label text-[15px] text-cover">Our Author Community</p>
          <h1 className="font-display mt-2 text-[36px] italic leading-tight sm:text-[46px]">Submit Your Book</h1>
          <p className="mt-4 max-w-xl text-[15px] leading-relaxed text-cover">
            Get your book in front of the Possible Woman community. Every submission is reviewed before it appears
            in Empowered Ink.
          </p>
        </div>
      </section>
      <SubmissionForm categories={categories} />
      <SiteFooter />
    </>
  );
}
