import SiteNav from "@/components/SiteNav";
import SiteFooter from "@/components/SiteFooter";
import SubmissionForm from "@/components/SubmissionForm";

export const metadata = {
  title: "Submit Your Book — Empowered Ink",
};

export default function SubmissionFormPage() {
  return (
    <>
      <SiteNav active="submit" />
      <section className="bg-gradient-to-b from-midnight-plum to-deep-plum py-14 text-warm-white">
        <div className="mx-auto max-w-2xl px-8">
          <div className="mb-3 flex items-center gap-2.5 text-[11.5px] uppercase tracking-[0.22em] text-champagne-gold-light">
            <span className="h-px w-[34px] bg-champagne-gold-light" /> Submit Your Book
          </div>
          <h1 className="font-display text-[34px] font-medium leading-tight sm:text-[42px]">
            Get your book in front of the Possible Woman community.
          </h1>
        </div>
      </section>
      <SubmissionForm />
      <SiteFooter />
    </>
  );
}
