import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { saveAdminBook } from "@/lib/admin-request";

export async function GET(req: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const status = new URL(req.url).searchParams.get("status") ?? "pending";
  const books = await prisma.book.findMany({
    where: status === "all" ? {} : { status: status as "pending" | "approved" | "rejected" },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json({ books });
}

// The owner adding a book by hand (multipart, from /admin/add). Books added
// here are approved straight away.
export async function POST(req: Request) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  return saveAdminBook(req, null);
}
