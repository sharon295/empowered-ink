import { isAdminAuthed } from "@/lib/admin-auth";
import { getCategoryNames } from "@/lib/categories";
import { currentMonthKey, monthLabel } from "@/lib/month";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminBookForm from "@/components/admin/AdminBookForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add a book — Empowered Ink", robots: { index: false } };

// Two entry points, like the membership-level links:
//   /admin/add?placement=featured  -> starts as Featured This Month
//   /admin/add?placement=new       -> starts as New on the Shelf
// The month defaults to the current month and can be changed on the form.
export default async function AddBookPage({ searchParams }: PageProps<"/admin/add">) {
  if (!(await isAdminAuthed())) return <AdminLoginForm />;
  const params = await searchParams;
  const featured = params.placement === "featured";
  const month = currentMonthKey();
  const categories = await getCategoryNames();

  return (
    <>
      <AdminHeader active={featured ? "add-featured" : "add-new"} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <h1 className="font-display text-[30px]">
          {featured ? "Add a Featured book" : "Add a New on the Shelf book"}
        </h1>
        <p className="mb-8 mt-2 max-w-2xl text-[14px] text-soft">
          Books you add here are approved straight away. It starts in {featured ? "Featured This Month" : "New on the Shelf"} for{" "}
          {monthLabel(month)}; choose a later month under &ldquo;Where it shows&rdquo; to schedule it, and it stays
          hidden until that month begins.
        </p>
        <AdminBookForm
          key={featured ? "featured" : "new"}
          categories={categories}
          currentMonth={month}
          initialPlacement={{ placement: featured ? "featured" : "new_on_shelf", placementMonth: month }}
        />
      </div>
    </>
  );
}
