import type { NextRequest } from "next/server";

import { isAdmin } from "@/lib/auth";
import { fail, isUuid } from "@/lib/http";
import { db } from "@/lib/supabase";

export async function DELETE(
  _request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    if (!(await isAdmin())) return fail("Phiên đăng nhập đã hết hạn.", 401);

    const { id } = await context.params;
    if (!isUuid(id)) return fail("Mã lượt chơi không hợp lệ.");

    const { error } = await db().from("attempts").delete().eq("id", id);
    if (error) throw error;

    return Response.json({ ok: true });
  } catch (error) {
    console.error("DELETE /api/admin/attempts/[id]", error);
    return fail("Không xóa được lượt chơi.", 500);
  }
}
