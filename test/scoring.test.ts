import { describe, expect, it } from "vitest";

import { questionById, questions } from "@/content/questions";
import { normalizeAnswer, scoreAnswer, toPublicQuestion } from "@/lib/scoring";
import type { Question, VariantType } from "@/lib/types";

function question(id: string): Question {
  const found = questionById.get(id);
  if (!found) throw new Error(`Không tìm thấy câu hỏi ${id}`);
  return found;
}

function short(questionId: string, value: string) {
  return scoreAnswer(question(questionId), "short", value);
}

describe("normalizeAnswer", () => {
  it("bỏ dấu, chữ hoa và khoảng trắng thừa", () => {
    expect(normalizeAnswer("  HỌC   ĐỂ Sáng Tạo ")).toBe("hoc de sang tao");
    expect(normalizeAnswer("Đặng Văn A")).toBe("dang van a");
  });

  it("bỏ dấu câu", () => {
    expect(normalizeAnswer("Học để sáng tạo, làm để trưởng thành!")).toBe(
      "hoc de sang tao lam de truong thanh",
    );
  });

  it("đưa các cách viết ngày về cùng một dạng", () => {
    expect(normalizeAnswer("14/3/2015")).toBe("14/3/2015");
    expect(normalizeAnswer("14-03-15")).toBe("14/3/2015");
    expect(normalizeAnswer("ngày 14 tháng 3 năm 2015")).toBe("14/3/2015");
  });
});

describe("chấm điểm", () => {
  it("chấm Đúng/Sai", () => {
    expect(scoreAnswer(question("new-student"), "true_false", true)).toMatchObject({
      verdict: "correct",
      points: 5,
      correctAnswer: "Đúng",
    });
    expect(scoreAnswer(question("new-student"), "true_false", false)).toMatchObject({
      verdict: "wrong",
      points: 0,
    });
  });

  it("chấm trắc nghiệm và từ chối chỉ số ngoài phạm vi", () => {
    expect(scoreAnswer(question("new-student"), "choice", 0)).toMatchObject({
      verdict: "correct",
      points: 10,
      correctAnswer: "Lớp 10",
    });
    expect(scoreAnswer(question("new-student"), "choice", 1)).toMatchObject({
      verdict: "wrong",
      points: 0,
    });
    expect(() => scoreAnswer(question("new-student"), "choice", 9)).toThrow();
  });

  it("chấp nhận đáp án tự luận có dấu, hoa/thường và khoảng trắng khác", () => {
    expect(short("pnit-identity", "  CÂU LẠC BỘ   TIN HỌC ")).toMatchObject({
      verdict: "correct",
      points: 20,
    });
    expect(short("project-idea", "trang xem lich")).toMatchObject(
      { verdict: "correct", points: 20 },
    );
  });

  it("cho điểm một phần theo từ khóa", () => {
    expect(short("school-problem", "lịch")).toMatchObject({
      verdict: "partial",
      points: 10,
    });
    expect(short("school-problem", "hạn nộp bài")).toMatchObject({
      verdict: "partial",
      points: 10,
    });
    expect(short("school-problem", "lịch và hạn nộp bài")).toMatchObject({ verdict: "partial", points: 20 });
  });

  it("trả 0 điểm khi sai", () => {
    expect(short("school-problem", "không biết")).toMatchObject({
      verdict: "wrong",
      points: 0,
    });
  });
});

describe("dữ liệu câu hỏi", () => {
  it("có 20 câu, mỗi câu đủ 3 hình thức và tổng điểm tối đa 400", () => {
    expect(questions).toHaveLength(20);
    expect(new Set(questions.map((item) => item.id)).size).toBe(20);

    let maxScore = 0;

    for (const item of questions) {
      const types = item.variants.map((variant) => variant.type).sort();
      expect(types).toEqual(["choice", "short", "true_false"]);

      const points = Object.fromEntries(
        item.variants.map((variant) => [variant.type, variant.points]),
      ) as Record<VariantType, number>;

      expect(points.true_false).toBeLessThan(points.choice);
      expect(points.choice).toBeLessThan(points.short);
      maxScore += points.short;

      const choice = item.variants.find((variant) => variant.type === "choice");
      if (!choice || choice.type !== "choice") throw new Error("Thiếu choice");
      expect(choice.answerIndex).toBeGreaterThanOrEqual(0);
      expect(choice.answerIndex).toBeLessThan(choice.options.length);

      const shortVariant = item.variants.find(
        (variant) => variant.type === "short",
      );
      if (!shortVariant || shortVariant.type !== "short") {
        throw new Error("Thiếu short");
      }
      expect(shortVariant.accepted.length).toBeGreaterThan(0);
      expect(shortVariant.accepted.every((value) => value.trim().length > 0)).toBe(
        true,
      );
    }

    expect(maxScore).toBe(400);
  });

  it("không gửi đáp án xuống client", () => {
    for (const item of questions) {
      const publicQuestion = toPublicQuestion(item);
      const json = JSON.stringify(publicQuestion);

      expect(json).not.toContain("answerIndex");
      expect(json).not.toContain("accepted");
      expect(json).not.toContain("keywords");

      for (const variant of publicQuestion.variants) {
        expect(variant).not.toHaveProperty("answer");
      }
    }
  });
});
