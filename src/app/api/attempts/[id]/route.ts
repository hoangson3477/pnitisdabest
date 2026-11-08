import type { NextRequest } from "next/server";

import { getAttemptResponse } from "@/lib/attempts";
import { DEVICE_COOKIE, fail, isUuid } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) return fail("Mã lượt chơi không hợp lệ.");

    const deviceId = request.cookies.get(DEVICE_COOKIE)?.value;
    if (!isUuid(deviceId)) return fail("Không tìm thấy lượt chơi.", 404);

    const state = await getAttemptResponse(id, deviceId);
    if (!state) return fail("Không tìm thấy lượt chơi.", 404);

    return Response.json(state);
  } catch (error) {
    console.error("GET /api/attempts/[id]", error);
    return fail("Không tải được lượt chơi. Thử lại nhé.", 500);
  }
}
