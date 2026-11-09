import fs from "node:fs";
import path from "node:path";
import { pathToFileURL } from "node:url";
import { isDeepStrictEqual } from "node:util";
import ts from "typescript";
import { createClient } from "@supabase/supabase-js";

// Isolated loader for these static content/validation modules, never for user input.
function loadLocalModule(file) {
  const source = fs.readFileSync(file, "utf8").replace(/^import "server-only";/m, "");
  const output = ts.transpileModule(source, {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loaded = { exports: {} };
  const localRequire = (id) => {
    if (!id.startsWith(".")) throw new Error("Unexpected content import.");
    return loadLocalModule(path.resolve(path.dirname(file), id + ".ts"));
  };
  new Function("exports", "module", "require", output)(loaded.exports, loaded, localRequire);
  return loaded.exports;
}

export async function syncContent(client, content, { publish = false, backup = () => {} } = {}) {
  const draft = await client.from("content_drafts").select("data,revision,updated_at").eq("id", 1).maybeSingle();
  if (draft.error) throw new Error("Không đọc được bản nháp: " + draft.error.message);
  if (draft.data) backup(draft.data);
  const revision = draft.data?.revision ?? 0;
  const payload = { data: content, revision: revision + 1, updated_at: new Date().toISOString() };
  const saved = revision
    ? await client.from("content_drafts").update(payload).eq("id", 1).eq("revision", revision).select("revision").maybeSingle()
    : await client.from("content_drafts").insert({ id: 1, ...payload }).select("revision").single();
  if (saved.error || !saved.data) throw new Error("Bản nháp đã thay đổi hoặc không lưu được; dừng đồng bộ.");
  if (!publish) return { status: "draft_saved", revision: saved.data.revision };

  const attempts = await client.from("attempts").select("id", { count: "exact", head: true });
  if (attempts.error) throw new Error("Không đếm được lượt chơi; dừng xuất bản.");
  if (typeof attempts.count !== "number") throw new Error("Không xác định được số lượt chơi; dừng xuất bản.");
  if (attempts.count > 0) return { status: "draft_saved_publish_locked", revision: saved.data.revision, attempts: attempts.count };

  // Database trigger also checks attempts, including arrivals after the count above.
  const published = await client.from("content_versions").insert({ data: content }).select("id,created_at").single();
  if (published.error) throw new Error("Bản nháp đã lưu nhưng xuất bản bị chặn; giữ nguyên bản công khai.");
  const verified = await client.from("content_versions").select("data").eq("id", published.data.id).single();
  if (verified.error || !isDeepStrictEqual(verified.data?.data, JSON.parse(JSON.stringify(content)))) {
    throw new Error("Đã xuất bản nhưng chưa xác minh được nội dung; kiểm tra admin.");
  }
  return { status: "published", revision: saved.data.revision, publishedAt: published.data.created_at };
}

async function main() {
  const args = process.argv.slice(2);
  if (args.some(arg => !["--publish", "--check"].includes(arg)) || (args.includes("--publish") && args.includes("--check"))) {
    throw new Error("Dùng --publish hoặc --check. Không hỗ trợ xóa lượt chơi.");
  }
  process.loadEnvFile(".env.local");
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error("Thiếu cấu hình Supabase.");
  const root = process.cwd();
  const content = {
    club: loadLocalModule(path.join(root, "src/content/club.ts")).club,
    stages: loadLocalModule(path.join(root, "src/content/story.ts")).stages,
    questions: loadLocalModule(path.join(root, "src/content/questions.ts")).questions,
  };
  const { parseSiteContent } = loadLocalModule(path.join(root, "src/lib/content-validation.ts"));
  const parsed = parseSiteContent(content);
  if (!parsed.ok) throw new Error(parsed.error);
  const client = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
  if (args.includes("--check")) {
    const latest = await client.from("content_versions").select("data,created_at").order("created_at", { ascending: false }).limit(1).single();
    if (latest.error || !isDeepStrictEqual(latest.data?.data, JSON.parse(JSON.stringify(parsed.data)))) {
      throw new Error("Nội dung công khai khác nội dung local.");
    }
    console.log(JSON.stringify({ status: "published_verified", publishedAt: latest.data.created_at, questions: parsed.data.questions.length }));
    return;
  }
  const result = await syncContent(client, parsed.data, {
    publish: args.includes("--publish"),
    backup: draft => {
      const dir = path.join(root, ".tmp-content-backups");
      fs.mkdirSync(dir, { recursive: true });
      fs.writeFileSync(path.join(dir, Date.now() + "-draft.json"), JSON.stringify(draft, null, 2));
    },
  });
  console.log(JSON.stringify(result));
}

if (process.argv[1] && import.meta.url === pathToFileURL(path.resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}

