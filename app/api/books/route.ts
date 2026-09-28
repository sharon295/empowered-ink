import { NextResponse } from "next/server";
import { listBooks } from "@/lib/books";

// GET /api/books?q=&category=&after=<cursor>
// One batch of the A–Z list. With q or category set, searches every visible
// book (Featured and New on the Shelf included).
export async function GET(req: Request) {
  const params = new URL(req.url).searchParams;
  try {
    const page = await listBooks({
      q: params.get("q")?.slice(0, 200) ?? "",
      category: params.get("category") ?? "",
      after: params.get("after"),
    });
    return NextResponse.json(page, { headers: { "Cache-Control": "no-store" } });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ error: "Couldn't load books" }, { status: 500 });
  }
}
