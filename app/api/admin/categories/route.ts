import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { isAdminAuthed } from "@/lib/admin-auth";
import { renameCategory } from "@/lib/book-writes";

const unauthorized = () => NextResponse.json({ error: "unauthorized" }, { status: 401 });

// Add a category: { name }
export async function POST(req: Request) {
  if (!(await isAdminAuthed())) return unauthorized();
  const name = String((await req.json()).name ?? "").trim();
  if (!name) return NextResponse.json({ error: "Enter a name" }, { status: 400 });
  const last = await prisma.category.findFirst({ where: { name: { not: "Other" } }, orderBy: { sortOrder: "desc" } });
  try {
    const category = await prisma.category.create({ data: { name, sortOrder: (last?.sortOrder ?? 0) + 1 } });
    return NextResponse.json({ category });
  } catch (err) {
    if (err instanceof Prisma.PrismaClientKnownRequestError && err.code === "P2002") {
      return NextResponse.json({ error: "That category already exists" }, { status: 409 });
    }
    throw err;
  }
}

// Rename a category everywhere it's used: { from, to }
export async function PATCH(req: Request) {
  if (!(await isAdminAuthed())) return unauthorized();
  const body = await req.json();
  const from = String(body.from ?? "");
  const to = String(body.to ?? "").trim();
  if (!to) return NextResponse.json({ error: "Enter a name" }, { status: 400 });
  if (from === to) return NextResponse.json({ ok: true });
  if (await prisma.category.findUnique({ where: { name: to } })) {
    return NextResponse.json({ error: "A category with that name already exists" }, { status: 409 });
  }
  if (!(await prisma.category.findUnique({ where: { name: from } }))) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }
  await renameCategory(from, to);
  return NextResponse.json({ ok: true });
}
