import { isAdmin } from "@/lib/auth";
import {
  ContentSetupError,
  getContentVersion,
  saveContentDraft,
} from "@/lib/content";
import { fail, isSameOrigin, isUuid, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) return fail("Phiên đăng nhập đã hết hạn.", 401);
    if (!isSameOrigin(request)) return fail("Yêu cầu không hợp lệ.", 403);

    const body = await readJson<{ versionId?: unknown; revision?: unknown }>(
      request,
    );
    const versionId = body?.versionId;
    const revision = body?.revision;

    if (!isUuid(versionId)) return fail("Bản nội dung không hợp lệ.");
    if (
      typeof revision !== "number" ||
      !Number.isInteger(revision) ||
      revision < 0
    ) {
      return fail("Phiên bản bản nháp không hợp lệ.");
    }

    const version = await getContentVersion(versionId);
    if (!version) return fail("Không tìm thấy bản nội dung.", 404);

    const saved = await saveContentDraft(version, revision);
    if (!saved) {
      return fail(
        "Bản nháp đã thay đổi ở tab khác. Tải lại trước khi khôi phục.",
        409,
      );
    }

    return Response.json({
      ok: true,
      revision: saved.revision,
      updatedAt: saved.updated_at,
    });
  } catch (error) {
    console.error("POST /api/admin/content/restore", error);
    if (error instanceof ContentSetupError) return fail(error.message, 500);
    return fail("Không khôi phục được nội dung.", 500);
  }
}
