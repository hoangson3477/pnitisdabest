"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";

import StoryPlayer from "@/components/story-player";
import { ApiError, api } from "@/lib/client";
import type {
  AnswerResponse,
  AttemptResponse,
  AttemptState,
  ClubContent,
  PublicQuestion,
  StoryStage,
  VariantType,
} from "@/lib/types";

const ATTEMPT_KEY = "clb_quiz_attempt";
const PENDING_KEY = "clb_quiz_pending";
const LOCK_KEY = "clb_quiz_lock";

type Screen =
  | "loading"
  | "resume-error"
  | "name"
  | "quiz"
  | "result";

type PendingAnswer = {
  attemptId: string;
  questionId: string;
  variant: VariantType;
  value: boolean | number | string;
};

type VariantLock = {
  attemptId: string;
  questionId: string;
  variant: VariantType;
};

type Feedback = {
  result: AnswerResponse["result"];
  finished: boolean;
};

const MODE_INFO: Record<
  VariantType,
  { label: string; description: string }
> = {
  true_false: {
    label: "Đúng / Sai",
    description: "Chọn nhanh, điểm cơ bản",
  },
  choice: {
    label: "Trắc nghiệm",
    description: "Chọn một đáp án, điểm trung bình",
  },
  short: {
    label: "Tự luận ngắn",
    description: "Tự viết đáp án, điểm cao nhất",
  },
};

const FEEDBACK_STYLE = {
  correct: {
    box: "border-success/30 bg-success-soft",
    label: "text-success",
    text: "Chính xác!",
  },
  partial: {
    box: "border-warning/30 bg-warning-soft",
    label: "text-warning",
    text: "Đúng một phần",
  },
  wrong: {
    box: "border-danger/30 bg-danger-soft",
    label: "text-danger",
    text: "Chưa đúng",
  },
} as const;

function readStorage(key: string) {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

function writeStorage(key: string, value: string) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    // Trình duyệt chặn localStorage: vẫn cho chơi, chỉ mất khả năng khôi phục.
  }
}

function removeStorage(key: string) {
  try {
    window.localStorage.removeItem(key);
  } catch {
    // Bỏ qua.
  }
}

function readPending(): PendingAnswer | null {
  const raw = readStorage(PENDING_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<PendingAnswer>;
    if (
      typeof parsed.attemptId !== "string" ||
      typeof parsed.questionId !== "string" ||
      (parsed.variant !== "true_false" &&
        parsed.variant !== "choice" &&
        parsed.variant !== "short")
    ) {
      return null;
    }
    return parsed as PendingAnswer;
  } catch {
    return null;
  }
}

function readLock(): VariantLock | null {
  const raw = readStorage(LOCK_KEY);
  if (!raw) return null;

  try {
    const parsed = JSON.parse(raw) as Partial<VariantLock>;
    if (
      typeof parsed.attemptId !== "string" ||
      typeof parsed.questionId !== "string" ||
      (parsed.variant !== "true_false" &&
        parsed.variant !== "choice" &&
        parsed.variant !== "short")
    ) {
      return null;
    }
    return parsed as VariantLock;
  } catch {
    return null;
  }
}

export default function QuizFlow({
  club,
  stages,
  ending,
}: {
  club: ClubContent;
  stages: StoryStage[];
  ending: StoryStage;
}) {
  const [screen, setScreen] = useState<Screen>("loading");
  const [attempt, setAttempt] = useState<AttemptState | null>(null);
  const [questions, setQuestions] = useState<PublicQuestion[]>([]);
  const [answeredIds, setAnsweredIds] = useState<string[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [selectedVariant, setSelectedVariant] = useState<VariantType | null>(
    null,
  );
  const [lockedVariant, setLockedVariant] = useState<VariantType | null>(null);
  const [answerValue, setAnswerValue] = useState<
    boolean | number | string | null
  >(null);
  const [feedback, setFeedback] = useState<Feedback | null>(null);
  const [pendingNotice, setPendingNotice] = useState("");
  const [introSeen, setIntroSeen] = useState<string | null>(null);
  const [showEnding, setShowEnding] = useState(false);

  const answeredSet = useMemo(() => new Set(answeredIds), [answeredIds]);
  const currentQuestion =
    questions.find((question) => !answeredSet.has(question.id)) ?? null;
  const currentIndex = currentQuestion
    ? questions.findIndex((question) => question.id === currentQuestion.id)
    : -1;
  const currentStageIndex = currentIndex >= 0 ? Math.floor(currentIndex / 4) : -1;
  const currentStoryStage =
    currentStageIndex >= 0 ? (stages[currentStageIndex] ?? null) : null;
  const stageAnsweredCount =
    currentIndex >= 0
      ? questions
          .slice(currentStageIndex * 4, currentStageIndex * 4 + 4)
          .filter((question) => answeredSet.has(question.id)).length
      : 0;
  const showStageIntro = Boolean(
    screen === "quiz" &&
      currentStoryStage &&
      !feedback &&
      stageAnsweredCount === 0 &&
      introSeen !== currentStoryStage.id,
  );
  const nextIsNewStage =
    currentIndex >= 0 &&
    currentIndex + 1 < questions.length &&
    Math.floor((currentIndex + 1) / 4) !== currentStageIndex;
  const currentVariant = currentQuestion?.variants.find(
    (variant) => variant.type === lockedVariant,
  );
  const progress = questions.length
    ? Math.min(
        1,
        (answeredIds.length + (feedback ? 1 : 0)) / questions.length,
      )
    : 0;
  const maxScore = questions.reduce(
    (total, question) =>
      total + Math.max(0, ...question.variants.map((variant) => variant.points)),
    0,
  );

  const applyAttempt = useCallback((data: AttemptResponse) => {
    const firstUnanswered =
      data.questions.find(
        (question) => !data.attempt.answeredIds.includes(question.id),
      ) ?? null;

    setAttempt(data.attempt);
    setQuestions(data.questions);
    setAnsweredIds(data.attempt.answeredIds);
    setName(data.attempt.name);
    setSelectedVariant(null);
    setLockedVariant(null);
    setAnswerValue(null);
    setFeedback(null);
    setError("");
    setPendingNotice("");
    setIntroSeen(null);
    setShowEnding(false);

    if (data.attempt.status === "finished") {
      removeStorage(PENDING_KEY);
      removeStorage(LOCK_KEY);
      setScreen("result");
      return;
    }

    const pending = readPending();
    const storedLock = readLock();
    const matchingPending =
      pending &&
      pending.attemptId === data.attempt.id &&
      firstUnanswered &&
      pending.questionId === firstUnanswered.id &&
      firstUnanswered.variants.some(
        (variant) => variant.type === pending.variant,
      )
        ? pending
        : null;

    if (pending && !matchingPending) {
      removeStorage(PENDING_KEY);
    }

    const restoredVariant =
      matchingPending?.variant ??
      (storedLock &&
      storedLock.attemptId === data.attempt.id &&
      firstUnanswered &&
      storedLock.questionId === firstUnanswered.id &&
      firstUnanswered.variants.some(
        (variant) => variant.type === storedLock.variant,
      )
        ? storedLock.variant
        : null);

    if (restoredVariant && firstUnanswered) {
      setSelectedVariant(restoredVariant);
      setLockedVariant(restoredVariant);
      writeStorage(
        LOCK_KEY,
        JSON.stringify({
          attemptId: data.attempt.id,
          questionId: firstUnanswered.id,
          variant: restoredVariant,
        } satisfies VariantLock),
      );
      if (matchingPending) {
        setAnswerValue(matchingPending.value);
        setPendingNotice(
          "Bạn có một câu trả lời chưa gửi. Kiểm tra rồi bấm “Gửi đáp án” để thử lại.",
        );
      } else {
        setPendingNotice(
          "Bạn đã chốt dạng trả lời cho câu này. Làm tiếp và bấm “Gửi đáp án” nhé.",
        );
      }
    } else {
      removeStorage(LOCK_KEY);
    }

    setScreen("quiz");
  }, []);

  const boot = useCallback(async () => {
    setScreen("loading");
    setError("");
    setBusy(true);

    const storedId = readStorage(ATTEMPT_KEY);
    if (!storedId) {
      setBusy(false);
      setScreen("name");
      return;
    }

    try {
      const data = await api<AttemptResponse>(`/api/attempts/${storedId}`);
      applyAttempt(data);
    } catch (caught) {
      if (
        caught instanceof ApiError &&
        (caught.status === 400 ||
          caught.status === 401 ||
          caught.status === 404)
      ) {
        removeStorage(ATTEMPT_KEY);
        setName("");
        setScreen("name");
      } else {
        setError(
          caught instanceof Error
            ? caught.message
            : "Không tải được lượt chơi. Thử lại nhé.",
        );
        setScreen("resume-error");
      }
    } finally {
      setBusy(false);
    }
  }, [applyAttempt]);

  useEffect(() => {
    // Chờ render đầu xong mới đọc localStorage, tránh setState đồng bộ trong effect.
    const timer = window.setTimeout(() => void boot(), 0);
    return () => window.clearTimeout(timer);
  }, [boot]);

  useEffect(() => {
    if (screen === "quiz" || screen === "result") {
      window.scrollTo({ top: 0 });
    }
  }, [screen, currentQuestion?.id, showStageIntro]);

  async function handleStart(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const cleaned = name.replace(/\s+/g, " ").trim();

    if (cleaned.length < 1) {
      setError("Nhập tên hiển thị trước khi chơi nhé.");
      return;
    }

    setBusy(true);
    setError("");

    try {
      const data = await api<AttemptResponse>("/api/attempts", {
        method: "POST",
        body: JSON.stringify({ name: cleaned }),
      });
      writeStorage(ATTEMPT_KEY, data.attempt.id);
      applyAttempt(data);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không tạo được lượt chơi. Thử lại nhé.",
      );
    } finally {
      setBusy(false);
    }
  }

  function chooseVariant(type: VariantType) {
    if (busy || feedback || lockedVariant) return;
    setSelectedVariant(type);
    setAnswerValue(null);
    setError("");
    setPendingNotice("");
  }

  function confirmLock() {
    if (busy || feedback || lockedVariant || !selectedVariant) return;
    if (!attempt || !currentQuestion) return;

    setLockedVariant(selectedVariant);
    setError("");
    writeStorage(
      LOCK_KEY,
      JSON.stringify({
        attemptId: attempt.id,
        questionId: currentQuestion.id,
        variant: selectedVariant,
      } satisfies VariantLock),
    );
  }

  function canSubmit() {
    if (
      !selectedVariant ||
      !lockedVariant ||
      selectedVariant !== lockedVariant ||
      answerValue === null
    ) {
      return false;
    }
    if (lockedVariant === "short") {
      return typeof answerValue === "string" && answerValue.trim().length > 0;
    }
    return true;
  }

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (
      !attempt ||
      !currentQuestion ||
      !selectedVariant ||
      !lockedVariant ||
      selectedVariant !== lockedVariant ||
      feedback ||
      busy
    ) {
      return;
    }
    if (!canSubmit()) return;

    const pending: PendingAnswer = {
      attemptId: attempt.id,
      questionId: currentQuestion.id,
      variant: selectedVariant,
      value: answerValue as boolean | number | string,
    };

    writeStorage(PENDING_KEY, JSON.stringify(pending));
    setBusy(true);
    setError("");
    setPendingNotice("");

    try {
      const data = await api<AnswerResponse>(
        `/api/attempts/${attempt.id}/answers`,
        {
          method: "POST",
          body: JSON.stringify({
            questionId: currentQuestion.id,
            variant: selectedVariant,
            value: answerValue,
          }),
        },
      );

      removeStorage(PENDING_KEY);
      setFeedback({ result: data.result, finished: data.finished });
      setAttempt((previous) =>
        previous
          ? {
              ...previous,
              score: data.result.totalScore,
              status: data.finished ? "finished" : previous.status,
            }
          : previous,
      );
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không gửi được câu trả lời. Thử lại nhé.",
      );
      setPendingNotice(
        "Câu trả lời đã được lưu tạm trên thiết bị này. Kiểm tra kết nối rồi bấm “Gửi đáp án” để thử lại.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function goToResult() {
    if (!attempt) return;
    setBusy(true);
    setError("");

    try {
      const data = await api<AttemptResponse>(`/api/attempts/${attempt.id}`);
      applyAttempt(data);
      if (data.attempt.status !== "finished") {
        setError("Bài làm chưa hoàn tất. Bấm “Xem kết quả” để thử lại.");
      }
    } catch (caught) {
      setShowEnding(false);
      setError(
        caught instanceof Error
          ? caught.message
          : "Không tải được kết quả. Thử lại nhé.",
      );
    } finally {
      setBusy(false);
    }
  }

  function handleNext() {
    if (!feedback) return;

    if (feedback.finished) {
      setShowEnding(true);
      return;
    }

    if (currentQuestion) {
      setAnsweredIds((previous) =>
        previous.includes(currentQuestion.id)
          ? previous
          : [...previous, currentQuestion.id],
      );
    }

    setFeedback(null);
    setSelectedVariant(null);
    setLockedVariant(null);
    setAnswerValue(null);
    setError("");
    setPendingNotice("");
    removeStorage(LOCK_KEY);
  }

  if (screen === "quiz" && showEnding) {
    return (
      <StoryPlayer
        stage={ending}
        stageIndex={stages.length - 1}
        totalStages={stages.length}
        badge="Kết thúc"
        onFinish={() => void goToResult()}
      />
    );
  }

  if (screen === "quiz" && showStageIntro && currentStoryStage) {
    return (
      <StoryPlayer
        stage={currentStoryStage}
        stageIndex={currentStageIndex}
        totalStages={stages.length}
        onFinish={() => setIntroSeen(currentStoryStage.id)}
      />
    );
  }

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="flex min-w-0 items-center gap-3 rounded-xl">
          <span className="grid h-10 w-10 shrink-0 place-items-center overflow-hidden rounded-xl border border-line bg-paper">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pnit-logo.jpg"
              alt={`Logo ${club.name}`}
              className="h-full w-full object-cover"
            />
          </span>
          <span
            className="truncate text-sm font-black text-ink"
            title={club.name}
          >
            {club.name}
          </span>
        </Link>
        <Link
          href="/leaderboard"
          className="shrink-0 rounded-xl px-3 py-2 text-sm font-bold text-ink hover:bg-brand-soft"
        >
          Bảng xếp hạng
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16">
        {screen === "loading" && (
          <section className="card mt-10 p-8 text-center">
            <p className="text-lg font-black text-ink">
              Đang kiểm tra lượt chơi…
            </p>
            <p className="mt-2 text-sm text-muted">
              Chỉ mất vài giây, bạn chờ nhé.
            </p>
          </section>
        )}

        {screen === "resume-error" && (
          <section className="card mt-10 p-6 text-center sm:p-8">
            <p className="pill">Mất kết nối</p>
            <h1 className="mt-4 text-2xl font-black text-ink">
              Chưa tải được lượt chơi
            </h1>
            <p className="mt-2 text-sm leading-7 text-muted">
              {error || "Kiểm tra mạng rồi thử lại. Lượt chơi của bạn vẫn được giữ."}
            </p>
            <button
              type="button"
              onClick={() => void boot()}
              disabled={busy}
              className="btn-primary mt-5 w-full"
            >
              Thử lại
            </button>
            <Link href="/" className="btn-secondary mt-3 w-full">
              Về trang chủ
            </Link>
          </section>
        )}

        {screen === "name" && (
          <section className="mx-auto max-w-xl pt-6">
            <p className="pill">Bước 1 / 2</p>
            <h1 className="mt-4 text-4xl font-black leading-tight text-ink sm:text-5xl">
              Bạn tên gì?
            </h1>
            <p className="mt-3 text-base leading-7 text-muted">
              Tên này sẽ xuất hiện trên bảng xếp hạng. Tên trùng vẫn được —
              mỗi lượt chơi có một ID riêng.
            </p>

            <form onSubmit={handleStart} className="card mt-6 p-5 sm:p-6">
              <label
                htmlFor="display-name"
                className="block text-sm font-black text-ink"
              >
                Tên hiển thị
              </label>
              <input
                id="display-name"
                name="name"
                value={name}
                onChange={(event) => setName(event.target.value)}
                maxLength={24}
                autoFocus
                autoComplete="off"
                placeholder="Ví dụ: Minh Anh"
                className="mt-2 h-14 w-full rounded-2xl border border-line bg-cream px-4 text-lg font-semibold text-ink outline-none placeholder:text-muted/70"
              />
              <p className="mt-2 text-xs leading-5 text-muted">
                Từ 1 đến 24 ký tự. Mỗi thiết bị được chơi 1 lượt.
              </p>

              {error && (
                <p
                  role="alert"
                  className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
                >
                  {error}
                </p>
              )}

              <button
                type="submit"
                disabled={busy}
                className="btn-primary mt-5 w-full text-lg"
              >
                {busy ? "Đang tạo lượt chơi…" : "Tiếp tục"}
              </button>
            </form>

            <p className="mt-4 text-center text-xs leading-5 text-muted">
              {club.playNote} · Kết quả được lưu ngay khi bạn trả lời.
            </p>
          </section>
        )}

        {screen === "quiz" && !currentQuestion && (
          <section className="card mt-10 p-6 text-center sm:p-8">
            <h1 className="text-2xl font-black text-ink">
              Bạn đã trả lời xong các câu hỏi
            </h1>
            <p className="mt-2 text-sm text-muted">
              Bấm bên dưới để xem kết quả và thứ hạng của mình.
            </p>
            {error && (
              <p
                role="alert"
                className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
              >
                {error}
              </p>
            )}
            <button
              type="button"
              onClick={() => void goToResult()}
              disabled={busy}
              className="btn-primary mt-5 w-full"
            >
              {busy ? "Đang tải kết quả…" : "Xem kết quả"}
            </button>
          </section>
        )}

        {screen === "quiz" && !showStageIntro && currentQuestion && (
          <section className="pt-3">
            <div className="flex items-end justify-between gap-4">
              <div>
                <p className="text-sm font-black text-ink">
                  Chặng {currentStageIndex + 1}/{stages.length} · Câu{" "}
                  {currentIndex + 1}/{questions.length}
                </p>
                <p className="mt-1 text-xs font-semibold text-muted">
                  {currentStoryStage?.title} · Hình thức càng khó, điểm càng cao
                </p>
              </div>
              <p className="text-right text-sm font-black text-brand">
                {attempt?.score ?? 0} điểm
              </p>
            </div>

            <div
              className="mt-3 h-2.5 overflow-hidden rounded-full bg-line"
              role="progressbar"
              aria-valuemin={0}
              aria-valuemax={questions.length}
              aria-valuenow={Math.min(
                answeredIds.length + (feedback ? 1 : 0),
                questions.length,
              )}
              aria-label="Tiến độ làm bài"
            >
              <div
                className="h-full rounded-full bg-brand transition-[width]"
                style={{ width: `${progress * 100}%` }}
              />
            </div>

            <div className="card mt-6 p-5 sm:p-7">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
                Câu hỏi
              </p>
              <h1 className="mt-3 text-2xl font-black leading-snug text-ink sm:text-3xl">
                {currentQuestion.prompt}
              </h1>

              {feedback ? (
                <div className="mt-6" aria-live="polite">
                  <div
                    className={`rounded-2xl border p-5 ${FEEDBACK_STYLE[feedback.result.verdict].box}`}
                  >
                    <p
                      className={`text-sm font-black ${FEEDBACK_STYLE[feedback.result.verdict].label}`}
                    >
                      {FEEDBACK_STYLE[feedback.result.verdict].text}
                    </p>
                    <p className="mt-1 text-3xl font-black text-ink">
                      {feedback.result.points > 0
                        ? `+${feedback.result.points}`
                        : "0"}{" "}
                      điểm
                    </p>
                    <p className="mt-4 text-sm leading-6 text-ink">
                      <span className="font-black">Đáp án đúng: </span>
                      {feedback.result.correctAnswer}
                    </p>
                    <p className="mt-2 text-sm leading-7 text-ink/80">
                      {feedback.result.explanation}
                    </p>
                    <p className="mt-4 text-sm font-black text-ink">
                      Tổng điểm hiện tại: {feedback.result.totalScore}
                    </p>
                  </div>

                  {error && (
                    <p
                      role="alert"
                      className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
                    >
                      {error}
                    </p>
                  )}

                  <button
                    type="button"
                    onClick={handleNext}
                    disabled={busy}
                    className="btn-primary mt-5 w-full text-lg"
                  >
                    {feedback.finished
                      ? busy
                        ? "Đang tải kết quả…"
                        : "Xem kết quả"
                      : nextIsNewStage
                        ? "Sang chặng tiếp theo →"
                        : "Câu tiếp theo →"}
                  </button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="mt-6">
                  <fieldset disabled={busy}>
                    <legend className="text-sm font-black text-ink">
                      Chọn hình thức trả lời
                    </legend>
                    <div className="mt-3 grid gap-2 sm:grid-cols-3">
                      {currentQuestion.variants.map((variant) => {
                        const selected = selectedVariant === variant.type;
                        const locked = lockedVariant === variant.type;
                        return (
                          <button
                            key={variant.type}
                            type="button"
                            aria-pressed={selected}
                            disabled={
                              busy || Boolean(lockedVariant && !locked)
                            }
                            onClick={() => chooseVariant(variant.type)}
                            className={`rounded-2xl border p-3 text-left transition-colors disabled:cursor-not-allowed ${
                              selected
                                ? "border-brand bg-brand-soft"
                                : "border-line bg-cream/60 hover:bg-brand-soft/60 disabled:opacity-50 disabled:hover:bg-cream/60"
                            }`}
                          >
                            <span className="block text-sm font-black text-ink">
                              {MODE_INFO[variant.type].label}
                              {locked && (
                                <span className="ml-2 rounded-full bg-brand px-2 py-0.5 text-[10px] font-black uppercase text-cream">
                                  Đã chốt
                                </span>
                              )}
                            </span>
                            <span className="mt-1 block text-xs leading-5 text-muted">
                              {MODE_INFO[variant.type].description}
                            </span>
                            <span className="mt-2 inline-block rounded-full bg-ink px-2 py-1 text-xs font-black text-cream">
                              +{variant.points} điểm
                            </span>
                          </button>
                        );
                      })}
                    </div>

                    {!selectedVariant && (
                      <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-sm text-muted">
                        Chọn một hình thức ở trên để xem nội dung câu hỏi.
                      </p>
                    )}

                    {selectedVariant && !lockedVariant && (
                      <div className="mt-4 rounded-2xl border border-warning/30 bg-warning-soft p-4">
                        <p className="text-sm font-black text-ink">
                          Chốt dạng {MODE_INFO[selectedVariant].label}?
                        </p>
                        <p className="mt-1 text-sm leading-6 text-muted">
                          Sau khi chốt, bạn không thể đổi dạng trả lời cho câu
                          này. Nội dung câu hỏi chỉ hiện sau khi chốt.
                        </p>
                        <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                          <button
                            type="button"
                            onClick={confirmLock}
                            disabled={busy}
                            className="btn-primary flex-1"
                          >
                            Chốt dạng này
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setSelectedVariant(null);
                              setAnswerValue(null);
                              setError("");
                            }}
                            disabled={busy}
                            className="btn-secondary flex-1"
                          >
                            Chọn lại
                          </button>
                        </div>
                      </div>
                    )}

                    {lockedVariant && (
                      <p className="mt-4 rounded-2xl bg-cream px-4 py-3 text-xs font-semibold leading-5 text-muted">
                        Đã chốt dạng {MODE_INFO[lockedVariant].label} cho câu
                        này. Không thể đổi cho đến câu tiếp theo.
                      </p>
                    )}

                    {currentVariant?.type === "true_false" && (
                      <div className="mt-5">
                        <p className="rounded-2xl bg-cream p-4 text-base font-semibold leading-7 text-ink">
                          {currentVariant.statement}
                        </p>
                        <div className="mt-3 grid grid-cols-2 gap-3">
                          {[true, false].map((value) => (
                            <button
                              key={String(value)}
                              type="button"
                              aria-pressed={answerValue === value}
                              onClick={() => setAnswerValue(value)}
                              className={`min-h-14 rounded-2xl border text-base font-black transition-colors ${
                                answerValue === value
                                  ? "border-teal bg-teal-soft text-ink"
                                  : "border-line bg-paper text-ink hover:bg-teal-soft/60"
                              }`}
                            >
                              {value ? "Đúng" : "Sai"}
                            </button>
                          ))}
                        </div>
                      </div>
                    )}

                    {currentVariant?.type === "choice" && (
                      <div className="mt-5 grid gap-2">
                        {currentVariant.options.map((option, index) => (
                          <button
                            key={option}
                            type="button"
                            aria-pressed={answerValue === index}
                            onClick={() => setAnswerValue(index)}
                            className={`flex min-h-14 items-center gap-3 rounded-2xl border p-3 text-left transition-colors ${
                              answerValue === index
                                ? "border-teal bg-teal-soft"
                                : "border-line bg-paper hover:bg-teal-soft/60"
                            }`}
                          >
                            <span className="grid h-8 w-8 shrink-0 place-items-center rounded-full border border-current text-xs font-black text-ink">
                              {String.fromCharCode(65 + index)}
                            </span>
                            <span className="text-sm font-semibold text-ink">
                              {option}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}

                    {currentVariant?.type === "short" && (
                      <div className="mt-5">
                        <label
                          htmlFor="short-answer"
                          className="block text-sm font-black text-ink"
                        >
                          Câu trả lời của bạn
                        </label>
                        <input
                          id="short-answer"
                          value={
                            typeof answerValue === "string" ? answerValue : ""
                          }
                          onChange={(event) => setAnswerValue(event.target.value)}
                          maxLength={160}
                          autoComplete="off"
                          placeholder={currentVariant.hint ?? "Nhập đáp án"}
                          className="mt-2 h-14 w-full rounded-2xl border border-line bg-cream px-4 text-base font-semibold text-ink outline-none placeholder:text-muted/70"
                        />
                        <p className="mt-2 text-xs leading-5 text-muted">
                          Không phân biệt hoa/thường, có dấu hay không dấu. Có
                          thể nhập ngày dạng 14/3/2015 hoặc 14-03-2015.
                        </p>
                      </div>
                    )}
                  </fieldset>

                  {error && (
                    <p
                      role="alert"
                      className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
                    >
                      {error}
                    </p>
                  )}

                  {pendingNotice && (
                    <p className="mt-4 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">
                      {pendingNotice}
                    </p>
                  )}

                  <button
                    type="submit"
                    disabled={!canSubmit() || busy}
                    className="btn-primary mt-5 w-full text-lg"
                  >
                    {busy ? "Đang gửi…" : "Gửi đáp án"}
                  </button>
                  <p className="mt-3 text-center text-xs leading-5 text-muted">
                    Đáp án được chấm trên server. Nếu mất mạng, câu trả lời được
                    lưu tạm để gửi lại.
                  </p>
                </form>
              )}
            </div>
          </section>
        )}

        {screen === "result" && attempt && (
          <section className="pt-6">
            <p className="pill">Hoàn thành</p>
            <h1 className="mt-4 text-3xl font-black leading-tight text-ink sm:text-4xl">
              Hành trình hoàn tất, {attempt.name}!
            </h1>
            <p className="mt-2 text-sm leading-7 text-muted">
              Từ một câu hỏi trên chuyến xe buýt, Milu đã tìm được một nơi để
              bắt đầu, hoàn thành bản demo đầu tiên và học cách đi tiếp cùng mọi
              người. Cảm ơn bạn đã đồng hành cùng {club.name}!
            </p>

            <div className="card mt-6 p-6 text-center sm:p-8">
              <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
                Điểm của bạn
              </p>
              <p className="mt-2 text-6xl font-black leading-none text-ink">
                {attempt.score}
                <span className="text-2xl font-bold text-muted">
                  /{maxScore}
                </span>
              </p>

              <div className="mt-6 grid grid-cols-2 gap-3 text-left">
                <div className="rounded-2xl bg-cream p-4">
                  <p className="text-xs font-bold text-muted">Thứ hạng</p>
                  <p className="mt-1 text-2xl font-black text-ink">
                    {attempt.rank ? `#${attempt.rank}` : "Đang cập nhật"}
                  </p>
                </div>
                <div className="rounded-2xl bg-cream p-4">
                  <p className="text-xs font-bold text-muted">
                    Người đã hoàn thành
                  </p>
                  <p className="mt-1 text-2xl font-black text-ink">
                    {attempt.totalFinished ?? "—"}
                  </p>
                </div>
              </div>

              <p className="mt-5 text-sm leading-7 text-muted">
                {attempt.rank && attempt.rank <= 3
                  ? "Bạn đang nằm trong nhóm dẫn đầu. Tuyệt vời!"
                  : "Xem bảng xếp hạng để biết mình đang ở đâu nhé."}
              </p>
            </div>

            {error && (
              <p
                role="alert"
                className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
              >
                {error}
              </p>
            )}

            <Link href="/leaderboard" className="btn-primary mt-5 w-full text-lg">
              Xem bảng xếp hạng
            </Link>
            <Link href="/" className="btn-secondary mt-3 w-full">
              Về trang chủ
            </Link>

            <p className="mt-4 text-center text-xs leading-5 text-muted">
              Mỗi thiết bị được chơi 1 lượt. Kết quả đã được lưu trên server.
            </p>
          </section>
        )}
      </main>
    </div>
  );
}
