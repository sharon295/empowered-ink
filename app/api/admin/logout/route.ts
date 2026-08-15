import { NextResponse } from "next/server";
import { clearAdminAuthed } from "@/lib/admin-auth";

export async function POST() {
  await clearAdminAuthed();
  return NextResponse.json({ ok: true });
}
