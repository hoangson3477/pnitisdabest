import type { PublicQuestion, Question, VariantType } from "./types";

export type ScoreResult = {
  verdict: "correct" | "partial" | "wrong";
  points: number;
  correctAnswer: string;
  explanation: string;
};

/**
 * Chuẩn hóa để so khớp: bỏ dấu, chữ hoa/thường, khoảng trắng thừa, dấu câu
 * và đưa các cách viết ngày tháng phổ biến về dạng d/m/yyyy.
 */
export function normalizeAnswer(input: string): string {
  const base = input
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/đ/g, "d")
    .replace(/\s+/g, " ")
    .trim();

  const hasDateWords = /(^|\s)(ngay|thang|nam)(\s|$)/.test(base);
  const hasDateSeparators = /\d{1,2}\s*[/.-]\s*\d{1,2}\s*[/.-]\s*\d{2,4}/.test(base);

  if (hasDateWords || hasDateSeparators) {
    const match = base.match(/(\d{1,2})\D+(\d{1,2})\D+(\d{2,4})/);
    if (match) {
      const year = match[3].length === 2 ? `20${match[3]}` : match[3];
      return `${Number(match[1])}/${Number(match[2])}/${year}`;
    }
  }

  return base
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function loose(input: string): string {
  return normalizeAnswer(input)
    .replace(/\b(ngay|thang|nam)\b/g, " ")
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
}

export function scoreAnswer(
  question: Question,
  variantType: VariantType,
  value: unknown,
): ScoreResult {
  const variant = question.variants.find((item) => item.type === variantType);
  if (!variant) {
    throw new Error("Câu hỏi không có hình thức trả lời này.");
  }

  if (variant.type === "true_false") {
    if (typeof value !== "boolean") {
      throw new Error("Đáp án Đúng/Sai không hợp lệ.");
    }
    const correct = value === variant.answer;
    return {
      verdict: correct ? "correct" : "wrong",
      points: correct ? variant.points : 0,
      correctAnswer: variant.answer ? "Đúng" : "Sai",
      explanation: question.explanation,
    };
  }

  if (variant.type === "choice") {
    if (
      typeof value !== "number" ||
      !Number.isInteger(value) ||
      value < 0 ||
      value >= variant.options.length
    ) {
      throw new Error("Đáp án trắc nghiệm không hợp lệ.");
    }
    const correct = value === variant.answerIndex;
    return {
      verdict: correct ? "correct" : "wrong",
      points: correct ? variant.points : 0,
      correctAnswer: variant.options[variant.answerIndex],
      explanation: question.explanation,
    };
  }

  if (typeof value !== "string") {
    throw new Error("Đáp án tự luận không hợp lệ.");
  }

  const normalized = normalizeAnswer(value);
  const accepted = new Set(variant.accepted.map(normalizeAnswer));

  if (normalized.length > 0 && accepted.has(normalized)) {
    return {
      verdict: "correct",
      points: variant.points,
      correctAnswer: variant.accepted[0],
      explanation: question.explanation,
    };
  }

  const inputLoose = loose(value);
  const partial = Math.min(
    variant.points,
    (variant.keywords ?? []).reduce((total, group) => {
      const matched = group.any.some((keyword) => {
        const needle = loose(keyword);
        return needle.length > 0 && inputLoose.includes(needle);
      });
      return total + (matched ? group.points : 0);
    }, 0),
  );

  return {
    verdict: partial > 0 ? "partial" : "wrong",
    points: partial,
    correctAnswer: variant.accepted[0],
    explanation: question.explanation,
  };
}

/** Bỏ toàn bộ dữ liệu đáp án trước khi gửi câu hỏi xuống trình duyệt. */
export function toPublicQuestion(question: Question): PublicQuestion {
  return {
    id: question.id,
    prompt: question.prompt,
    variants: question.variants.map((variant) => {
      switch (variant.type) {
        case "true_false":
          return {
            type: variant.type,
            points: variant.points,
            statement: variant.statement,
          };
        case "choice":
          return {
            type: variant.type,
            points: variant.points,
            options: variant.options,
          };
        case "short":
          return {
            type: variant.type,
            points: variant.points,
            hint: variant.hint,
          };
      }
    }),
  };
}
