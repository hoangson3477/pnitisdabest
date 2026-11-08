import { isAdmin } from "@/lib/auth";
import {
  ContentSetupError,
  getAttemptsCount,
  publishContentDraft,
  PublishLockedError,
} from "@/lib/content";
import { fail, isSameOrigin } from "@/lib/http";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  try {
    if (!(await isAdmin())) return fail("Phiên đăng nhập đã hết hạn.", 401);
    if (!isSameOrigin(request)) return fail("Yêu cầu không hợp lệ.", 403);

    const attemptsCount = await getAttemptsCount();
    if (attemptsCount > 0) {
      return fail(
        "Đã có lượt chơi nên không thể xuất bản nội dung. Hãy reset dữ liệu trước.",
        409,
      );
    }

    const published = await publishContentDraft();
    return Response.json({
      ok: true,
      id: published.id,
      publishedAt: published.created_at,
    });
  } catch (error) {
    console.error("POST /api/admin/content/publish", error);
    if (error instanceof PublishLockedError) return fail(error.message, 409);
    if (error instanceof ContentSetupError) return fail(error.message, 500);
    return fail("Không xuất bản được nội dung.", 500);
  }
}
