import { isAdmin } from "@/lib/auth";
import { getAdminContent, saveContentDraft, ContentSetupError } from "@/lib/content";
import { parseSiteContent } from "@/lib/content-validation";
import { fail, isSameOrigin, readJson } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    if (!(await isAdmin())) return fail("Phiên đăng nhập đã hết hạn.", 401);
    return Response.json(await getAdminContent());
  } catch (error) {
    console.error("GET /api/admin/content", error);
    if (error instanceof ContentSetupError) return fail(error.message, 500);
    return fail("Không tải được nội dung.", 500);
  }
}

export async function PUT(request: Request) {
  try {
    if (!(await isAdmin())) return fail("Phiên đăng nhập đã hết hạn.", 401);
    if (!isSameOrigin(request)) return fail("Yêu cầu không hợp lệ.", 403);

    const contentLength = Number(request.headers.get("content-length") ?? 0);
    if (contentLength > 500_000) {
      return fail("Nội dung quá lớn.", 413);
    }

    const body = await readJson<{ data?: unknown; revision?: unknown }>(request);
    const revision = body?.revision;

    if (
      typeof revision !== "number" ||
      !Number.isInteger(revision) ||
      revision < 0
    ) {
      return fail("Phiên bản bản nháp không hợp lệ.");
    }

    const parsed = parseSiteContent(body?.data);
    if (!parsed.ok) return fail(parsed.error);

    const saved = await saveContentDraft(parsed.data, revision);
    if (!saved) {
      return fail(
        "Bản nháp đã thay đổi ở tab khác. Tải lại trước khi lưu.",
        409,
      );
    }

    return Response.json({
      ok: true,
      revision: saved.revision,
      updatedAt: saved.updated_at,
    });
  } catch (error) {
    console.error("PUT /api/admin/content", error);
    if (error instanceof ContentSetupError) return fail(error.message, 500);
    return fail("Không lưu được nội dung.", 500);
  }
}
