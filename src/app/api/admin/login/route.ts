import { cookies } from "next/headers";

import {
  ADMIN_COOKIE,
  adminCookieOptions,
  checkPassword,
  createAdminToken,
} from "@/lib/auth";
import { fail, readJson } from "@/lib/http";

export async function POST(request: Request) {
  try {
    if (!process.env.ADMIN_PASSWORD || !process.env.ADMIN_SECRET) {
      return fail("Admin chưa được cấu hình. Kiểm tra biến môi trường.", 500);
    }

    const body = await readJson<{ password?: unknown }>(request);
    if (typeof body?.password !== "string" || !checkPassword(body.password)) {
      return fail("Mật khẩu không đúng.", 401);
    }

    const jar = await cookies();
    jar.set(ADMIN_COOKIE, createAdminToken(), adminCookieOptions());

    return Response.json({ ok: true });
  } catch (error) {
    console.error("POST /api/admin/login", error);
    return fail("Không đăng nhập được. Thử lại nhé.", 500);
  }
}
