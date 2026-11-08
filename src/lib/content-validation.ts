import type {
  ClubActivity,
  ClubContent,
  ClubFeature,
  ClubStat,
  ClubTheoryCard,
  KeywordGroup,
  Question,
  SiteContent,
  StoryLine,
  StoryScene,
  StoryStage,
  Variant,
  VariantType,
} from "./types";

export type ContentValidationResult =
  | { ok: true; data: SiteContent }
  | { ok: false; error: string };

class InvalidContent extends Error {}

const CONTROL_CHARS =
  /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f\u200b-\u200f\u202a-\u202e]/g;

function object(value: unknown, label: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) {
    throw new InvalidContent(`${label} không hợp lệ.`);
  }
  return value as Record<string, unknown>;
}

function text(
  value: unknown,
  label: string,
  min: number,
  max: number,
): string {
  if (typeof value !== "string") {
    throw new InvalidContent(`${label} phải là chữ.`);
  }
  const cleaned = value
    .replace(/\r\n/g, "\n")
    .replace(CONTROL_CHARS, "")
    .trim();

  if (cleaned.length < min) {
    throw new InvalidContent(
      min === 1 ? `${label} không được để trống.` : `${label} quá ngắn.`,
    );
  }
  if (cleaned.length > max) {
    throw new InvalidContent(`${label} tối đa ${max} ký tự.`);
  }
  return cleaned;
}

function optionalText(
  value: unknown,
  label: string,
  max: number,
): string | undefined {
  if (value === undefined || value === null) return undefined;
  if (typeof value !== "string") {
    throw new InvalidContent(`${label} phải là chữ.`);
  }
  const cleaned = text(value, label, 0, max);
  return cleaned.length > 0 ? cleaned : undefined;
}

function list(
  value: unknown,
  label: string,
  min: number,
  max: number,
): unknown[] {
  if (!Array.isArray(value)) {
    throw new InvalidContent(`${label} không hợp lệ.`);
  }
  if (value.length < min || value.length > max) {
    throw new InvalidContent(`${label} phải có từ ${min} đến ${max} mục.`);
  }
  return value;
}

function integer(
  value: unknown,
  label: string,
  min: number,
  max: number,
): number {
  if (
    typeof value !== "number" ||
    !Number.isInteger(value) ||
    value < min ||
    value > max
  ) {
    throw new InvalidContent(`${label} phải là số nguyên từ ${min} đến ${max}.`);
  }
  return value;
}

const IMAGE_PATH = /^(?:\/|https?:\/\/)[^\s"'<>()]+$/;

function imagePath(value: unknown, label: string): string | undefined {
  const path = optionalText(value, label, 300);
  if (!path) return undefined;
  if (!IMAGE_PATH.test(path)) {
    throw new InvalidContent(
      `${label} phải là đường dẫn bắt đầu bằng / hoặc http(s)://.`,
    );
  }
  return path;
}

const SCENES: StoryScene[] = ["thought", "bus", "yard", "lab", "home"];

function parseLine(value: unknown, label: string): StoryLine {
  const line = object(value, label);
  return {
    speaker: text(line.speaker, `${label}: người nói`, 1, 40),
    text: text(line.text, `${label}: lời thoại`, 1, 300),
    image: imagePath(line.image, `${label}: ảnh minh họa`),
  };
}

function parseStage(value: unknown, index: number): StoryStage {
  const label = `Chặng ${index + 1}`;
  const stage = object(value, label);
  const id = text(stage.id, `${label}: mã chặng`, 2, 40);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new InvalidContent(
      `${label}: mã chặng chỉ dùng chữ thường, số và dấu gạch nối.`,
    );
  }

  const scene = stage.scene;
  if (typeof scene !== "string" || !SCENES.includes(scene as StoryScene)) {
    throw new InvalidContent(
      `${label}: bối cảnh phải là một trong: ${SCENES.join(", ")}.`,
    );
  }

  return {
    id,
    title: text(stage.title, `${label}: tiêu đề`, 1, 80),
    scene: scene as StoryScene,
    background: imagePath(stage.background, `${label}: ảnh nền`),
    portrait: imagePath(stage.portrait, `${label}: ảnh nhân vật`),
    lines: list(stage.lines, `${label}: lời thoại`, 1, 6).map((line, lineIndex) =>
      parseLine(line, `${label}, thoại ${lineIndex + 1}`),
    ),
  };
}

function parseStats(value: unknown): ClubStat[] {
  return list(value, "Số liệu CLB", 1, 6).map((item, index) => {
    const row = object(item, `Số liệu ${index + 1}`);
    return {
      value: text(row.value, `Giá trị số liệu ${index + 1}`, 1, 20),
      label: text(row.label, `Nhãn số liệu ${index + 1}`, 1, 40),
    };
  });
}

function parseStrengths(value: unknown): ClubFeature[] {
  return list(value, "Thế mạnh", 1, 6).map((item, index) => {
    const row = object(item, `Thế mạnh ${index + 1}`);
    return {
      title: text(row.title, `Tiêu đề thế mạnh ${index + 1}`, 1, 80),
      description: text(
        row.description,
        `Mô tả thế mạnh ${index + 1}`,
        1,
        500,
      ),
    };
  });
}

function parseActivities(value: unknown): ClubActivity[] {
  return list(value, "Hoạt động", 1, 6).map((item, index) => {
    const row = object(item, `Hoạt động ${index + 1}`);
    return {
      title: text(row.title, `Tiêu đề hoạt động ${index + 1}`, 1, 80),
      time: text(row.time, `Thời gian hoạt động ${index + 1}`, 1, 60),
      description: text(
        row.description,
        `Mô tả hoạt động ${index + 1}`,
        1,
        500,
      ),
    };
  });
}

function parseTheory(value: unknown): ClubTheoryCard[] {
  return list(value, "Thẻ thông tin", 1, 10).map((item, index) => {
    const row = object(item, `Thẻ thông tin ${index + 1}`);
    return {
      title: text(row.title, `Tiêu đề thẻ ${index + 1}`, 1, 100),
      body: text(row.body, `Nội dung thẻ ${index + 1}`, 1, 1000),
    };
  });
}

function parseClub(value: unknown): ClubContent {
  const club = object(value, "Thông tin CLB");
  const coverImage = text(club.coverImage, "Ảnh bìa", 1, 300);

  if (!/^(?:\/|https?:\/\/)[^\s"'<>()]+$/.test(coverImage)) {
    throw new InvalidContent(
      "Ảnh bìa phải là đường dẫn bắt đầu bằng / hoặc http(s)://.",
    );
  }

  return {
    name: text(club.name, "Tên CLB", 1, 80),
    monogram: text(club.monogram, "Ký hiệu CLB", 1, 8),
    tagline: text(club.tagline, "Khẩu hiệu", 1, 160),
    description: text(club.description, "Mô tả CLB", 1, 1000),
    eventNote: text(club.eventNote, "Ghi chú sự kiện", 1, 120),
    coverImage,
    stats: parseStats(club.stats),
    strengths: parseStrengths(club.strengths),
    activities: parseActivities(club.activities),
    theory: parseTheory(club.theory),
    playNote: text(club.playNote, "Ghi chú lượt chơi", 1, 160),
  };
}

function parseTrueFalse(row: Record<string, unknown>, label: string): Variant {
  const points = integer(row.points, `${label}: điểm`, 0, 100);
  if (points !== 5) {
    throw new InvalidContent(`${label}: điểm Đúng/Sai phải là 5.`);
  }
  if (typeof row.answer !== "boolean") {
    throw new InvalidContent(`${label}: đáp án Đúng/Sai phải là true/false.`);
  }
  return {
    type: "true_false",
    points,
    statement: text(row.statement, `${label}: mệnh đề`, 1, 300),
    answer: row.answer,
  };
}

function parseChoice(row: Record<string, unknown>, label: string): Variant {
  const points = integer(row.points, `${label}: điểm`, 0, 100);
  if (points !== 10) {
    throw new InvalidContent(`${label}: điểm trắc nghiệm phải là 10.`);
  }
  const options = list(row.options, `${label}: đáp án`, 2, 6).map(
    (option, index) => text(option, `${label}: đáp án ${index + 1}`, 1, 200),
  );
  const seen = new Set<string>();

  for (const option of options) {
    const key = option.toLocaleLowerCase("vi");
    if (seen.has(key)) {
      throw new InvalidContent(`${label}: các đáp án không được trùng nhau.`);
    }
    seen.add(key);
  }

  return {
    type: "choice",
    points,
    options,
    answerIndex: integer(
      row.answerIndex,
      `${label}: đáp án đúng`,
      0,
      options.length - 1,
    ),
  };
}

function parseShort(row: Record<string, unknown>, label: string): Variant {
  const points = integer(row.points, `${label}: điểm`, 0, 100);
  if (points !== 20) {
    throw new InvalidContent(`${label}: điểm tự luận phải là 20.`);
  }

  const accepted = list(row.accepted, `${label}: đáp án chấp nhận`, 1, 20)
    .map((answer, index) => {
      if (typeof answer !== "string") {
        throw new InvalidContent(
          `${label}: đáp án chấp nhận ${index + 1} phải là chữ.`,
        );
      }
      return answer.trim();
    })
    .filter((answer) => answer.length > 0)
    .map((answer, index) =>
      text(answer, `${label}: đáp án chấp nhận ${index + 1}`, 1, 160),
    );

  if (accepted.length === 0) {
    throw new InvalidContent(`${label}: cần ít nhất một đáp án chấp nhận.`);
  }

  if (new Set(accepted).size !== accepted.length) {
    throw new InvalidContent(`${label}: đáp án chấp nhận bị trùng.`);
  }

  let keywords: KeywordGroup[] | undefined;
  if (row.keywords !== undefined && row.keywords !== null) {
    const rawKeywords = list(row.keywords, `${label}: từ khóa`, 0, 10);
    if (rawKeywords.length > 0) {
      let partialTotal = 0;
      keywords = rawKeywords.map((item, index) => {
        const group = object(item, `${label}: nhóm từ khóa ${index + 1}`);
        const any = list(
          group.any,
          `${label}: từ khóa nhóm ${index + 1}`,
          1,
          10,
        )
          .map((keyword, keywordIndex) => {
            if (typeof keyword !== "string") {
              throw new InvalidContent(
                `${label}: từ khóa ${index + 1}.${keywordIndex + 1} phải là chữ.`,
              );
            }
            return keyword.trim();
          })
          .filter((keyword) => keyword.length > 0)
          .map((keyword, keywordIndex) =>
            text(
              keyword,
              `${label}: từ khóa ${index + 1}.${keywordIndex + 1}`,
              1,
              80,
            ),
          );

        if (any.length === 0) {
          throw new InvalidContent(
            `${label}: nhóm từ khóa ${index + 1} cần ít nhất một từ khóa.`,
          );
        }
        const groupPoints = integer(
          group.points,
          `${label}: điểm nhóm từ khóa ${index + 1}`,
          1,
          20,
        );
        partialTotal += groupPoints;
        return { any, points: groupPoints };
      });

      if (partialTotal > points) {
        throw new InvalidContent(
          `${label}: tổng điểm từ khóa (${partialTotal}) vượt quá điểm câu (${points}).`,
        );
      }
    }
  }

  return {
    type: "short",
    points,
    hint: optionalText(row.hint, `${label}: gợi ý`, 200),
    accepted,
    ...(keywords ? { keywords } : {}),
  };
}

function parseQuestion(value: unknown, index: number): Question {
  const label = `Câu ${index + 1}`;
  const question = object(value, label);
  const id = text(question.id, `${label}: mã câu hỏi`, 2, 40);

  if (!/^[a-z0-9]+(?:-[a-z0-9]+)*$/.test(id)) {
    throw new InvalidContent(
      `${label}: mã câu hỏi chỉ dùng chữ thường, số và dấu gạch nối.`,
    );
  }

  const rawVariants = list(question.variants, `${label}: hình thức`, 3, 3);
  const variants = new Map<VariantType, Variant>();

  for (const rawVariant of rawVariants) {
    const variant = object(rawVariant, `${label}: hình thức trả lời`);
    const type = variant.type;

    if (
      type !== "true_false" &&
      type !== "choice" &&
      type !== "short"
    ) {
      throw new InvalidContent(`${label}: hình thức trả lời không hợp lệ.`);
    }
    if (variants.has(type)) {
      throw new InvalidContent(`${label}: hình thức ${type} bị lặp.`);
    }

    variants.set(
      type,
      type === "true_false"
        ? parseTrueFalse(variant, label)
        : type === "choice"
          ? parseChoice(variant, label)
          : parseShort(variant, label),
    );
  }

  return {
    id,
    prompt: text(question.prompt, `${label}: câu hỏi`, 1, 300),
    explanation: text(question.explanation, `${label}: giải thích`, 1, 1000),
    variants: [
      variants.get("true_false")!,
      variants.get("choice")!,
      variants.get("short")!,
    ],
  };
}

export function parseSiteContent(value: unknown): ContentValidationResult {
  try {
    const root = object(value, "Nội dung");
    const club = parseClub(root.club);
    const stages = list(root.stages, "Danh sách chặng", 5, 5).map(
      (stage, index) => parseStage(stage, index),
    );

    if (new Set(stages.map((stage) => stage.id)).size !== stages.length) {
      throw new InvalidContent("Mã chặng bị trùng.");
    }

    const rawQuestions = list(root.questions, "Danh sách câu hỏi", 20, 20);
    const questions = rawQuestions.map((question, index) =>
      parseQuestion(question, index),
    );

    if (questions.length !== stages.length * 4) {
      throw new InvalidContent("Mỗi chặng phải có đúng 4 câu hỏi.");
    }

    if (new Set(questions.map((question) => question.id)).size !== questions.length) {
      throw new InvalidContent("Mã câu hỏi bị trùng.");
    }

    return { ok: true, data: { club, stages, questions } };
  } catch (error) {
    return {
      ok: false,
      error:
        error instanceof InvalidContent
          ? error.message
          : "Nội dung không hợp lệ.",
    };
  }
}
