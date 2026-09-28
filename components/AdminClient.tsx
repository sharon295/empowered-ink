"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { AdminBook } from "@/lib/admin-types";
import { monthLabel } from "@/lib/month";
import { requestedLabel } from "@/lib/submission-types";
import AdminBookForm from "./admin/AdminBookForm";
import PlacementFields, { PLACEMENT_LABELS, type PlacementValue } from "./admin/PlacementFields";

type StatusFilter = "pending" | "approved" | "rejected" | "all";

const FILTERS: { value: StatusFilter; label: string }[] = [
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "rejected", label: "Rejected" },
  { value: "all", label: "All" },
];

function formatDate(iso: string | null) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric", timeZone: "America/Denver" });
}

function SectionBadge({ book }: { book: AdminBook }) {
  if (book.status !== "approved") {
    const requested = requestedLabel(book.requestedPlacement);
    return requested ? (
      <span className="border border-brass px-2 py-1 text-[12px] text-brass-text">Sent from the {requested} link</span>
    ) : null;
  }
  const month = book.placementMonth ? monthLabel(book.placementMonth) : "";
  const styles = {
    featured: ["bg-ink text-ivory", `Featured · ${month}`],
    new: ["bg-brass-text text-ivory", `New on the Shelf · ${month}`],
    scheduled: [
      "border border-brass text-brass-text",
      `Scheduled: ${book.placement ? PLACEMENT_LABELS[book.placement] : ""} · ${month}`,
    ],
    main: ["border border-hairline text-soft", "A–Z list"],
  } as const;
  const [cls, text] = styles[book.section];
  return <span className={`px-2 py-1 text-[12px] ${cls}`}>{text}</span>;
}

function ApproveControls({ book, currentMonth, busy, onApprove }: {
  book: AdminBook;
  currentMonth: string;
  busy: boolean;
  onApprove: (placement: PlacementValue) => void;
}) {
  // Default to the form link the author used (Featured / New on the Shelf /
  // A–Z list) for the current month; with no link type, New on the Shelf.
  // A month already set on the book is kept unless it has passed.
  const [placement, setPlacement] = useState<PlacementValue>(() => {
    const month = book.placementMonth && book.placementMonth >= currentMonth ? book.placementMonth : currentMonth;
    if (book.placement) return { placement: book.placement, placementMonth: month };
    if (book.requestedPlacement === "featured") return { placement: "featured", placementMonth: currentMonth };
    if (book.requestedPlacement === "list") return { placement: null, placementMonth: null };
    return { placement: "new_on_shelf", placementMonth: currentMonth };
  });
  return (
    <div className="flex flex-wrap items-end gap-3">
      <PlacementFields value={placement} onChange={setPlacement} currentMonth={currentMonth} idPrefix={`ap-${book.id}`} compact />
      <button
        type="button"
        disabled={busy}
        onClick={() => onApprove(placement)}
        className="bg-ink px-4 py-2 text-[13.5px] text-ivory hover:bg-brass-text disabled:opacity-60"
      >
        {book.status === "rejected" ? "Approve again" : "Approve"}
      </button>
    </div>
  );
}

export default function AdminClient({
  books,
  status,
  counts,
  categories,
  currentMonth,
  justAdded,
}: {
  books: AdminBook[];
  status: StatusFilter;
  counts: Record<StatusFilter, number>;
  categories: string[];
  currentMonth: string;
  justAdded: boolean;
}) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [search, setSearch] = useState("");
  const [error, setError] = useState("");

  const shown = useMemo(() => {
    const q = search.trim().toLowerCase();
    if (!q) return books;
    return books.filter((b) => `${b.title} ${b.author}`.toLowerCase().includes(q));
  }, [books, search]);

  async function patch(id: string, body: Record<string, unknown>) {
    setBusyId(id);
    setError("");
    const res = await fetch(`/api/admin/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusyId(null);
    if (!res.ok) setError(res.status === 401 ? "Your session has ended. Sign in again." : "That didn't save. Please try again.");
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
      <div className="flex flex-wrap items-baseline justify-between gap-3">
        <h1 className="font-display text-[30px]">Books</h1>
        <input
          type="search"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Find by title or author"
          aria-label="Find by title or author"
          className="w-64 border border-hairline bg-white px-3 py-2 text-[14px] focus:border-ink focus:outline-none"
        />
      </div>

      <nav aria-label="Filter by status" className="mt-5 flex flex-wrap gap-2 border-b border-hairline pb-4">
        {FILTERS.map((f) => (
          <Link
            key={f.value}
            href={`/admin?status=${f.value}`}
            aria-current={status === f.value ? "page" : undefined}
            className={`border px-3.5 py-1.5 text-[13.5px] ${
              status === f.value ? "border-ink bg-ink text-ivory" : "border-hairline text-soft hover:border-brass hover:text-brass-text"
            }`}
          >
            {f.label} <span className="opacity-70">({counts[f.value]})</span>
          </Link>
        ))}
      </nav>

      {justAdded && <p role="status" className="mt-4 border border-hairline bg-tint px-4 py-3 text-[14px]">Book added.</p>}
      {error && <p role="alert" className="mt-4 text-[14px] text-red-700">{error}</p>}
      {shown.length === 0 && <p className="mt-8 text-[14px] text-muted-text">No books here.</p>}

      <ul className="mt-2">
        {shown.map((b) => (
          <li key={b.id} className="border-b border-hairline py-6">
            <div className="flex gap-4">
              <div className="w-16 shrink-0">
                {b.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={b.coverImageUrl} alt="" className="aspect-[2/3] w-full border border-hairline object-cover" />
                ) : (
                  <div className="aspect-[2/3] w-full bg-cover" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-2">
                  <h2 className="font-display text-[19px] leading-tight">{b.title}</h2>
                  <SectionBadge book={b} />
                  {b.status !== "approved" && (
                    <span className="border border-hairline px-2 py-1 text-[12px] capitalize text-soft">{b.status}</span>
                  )}
                </div>
                <p className="mt-0.5 text-[14px] text-soft">by {b.author}</p>
                <dl className="mt-2 flex flex-wrap gap-x-6 gap-y-1 text-[12.5px] text-muted-text">
                  <div><dt className="inline">Submitted </dt><dd className="inline">{formatDate(b.submittedAt)}</dd></div>
                  <div><dt className="inline">Approved </dt><dd className="inline">{formatDate(b.approvedAt)}</dd></div>
                  <div><dt className="inline">Categories </dt><dd className="inline">{[b.primaryCategory, ...b.secondaryCategories].join(", ")}</dd></div>
                  {b.email && <div><dt className="sr-only">Email</dt><dd className="inline">{b.email}</dd></div>}
                  {b.phone && <div><dt className="sr-only">Phone</dt><dd className="inline">{b.phone}</dd></div>}
                </dl>
                {b.status === "pending" && b.description && (
                  <p className="mt-2 max-w-3xl text-[13.5px] leading-relaxed text-soft">{b.description}</p>
                )}

                <div className="mt-4 flex flex-wrap items-end gap-3">
                  {b.status !== "approved" && (
                    <ApproveControls
                      book={b}
                      currentMonth={currentMonth}
                      busy={busyId === b.id}
                      onApprove={(p) => patch(b.id, { status: "approved", ...p })}
                    />
                  )}
                  {b.status !== "rejected" && (
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => patch(b.id, { status: "rejected" })}
                      className="border border-brass px-4 py-2 text-[13.5px] text-brass-text hover:bg-tint disabled:opacity-60"
                    >
                      {b.status === "approved" ? "Unpublish" : "Reject"}
                    </button>
                  )}
                  {b.status === "approved" && b.section === "featured" && (
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => patch(b.id, { placement: null })}
                      className="border border-hairline px-4 py-2 text-[13.5px] text-soft hover:border-brass disabled:opacity-60"
                    >
                      Un-feature
                    </button>
                  )}
                  {b.status === "approved" && b.section !== "featured" && (
                    <button
                      type="button"
                      disabled={busyId === b.id}
                      onClick={() => patch(b.id, { placement: "featured", placementMonth: currentMonth })}
                      className="border border-hairline px-4 py-2 text-[13.5px] text-soft hover:border-brass disabled:opacity-60"
                    >
                      Feature this month
                    </button>
                  )}
                  <button
                    type="button"
                    aria-expanded={editingId === b.id}
                    onClick={() => setEditingId(editingId === b.id ? null : b.id)}
                    className="px-2 py-2 text-[13.5px] underline decoration-1 underline-offset-4 hover:text-brass-text"
                  >
                    {editingId === b.id ? "Close editor" : "Edit"}
                  </button>
                  <a href={b.purchaseLink} target="_blank" rel="noopener noreferrer" className="px-2 py-2 text-[13.5px] text-soft underline decoration-1 underline-offset-4 hover:text-brass-text">
                    Open link
                  </a>
                </div>
              </div>
            </div>
            {editingId === b.id && (
              <div className="mt-5 border border-hairline bg-white p-5">
                <AdminBookForm book={b} categories={categories} currentMonth={currentMonth} onDone={() => setEditingId(null)} />
              </div>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}
