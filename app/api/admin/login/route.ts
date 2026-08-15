import { NextResponse } from "next/server";
import { setAdminAuthed } from "@/lib/admin-auth";

export async function POST(req: Request) {
  const { password } = await req.json();
  if (!process.env.ADMIN_PASSWORD || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: "Incorrect password" }, { status: 401 });
  }
  await setAdminAuthed();
  return NextResponse.json({ ok: true });
}
