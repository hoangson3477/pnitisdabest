import { isAdmin } from "@/lib/auth";
import { fail, readJson } from "@/lib/http";
import { db } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) return fail("Phiên đăng nhập đã hết hạn.", 401);

    const body = await readJson<{ confirm?: unknown }>(request);
    if (body?.confirm !== "RESET") {
      return fail("Xác nhận không hợp lệ.");
    }

    const { error } = await db()
      .from("attempts")
      .delete()
      .gte("started_at", "1970-01-01T00:00:00.000Z");

    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/admin/reset", error);
    return fail("Không reset được dữ liệu.", 500);
  }
}
