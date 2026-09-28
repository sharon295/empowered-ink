"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

import { countWords } from "@/lib/validation";

const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

type FieldErrors = Record<string, string>;

export default function SubmissionForm({ categories }: { categories: string[] }) {
  const router = useRouter();

  const [author, setAuthor] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [purchaseLink, setPurchaseLink] = useState("");
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverError, setCoverError] = useState("");

  const [primaryCategory, setPrimaryCategory] = useState("");
  const [secondaryCategories, setSecondaryCategories] = useState<string[]>(["", ""]);
  const [otherCategoryLabel, setOtherCategoryLabel] = useState("");

  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const wordCount = countWords(description);
  const needsOther =
    primaryCategory === "Other" || secondaryCategories.filter(Boolean).includes("Other");
  const activeSecondary = secondaryCategories.filter((c) => c && c !== primaryCategory);

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0] ?? null;
    if (file && !ACCEPTED_TYPES.includes(file.type)) {
      setCoverError("Cover image must be a JPG or PNG file. PDFs and Word documents aren't accepted.");
      setCoverFile(null);
      e.target.value = "";
      return;
    }
    setCoverError("");
    setCoverFile(file);
  }

  function updateSecondary(idx: number, value: string) {
    setSecondaryCategories((prev) => {
      const next = [...prev];
      next[idx] = value;
      return next;
    });
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setErrors({});
    setSubmitError("");

    const nextErrors: FieldErrors = {};
    if (!author.trim()) nextErrors.author = "Author's name is required.";
    if (!email.trim()) nextErrors.email = "Email is required.";
    if (!phone.trim()) nextErrors.phone = "Phone is required.";
    if (!title.trim()) nextErrors.title = "Book title is required.";
    if (!purchaseLink.trim()) nextErrors.purchaseLink = "Link to purchase is required.";
    else {
      try {
        new URL(purchaseLink);
      } catch {
        nextErrors.purchaseLink = "Enter a valid URL, including https://";
      }
    }
    if (!primaryCategory) nextErrors.primaryCategory = "Choose a primary category.";
    if (needsOther && !otherCategoryLabel.trim())
      nextErrors.otherCategoryLabel = "Please specify your book's genre or category.";
    if (!coverFile) nextErrors.coverImage = "A cover image is required.";
    if (!consent) nextErrors.consent = "You must agree to the terms to submit.";

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    setSubmitting(true);
    try {
      const fd = new FormData();
      fd.set("author", author);
      fd.set("email", email);
      fd.set("phone", phone);
      fd.set("title", title);
      fd.set("description", description);
      fd.set("purchaseLink", purchaseLink);
      fd.set("primaryCategory", primaryCategory);
      fd.set("secondaryCategories", JSON.stringify(activeSecondary));
      fd.set("otherCategoryLabel", otherCategoryLabel);
      fd.set("consent", String(consent));
      if (coverFile) fd.set("coverImage", coverFile);

      const res = await fetch("/api/submit", { method: "POST", body: fd });
      const json = await res.json();

      if (!res.ok) {
        const fieldErrors: FieldErrors = {};
        for (const issue of json.issues ?? []) {
          const key = Array.isArray(issue.path) ? issue.path[0] : issue.path;
          fieldErrors[key] = issue.message;
        }
        setErrors(fieldErrors);
        setSubmitError("Please fix the highlighted fields and try again.");
        setSubmitting(false);
        return;
      }

      router.push("/book-feature-submission-form/thank-you");
    } catch {
      setSubmitError("Something went wrong submitting your book. Please try again.");
      setSubmitting(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate className="mx-auto max-w-2xl px-8 py-14">
      <FormField label="Author's Name" htmlFor="author" error={errors.author}>
        <input
          id="author"
          value={author}
          onChange={(e) => setAuthor(e.target.value)}
          className={inputClass(!!errors.author)}
        />
      </FormField>

      <FormField label="Email" htmlFor="email" error={errors.email}>
        <input
          id="email"
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className={inputClass(!!errors.email)}
        />
        <p className="mt-1 text-[11.5px] text-muted-text">Never shown publicly.</p>
      </FormField>

      <FormField label="Phone" htmlFor="phone" error={errors.phone}>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass(!!errors.phone)}
        />
        <p className="mt-1 text-[11.5px] text-muted-text">Never shown publicly.</p>
      </FormField>

      <FormField label="Book Title" htmlFor="title" error={errors.title}>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass(!!errors.title)}
        />
      </FormField>

      <FormField label="Book Description (optional)" htmlFor="description" error={errors.description}>
        <textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass(!!errors.description)}
        />
        <p className="mt-1 text-[11.5px] text-muted-text">
          {wordCount} word{wordCount === 1 ? "" : "s"} · 75–100 words works best
        </p>
      </FormField>

      <FormField label="Book Cover Image" htmlFor="coverImage" error={errors.coverImage || coverError}>
        <input
          id="coverImage"
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleCoverChange}
          className="block w-full text-[13px] file:mr-3 file:border file:border-ink file:bg-ink file:px-4 file:py-2 file:text-[13px] file:text-ivory"
        />
        <p className="mt-1 text-[11.5px] text-muted-text">JPG or PNG only.</p>
      </FormField>

      <FormField label="Link to Purchase" htmlFor="purchaseLink" error={errors.purchaseLink}>
        <input
          id="purchaseLink"
          type="url"
          placeholder="https://"
          value={purchaseLink}
          onChange={(e) => setPurchaseLink(e.target.value)}
          className={inputClass(!!errors.purchaseLink)}
        />
      </FormField>

      <FormField label="Primary Category" htmlFor="primaryCategory" error={errors.primaryCategory}>
        <select
          id="primaryCategory"
          value={primaryCategory}
          onChange={(e) => setPrimaryCategory(e.target.value)}
          className={inputClass(!!errors.primaryCategory)}
        >
          <option value="">Select a category…</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </FormField>

      <fieldset className="mb-6">
        <legend className="label mb-1.5 block text-[14.5px] text-soft">More Categories (optional)</legend>
        <div className="space-y-3">
          {[0, 1].map((idx) => (
            <select
              key={idx}
              aria-label={`Extra category ${idx + 1}`}
              value={secondaryCategories[idx]}
              onChange={(e) => updateSecondary(idx, e.target.value)}
              className={inputClass(false)}
            >
              <option value="">Extra category {idx + 1}…</option>
              {categories
                .filter((c) => (c !== primaryCategory && !secondaryCategories.includes(c)) || c === secondaryCategories[idx])
                .map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
            </select>
          ))}
        </div>
        <p className="mt-1 text-[11.5px] text-muted-text">Up to 2 more, so readers can find your book under each.</p>
        {errors.secondaryCategories && <p className="mt-1 text-[12px] text-red-700">{errors.secondaryCategories}</p>}
      </fieldset>

      {needsOther && (
        <FormField
          label="Please specify your book's genre or category."
          htmlFor="otherCategoryLabel"
          error={errors.otherCategoryLabel}
        >
          <input
            id="otherCategoryLabel"
            value={otherCategoryLabel}
            onChange={(e) => setOtherCategoryLabel(e.target.value)}
            className={inputClass(!!errors.otherCategoryLabel)}
          />
        </FormField>
      )}

      <div className="mb-8">
        <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-soft">
          <input
            type="checkbox"
            checked={consent}
            onChange={(e) => setConsent(e.target.checked)}
            className="mt-0.5"
          />
          <span>
            I understand my book may be published in a different issue than submitted, I consent to being
            contacted about this submission, and I agree to the{" "}
            <a href="https://possiblewomanmagazine.com/terms" className="underline">
              Terms
            </a>{" "}
            and{" "}
            <a href="https://possiblewomanmagazine.com/privacy" className="underline">
              Privacy Policy
            </a>
            .
          </span>
        </label>
        {errors.consent && <p className="mt-1 text-[12px] text-red-700">{errors.consent}</p>}
      </div>

      {submitError && <p className="mb-4 text-[13px] text-red-700">{submitError}</p>}

      <button
        type="submit"
        disabled={submitting}
        className="w-full bg-ink px-6 py-3.5 text-center text-[14px] text-ivory hover:bg-brass-text disabled:opacity-60"
      >
        {submitting ? "Submitting…" : "Submit Your Book"}
      </button>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return `w-full border ${
    hasError ? "border-red-500" : "border-hairline"
  } bg-white px-3.5 py-2.5 text-[13.5px] text-ink focus:border-ink focus:outline-none`;
}

function FormField({
  label,
  htmlFor,
  error,
  children,
}: {
  label: string;
  htmlFor: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="mb-6">
      <label htmlFor={htmlFor} className="label mb-1.5 block text-[14.5px] text-soft">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[12px] text-red-700">{error}</p>}
    </div>
  );
}
