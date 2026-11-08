import type { NextRequest } from "next/server";

import {
  finishIfComplete,
  getAnswerRows,
  getAttemptRow,
  getExistingAnswer,
  getTotalScore,
  type AnswerRow,
} from "@/lib/attempts";
import { getSiteContent } from "@/lib/content";
import type { Json } from "@/lib/database.types";
import { DEVICE_COOKIE, fail, isUuid, readJson } from "@/lib/http";
import { scoreAnswer } from "@/lib/scoring";
import { db } from "@/lib/supabase";
import type { AnswerResponse, Question, VariantType } from "@/lib/types";

function storedResult(question: Question, stored: AnswerRow): AnswerResponse["result"] {
  let correctAnswer = "";
  try {
    correctAnswer = scoreAnswer(
      question,
      stored.variant as VariantType,
      stored.answer,
    ).correctAnswer;
  } catch {
    correctAnswer = "";
  }

  return {
    verdict: stored.correct ? "correct" : stored.points > 0 ? "partial" : "wrong",
    points: stored.points,
    totalScore: 0,
    correctAnswer,
    explanation: question.explanation,
  };
}

export async function POST(
  request: NextRequest,
  context: { params: Promise<{ id: string }> },
) {
  try {
    const { id } = await context.params;
    if (!isUuid(id)) return fail("Mã lượt chơi không hợp lệ.");

    const deviceId = request.cookies.get(DEVICE_COOKIE)?.value;
    if (!isUuid(deviceId)) return fail("Không tìm thấy lượt chơi.", 404);

    const attempt = await getAttemptRow(id);
    if (!attempt || attempt.device_id !== deviceId) {
      return fail("Không tìm thấy lượt chơi.", 404);
    }

    const body = await readJson<{
      questionId?: unknown;
      variant?: unknown;
      value?: unknown;
    }>(request);

    const questionId = body?.questionId;
    const variantType = body?.variant;

    if (typeof questionId !== "string" || typeof variantType !== "string") {
      return fail("Dữ liệu trả lời không hợp lệ.");
    }

    const { questions } = await getSiteContent();
    const question = questions.find((item) => item.id === questionId);
    if (!question) return fail("Không tìm thấy câu hỏi.", 404);

    const variant = question.variants.find((item) => item.type === variantType);
    if (!variant) return fail("Câu hỏi không có hình thức trả lời này.");

    const existing = await getExistingAnswer(id, questionId);
    if (existing) {
      const answers = await getAnswerRows(id);
      const finished =
        Boolean(attempt.finished_at) || answers.length >= questions.length;
      if (!attempt.finished_at && finished) {
        await finishIfComplete(id, answers.length, questions.length);
      }

      const result = storedResult(question, existing);
      result.totalScore = await getTotalScore(id);

      return Response.json({ result, finished } satisfies AnswerResponse);
    }

    if (attempt.finished_at) {
      return fail("Bài làm đã kết thúc.", 409);
    }

    let value = body?.value;

    if (variant.type === "short") {
      if (typeof value !== "string") return fail("Câu trả lời không hợp lệ.");
      const text = value.trim();
      if (text.length < 1 || text.length > 160) {
        return fail("Câu trả lời phải từ 1 đến 160 ký tự.");
      }
      value = text;
    }

    let result;
    try {
      result = scoreAnswer(question, variant.type, value);
    } catch (error) {
      return fail(error instanceof Error ? error.message : "Đáp án không hợp lệ.");
    }

    const { error: insertError } = await db().from("attempt_answers").insert({
      attempt_id: id,
      question_id: questionId,
      variant: variant.type,
      answer: value as Json,
      correct: result.verdict === "correct",
      points: result.points,
    });

    if (insertError) {
      if (insertError.code === "23505") {
        const raced = await getExistingAnswer(id, questionId);
        if (raced) {
          const answers = await getAnswerRows(id);
          const finished =
            Boolean(attempt.finished_at) || answers.length >= questions.length;
          if (!attempt.finished_at && finished) {
            await finishIfComplete(id, answers.length, questions.length);
          }

          const racedResult = storedResult(question, raced);
          racedResult.totalScore = await getTotalScore(id);

          return Response.json({
            result: racedResult,
            finished,
          } satisfies AnswerResponse);
        }
      }

      throw insertError;
    }

    const answers = await getAnswerRows(id);
    const finished = await finishIfComplete(id, answers.length, questions.length);
    const totalScore = await getTotalScore(id);

    return Response.json({
      result: { ...result, totalScore },
      finished,
    } satisfies AnswerResponse);
  } catch (error) {
    console.error("POST /api/attempts/[id]/answers", error);
    return fail("Không gửi được câu trả lời. Thử lại nhé.", 500);
  }
}
