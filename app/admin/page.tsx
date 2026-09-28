import { isAdminAuthed } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { sectionOf } from "@/lib/books";
import { getCategoryNames } from "@/lib/categories";
import { currentMonthKey } from "@/lib/month";
import { toAdminBook } from "@/lib/admin-types";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminClient from "@/components/AdminClient";
import AdminHeader from "@/components/admin/AdminHeader";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin — Empowered Ink", robots: { index: false } };

const STATUSES = ["pending", "approved", "rejected", "all"] as const;
type StatusFilter = (typeof STATUSES)[number];

export default async function AdminPage({ searchParams }: PageProps<"/admin">) {
  if (!(await isAdminAuthed())) return <AdminLoginForm />;

  const params = await searchParams;
  const status: StatusFilter = STATUSES.includes(params.status as StatusFilter) ? (params.status as StatusFilter) : "pending";
  const month = currentMonthKey();

  const [books, grouped, categories] = await Promise.all([
    prisma.book.findMany({
      where: status === "all" ? {} : { status },
      orderBy: status === "approved" ? [{ sortTitle: "asc" }, { id: "asc" }] : [{ submittedAt: "desc" }],
    }),
    prisma.book.groupBy({ by: ["status"], _count: true }),
    getCategoryNames(),
  ]);

  const counts: Record<StatusFilter, number> = { pending: 0, approved: 0, rejected: 0, all: 0 };
  for (const g of grouped) {
    counts[g.status] = g._count;
    counts.all += g._count;
  }

  return (
    <>
      <AdminHeader active="books" />
      <AdminClient
        books={books.map((b) => toAdminBook(b, sectionOf(b, month)))}
        status={status}
        counts={counts}
        categories={categories}
        currentMonth={month}
        justAdded={params.added === "1"}
      />
    </>
  );
}
