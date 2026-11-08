import "server-only";

export const DEVICE_COOKIE = "clb_quiz_device";

export function maxAttempts() {
  const value = Number(process.env.MAX_ATTEMPTS_PER_DEVICE);
  return Number.isInteger(value) && value >= 1 ? Math.min(value, 5) : 1;
}

export function fail(message: string, status = 400) {
  return Response.json({ error: message }, { status });
}

export function isSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin) return true;

  try {
    return new URL(origin).origin === new URL(request.url).origin;
  } catch {
    return false;
  }
}

export async function readJson<T>(request: Request): Promise<T | null> {
  try {
    return (await request.json()) as T;
  } catch {
    return null;
  }
}

export function isUuid(value: unknown): value is string {
  return (
    typeof value === "string" &&
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
      value,
    )
  );
}

export function cleanName(value: unknown) {
  if (typeof value !== "string") return "";

  return value
    .replace(/[\u0000-\u001f\u007f\u200b-\u200f\u202a-\u202e]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}
