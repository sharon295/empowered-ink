import Link from "next/link";
import { isAdminAuthed } from "@/lib/admin-auth";
import { getCategoryNames } from "@/lib/categories";
import { currentMonthKey, monthLabel } from "@/lib/month";
import AdminLoginForm from "@/components/AdminLoginForm";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminBookForm from "@/components/admin/AdminBookForm";

export const dynamic = "force-dynamic";
export const metadata = { title: "Add a book — Empowered Ink", robots: { index: false } };

// Three entry points, like the membership-level links:
//   /admin/add?placement=featured  -> Featured This Month
//   /admin/add?placement=new       -> New on the Shelf
//   /admin/add?placement=list      -> straight into the A–Z list (e.g. existing books)
// The month defaults to the current month and can be changed on the form.
// After each save the form reopens empty, so many books can be entered in a row.
const MODES = {
  featured: {
    header: "add-featured",
    title: "Add a Featured book",
    intro: (month: string) =>
      `It starts in Featured This Month for ${month}. Choose a later month under “Where it shows” to schedule it; it stays hidden until that month begins.`,
    placement: "featured",
  },
  new: {
    header: "add-new",
    title: "Add a New on the Shelf book",
    intro: (month: string) =>
      `It starts in New on the Shelf for ${month}. Choose a later month under “Where it shows” to schedule it; it stays hidden until that month begins.`,
    placement: "new_on_shelf",
  },
  list: {
    header: "add-list",
    title: "Add a book to the A–Z list",
    intro: () =>
      "For books that have already been on the site. It goes straight into All Empowered Ink Books in its alphabetical place, without appearing in Featured or New on the Shelf.",
    placement: null,
  },
} as const;

export default async function AddBookPage({ searchParams }: PageProps<"/admin/add">) {
  if (!(await isAdminAuthed())) return <AdminLoginForm />;
  const params = await searchParams;
  const modeKey = (["featured", "new", "list"] as const).find((k) => k === params.placement) ?? "new";
  const mode = MODES[modeKey];
  const month = currentMonthKey();
  const categories = await getCategoryNames();
  const added = typeof params.added === "string" ? params.added : "";

  return (
    <>
      <AdminHeader active={mode.header} />
      <div className="mx-auto max-w-5xl px-4 py-8 sm:px-8">
        <h1 className="font-display text-[30px]">{mode.title}</h1>
        <p className="mb-6 mt-2 max-w-2xl text-[14px] text-soft">
          Books you add here go live straight away. {mode.intro(monthLabel(month))}
        </p>
        {added && (
          <p role="status" className="mb-6 border border-hairline bg-tint px-4 py-3 text-[14px]">
            &ldquo;{added}&rdquo; was added. Add the next one below, or{" "}
            <Link href="/admin?status=approved" className="underline decoration-1 underline-offset-4 hover:text-brass-text">
              see all books
            </Link>
            .
          </p>
        )}
        <AdminBookForm
          key={`${modeKey}|${added}`}
          categories={categories}
          currentMonth={month}
          initialPlacement={{ placement: mode.placement, placementMonth: mode.placement ? month : null }}
          afterCreate={`/admin/add?placement=${modeKey}`}
        />
      </div>
    </>
  );
}
