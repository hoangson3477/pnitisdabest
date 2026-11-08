import "server-only";

import { getSiteContent } from "./content";
import { toPublicQuestion } from "./scoring";
import { db } from "./supabase";
import type { AttemptResponse } from "./types";

export type AttemptRow = {
  id: string;
  name: string;
  device_id: string;
  started_at: string;
  finished_at: string | null;
};

export type AnswerRow = {
  question_id: string;
  variant: string;
  answer: unknown;
  correct: boolean;
  points: number;
  created_at: string;
};

export async function getAttemptRow(id: string) {
  const { data, error } = await db()
    .from("attempts")
    .select("id,name,device_id,started_at,finished_at")
    .eq("id", id)
    .maybeSingle();

  if (error) throw error;
  return (data as AttemptRow | null) ?? null;
}

export async function getAnswerRows(attemptId: string) {
  const { data, error } = await db()
    .from("attempt_answers")
    .select("question_id,variant,answer,correct,points,created_at")
    .eq("attempt_id", attemptId)
    .order("created_at", { ascending: true });

  if (error) throw error;
  return (data ?? []) as AnswerRow[];
}

export async function getExistingAnswer(attemptId: string, questionId: string) {
  const { data, error } = await db()
    .from("attempt_answers")
    .select("question_id,variant,answer,correct,points,created_at")
    .eq("attempt_id", attemptId)
    .eq("question_id", questionId)
    .maybeSingle();

  if (error) throw error;
  return (data as AnswerRow | null) ?? null;
}

export async function getTotalScore(attemptId: string) {
  const { data, error } = await db()
    .from("attempt_scores")
    .select("score")
    .eq("id", attemptId)
    .maybeSingle();

  if (error) throw error;
  return Number(data?.score ?? 0);
}

export async function finishIfComplete(
  attemptId: string,
  answeredCount: number,
  totalQuestions: number,
) {
  if (answeredCount < totalQuestions) return false;

  const { error } = await db()
    .from("attempts")
    .update({ finished_at: new Date().toISOString() })
    .eq("id", attemptId)
    .is("finished_at", null);

  if (error) throw error;
  return true;
}

export async function getAttemptResponse(
  attemptId: string,
  deviceId?: string,
): Promise<AttemptResponse | null> {
  const attempt = await getAttemptRow(attemptId);
  if (!attempt) return null;
  if (deviceId && attempt.device_id !== deviceId) return null;

  const [{ questions }, answers] = await Promise.all([
    getSiteContent(),
    getAnswerRows(attemptId),
  ]);
  let finishedAt = attempt.finished_at;

  if (!finishedAt && answers.length >= questions.length) {
    await finishIfComplete(attemptId, answers.length, questions.length).catch(
      () => false,
    );
    const refreshed = await getAttemptRow(attemptId);
    finishedAt = refreshed?.finished_at ?? null;
  }

  const finished = Boolean(finishedAt);
  let rank: number | null = null;
  let totalFinished: number | null = null;

  if (finished) {
    const [rankResult, countResult] = await Promise.all([
      db().from("leaderboard").select("rank_no").eq("id", attemptId).maybeSingle(),
      db().from("leaderboard").select("id", { count: "exact", head: true }),
    ]);

    if (rankResult.error) throw rankResult.error;
    if (countResult.error) throw countResult.error;

    rank = rankResult.data ? Number(rankResult.data.rank_no) : null;
    totalFinished = countResult.count ?? 0;
  }

  return {
    attempt: {
      id: attempt.id,
      name: attempt.name,
      score: answers.reduce((total, answer) => total + Number(answer.points), 0),
      status: finished ? "finished" : "playing",
      answeredIds: answers.map((answer) => answer.question_id),
      totalQuestions: questions.length,
      rank,
      totalFinished,
    },
    questions: questions.map(toPublicQuestion),
  };
}
