"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";

const LINKS = [
  { href: "/admin", key: "books", label: "Books" },
  { href: "/admin/add?placement=featured", key: "add-featured", label: "Add a Featured book" },
  { href: "/admin/add?placement=new", key: "add-new", label: "Add a New on the Shelf book" },
  { href: "/admin/add?placement=list", key: "add-list", label: "Add to the A–Z list" },
  { href: "/admin/categories", key: "categories", label: "Categories" },
] as const;

export default function AdminHeader({ active }: { active: (typeof LINKS)[number]["key"] }) {
  const router = useRouter();
  async function logout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.refresh();
  }
  return (
    <header className="border-b border-hairline bg-ivory">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center gap-x-6 gap-y-2 px-4 py-4 sm:px-8">
        <span className="font-display text-[18px] italic">Empowered Ink · Admin</span>
        <nav aria-label="Admin" className="flex flex-wrap gap-x-5 gap-y-1 text-[13.5px]">
          {LINKS.map((l) => (
            <Link
              key={l.key}
              href={l.href}
              aria-current={active === l.key ? "page" : undefined}
              className={active === l.key ? "text-brass-text underline decoration-1 underline-offset-4" : "text-soft hover:text-brass-text"}
            >
              {l.label}
            </Link>
          ))}
        </nav>
        <button type="button" onClick={logout} className="ml-auto text-[13.5px] text-soft underline decoration-1 underline-offset-4 hover:text-brass-text">
          Sign out
        </button>
      </div>
    </header>
  );
}
