import { describe, expect, it } from "vitest";

import { club } from "@/content/club";
import { questions } from "@/content/questions";
import { stages } from "@/content/story";
import { parseSiteContent } from "@/lib/content-validation";
import type { ClubContent, Question, StoryStage } from "@/lib/types";

function seed(): {
  club: ClubContent;
  stages: StoryStage[];
  questions: Question[];
} {
  return JSON.parse(JSON.stringify({ club, stages, questions })) as {
    club: ClubContent;
    stages: StoryStage[];
    questions: Question[];
  };
}

function parse(value: unknown) {
  return parseSiteContent(value);
}

describe("validate nội dung quiz", () => {
  it("chấp nhận nội dung mẫu", () => {
    const result = parse(seed());
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.data.questions).toHaveLength(20);
      expect(result.data.stages).toHaveLength(5);
      expect(result.data.club.name).toBe(club.name);
    }
  });

  it("từ chối sai số chặng", () => {
    const content = seed();
    content.stages.pop();
    const result = parse(content);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Danh sách chặng");
  });

  it("từ chối bối cảnh không hợp lệ", () => {
    const content = seed();
    (content.stages[0] as { scene: string }).scene = "moon";
    const result = parse(content);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("bối cảnh");
  });

  it("từ chối đường dẫn ảnh minh họa không hợp lệ", () => {
    const content = seed();
    content.stages[1].lines[0].image = "khong-phai-duong-dan";
    const result = parse(content);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("ảnh minh họa");
  });

  it("từ chối sai số câu hỏi", () => {
    const content = seed();
    content.questions.push(structuredClone(content.questions[0]));
    const result = parse(content);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Danh sách câu hỏi");
  });

  it("cắt khoảng trắng thừa", () => {
    const content = seed();
    content.club.name = "  CLB Test  ";
    const result = parse(content);
    expect(result.ok).toBe(true);
    if (result.ok) expect(result.data.club.name).toBe("CLB Test");
  });

  it("từ chối đáp án trắc nghiệm ngoài phạm vi", () => {
    const content = seed();
    const choice = content.questions[0].variants.find(
      (variant) => variant.type === "choice",
    );
    if (!choice || choice.type !== "choice") throw new Error("Thiếu choice");
    choice.answerIndex = 99;

    const result = parse(content);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("đáp án đúng");
  });

  it("từ chối mã câu hỏi trùng", () => {
    const content = seed();
    content.questions[1].id = content.questions[0].id;
    const result = parse(content);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("Mã câu hỏi bị trùng");
  });

  it("từ chối điểm sai định dạng", () => {
    const content = seed();
    const trueFalse = content.questions[0].variants.find(
      (variant) => variant.type === "true_false",
    );
    if (!trueFalse || trueFalse.type !== "true_false") {
      throw new Error("Thiếu true_false");
    }
    trueFalse.points = 8;

    const result = parse(content);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("phải là 5");
  });

  it("từ chối tổng điểm từ khóa vượt điểm câu", () => {
    const content = seed();
    const short = content.questions[0].variants.find(
      (variant) => variant.type === "short",
    );
    if (!short || short.type !== "short") throw new Error("Thiếu short");
    short.keywords = [
      { any: ["a"], points: 20 },
      { any: ["b"], points: 10 },
    ];

    const result = parse(content);
    expect(result.ok).toBe(false);
    if (!result.ok) expect(result.error).toContain("vượt quá");
  });

  it("bỏ qua dòng trống trong đáp án tự luận", () => {
    const content = seed();
    const short = content.questions[0].variants.find(
      (variant) => variant.type === "short",
    );
    if (!short || short.type !== "short") throw new Error("Thiếu short");
    short.accepted = ["", " 14/3/2015 ", ""];

    const result = parse(content);
    expect(result.ok).toBe(true);
    if (result.ok) {
      const parsedShort = result.data.questions[0].variants.find(
        (variant) => variant.type === "short",
      );
      if (!parsedShort || parsedShort.type !== "short") {
        throw new Error("Thiếu short");
      }
      expect(parsedShort.accepted).toEqual(["14/3/2015"]);
    }
  });
});
