import "server-only";

import { cache } from "react";

import { club as seedClub } from "@/content/club";
import { questions as seedQuestions } from "@/content/questions";
import { stages as seedStages } from "@/content/story";
import { parseSiteContent } from "./content-validation";
import type { Json } from "./database.types";
import { db } from "./supabase";
import type { SiteContent } from "./types";

const seedContent: SiteContent = {
  club: seedClub,
  stages: seedStages,
  questions: seedQuestions,
};

export class ContentSetupError extends Error {}

export class PublishLockedError extends Error {}

export type ContentVersionSummary = {
  id: string;
  createdAt: string;
};

export type AdminContent = {
  draft: SiteContent;
  revision: number;
  updatedAt: string | null;
  publishedAt: string | null;
  attemptsCount: number;
  versions: ContentVersionSummary[];
};

export type DraftContent = {
  data: SiteContent;
  revision: number;
  updatedAt: string | null;
};

function isMissingTable(error: { code?: string } | null) {
  return error?.code === "42P01" || error?.code === "PGRST205";
}

function setupError() {
  return new ContentSetupError(
    "Chưa có bảng nội dung. Hãy chạy supabase/content-migration.sql trong Supabase SQL Editor.",
  );
}

function parseOrThrow(value: unknown, source: string): SiteContent {
  const parsed = parseSiteContent(value);
  if (!parsed.ok) {
    throw new Error(`${source}: ${parsed.error}`);
  }
  return parsed.data;
}

async function loadDraftState() {
  const [draftResult, publishedResult] = await Promise.all([
    db()
      .from("content_drafts")
      .select("data,revision,updated_at")
      .eq("id", 1)
      .maybeSingle(),
    db()
      .from("content_versions")
      .select("data,created_at")
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (draftResult.error) {
    if (isMissingTable(draftResult.error)) throw setupError();
    throw draftResult.error;
  }
  if (publishedResult.error) {
    if (isMissingTable(publishedResult.error)) throw setupError();
    throw publishedResult.error;
  }

  const published = publishedResult.data
    ? parseOrThrow(publishedResult.data.data, "Nội dung đã xuất bản")
    : seedContent;

  return {
    draftRow: draftResult.data,
    publishedRow: publishedResult.data,
    fallback: published,
  };
}

/** Nội dung công khai: bản xuất bản mới nhất, hoặc nội dung mẫu trong code. */
export const getSiteContent = cache(async (): Promise<SiteContent> => {
  const { data, error } = await db()
    .from("content_versions")
    .select("data")
    .order("created_at", { ascending: false })
    .limit(1)
    .maybeSingle();

  if (error) {
    // Trước khi chạy migration, app vẫn chạy bằng nội dung trong code.
    if (isMissingTable(error)) return seedContent;
    throw error;
  }

  return data
    ? parseOrThrow(data.data, "Nội dung đã xuất bản")
    : seedContent;
});

export async function getDraftContent(): Promise<DraftContent> {
  const { draftRow, fallback } = await loadDraftState();

  if (!draftRow) {
    return { data: fallback, revision: 0, updatedAt: null };
  }

  return {
    data: parseOrThrow(draftRow.data, "Bản nháp"),
    revision: draftRow.revision,
    updatedAt: draftRow.updated_at,
  };
}

export async function getAdminContent(): Promise<AdminContent> {
  const [{ draftRow, publishedRow, fallback }, versionsResult, countResult] =
    await Promise.all([
      loadDraftState(),
      db()
        .from("content_versions")
        .select("id,created_at")
        .order("created_at", { ascending: false })
        .limit(10),
      db().from("attempts").select("id", { count: "exact", head: true }),
    ]);

  if (versionsResult.error) {
    if (isMissingTable(versionsResult.error)) throw setupError();
    throw versionsResult.error;
  }
  if (countResult.error) throw countResult.error;

  return {
    draft: draftRow
      ? parseOrThrow(draftRow.data, "Bản nháp")
      : fallback,
    revision: draftRow?.revision ?? 0,
    updatedAt: draftRow?.updated_at ?? null,
    publishedAt: publishedRow?.created_at ?? null,
    attemptsCount: countResult.count ?? 0,
    versions: (versionsResult.data ?? []).map((version) => ({
      id: version.id,
      createdAt: version.created_at,
    })),
  };
}

export async function getAttemptsCount() {
  const { count, error } = await db()
    .from("attempts")
    .select("id", { count: "exact", head: true });

  if (error) throw error;
  return count ?? 0;
}

export async function saveContentDraft(
  data: SiteContent,
  revision: number,
) {
  const now = new Date().toISOString();
  const payload = data as unknown as Json;

  if (revision === 0) {
    const { data: row, error } = await db()
      .from("content_drafts")
      .insert({ id: 1, data: payload, revision: 1, updated_at: now })
      .select("revision,updated_at")
      .single();

    if (error) {
      if (error.code === "23505") return null;
      if (isMissingTable(error)) throw setupError();
      throw error;
    }
    return row;
  }

  const { data: row, error } = await db()
    .from("content_drafts")
    .update({ data: payload, revision: revision + 1, updated_at: now })
    .eq("id", 1)
    .eq("revision", revision)
    .select("revision,updated_at")
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) throw setupError();
    throw error;
  }
  return row;
}

export async function publishContentDraft() {
  const { data: draft } = await getDraftContent();

  const { data, error } = await db()
    .from("content_versions")
    .insert({ data: draft as unknown as Json })
    .select("id,created_at")
    .single();

  if (error) {
    if (error.code === "P0001") {
      throw new PublishLockedError(
        "Không thể xuất bản khi đã có lượt chơi. Hãy reset dữ liệu trước.",
      );
    }
    if (isMissingTable(error)) throw setupError();
    throw error;
  }

  return data;
}

export async function getContentVersion(id: string) {
  const { data, error } = await db()
    .from("content_versions")
    .select("data")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    if (isMissingTable(error)) throw setupError();
    throw error;
  }
  if (!data) return null;

  return parseOrThrow(data.data, "Bản đã lưu");
}
