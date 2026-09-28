import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { saveAdminBook } from "@/lib/admin-request";

// Approve / reject ({ status }, optionally with placement + placementMonth)
// as JSON, or a full edit (any field, plus a replacement cover) as multipart.
export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  if (!(await isAdminAuthed())) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
  const { id } = await params;
  const existing = await prisma.book.findUnique({ where: { id } });
  if (!existing) return NextResponse.json({ error: "not found" }, { status: 404 });
  return saveAdminBook(req, existing);
}
