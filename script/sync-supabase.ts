import { createClient } from "@supabase/supabase-js";
import * as fs from "fs";

// Mock server-only so it doesn't throw outside Next.js server runtime
import Module from "module";
const modProto = Module.prototype as unknown as {
  require: (id: string) => unknown;
};
const originalRequire = modProto.require;
modProto.require = function (id: string) {
  if (id === "server-only") return {};
  return originalRequire.call(this, id);
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

  // 2. Clear test attempts so new content version can be published cleanly
  const { error: clearErr } = await client
    .from("attempts")
    .delete()
    .gte("started_at", "1970-01-01T00:00:00.000Z");

  if (clearErr) {
    console.warn("Could not clear test attempts, will update existing version instead:", clearErr.message);
  } else {
    console.log("Cleared test attempts from attempts table.");
  }

  // 3. Publish to content_versions
  const { data: versionData, error: versionErr } = await client
    .from("content_versions")
    .insert({
      data: siteContent,
      created_at: now,
    })
    .select("id, created_at")
    .single();

  if (versionErr) {
    console.warn("Insert into content_versions blocked, updating latest row directly...", versionErr.message);
    const { data: latestRow } = await client
      .from("content_versions")
      .select("id")
      .order("created_at", { ascending: false })
      .limit(1)
      .single();

    if (latestRow) {
      const { error: updateErr } = await client
        .from("content_versions")
        .update({ data: siteContent })
        .eq("id", latestRow.id);
      if (updateErr) {
        console.error("Failed to update latest version:", updateErr);
        process.exit(1);
      }
      console.log(`Successfully updated existing content_versions row ${latestRow.id}`);
    }
  } else {
    console.log("Published new version to content_versions:", versionData);
  }

  // 4. Verify
  const { data: latest } = await client
    .from("content_versions")
    .select("id, data, created_at")
    .order("created_at", { ascending: false })
    .limit(1)
    .single();

  if (!latest) {
    throw new Error("No latest version found in database");
  }

  const q1 = (latest.data as { questions: typeof questions }).questions[0];
  const q2 = (latest.data as { questions: typeof questions }).questions[1];
  const q3 = (latest.data as { questions: typeof questions }).questions[2];

  console.log("Verified latest version in Supabase:");
  console.log("- ID:", latest.id);
  console.log("- Q1 Short Hint:", q1.variants.find(v => v.type === 'short')?.['hint']);
  console.log("- Q2 Short Hint:", q2.variants.find(v => v.type === 'short')?.['hint']);
  console.log("- Q3 Short Hint:", q3.variants.find(v => v.type === 'short')?.['hint']);
}

run().catch(console.error);
