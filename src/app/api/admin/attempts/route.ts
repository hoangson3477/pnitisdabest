import { isAdmin } from "@/lib/auth";
import { fail } from "@/lib/http";
import { db } from "@/lib/supabase";
import type { AdminAttempt } from "@/lib/types";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await isAdmin())) return fail("Phiên đăng nhập đã hết hạn.", 401);

    const { data, error } = await db()
      .from("attempt_scores")
      .select("id,name,score,started_at,finished_at")
      .order("started_at", { ascending: false })
      .limit(500);

    if (error) throw error;

    return Response.json({ attempts: (data ?? []) as AdminAttempt[] });
  } catch (error) {
    console.error("GET /api/admin/attempts", error);
    return fail("Không tải được danh sách lượt chơi.", 500);
  }
}
