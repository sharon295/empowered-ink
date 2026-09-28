import { isAdminAuthed } from "@/lib/admin-auth";
import { prisma } from "@/lib/prisma";
import { categoryUsage } from "@/lib/book-writes";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminHeader from "@/components/admin/AdminHeader";
import CategoryManager from "@/components/admin/CategoryManager";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categories — Empowered Ink", robots: { index: false } };

export default async function CategoriesPage() {
  if (!(await isAdminAuthed())) return <AdminLoginForm />;
  const [categories, usage] = await Promise.all([
    prisma.category.findMany({ orderBy: [{ sortOrder: "asc" }, { name: "asc" }] }),
    categoryUsage(),
  ]);
  return (
    <>
      <AdminHeader active="categories" />
      <CategoryManager categories={categories.map((c) => ({ name: c.name, count: usage[c.name] ?? 0 }))} />
    </>
  );
}
