import type { NextRequest } from "next/server";

import { fail, isUuid } from "@/lib/http";
import { db } from "@/lib/supabase";
import type { LeaderboardEntry, LeaderboardResponse } from "@/lib/types";

export const dynamic = "force-dynamic";

type LeaderboardRow = {
  id: string;
  name: string;
  score: number;
  rank_no: number;
};

function toEntry(row: LeaderboardRow): LeaderboardEntry {
  return {
    id: row.id,
    name: row.name,
    score: Number(row.score),
    rank: Number(row.rank_no),
  };
}

export async function GET(request: NextRequest) {
  try {
    const attemptId = request.nextUrl.searchParams.get("attemptId");
    const supabase = db();

    const [topResult, countResult, meResult] = await Promise.all([
      supabase
        .from("leaderboard")
        .select("id,name,score,rank_no")
        .order("rank_no", { ascending: true })
        .limit(20),
      supabase.from("leaderboard").select("id", { count: "exact", head: true }),
      attemptId && isUuid(attemptId)
        ? supabase
            .from("leaderboard")
            .select("id,name,score,rank_no")
            .eq("id", attemptId)
            .maybeSingle()
        : Promise.resolve({ data: null, error: null }),
    ]);

    if (topResult.error) throw topResult.error;
    if (countResult.error) throw countResult.error;
    if (meResult.error) throw meResult.error;

    return Response.json({
      top: ((topResult.data ?? []) as LeaderboardRow[]).map(toEntry),
      me: meResult.data ? toEntry(meResult.data as LeaderboardRow) : null,
      total: countResult.count ?? 0,
    } satisfies LeaderboardResponse);
  } catch (error) {
    console.error("GET /api/leaderboard", error);
    return fail("Không tải được bảng xếp hạng. Thử lại nhé.", 500);
  }
}
