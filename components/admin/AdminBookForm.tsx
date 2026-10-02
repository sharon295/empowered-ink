"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import type { AdminBook } from "@/lib/admin-types";
import PlacementFields, { placementSummary, type PlacementValue } from "./PlacementFields";
import CoverPreview, { COVER_SIZE_HINT } from "../CoverPreview";

type Errors = Record<string, string>;

const inputClass = (error?: string) =>
  `w-full border ${error ? "border-red-700" : "border-hairline"} bg-white px-3 py-2 text-[14px] text-ink focus:border-ink focus:outline-none`;

// Converts an ISO timestamp to the value a datetime-local input expects, in
// the browser's own time zone.
function toLocalInput(iso: string | null): string {
  if (!iso) return "";
  const d = new Date(iso);
  const pad = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AdminBookForm({
  book,
  categories,
  currentMonth,
  initialPlacement,
  onDone,
  afterCreate,
}: {
  book?: AdminBook;
  categories: string[];
  currentMonth: string;
  initialPlacement?: PlacementValue;
  onDone?: () => void;
  // Where to go after adding a book; the page reopens an empty form there.
  afterCreate?: string;
}) {
  const router = useRouter();
  const creating = !book;
  const [f, setF] = useState({
    title: book?.title ?? "",
    author: book?.author ?? "",
    email: book?.email ?? "",
    phone: book?.phone ?? "",
    description: book?.description ?? "",
    purchaseLink: book?.purchaseLink ?? "",
    primaryCategory: book?.primaryCategory ?? "",
    otherCategoryLabel: book?.otherCategoryLabel ?? "",
    approvedAt: toLocalInput(book?.approvedAt ?? null),
  });
  const [placement, setPlacement] = useState<PlacementValue>(
    book
      ? { placement: book.placement, placementMonth: book.placementMonth }
      : initialPlacement ?? { placement: "new_on_shelf", placementMonth: currentMonth }
  );
  const [cover, setCover] = useState<File | null>(null);
  const [removeCover, setRemoveCover] = useState(false);
  const [errors, setErrors] = useState<Errors>({});
  const [message, setMessage] = useState("");
  const [saving, setSaving] = useState(false);

  const set = (key: keyof typeof f) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) =>
    setF((prev) => ({ ...prev, [key]: e.target.type === "checkbox" ? (e.target as HTMLInputElement).checked : e.target.value }));

  const allCategories = [...new Set([...categories, f.primaryCategory].filter(Boolean))];
  const usesOther = f.primaryCategory === "Other";

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setErrors({});
    setMessage("");

    const fd = new FormData();
    for (const key of ["title", "author", "email", "phone", "description", "purchaseLink", "primaryCategory", "otherCategoryLabel"] as const) {
      fd.set(key, f[key]);
    }
    // One category per book: saving clears any extra categories left over
    // from earlier versions.
    fd.set("secondaryCategories", "");
    fd.set("placement", placement.placement ?? "");
    fd.set("placementMonth", placement.placementMonth ?? "");
    if (!creating) fd.set("approvedAt", f.approvedAt ? new Date(f.approvedAt).toISOString() : "");
    if (cover) fd.set("coverImage", cover);
    if (removeCover) fd.set("removeCover", "true");

    const res = await fetch(creating ? "/api/admin/books" : `/api/admin/books/${book!.id}`, {
      method: creating ? "POST" : "PATCH",
      body: fd,
    });
    setSaving(false);
    if (!res.ok) {
      const json = await res.json().catch(() => ({}));
      const next: Errors = {};
      for (const issue of json.issues ?? []) next[String(issue.path?.[0] ?? "form")] = issue.message;
      setErrors(next);
      setMessage(res.status === 401 ? "Your session has ended. Sign in again." : "Please fix the highlighted fields.");
      return;
    }
    if (creating) {
      router.push(
        afterCreate
          ? `${afterCreate}&added=${encodeURIComponent(f.title.trim())}`
          : "/admin?status=approved&added=1"
      );
      window.scrollTo(0, 0);
    } else {
      router.refresh();
      onDone?.();
    }
  }

  const field = (key: string, label: string, input: React.ReactNode, hint?: string) => (
    <div className="mb-4">
      <label htmlFor={`bf-${book?.id ?? "new"}-${key}`} className="label mb-1 block text-[14px] text-soft">
        {label}
      </label>
      {input}
      {hint && <p className="mt-1 text-[12px] text-muted-text">{hint}</p>}
      {errors[key] && <p className="mt-1 text-[12.5px] text-red-700">{errors[key]}</p>}
    </div>
  );
  const id = (key: string) => `bf-${book?.id ?? "new"}-${key}`;

  return (
    <form onSubmit={submit} noValidate className="grid grid-cols-1 gap-x-6 md:grid-cols-2">
      <div>
        {field("title", "Title", <input id={id("title")} value={f.title} onChange={set("title")} className={inputClass(errors.title)} />)}
        {field("author", "Author", <input id={id("author")} value={f.author} onChange={set("author")} className={inputClass(errors.author)} />)}
        {field(
          "purchaseLink",
          "Book link (opens from “Learn more”)",
          <input id={id("purchaseLink")} type="url" placeholder="https://" value={f.purchaseLink} onChange={set("purchaseLink")} className={inputClass(errors.purchaseLink)} />
        )}
        {field(
          "description",
          "Description (only you can add this)",
          <>
            <textarea id={id("description")} rows={5} value={f.description} onChange={set("description")} className={inputClass(errors.description)} />
            {f.description && (
              <button
                type="button"
                onClick={() => setF((p) => ({ ...p, description: "" }))}
                className="mt-1.5 text-[13px] text-soft underline decoration-1 underline-offset-4 hover:text-brass-text"
              >
                Delete description
              </button>
            )}
          </>,
          "Featured cards show the first 75–100 characters with a Read more link. Authors can't add or change it. Save changes to apply."
        )}
        {field("email", "Author email (private)", <input id={id("email")} type="email" value={f.email} onChange={set("email")} className={inputClass(errors.email)} />)}
        {field("phone", "Author phone (private)", <input id={id("phone")} type="tel" value={f.phone} onChange={set("phone")} className={inputClass(errors.phone)} />)}
      </div>

      <div>
        {field(
          "primaryCategory",
          "Category",
          <select id={id("primaryCategory")} value={f.primaryCategory} onChange={set("primaryCategory")} className={inputClass(errors.primaryCategory)}>
            <option value="">Choose…</option>
            {allCategories.map((c) => (
              <option key={c} value={c}>{c}</option>
            ))}
          </select>,
          "Each book has one category, which decides the category button it appears under."
        )}
        {usesOther &&
          field(
            "otherCategoryLabel",
            "Genre shown for “Other”",
            <input id={id("otherCategoryLabel")} value={f.otherCategoryLabel} onChange={set("otherCategoryLabel")} className={inputClass(errors.otherCategoryLabel)} />
          )}

        <div className="mb-4">
          <p className="label mb-1 text-[14px] text-soft">Cover</p>
          <p className="mb-2 text-[12px] leading-snug text-muted-text">{COVER_SIZE_HINT}</p>
          {book?.coverImageUrl && !removeCover && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={book.coverImageUrl} alt={`Current cover of ${book.title}`} className="mb-2 h-28 w-auto border border-hairline" />
          )}
          <input
            aria-label={book?.coverImageUrl ? "Replace cover" : "Upload cover"}
            type="file"
            accept="image/png,image/jpeg"
            onChange={(e) => setCover(e.target.files?.[0] ?? null)}
            className="block text-[13px] file:mr-3 file:border file:border-plum file:bg-plum file:px-3 file:py-1.5 file:text-[12.5px] file:text-ivory"
          />
          {book?.coverImageUrl && (
            <label className="mt-2 flex items-center gap-2 text-[13px] text-soft">
              <input type="checkbox" checked={removeCover} onChange={(e) => setRemoveCover(e.target.checked)} />
              Remove the current cover
            </label>
          )}
          <CoverPreview file={cover} />
          {errors.coverImage && <p className="mt-1 text-[12.5px] text-red-700">{errors.coverImage}</p>}
        </div>

        <fieldset className="mb-4 border border-hairline bg-tint p-4">
          <legend className="label px-1 text-[14px] text-soft">Where it shows</legend>
          <PlacementFields value={placement} onChange={setPlacement} currentMonth={currentMonth} idPrefix={id("pl")} />
          <p className="text-[12.5px] text-muted-text">
            {placementSummary(placement.placement, placement.placementMonth, currentMonth)}
          </p>
          {errors.placementMonth && <p className="mt-1 text-[12.5px] text-red-700">{errors.placementMonth}</p>}
        </fieldset>

        {!creating &&
          field(
            "approvedAt",
            "Approved on",
            <div className="flex gap-2">
              <input id={id("approvedAt")} type="datetime-local" value={f.approvedAt} onChange={set("approvedAt")} className={inputClass(errors.approvedAt)} />
              {f.approvedAt && (
                <button type="button" onClick={() => setF((p) => ({ ...p, approvedAt: "" }))} className="border border-hairline px-3 text-[13px] text-soft hover:border-brass">
                  Clear
                </button>
              )}
            </div>
          )}
      </div>

      <div className="md:col-span-2 flex flex-wrap items-center gap-3 border-t border-hairline pt-4">
        <button type="submit" disabled={saving} className="bg-plum px-5 py-2.5 text-[13.5px] text-ivory hover:bg-brass-text disabled:opacity-60">
          {saving ? "Saving…" : creating ? "Add book" : "Save changes"}
        </button>
        {onDone && (
          <button type="button" onClick={onDone} className="border border-brass px-5 py-2.5 text-[13.5px] text-brass-text hover:bg-tint">
            Cancel
          </button>
        )}
        {message && <p role="alert" className="text-[13px] text-red-700">{message}</p>}
      </div>
    </form>
  );
}
