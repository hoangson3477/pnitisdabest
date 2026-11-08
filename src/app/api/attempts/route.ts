import { cookies } from "next/headers";
import type { NextRequest } from "next/server";

import { getAttemptResponse } from "@/lib/attempts";
import { DEVICE_COOKIE, cleanName, fail, isUuid, maxAttempts, readJson } from "@/lib/http";
import { db } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await readJson<{ name?: unknown }>(request);
    const name = cleanName(body?.name);

    if (name.length < 1 || name.length > 24) {
      return fail("Tên hiển thị phải từ 1 đến 24 ký tự.");
    }

    const jar = await cookies();
    let deviceId = jar.get(DEVICE_COOKIE)?.value;

    if (!isUuid(deviceId)) {
      deviceId = crypto.randomUUID();
      jar.set(DEVICE_COOKIE, deviceId, {
        httpOnly: true,
        sameSite: "lax",
        secure: process.env.NODE_ENV === "production",
        path: "/",
        maxAge: 60 * 60 * 24 * 365,
      });
    }

    const supabase = db();

    const { data: active, error: activeError } = await supabase
      .from("attempts")
      .select("id")
      .eq("device_id", deviceId)
      .is("finished_at", null)
      .order("started_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeError) throw activeError;

    if (active) {
      const state = await getAttemptResponse(active.id, deviceId);
      if (!state) return fail("Không tìm thấy lượt chơi.", 404);
      return Response.json(state);
    }

    const { count, error: countError } = await supabase
      .from("attempts")
      .select("id", { count: "exact", head: true })
      .eq("device_id", deviceId);

    if (countError) throw countError;

    if ((count ?? 0) >= maxAttempts()) {
      return fail(
        "Thiết bị này đã dùng hết lượt chơi. Hãy xem bảng xếp hạng hoặc nhờ admin.",
        429,
      );
    }

    const { data: created, error: createError } = await supabase
      .from("attempts")
      .insert({ name, device_id: deviceId })
      .select("id")
      .single();

    if (createError) {
      // Hai tab cùng tạo lượt: index "một lượt đang chơi / thiết bị" chặn lượt thứ hai.
      if (createError.code === "23505") {
        const { data: raced } = await supabase
          .from("attempts")
          .select("id")
          .eq("device_id", deviceId)
          .is("finished_at", null)
          .maybeSingle();

        if (raced) {
          const state = await getAttemptResponse(raced.id, deviceId);
          if (state) return Response.json(state);
        }
      }

      throw createError;
    }

    const state = await getAttemptResponse(created.id, deviceId);
    if (!state) return fail("Không tạo được lượt chơi.", 500);

    return Response.json(state, { status: 201 });
  } catch (error) {
    console.error("POST /api/attempts", error);
    return fail("Không tạo được lượt chơi. Thử lại nhé.", 500);
  }
}
