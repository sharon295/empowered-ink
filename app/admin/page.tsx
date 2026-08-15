import { isAdminAuthed } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminClient from "@/components/AdminClient";

export const revalidate = 0;

export default async function AdminPage() {
  const authed = await isAdminAuthed();
  if (!authed) return <AdminLoginForm />;

  const books = await prisma.book.findMany({
    where: { status: "pending" },
    orderBy: { submittedAt: "desc" },
  });

  const plainBooks = books.map((b) => ({
    id: b.id,
    title: b.title,
    author: b.author,
    email: b.email,
    phone: b.phone,
    description: b.description,
    coverImageUrl: b.coverImageUrl,
    purchaseLink: b.purchaseLink,
    primaryCategory: b.primaryCategory,
    secondaryCategories: b.secondaryCategories,
    otherCategoryLabel: b.otherCategoryLabel,
    isFeatured: b.isFeatured,
    categoryAddonPaid: b.categoryAddonPaid,
    submittedAt: b.submittedAt.toISOString(),
  }));

  return <AdminClient books={plainBooks} />;
}
