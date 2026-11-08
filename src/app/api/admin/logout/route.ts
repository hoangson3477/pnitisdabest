import { cookies } from "next/headers";

import { ADMIN_COOKIE } from "@/lib/auth";
import { fail } from "@/lib/http";

export async function POST() {
  try {
    const jar = await cookies();
    jar.delete(ADMIN_COOKIE);
    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/admin/logout", error);
    return fail("Không đăng xuất được.", 500);
  }
}
