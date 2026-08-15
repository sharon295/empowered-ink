"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { CATEGORIES } from "@/lib/categories";
import { countWords } from "@/lib/validation";

const FEATURED_PRICE = 75;
const ADDON_PRICE = 35;
const ACCEPTED_TYPES = ["image/jpeg", "image/jpg", "image/png"];

type FieldErrors = Record<string, string>;

export default function SubmissionForm() {
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
  const [addCategories, setAddCategories] = useState(false);
  const [secondaryCategories, setSecondaryCategories] = useState<string[]>(["", ""]);
  const [otherCategoryLabel, setOtherCategoryLabel] = useState("");

  const [isFeatured, setIsFeatured] = useState(false);
  const [consent, setConsent] = useState(false);

  const [errors, setErrors] = useState<FieldErrors>({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");

  const wordCount = countWords(description);
  const needsOther =
    primaryCategory === "Other" || secondaryCategories.filter(Boolean).includes("Other");
  const activeSecondary = secondaryCategories.filter(Boolean);

  const total =
    (isFeatured ? FEATURED_PRICE : 0) +
    (addCategories && activeSecondary.length > 0 && !isFeatured ? ADDON_PRICE : 0);
  const submitLabel = useMemo(() => {
    if (total === 0) return "Submit for Free";
    return `Submit & Pay $${total}`;
  }, [total]);

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
    if (addCategories && !isFeatured && activeSecondary.length === 0)
      nextErrors.secondaryCategories = "Choose at least one secondary category, or turn this off.";
    if (isFeatured && (wordCount < 75 || wordCount > 100))
      nextErrors.description = `Featured listings require a 75–100 word description (currently ${wordCount}).`;
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
      fd.set("secondaryCategories", JSON.stringify(addCategories ? activeSecondary : []));
      fd.set("otherCategoryLabel", otherCategoryLabel);
      fd.set("isFeatured", String(isFeatured));
      fd.set("addCategories", String(addCategories));
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

      if (json.free) {
        router.push("/book-feature-submission-form/thank-you");
      } else if (json.checkoutUrl) {
        window.location.href = json.checkoutUrl;
      }
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
        <p className="mt-1 text-[11.5px] text-[#8a7a86]">Never shown publicly.</p>
      </FormField>

      <FormField label="Phone" htmlFor="phone" error={errors.phone}>
        <input
          id="phone"
          type="tel"
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          className={inputClass(!!errors.phone)}
        />
        <p className="mt-1 text-[11.5px] text-[#8a7a86]">Never shown publicly.</p>
      </FormField>

      <FormField label="Book Title" htmlFor="title" error={errors.title}>
        <input
          id="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className={inputClass(!!errors.title)}
        />
      </FormField>

      <FormField
        label={`Book Description${isFeatured ? " (required, 75–100 words)" : " (optional)"}`}
        htmlFor="description"
        error={errors.description}
      >
        <textarea
          id="description"
          rows={5}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className={inputClass(!!errors.description)}
        />
        <p
          className={`mt-1 text-[11.5px] ${
            isFeatured && (wordCount < 75 || wordCount > 100) ? "text-red-700" : "text-[#8a7a86]"
          }`}
        >
          {wordCount} word{wordCount === 1 ? "" : "s"}
          {isFeatured ? " · 75–100 required for Featured listings" : ""}
        </p>
      </FormField>

      <FormField label="Book Cover Image" htmlFor="coverImage" error={errors.coverImage || coverError}>
        <input
          id="coverImage"
          type="file"
          accept="image/png,image/jpeg"
          onChange={handleCoverChange}
          className="block w-full text-[13px] file:mr-3 file:rounded-sm file:border-0 file:bg-deep-plum file:px-4 file:py-2 file:text-[12px] file:font-bold file:uppercase file:tracking-wide file:text-warm-white"
        />
        <p className="mt-1 text-[11.5px] text-[#8a7a86]">JPG or PNG only.</p>
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
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <p className="mt-1 text-[11.5px] text-[#8a7a86]">Included free with every listing.</p>
      </FormField>

      <div className="mb-6 rounded-sm border border-deep-plum/20 bg-soft-lavender/40 p-4">
        <label className="flex items-center gap-2.5 text-[13.5px] font-semibold">
          <input
            type="checkbox"
            checked={addCategories}
            onChange={(e) => setAddCategories(e.target.checked)}
          />
          Add more categories?{" "}
          <span className="font-normal text-[#6b5865]">
            {isFeatured ? "— included free with Featured Placement" : "— $35 for up to 2 more"}
          </span>
        </label>

        {addCategories && (
          <div className="mt-4 space-y-3">
            {[0, 1].map((idx) => (
              <select
                key={idx}
                value={secondaryCategories[idx]}
                onChange={(e) => updateSecondary(idx, e.target.value)}
                className={inputClass(false)}
              >
                <option value="">Secondary category {idx + 1} (optional)…</option>
                {CATEGORIES.filter(
                  (c) => c !== primaryCategory && !secondaryCategories.includes(c) || c === secondaryCategories[idx]
                ).map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            ))}
            {errors.secondaryCategories && (
              <p className="text-[12px] text-red-700">{errors.secondaryCategories}</p>
            )}
          </div>
        )}
      </div>

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

      <div className="mb-6 rounded-sm border border-champagne-gold/50 bg-blush-linen p-4">
        <label className="flex items-center gap-2.5 text-[13.5px] font-semibold">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => {
              const checked = e.target.checked;
              setIsFeatured(checked);
              if (checked) setAddCategories(true);
            }}
          />
          $75 to upgrade to Featured Placement
        </label>
        <ul className="mt-3 space-y-1.5 pl-1 text-[12.5px] text-[#3f2a3a]">
          <li>✓ Larger, upgraded cover image</li>
          <li>✓ All 3 categories included, free</li>
          <li>✓ Top-of-page placement above standard listings</li>
          <li>✓ Runs through the end of this month</li>
        </ul>
      </div>

      <div className="mb-8">
        <label className="flex items-start gap-2.5 text-[13px] leading-relaxed text-[#3f2a3a]">
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
        className="w-full rounded-sm bg-champagne-gold px-6 py-3.5 text-center text-[13px] font-bold uppercase tracking-wider text-midnight-plum disabled:opacity-60"
      >
        {submitting ? "Submitting…" : submitLabel}
      </button>
    </form>
  );
}

function inputClass(hasError: boolean) {
  return `w-full rounded-sm border ${
    hasError ? "border-red-500" : "border-deep-plum/25"
  } bg-white px-3.5 py-2.5 text-[13.5px] text-midnight-plum focus:outline focus:outline-1 focus:outline-deep-plum`;
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
      <label htmlFor={htmlFor} className="mb-1.5 block text-[12.5px] font-semibold uppercase tracking-wide text-deep-plum">
        {label}
      </label>
      {children}
      {error && <p className="mt-1 text-[12px] text-red-700">{error}</p>}
    </div>
  );
}
