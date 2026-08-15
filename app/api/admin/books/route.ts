import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function GET() {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const books = await prisma.book.findMany({
    where: { status: "pending" },
    orderBy: { submittedAt: "desc" },
  });
  return NextResponse.json({ books });
}
