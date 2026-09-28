import { cookies } from "next/headers";
import { createHmac, timingSafeEqual } from "crypto";

const COOKIE_NAME = "ei_admin";
const MAX_AGE_SECONDS = 60 * 60 * 8;

// The cookie carries its expiry plus an HMAC of it, so it can't be forged by
// setting a cookie by hand. Changing ADMIN_PASSWORD (or ADMIN_SESSION_SECRET)
// signs everyone out.
function secret(): string | null {
  return process.env.ADMIN_SESSION_SECRET || process.env.ADMIN_PASSWORD || null;
}

function sign(expires: number, key: string): string {
  return createHmac("sha256", key).update(`admin:${expires}`).digest("base64url");
}

export async function isAdminAuthed(): Promise<boolean> {
  const key = secret();
  if (!key) return false;
  const store = await cookies();
  const value = store.get(COOKIE_NAME)?.value ?? "";
  const [expiresRaw, signature] = value.split(".");
  const expires = Number(expiresRaw);
  if (!signature || !Number.isFinite(expires) || expires < Date.now()) return false;
  const expected = Buffer.from(sign(expires, key));
  const actual = Buffer.from(signature);
  return expected.length === actual.length && timingSafeEqual(expected, actual);
}

export async function setAdminAuthed() {
  const key = secret();
  if (!key) return;
  const expires = Date.now() + MAX_AGE_SECONDS * 1000;
  const store = await cookies();
  store.set(COOKIE_NAME, `${expires}.${sign(expires, key)}`, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  });
}

export async function clearAdminAuthed() {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}
