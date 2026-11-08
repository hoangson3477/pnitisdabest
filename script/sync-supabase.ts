import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Mock server-only so it doesn't throw outside Next.js server runtime
import Module from "module";
// @ts-expect-error internal
const originalRequire = Module.prototype.require;
// @ts-expect-error internal
Module.prototype.require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.apply(this, arguments);
};

async function run() {
  const { club } = await import("../src/content/club");
  const { stages } = await import("../src/content/story");
  const { questions } = await import("../src/content/questions");
  const { parseSiteContent } = await import("../src/lib/content-validation");

  // Read .env.local
  const envContent = fs.readFileSync(".env.local", "utf8");
  const env: Record<string, string> = {};
  for (const line of envContent.split("\n")) {
    const match = line.trim().match(/^([^=]+)=(.*)$/);
    if (match) {
      env[match[1]] = match[2];
    }
  }

  const supabaseUrl = env.SUPABASE_URL;
  const supabaseKey = env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !supabaseKey) {
    throw new Error("Missing Supabase credentials in .env.local");
  }

  const client = createClient(supabaseUrl, supabaseKey);

  const siteContent = { club, stages, questions };
  const validated = parseSiteContent(siteContent);
  if (!validated.ok) {
    console.error("Validation failed:", validated.error);
    process.exit(1);
  }
  console.log("Validation passed successfully!");

  // 1. Update draft
  const { data: currentDraft } = await client
    .from("content_drafts")
    .select("revision")
    .eq("id", 1)
    .maybeSingle();

  const nextRevision = (currentDraft?.revision ?? 0) + 1;
  const now = new Date().toISOString();

  const { error: draftErr } = await client
    .from("content_drafts")
    .upsert({
      id: 1,
      data: siteContent,
      revision: nextRevision,
      updated_at: now,
    });

  if (draftErr) {
    console.error("Draft update error:", draftErr);
    process.exit(1);
  }
  console.log(`Updated content_drafts with revision ${nextRevision}`);

  // 2. Publish to content_versions
  const { data: versionData, error: versionErr } = await client
    .from("content_versions")
    .insert({
      data: siteContent,
      created_at: now,
    })
    .select("id, created_at")
    .single();

  if (versionErr) {
    console.error("Publish version error:", versionErr);
    process.exit(1);
  }
  console.log("Published new version to content_versions:", versionData);

  // 3. Verify
  const { data: latest } = await client
    .from("content_versions")
    .select("id, data, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  console.log("Verified latest version in Supabase:");
  console.log("- ID:", latest.id);
  console.log("- Club Name:", latest.data.club.name);
  console.log("- Monogram:", latest.data.club.monogram);
  console.log("- Tagline:", latest.data.club.tagline);
  console.log("- Cover Image:", latest.data.club.coverImage);
  console.log("- Stats:", JSON.stringify(latest.data.club.stats));
  console.log("- Stages Count:", latest.data.stages.length);
  console.log("- Questions Count:", latest.data.questions.length);
}

run().catch(console.error);
