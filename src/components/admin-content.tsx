"use client";

import Link from "next/link";
import { Fragment, useCallback, useEffect, useRef, useState } from "react";

import { SCENE_LABELS } from "@/components/story-scene";
import { ApiError, api } from "@/lib/client";
import { parseSiteContent } from "@/lib/content-validation";
import type {
  KeywordGroup,
  SiteContent,
  StoryScene,
  Variant,
} from "@/lib/types";

type AdminContentResponse = {
  draft: SiteContent;
  revision: number;
  updatedAt: string | null;
  publishedAt: string | null;
  attemptsCount: number;
  versions: { id: string; createdAt: string }[];
};

type Busy = "load" | "save" | "publish" | "restore" | null;

type TrueFalseVariant = Extract<Variant, { type: "true_false" }>;
type ChoiceVariant = Extract<Variant, { type: "choice" }>;
type ShortVariant = Extract<Variant, { type: "short" }>;

const inputClass =
  "h-11 w-full rounded-xl border border-line bg-cream px-3 text-sm font-semibold text-ink outline-none placeholder:text-muted/60";
const textareaClass =
  "w-full rounded-xl border border-line bg-cream px-3 py-2 text-sm font-semibold leading-6 text-ink outline-none placeholder:text-muted/60";
const smallButton =
  "min-h-10 rounded-xl border border-line bg-paper px-3 text-xs font-black text-ink transition-colors hover:bg-brand-soft disabled:cursor-not-allowed disabled:opacity-50";
const dangerButton =
  "min-h-10 rounded-xl border border-danger/30 bg-danger-soft px-3 text-xs font-black text-danger transition-colors hover:bg-danger/10 disabled:cursor-not-allowed disabled:opacity-50";

function formatDateTime(value: string | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function Field({
  label,
  hint,
  className,
  children,
}: {
  label: string;
  hint?: string;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <label className={`block text-xs font-black text-ink ${className ?? ""}`}>
      {label}
      {hint && (
        <span className="ml-1 font-medium text-muted">· {hint}</span>
      )}
      <span className="mt-1 block font-medium">{children}</span>
    </label>
  );
}

export default function AdminContent() {
  const [payload, setPayload] = useState<AdminContentResponse | null>(null);
  const [draft, setDraft] = useState<SiteContent | null>(null);
  const [revision, setRevision] = useState(0);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState<Busy>(null);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const fileRef = useRef<HTMLInputElement>(null);

  const handleError = useCallback((caught: unknown) => {
    if (caught instanceof ApiError && caught.status === 401) {
      setError("Phiên đăng nhập đã hết hạn. Quay lại trang quản trị để đăng nhập.");
      return;
    }
    setError(
      caught instanceof Error ? caught.message : "Có lỗi xảy ra. Thử lại nhé.",
    );
  }, []);

  const load = useCallback(async () => {
    setBusy("load");
    setError("");
    setNotice("");

    try {
      const data = await api<AdminContentResponse>("/api/admin/content");
      setPayload(data);
      setDraft(data.draft);
      setRevision(data.revision);
      setDirty(false);
    } catch (caught) {
      handleError(caught);
    } finally {
      setBusy(null);
    }
  }, [handleError]);

  useEffect(() => {
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [load]);

  function editDraft(mutator: (next: SiteContent) => void) {
    setDraft((previous) => {
      if (!previous) return previous;
      const next = structuredClone(previous);
      mutator(next);
      return next;
    });
    setDirty(true);
    setNotice("");
  }

  function editTrueFalse(
    questionIndex: number,
    mutator: (variant: TrueFalseVariant) => void,
  ) {
    editDraft((next) => {
      const variant = next.questions[questionIndex]?.variants.find(
        (item) => item.type === "true_false",
      );
      if (variant?.type === "true_false") mutator(variant);
    });
  }

  function editChoice(
    questionIndex: number,
    mutator: (variant: ChoiceVariant) => void,
  ) {
    editDraft((next) => {
      const variant = next.questions[questionIndex]?.variants.find(
        (item) => item.type === "choice",
      );
      if (variant?.type === "choice") mutator(variant);
    });
  }

  function editShort(
    questionIndex: number,
    mutator: (variant: ShortVariant) => void,
  ) {
    editDraft((next) => {
      const variant = next.questions[questionIndex]?.variants.find(
        (item) => item.type === "short",
      );
      if (variant?.type === "short") mutator(variant);
    });
  }

  function addChoiceOption(questionIndex: number) {
    editChoice(questionIndex, (variant) => {
      if (variant.options.length < 6) variant.options.push("");
    });
  }

  function removeChoiceOption(questionIndex: number, optionIndex: number) {
    editChoice(questionIndex, (variant) => {
      if (variant.options.length <= 2) return;
      variant.options.splice(optionIndex, 1);
      if (variant.answerIndex === optionIndex) {
        variant.answerIndex = 0;
      } else if (variant.answerIndex > optionIndex) {
        variant.answerIndex -= 1;
      }
    });
  }

  function addKeyword(questionIndex: number) {
    editShort(questionIndex, (variant) => {
      variant.keywords ??= [];
      if (variant.keywords.length < 10) {
        variant.keywords.push({ any: [""], points: 5 });
      }
    });
  }

  function removeKeyword(questionIndex: number, keywordIndex: number) {
    editShort(questionIndex, (variant) => {
      variant.keywords?.splice(keywordIndex, 1);
    });
  }

  function updateKeyword(
    questionIndex: number,
    keywordIndex: number,
    patch: Partial<KeywordGroup>,
  ) {
    editShort(questionIndex, (variant) => {
      const keyword = variant.keywords?.[keywordIndex];
      if (keyword) Object.assign(keyword, patch);
    });
  }

  async function handleReload() {
    if (
      dirty &&
      !window.confirm("Bỏ các thay đổi chưa lưu và tải lại bản nháp?")
    ) {
      return;
    }
    await load();
  }

  async function handleSave() {
    if (!draft || !dirty || busy) return;

    setBusy("save");
    setError("");
    setNotice("");

    try {
      const saved = await api<{ revision: number; updatedAt: string }>(
        "/api/admin/content",
        {
          method: "PUT",
          body: JSON.stringify({ data: draft, revision }),
        },
      );

      setRevision(saved.revision);
      setPayload((previous) =>
        previous
          ? {
              ...previous,
              draft,
              revision: saved.revision,
              updatedAt: saved.updatedAt,
            }
          : previous,
      );
      setDirty(false);
      setNotice("Đã lưu bản nháp. Người chơi vẫn thấy bản đã xuất bản.");
    } catch (caught) {
      handleError(caught);
    } finally {
      setBusy(null);
    }
  }

  async function handlePublish() {
    if (!payload || dirty || busy || payload.attemptsCount > 0) return;

    if (
      !window.confirm(
        "Xuất bản bản nháp này? Người chơi mới sẽ thấy nội dung mới ngay sau khi tải lại trang.",
      )
    ) {
      return;
    }

    setBusy("publish");
    setError("");
    setNotice("");

    try {
      const published = await api<{ id: string; publishedAt: string }>(
        "/api/admin/content/publish",
        { method: "POST" },
      );

      setPayload((previous) =>
        previous
          ? {
              ...previous,
              publishedAt: published.publishedAt,
              versions: [
                { id: published.id, createdAt: published.publishedAt },
                ...previous.versions,
              ].slice(0, 10),
            }
          : previous,
      );
      setNotice("Đã xuất bản nội dung mới.");
    } catch (caught) {
      handleError(caught);
    } finally {
      setBusy(null);
    }
  }

  async function handleRestore(versionId: string) {
    if (!payload || busy) return;

    if (
      dirty &&
      !window.confirm(
        "Bản nháp đang có thay đổi chưa lưu. Khôi phục sẽ ghi đè lên các thay đổi đó. Tiếp tục?",
      )
    ) {
      return;
    }

    setBusy("restore");
    setError("");
    setNotice("");

    try {
      await api("/api/admin/content/restore", {
        method: "POST",
        body: JSON.stringify({ versionId, revision }),
      });
      await load();
      setNotice(
        "Đã khôi phục bản cũ vào nháp. Kiểm tra rồi bấm “Xuất bản” nếu muốn áp dụng.",
      );
    } catch (caught) {
      handleError(caught);
    } finally {
      setBusy(null);
    }
  }

  function handleExport() {
    if (!draft) return;

    const blob = new Blob([JSON.stringify(draft, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `quiz-content-${new Date().toISOString().slice(0, 10)}.json`;
    link.click();
    window.setTimeout(() => URL.revokeObjectURL(url), 0);
  }

  async function handleImport(event: React.ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 500_000) {
      setError("File quá lớn. Chỉ nhận file JSON dưới 500 KB.");
      return;
    }

    try {
      const parsed = parseSiteContent(JSON.parse(await file.text()));
      if (!parsed.ok) {
        setError(`File không hợp lệ: ${parsed.error}`);
        return;
      }
      if (
        !window.confirm(
          "Thay bản nháp hiện tại bằng nội dung trong file? Thay đổi chỉ được lưu khi bạn bấm “Lưu nháp”.",
        )
      ) {
        return;
      }
      setDraft(parsed.data);
      setDirty(true);
      setError("");
      setNotice("Đã nhập file. Kiểm tra rồi bấm “Lưu nháp”.");
    } catch {
      setError("Không đọc được file JSON. Kiểm tra lại định dạng file.");
    }
  }

  if (!payload || !draft) {
    return (
      <section className="card mt-6 p-6 text-center sm:p-8">
        <p className="text-lg font-black text-ink">
          {busy === "load" ? "Đang tải nội dung…" : "Chưa tải được nội dung"}
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
          onClick={() => void load()}
          disabled={Boolean(busy)}
          className="btn-primary mt-5 w-full"
        >
          Thử lại
        </button>
        <Link href="/admin" className="btn-secondary mt-3 w-full">
          Về trang quản trị
        </Link>
      </section>
    );
  }

  const published = Boolean(payload.publishedAt);
  const locked = payload.attemptsCount > 0;

  return (
    <div className="mt-5">
      <div className="card p-4 sm:p-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-black uppercase tracking-[0.18em] text-brand">
              Bản nháp
            </p>
            <p className="mt-1 text-sm font-semibold text-ink">
              {dirty
                ? "Có thay đổi chưa lưu"
                : payload.updatedAt
                  ? `Đã lưu lúc ${formatDateTime(payload.updatedAt)}`
                  : "Chưa lưu — đang dùng nội dung mẫu hoặc bản đã xuất bản"}
            </p>
            <p className="mt-1 text-xs text-muted">
              Xuất bản lần cuối:{" "}
              {published ? formatDateTime(payload.publishedAt) : "chưa xuất bản"}
              {" · "}
              {locked
                ? `${payload.attemptsCount} lượt chơi`
                : "chưa có lượt chơi"}
            </p>
          </div>

          <div className="flex flex-wrap gap-2">
            <button
              type="button"
              onClick={() => void handleReload()}
              disabled={Boolean(busy)}
              className="btn-secondary"
            >
              {busy === "load" ? "Đang tải…" : "Tải lại"}
            </button>
            <Link
              href="/admin/content/preview"
              target="_blank"
              className="btn-secondary"
            >
              Xem trước
            </Link>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => void handleSave()}
            disabled={!dirty || Boolean(busy)}
            className="btn-primary"
          >
            {busy === "save" ? "Đang lưu…" : "Lưu nháp"}
          </button>
          <button
            type="button"
            onClick={() => void handlePublish()}
            disabled={dirty || Boolean(busy) || locked}
            title={
              dirty
                ? "Lưu nháp trước khi xuất bản."
                : locked
                  ? "Phải reset dữ liệu trước khi xuất bản."
                  : undefined
            }
            className="inline-flex min-h-12 items-center justify-center rounded-2xl bg-ink px-5 py-3 text-center text-sm font-black text-cream transition-colors hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {busy === "publish" ? "Đang xuất bản…" : "Xuất bản"}
          </button>
          <button
            type="button"
            onClick={handleExport}
            disabled={Boolean(busy)}
            className="btn-secondary"
          >
            Xuất JSON
          </button>
          <button
            type="button"
            onClick={() => fileRef.current?.click()}
            disabled={Boolean(busy)}
            className="btn-secondary"
          >
            Nhập JSON
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            onChange={(event) => void handleImport(event)}
            className="hidden"
          />
        </div>

        {dirty && (
          <p className="mt-3 text-xs leading-5 text-muted">
            Thay đổi chưa được lưu. Người chơi vẫn thấy bản đã xuất bản; bấm
            “Lưu nháp” trước khi xuất bản hoặc tải lại.
          </p>
        )}

        {locked && (
          <p className="mt-3 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm font-semibold text-warning">
            Đã có {payload.attemptsCount} lượt chơi nên không thể xuất bản. Bạn
            vẫn sửa và lưu nháp được; muốn áp dụng nội dung mới, hãy reset dữ
            liệu trong trang quản trị trước.
          </p>
        )}

        {!published && (
          <p className="mt-3 rounded-2xl border border-line bg-cream px-4 py-3 text-sm text-muted">
            Chưa xuất bản lần nào — người chơi đang thấy nội dung mẫu trong code.
            Lưu nháp rồi xuất bản để chuyển sang nội dung trong database.
          </p>
        )}

        {error && (
          <p
            role="alert"
            className="mt-4 rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger"
          >
            {error}
          </p>
        )}

        {notice && (
          <p
            role="status"
            className="mt-4 rounded-2xl border border-success/30 bg-success-soft px-4 py-3 text-sm font-semibold text-success"
          >
            {notice}
          </p>
        )}
      </div>

      <section className="card mt-5 p-5 sm:p-6">
        <h2 className="text-lg font-black text-ink">Thông tin CLB</h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Các trường này hiện trên trang chủ, trang chơi và bảng xếp hạng.
        </p>

        <div className="mt-4 grid gap-4 sm:grid-cols-2">
          <Field label="Tên CLB">
            <input
              value={draft.club.name}
              maxLength={80}
              onChange={(event) =>
                editDraft((next) => {
                  next.club.name = event.target.value;
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Ký hiệu">
            <input
              value={draft.club.monogram}
              maxLength={8}
              onChange={(event) =>
                editDraft((next) => {
                  next.club.monogram = event.target.value;
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Khẩu hiệu" className="sm:col-span-2">
            <input
              value={draft.club.tagline}
              maxLength={160}
              onChange={(event) =>
                editDraft((next) => {
                  next.club.tagline = event.target.value;
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Mô tả CLB" className="sm:col-span-2">
            <textarea
              value={draft.club.description}
              rows={4}
              maxLength={1000}
              onChange={(event) =>
                editDraft((next) => {
                  next.club.description = event.target.value;
                })
              }
              className={textareaClass}
            />
          </Field>
          <Field label="Ghi chú sự kiện">
            <input
              value={draft.club.eventNote}
              maxLength={120}
              onChange={(event) =>
                editDraft((next) => {
                  next.club.eventNote = event.target.value;
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Ảnh bìa" hint="đường dẫn /... hoặc https://...">
            <input
              value={draft.club.coverImage}
              maxLength={300}
              onChange={(event) =>
                editDraft((next) => {
                  next.club.coverImage = event.target.value;
                })
              }
              className={inputClass}
            />
          </Field>
          <Field label="Ghi chú lượt chơi" className="sm:col-span-2">
            <input
              value={draft.club.playNote}
              maxLength={160}
              onChange={(event) =>
                editDraft((next) => {
                  next.club.playNote = event.target.value;
                })
              }
              className={inputClass}
            />
          </Field>
        </div>
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-ink">Số liệu nhanh</h2>
            <p className="mt-1 text-xs text-muted">Tối đa 6 mục.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              editDraft((next) => {
                if (next.club.stats.length < 6) {
                  next.club.stats.push({ value: "", label: "" });
                }
              })
            }
            disabled={draft.club.stats.length >= 6 || Boolean(busy)}
            className={smallButton}
          >
            + Thêm số liệu
          </button>
        </div>

        <div className="mt-3 grid gap-2">
          {draft.club.stats.map((stat, index) => (
            <div
              key={index}
              className="grid gap-2 sm:grid-cols-[1fr_2fr_auto]"
            >
              <input
                value={stat.value}
                maxLength={20}
                aria-label={`Giá trị số liệu ${index + 1}`}
                placeholder="60+"
                onChange={(event) =>
                  editDraft((next) => {
                    next.club.stats[index].value = event.target.value;
                  })
                }
                className={inputClass}
              />
              <input
                value={stat.label}
                maxLength={40}
                aria-label={`Nhãn số liệu ${index + 1}`}
                placeholder="thành viên"
                onChange={(event) =>
                  editDraft((next) => {
                    next.club.stats[index].label = event.target.value;
                  })
                }
                className={inputClass}
              />
              <button
                type="button"
                onClick={() =>
                  editDraft((next) => {
                    if (next.club.stats.length > 1) {
                      next.club.stats.splice(index, 1);
                    }
                  })
                }
                disabled={draft.club.stats.length <= 1 || Boolean(busy)}
                className={dangerButton}
              >
                Xóa
              </button>
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-ink">Thế mạnh</h2>
            <p className="mt-1 text-xs text-muted">Tối đa 6 mục.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              editDraft((next) => {
                if (next.club.strengths.length < 6) {
                  next.club.strengths.push({ title: "", description: "" });
                }
              })
            }
            disabled={draft.club.strengths.length >= 6 || Boolean(busy)}
            className={smallButton}
          >
            + Thêm thế mạnh
          </button>
        </div>

        <div className="mt-3 grid gap-3">
          {draft.club.strengths.map((item, index) => (
            <div
              key={index}
              className="rounded-2xl border border-line p-3"
            >
              <div className="flex gap-2">
                <input
                  value={item.title}
                  maxLength={80}
                  aria-label={`Tiêu đề thế mạnh ${index + 1}`}
                  placeholder="Tiêu đề"
                  onChange={(event) =>
                    editDraft((next) => {
                      next.club.strengths[index].title = event.target.value;
                    })
                  }
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() =>
                    editDraft((next) => {
                      if (next.club.strengths.length > 1) {
                        next.club.strengths.splice(index, 1);
                      }
                    })
                  }
                  disabled={draft.club.strengths.length <= 1 || Boolean(busy)}
                  className={dangerButton}
                >
                  Xóa
                </button>
              </div>
              <textarea
                value={item.description}
                rows={2}
                maxLength={500}
                aria-label={`Mô tả thế mạnh ${index + 1}`}
                placeholder="Mô tả"
                onChange={(event) =>
                  editDraft((next) => {
                    next.club.strengths[index].description = event.target.value;
                  })
                }
                className={`mt-2 ${textareaClass}`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-ink">Hoạt động nổi bật</h2>
            <p className="mt-1 text-xs text-muted">Tối đa 6 mục.</p>
          </div>
          <button
            type="button"
            onClick={() =>
              editDraft((next) => {
                if (next.club.activities.length < 6) {
                  next.club.activities.push({
                    title: "",
                    time: "",
                    description: "",
                  });
                }
              })
            }
            disabled={draft.club.activities.length >= 6 || Boolean(busy)}
            className={smallButton}
          >
            + Thêm hoạt động
          </button>
        </div>

        <div className="mt-3 grid gap-3">
          {draft.club.activities.map((activity, index) => (
            <div
              key={index}
              className="rounded-2xl border border-line p-3"
            >
              <div className="grid gap-2 sm:grid-cols-[2fr_1fr_auto]">
                <input
                  value={activity.title}
                  maxLength={80}
                  aria-label={`Tiêu đề hoạt động ${index + 1}`}
                  placeholder="Tên hoạt động"
                  onChange={(event) =>
                    editDraft((next) => {
                      next.club.activities[index].title = event.target.value;
                    })
                  }
                  className={inputClass}
                />
                <input
                  value={activity.time}
                  maxLength={60}
                  aria-label={`Thời gian hoạt động ${index + 1}`}
                  placeholder="Tháng 11 hằng năm"
                  onChange={(event) =>
                    editDraft((next) => {
                      next.club.activities[index].time = event.target.value;
                    })
                  }
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() =>
                    editDraft((next) => {
                      if (next.club.activities.length > 1) {
                        next.club.activities.splice(index, 1);
                      }
                    })
                  }
                  disabled={draft.club.activities.length <= 1 || Boolean(busy)}
                  className={dangerButton}
                >
                  Xóa
                </button>
              </div>
              <textarea
                value={activity.description}
                rows={2}
                maxLength={500}
                aria-label={`Mô tả hoạt động ${index + 1}`}
                placeholder="Mô tả"
                onChange={(event) =>
                  editDraft((next) => {
                    next.club.activities[index].description = event.target.value;
                  })
                }
                className={`mt-2 ${textareaClass}`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-lg font-black text-ink">Thẻ ôn nhanh</h2>
            <p className="mt-1 text-xs text-muted">
              Tối đa 10 thẻ, hiện trong phần ôn nhanh trước khi chơi.
            </p>
          </div>
          <button
            type="button"
            onClick={() =>
              editDraft((next) => {
                if (next.club.theory.length < 10) {
                  next.club.theory.push({ title: "", body: "" });
                }
              })
            }
            disabled={draft.club.theory.length >= 10 || Boolean(busy)}
            className={smallButton}
          >
            + Thêm thẻ
          </button>
        </div>

        <div className="mt-3 grid gap-3">
          {draft.club.theory.map((card, index) => (
            <div
              key={index}
              className="rounded-2xl border border-line p-3"
            >
              <div className="flex gap-2">
                <input
                  value={card.title}
                  maxLength={100}
                  aria-label={`Tiêu đề thẻ ${index + 1}`}
                  placeholder="Tiêu đề thẻ"
                  onChange={(event) =>
                    editDraft((next) => {
                      next.club.theory[index].title = event.target.value;
                    })
                  }
                  className={inputClass}
                />
                <button
                  type="button"
                  onClick={() =>
                    editDraft((next) => {
                      if (next.club.theory.length > 1) {
                        next.club.theory.splice(index, 1);
                      }
                    })
                  }
                  disabled={draft.club.theory.length <= 1 || Boolean(busy)}
                  className={dangerButton}
                >
                  Xóa
                </button>
              </div>
              <textarea
                value={card.body}
                rows={3}
                maxLength={1000}
                aria-label={`Nội dung thẻ ${index + 1}`}
                placeholder="Nội dung"
                onChange={(event) =>
                  editDraft((next) => {
                    next.club.theory[index].body = event.target.value;
                  })
                }
                className={`mt-2 ${textareaClass}`}
              />
            </div>
          ))}
        </div>
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <h2 className="text-lg font-black text-ink">
          Chặng truyện ({draft.stages.length})
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Đúng 5 chặng, mỗi chặng 4 câu hỏi. Ảnh để trống sẽ dùng nền CSS theo
          bối cảnh; mỗi chặng có 1–6 lời thoại.
        </p>

        <div className="mt-3 grid gap-3">
          {draft.stages.map((stage, stageIndex) => (
            <details
              key={stageIndex}
              className="rounded-2xl border border-line p-3"
            >
              <summary className="cursor-pointer text-sm font-black text-ink">
                Chặng {stageIndex + 1}:{" "}
                {stage.title || "(chưa có tiêu đề)"}
              </summary>

              <div className="mt-3 grid gap-3">
                <div className="grid gap-3 sm:grid-cols-[150px_1fr_190px]">
                  <Field label="Mã chặng" hint="chữ thường, số, gạch nối">
                    <input
                      value={stage.id}
                      maxLength={40}
                      onChange={(event) =>
                        editDraft((next) => {
                          next.stages[stageIndex].id = event.target.value;
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Tiêu đề">
                    <input
                      value={stage.title}
                      maxLength={80}
                      onChange={(event) =>
                        editDraft((next) => {
                          next.stages[stageIndex].title = event.target.value;
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Bối cảnh">
                    <select
                      value={stage.scene}
                      onChange={(event) =>
                        editDraft((next) => {
                          next.stages[stageIndex].scene = event.target
                            .value as StoryScene;
                        })
                      }
                      className={inputClass}
                    >
                      {(Object.keys(SCENE_LABELS) as StoryScene[]).map(
                        (scene) => (
                          <option key={scene} value={scene}>
                            {SCENE_LABELS[scene]}
                          </option>
                        ),
                      )}
                    </select>
                  </Field>
                </div>

                <div className="grid gap-3 sm:grid-cols-2">
                  <Field label="Ảnh nền" hint="để trống = nền CSS">
                    <input
                      value={stage.background ?? ""}
                      maxLength={300}
                      placeholder="/story/ten-anh.jpg"
                      onChange={(event) =>
                        editDraft((next) => {
                          next.stages[stageIndex].background =
                            event.target.value || undefined;
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field
                    label="Ảnh nhân vật"
                    hint="PNG nền trong suốt; để trống = không hiện"
                  >
                    <input
                      value={stage.portrait ?? ""}
                      maxLength={300}
                      placeholder="/story/milu-idle.png"
                      onChange={(event) =>
                        editDraft((next) => {
                          next.stages[stageIndex].portrait =
                            event.target.value || undefined;
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                </div>

                <div>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <p className="text-xs font-black text-ink">
                      Lời thoại ({stage.lines.length}/6)
                    </p>
                    <button
                      type="button"
                      onClick={() =>
                        editDraft((next) => {
                          if (next.stages[stageIndex].lines.length < 6) {
                            next.stages[stageIndex].lines.push({
                              speaker: "",
                              text: "",
                            });
                          }
                        })
                      }
                      disabled={stage.lines.length >= 6 || Boolean(busy)}
                      className={smallButton}
                    >
                      + Thêm thoại
                    </button>
                  </div>

                  <div className="mt-2 grid gap-2">
                    {stage.lines.map((line, lineIndex) => (
                      <div
                        key={lineIndex}
                        className="rounded-xl border border-line/70 p-2"
                      >
                        <div className="flex gap-2">
                          <input
                            value={line.speaker}
                            maxLength={40}
                            aria-label={`Người nói chặng ${stageIndex + 1}, thoại ${lineIndex + 1}`}
                            placeholder="Người nói"
                            onChange={(event) =>
                              editDraft((next) => {
                                next.stages[stageIndex].lines[lineIndex].speaker =
                                  event.target.value;
                              })
                            }
                            className={inputClass}
                          />
                          <button
                            type="button"
                            onClick={() =>
                              editDraft((next) => {
                                if (next.stages[stageIndex].lines.length > 1) {
                                  next.stages[stageIndex].lines.splice(
                                    lineIndex,
                                    1,
                                  );
                                }
                              })
                            }
                            disabled={
                              stage.lines.length <= 1 || Boolean(busy)
                            }
                            className={dangerButton}
                          >
                            Xóa
                          </button>
                        </div>
                        <textarea
                          value={line.text}
                          rows={2}
                          maxLength={300}
                          aria-label={`Lời thoại chặng ${stageIndex + 1}, câu ${lineIndex + 1}`}
                          placeholder="Lời thoại"
                          onChange={(event) =>
                            editDraft((next) => {
                              next.stages[stageIndex].lines[lineIndex].text =
                                event.target.value;
                            })
                          }
                          className={`mt-2 ${textareaClass}`}
                        />
                        <Field
                          label="Ảnh minh họa"
                          hint="để trống = không có"
                          className="mt-2"
                        >
                          <input
                            value={line.image ?? ""}
                            maxLength={300}
                            placeholder="/story/ten-anh.jpg"
                            onChange={(event) =>
                              editDraft((next) => {
                                next.stages[stageIndex].lines[lineIndex].image =
                                  event.target.value || undefined;
                              })
                            }
                            className={inputClass}
                          />
                        </Field>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </details>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <div>
          <h2 className="text-lg font-black text-ink">
            Câu hỏi ({draft.questions.length})
          </h2>
          <p className="mt-1 text-xs leading-5 text-muted">
            Đúng 20 câu, 4 câu mỗi chặng. Mỗi câu đủ 3 dạng. Điểm cố định:
            Đúng/Sai 5, trắc nghiệm 10, tự luận 20.
          </p>
        </div>

        {draft.questions.map((question, questionIndex) => {
          const trueFalse = question.variants.find(
            (variant) => variant.type === "true_false",
          );
          const choice = question.variants.find(
            (variant) => variant.type === "choice",
          );
          const short = question.variants.find(
            (variant) => variant.type === "short",
          );
          const keywordSum =
            short?.type === "short"
              ? (short.keywords ?? []).reduce(
                  (total, keyword) => total + keyword.points,
                  0,
                )
              : 0;
          const stageIndex = Math.floor(questionIndex / 4);
          const stage = draft.stages[stageIndex];

          return (
            <Fragment key={questionIndex}>
              {questionIndex % 4 === 0 && (
                <h3 className="mt-6 text-sm font-black uppercase tracking-wide text-brand">
                  Chặng {stageIndex + 1}
                  {stage?.title ? ` · ${stage.title}` : ""}
                </h3>
              )}
              <details className="card mt-4 p-4 sm:p-5">
              <summary className="cursor-pointer text-sm font-black text-ink">
                Câu {questionIndex + 1}:{" "}
                {question.prompt || "(chưa có câu hỏi)"}
              </summary>

              <div className="mt-4 space-y-4">
                <div className="grid gap-3 sm:grid-cols-[180px_1fr]">
                  <Field label="Mã câu hỏi" hint="chữ thường, số, gạch nối">
                    <input
                      value={question.id}
                      maxLength={40}
                      onChange={(event) =>
                        editDraft((next) => {
                          next.questions[questionIndex].id =
                            event.target.value;
                        })
                      }
                      className={inputClass}
                    />
                  </Field>
                  <Field label="Câu hỏi">
                    <textarea
                      value={question.prompt}
                      rows={2}
                      maxLength={300}
                      onChange={(event) =>
                        editDraft((next) => {
                          next.questions[questionIndex].prompt =
                            event.target.value;
                        })
                      }
                      className={textareaClass}
                    />
                  </Field>
                </div>

                <Field label="Giải thích đáp án">
                  <textarea
                    value={question.explanation}
                    rows={2}
                    maxLength={1000}
                    onChange={(event) =>
                      editDraft((next) => {
                        next.questions[questionIndex].explanation =
                          event.target.value;
                      })
                    }
                    className={textareaClass}
                  />
                </Field>

                {!trueFalse || !choice || !short ? (
                  <p className="rounded-2xl border border-danger/30 bg-danger-soft px-4 py-3 text-sm font-semibold text-danger">
                    Câu này thiếu một dạng trả lời. Hãy tải lại hoặc nhập file
                    JSON hợp lệ.
                  </p>
                ) : (
                  <>
                    {trueFalse.type === "true_false" && (
                      <div className="rounded-2xl border border-line bg-cream/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-black text-ink">
                            Đúng / Sai
                          </h3>
                          <span className="pill">5 điểm</span>
                        </div>
                        <Field label="Mệnh đề" className="mt-3">
                          <textarea
                            value={trueFalse.statement}
                            rows={2}
                            maxLength={300}
                            onChange={(event) =>
                              editTrueFalse(questionIndex, (variant) => {
                                variant.statement = event.target.value;
                              })
                            }
                            className={textareaClass}
                          />
                        </Field>
                        <div className="mt-3 flex gap-5">
                          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <input
                              type="radio"
                              name={`tf-${questionIndex}`}
                              checked={trueFalse.answer === true}
                              onChange={() =>
                                editTrueFalse(questionIndex, (variant) => {
                                  variant.answer = true;
                                })
                              }
                              className="h-5 w-5 accent-brand"
                            />
                            Đúng
                          </label>
                          <label className="flex items-center gap-2 text-sm font-semibold text-ink">
                            <input
                              type="radio"
                              name={`tf-${questionIndex}`}
                              checked={trueFalse.answer === false}
                              onChange={() =>
                                editTrueFalse(questionIndex, (variant) => {
                                  variant.answer = false;
                                })
                              }
                              className="h-5 w-5 accent-brand"
                            />
                            Sai
                          </label>
                        </div>
                      </div>
                    )}

                    {choice.type === "choice" && (
                      <div className="rounded-2xl border border-line bg-cream/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-black text-ink">
                            Trắc nghiệm
                          </h3>
                          <span className="pill">10 điểm</span>
                        </div>
                        <p className="mt-2 text-xs text-muted">
                          Chọn nút tròn bên trái để đánh dấu đáp án đúng.
                        </p>
                        <div className="mt-3 space-y-2">
                          {choice.options.map((option, optionIndex) => (
                            <div
                              key={optionIndex}
                              className="flex items-center gap-2"
                            >
                              <input
                                type="radio"
                                name={`choice-${questionIndex}`}
                                checked={choice.answerIndex === optionIndex}
                                onChange={() =>
                                  editChoice(questionIndex, (variant) => {
                                    variant.answerIndex = optionIndex;
                                  })
                                }
                                aria-label={`Đáp án đúng ${optionIndex + 1}`}
                                className="h-5 w-5 shrink-0 accent-brand"
                              />
                              <input
                                value={option}
                                maxLength={200}
                                aria-label={`Đáp án ${optionIndex + 1}`}
                                onChange={(event) =>
                                  editChoice(questionIndex, (variant) => {
                                    variant.options[optionIndex] =
                                      event.target.value;
                                  })
                                }
                                className={inputClass}
                              />
                              <button
                                type="button"
                                onClick={() =>
                                  removeChoiceOption(
                                    questionIndex,
                                    optionIndex,
                                  )
                                }
                                disabled={
                                  choice.options.length <= 2 || Boolean(busy)
                                }
                                className={dangerButton}
                              >
                                Xóa
                              </button>
                            </div>
                          ))}
                        </div>
                        <button
                          type="button"
                          onClick={() => addChoiceOption(questionIndex)}
                          disabled={choice.options.length >= 6 || Boolean(busy)}
                          className={`mt-3 ${smallButton}`}
                        >
                          + Thêm đáp án
                        </button>
                      </div>
                    )}

                    {short.type === "short" && (
                      <div className="rounded-2xl border border-line bg-cream/50 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <h3 className="text-sm font-black text-ink">
                            Tự luận ngắn
                          </h3>
                          <span className="pill">20 điểm</span>
                        </div>
                        <Field label="Gợi ý" className="mt-3">
                          <input
                            value={short.hint ?? ""}
                            maxLength={200}
                            onChange={(event) =>
                              editShort(questionIndex, (variant) => {
                                variant.hint = event.target.value;
                              })
                            }
                            className={inputClass}
                          />
                        </Field>
                        <Field
                          label="Đáp án được chấp nhận"
                          hint="mỗi dòng một đáp án"
                          className="mt-3"
                        >
                          <textarea
                            value={short.accepted.join("\n")}
                            rows={3}
                            maxLength={1600}
                            onChange={(event) =>
                              editShort(questionIndex, (variant) => {
                                variant.accepted = event.target.value.split("\n");
                              })
                            }
                            className={textareaClass}
                          />
                        </Field>

                        <div className="mt-4">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <p className="text-xs font-black text-ink">
                              Từ khóa cho điểm một phần
                            </p>
                            <button
                              type="button"
                              onClick={() => addKeyword(questionIndex)}
                              disabled={
                                (short.keywords?.length ?? 0) >= 10 ||
                                Boolean(busy)
                              }
                              className={smallButton}
                            >
                              + Thêm nhóm
                            </button>
                          </div>
                          <p className="mt-1 text-xs text-muted">
                            Mỗi nhóm gồm các cách viết, cách nhau dấu phẩy, và
                            điểm cộng khi khớp.
                          </p>
                          <div className="mt-2 space-y-2">
                            {(short.keywords ?? []).map((keyword, keywordIndex) => (
                              <div
                                key={keywordIndex}
                                className="grid gap-2 sm:grid-cols-[1fr_100px_auto]"
                              >
                                <input
                                  value={keyword.any.join(", ")}
                                  maxLength={400}
                                  aria-label={`Từ khóa nhóm ${keywordIndex + 1}`}
                                  placeholder="14/3, ngày 14 tháng 3"
                                  onChange={(event) =>
                                    updateKeyword(
                                      questionIndex,
                                      keywordIndex,
                                      {
                                        any: event.target.value.split(","),
                                      },
                                    )
                                  }
                                  className={inputClass}
                                />
                                <input
                                  type="number"
                                  min={1}
                                  max={20}
                                  value={keyword.points}
                                  aria-label={`Điểm nhóm ${keywordIndex + 1}`}
                                  onChange={(event) =>
                                    updateKeyword(
                                      questionIndex,
                                      keywordIndex,
                                      {
                                        points: Number(event.target.value),
                                      },
                                    )
                                  }
                                  className={inputClass}
                                />
                                <button
                                  type="button"
                                  onClick={() =>
                                    removeKeyword(
                                      questionIndex,
                                      keywordIndex,
                                    )
                                  }
                                  disabled={Boolean(busy)}
                                  className={dangerButton}
                                >
                                  Xóa
                                </button>
                              </div>
                            ))}
                          </div>
                          {keywordSum > 20 && (
                            <p className="mt-2 text-xs font-semibold text-danger">
                              Tổng điểm từ khóa ({keywordSum}) vượt quá 20
                              điểm của câu.
                            </p>
                          )}
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </details>
            </Fragment>
          );
        })}
      </section>

      <section className="card mt-5 p-5 sm:p-6">
        <h2 className="text-lg font-black text-ink">Lịch sử xuất bản</h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Khôi phục sẽ ghi đè bản nháp hiện tại; sau đó cần bấm “Xuất bản” để áp
          dụng.
        </p>

        {payload.versions.length === 0 ? (
          <p className="mt-3 text-sm text-muted">Chưa có bản xuất bản nào.</p>
        ) : (
          <ul className="mt-3 divide-y divide-line">
            {payload.versions.map((version) => (
              <li
                key={version.id}
                className="flex flex-wrap items-center justify-between gap-2 py-2"
              >
                <span className="text-sm font-semibold text-ink">
                  {formatDateTime(version.createdAt)}
                </span>
                <button
                  type="button"
                  onClick={() => void handleRestore(version.id)}
                  disabled={Boolean(busy)}
                  className={smallButton}
                >
                  {busy === "restore" ? "Đang khôi phục…" : "Khôi phục vào nháp"}
                </button>
              </li>
            ))}
          </ul>
        )}
      </section>

      <p className="mt-6 text-xs leading-6 text-muted">
        Chỉ admin đã đăng nhập mới sửa được nội dung. Nội dung công khai chỉ đổi
        sau khi bấm “Xuất bản”, và chỉ được xuất bản khi chưa có lượt chơi nào.
      </p>
    </div>
  );
}
