import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const { status } = await req.json();
  if (status !== "approved" && status !== "rejected") {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }
  const book = await prisma.book.update({ where: { id }, data: { status } });
  return NextResponse.json({ book });
}
