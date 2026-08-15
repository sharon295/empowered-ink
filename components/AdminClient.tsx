"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type PendingBook = {
  id: string;
  title: string;
  author: string;
  email: string;
  phone: string;
  description: string | null;
  coverImageUrl: string | null;
  purchaseLink: string;
  primaryCategory: string;
  secondaryCategories: string;
  otherCategoryLabel: string | null;
  isFeatured: boolean;
  categoryAddonPaid: boolean;
  submittedAt: string;
};

export default function AdminClient({ books }: { books: PendingBook[] }) {
  const router = useRouter();
  const [busyId, setBusyId] = useState<string | null>(null);

  async function act(id: string, status: "approved" | "rejected") {
    setBusyId(id);
    await fetch(`/api/admin/books/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setBusyId(null);
    router.refresh();
  }

  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }

  return (
    <div className="mx-auto max-w-4xl px-8 py-10">
      <div className="mb-6 flex items-center justify-between">
        <h1 className="font-display text-[26px] font-medium text-midnight-plum">
          Pending Submissions <span className="text-[16px] text-[#8a7a86]">({books.length})</span>
        </h1>
        <button onClick={logout} className="text-[12.5px] font-semibold text-deep-plum underline">
          Sign Out
        </button>
      </div>

      {books.length === 0 && (
        <p className="text-[14px] text-[#8a7a86]">No pending submissions right now.</p>
      )}

      <div className="flex flex-col gap-4">
        {books.map((b) => {
          const secondary: string[] = JSON.parse(b.secondaryCategories || "[]");
          return (
            <div key={b.id} className="rounded-sm border border-deep-plum/15 bg-white p-5">
              <div className="mb-2 flex flex-wrap items-start justify-between gap-2">
                <div>
                  <h2 className="font-display text-[18px] font-medium">{b.title}</h2>
                  <div className="text-[13px] text-[#6b5865]">by {b.author}</div>
                </div>
                <div className="flex gap-2">
                  {b.isFeatured && (
                    <span className="rounded-sm bg-champagne-gold px-2 py-1 text-[10px] font-bold uppercase text-midnight-plum">
                      Featured (paid)
                    </span>
                  )}
                  {b.categoryAddonPaid && (
                    <span className="rounded-sm bg-soft-lavender px-2 py-1 text-[10px] font-bold uppercase text-deep-plum">
                      Category add-on (paid)
                    </span>
                  )}
                </div>
              </div>

              <dl className="mb-3 grid grid-cols-1 gap-x-6 gap-y-1 text-[12.5px] text-[#3f2a3a] sm:grid-cols-2">
                <div>
                  <dt className="font-semibold">Email</dt>
                  <dd>{b.email}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Phone</dt>
                  <dd>{b.phone}</dd>
                </div>
                <div>
                  <dt className="font-semibold">Primary category</dt>
                  <dd>
                    {b.primaryCategory}
                    {b.primaryCategory === "Other" && b.otherCategoryLabel ? ` — ${b.otherCategoryLabel}` : ""}
                  </dd>
                </div>
                <div>
                  <dt className="font-semibold">Secondary categories</dt>
                  <dd>{secondary.length > 0 ? secondary.join(", ") : "—"}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="font-semibold">Purchase link</dt>
                  <dd>
                    <a href={b.purchaseLink} target="_blank" rel="noopener noreferrer" className="underline">
                      {b.purchaseLink}
                    </a>
                  </dd>
                </div>
                {b.coverImageUrl && (
                  <div className="sm:col-span-2">
                    <dt className="font-semibold">Cover</dt>
                    <dd>
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={b.coverImageUrl} alt="" className="mt-1 h-24 w-auto rounded-sm border border-black/10" />
                    </dd>
                  </div>
                )}
              </dl>

              {b.description && (
                <p className="mb-4 text-[13px] leading-relaxed text-[#3f2a3a]">{b.description}</p>
              )}

              <div className="flex gap-3">
                <button
                  onClick={() => act(b.id, "approved")}
                  disabled={busyId === b.id}
                  className="rounded-sm bg-deep-plum px-5 py-2 text-[12px] font-bold uppercase tracking-wide text-warm-white disabled:opacity-60"
                >
                  Approve
                </button>
                <button
                  onClick={() => act(b.id, "rejected")}
                  disabled={busyId === b.id}
                  className="rounded-sm border border-deep-plum/30 px-5 py-2 text-[12px] font-bold uppercase tracking-wide text-deep-plum disabled:opacity-60"
                >
                  Reject
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
