import "server-only";

import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";

export const ADMIN_COOKIE = "clb_quiz_admin";
const MAX_AGE_SECONDS = 60 * 60 * 12;

function adminSecret() {
  const secret = process.env.ADMIN_SECRET;
  if (!secret) {
    throw new Error("Thiếu ADMIN_SECRET.");
  }
  return secret;
}

function sign(expiresAt: number) {
  return createHmac("sha256", adminSecret()).update(String(expiresAt)).digest("hex");
}

export function createAdminToken() {
  const expiresAt = Date.now() + MAX_AGE_SECONDS * 1000;
  return `${expiresAt}.${sign(expiresAt)}`;
}

export function verifyAdminToken(token: string | undefined) {
  if (!token) return false;

  const [expiresRaw, signature] = token.split(".");
  const expiresAt = Number(expiresRaw);

  if (!Number.isFinite(expiresAt) || expiresAt < Date.now() || !signature) {
    return false;
  }

  const expected = sign(expiresAt);
  const actualBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expected);

  return (
    actualBuffer.length === expectedBuffer.length &&
    timingSafeEqual(actualBuffer, expectedBuffer)
  );
}

export async function isAdmin() {
  const store = await cookies();
  return verifyAdminToken(store.get(ADMIN_COOKIE)?.value);
}

export function checkPassword(input: string) {
  const expected = process.env.ADMIN_PASSWORD;
  if (!expected) {
    throw new Error("Thiếu ADMIN_PASSWORD.");
  }

  const actualHash = createHash("sha256").update(input).digest();
  const expectedHash = createHash("sha256").update(expected).digest();

  return timingSafeEqual(actualHash, expectedHash);
}

export function adminCookieOptions() {
  return {
    httpOnly: true,
    sameSite: "lax" as const,
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: MAX_AGE_SECONDS,
  };
}
