import { describe, expect, it, vi } from "vitest";
import { syncContent } from "../script/sync-supabase.mjs";

function database(results: Array<{ data?: unknown; error?: unknown; count?: number }>) {
  const operations: string[] = [];
  const from = vi.fn((table: string) => {
    const result = results.shift();
    if (!result) throw new Error("Unexpected database request");
    const chain = {
      select: () => chain,
      eq: () => chain,
      update: () => { operations.push(table + ":update"); return chain; },
      insert: () => { operations.push(table + ":insert"); return chain; },
      single: async () => result,
      maybeSingle: async () => result,
      then: (resolve: (value: unknown) => unknown) => Promise.resolve(result).then(resolve),
    };
    return chain;
  });
  return { client: { from }, operations };
}

const content = { questions: [{ id: "test" }] };

describe("đồng bộ nội dung an toàn", () => {
  it("mặc định chỉ lưu nháp và backup bản trước", async () => {
    const db = database([{ data: { revision: 3, data: { old: true } } }, { data: { revision: 4 } }]);
    const backup = vi.fn();
    expect(await syncContent(db.client, content, { backup })).toEqual({ status: "draft_saved", revision: 4 });
    expect(backup).toHaveBeenCalledOnce();
    expect(db.operations).toEqual(["content_drafts:update"]);
  });

  it("có lượt chơi thì không xuất bản hay xóa dữ liệu", async () => {
    const db = database([{ data: { revision: 3 } }, { data: { revision: 4 } }, { count: 1 }]);
    expect(await syncContent(db.client, content, { publish: true })).toMatchObject({ status: "draft_saved_publish_locked", attempts: 1 });
    expect(db.operations).toEqual(["content_drafts:update"]);
  });

  it("dừng khi bản nháp bị thay đổi đồng thời", async () => {
    const db = database([{ data: { revision: 3 } }, { data: null }]);
    await expect(syncContent(db.client, content, { publish: true })).rejects.toThrow("Bản nháp");
    expect(db.client.from).toHaveBeenCalledTimes(2);
  });

  it("trigger chặn thì không ghi đè phiên bản đã xuất bản", async () => {
    const db = database([{ data: { revision: 3 } }, { data: { revision: 4 } }, { count: 0 }, { error: { code: "P0001" } }]);
    await expect(syncContent(db.client, content, { publish: true })).rejects.toThrow("giữ nguyên");
    expect(db.operations).toEqual(["content_drafts:update", "content_versions:insert"]);
  });

  it("xuất bản phiên bản mới và đọc lại xác minh khi không có lượt", async () => {
    const db = database([{ data: null }, { data: { revision: 1 } }, { count: 0 }, { data: { id: "v1", created_at: "now" } }, { data: { data: content } }]);
    expect(await syncContent(db.client, content, { publish: true })).toMatchObject({ status: "published", revision: 1 });
    expect(db.operations).toEqual(["content_drafts:insert", "content_versions:insert"]);
  });

  it("không xuất bản khi không đọc được số lượt", async () => {
    const db = database([{ data: { revision: 1 } }, { data: { revision: 2 } }, { count: null } as unknown as { count: number }]);
    await expect(syncContent(db.client, content, { publish: true })).rejects.toThrow("Không xác định");
    expect(db.operations).toEqual(["content_drafts:update"]);
  });

  it("xác minh JSONB không phụ thuộc thứ tự khóa hoặc trường undefined", async () => {
    const local = { questions: [{ id: "q1", hint: undefined, prompt: "Test" }] };
    const remote = { questions: [{ prompt: "Test", id: "q1" }] };
    const db = database([{ data: null }, { data: { revision: 1 } }, { count: 0 }, { data: { id: "v1" } }, { data: { data: remote } }]);
    expect(await syncContent(db.client, local, { publish: true })).toMatchObject({ status: "published" });
  });
});

