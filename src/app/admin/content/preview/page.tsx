import type { Metadata } from "next";
import Link from "next/link";
import { Fragment } from "react";
import { redirect } from "next/navigation";

import StoryScene from "@/components/story-scene";
import { isAdmin } from "@/lib/auth";
import { getDraftContent } from "@/lib/content";
import type { Variant } from "@/lib/types";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Xem trước nội dung",
  robots: { index: false, follow: false },
};

function VariantPreview({ variant }: { variant: Variant }) {
  if (variant.type === "true_false") {
    return (
      <div className="rounded-2xl border border-line bg-cream/60 p-3">
        <p className="text-xs font-black text-brand">
          Đúng / Sai · {variant.points} điểm
        </p>
        <p className="mt-1 text-sm leading-6 text-ink">{variant.statement}</p>
        <p className="mt-1 text-xs font-black text-success">
          Đáp án: {variant.answer ? "Đúng" : "Sai"}
        </p>
      </div>
    );
  }

  if (variant.type === "choice") {
    return (
      <div className="rounded-2xl border border-line bg-cream/60 p-3">
        <p className="text-xs font-black text-brand">
          Trắc nghiệm · {variant.points} điểm
        </p>
        <ul className="mt-2 grid gap-1">
          {variant.options.map((option, index) => (
            <li
              key={index}
              className={`rounded-xl border px-3 py-2 text-sm ${
                index === variant.answerIndex
                  ? "border-success/40 bg-success-soft font-black text-success"
                  : "border-line bg-paper text-ink"
              }`}
            >
              {String.fromCharCode(65 + index)}. {option}
              {index === variant.answerIndex ? " · đáp án đúng" : ""}
            </li>
          ))}
        </ul>
      </div>
    );
  }

  return (
    <div className="rounded-2xl border border-line bg-cream/60 p-3">
      <p className="text-xs font-black text-brand">
        Tự luận ngắn · {variant.points} điểm
      </p>
      {variant.hint && (
        <p className="mt-1 text-xs text-muted">Gợi ý: {variant.hint}</p>
      )}
      <p className="mt-2 text-xs font-black text-ink">
        Đáp án chấp nhận:
      </p>
      <ul className="mt-1 grid gap-1">
        {variant.accepted.map((answer, index) => (
          <li key={index} className="text-sm leading-6 text-ink">
            • {answer}
          </li>
        ))}
      </ul>
      {variant.keywords && variant.keywords.length > 0 && (
        <p className="mt-2 text-xs leading-5 text-muted">
          Từ khóa:{" "}
          {variant.keywords
            .map(
              (keyword) =>
                `${keyword.any.join(" / ")} (+${keyword.points})`,
            )
            .join(", ")}
        </p>
      )}
    </div>
  );
}

export default async function AdminContentPreviewPage() {
  let authed = false;

  try {
    authed = await isAdmin();
  } catch {
    authed = false;
  }

  if (!authed) redirect("/admin");

  const { data, updatedAt } = await getDraftContent();
  const { club, stages, questions } = data;

  return (
    <main className="mx-auto min-h-dvh max-w-4xl px-5 py-8">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.2em] text-brand">
            Xem trước bản nháp
          </p>
          <h1 className="mt-2 text-3xl font-black text-ink">{club.name}</h1>
          <p className="mt-1 text-sm text-muted">
            {updatedAt
              ? `Bản nháp lưu lúc ${new Date(updatedAt).toLocaleString("vi-VN")}`
              : "Chưa có bản nháp lưu — đang xem nội dung mẫu hoặc bản đã xuất bản."}
          </p>
        </div>
        <Link href="/admin/content" className="btn-secondary">
          ← Sửa nội dung
        </Link>
      </div>

      <section className="card mt-5 p-5 sm:p-6">
        <p className="pill">{club.eventNote}</p>
        <p className="mt-3 text-lg font-black text-ink">{club.tagline}</p>
        <p className="mt-2 text-sm leading-7 text-muted">{club.description}</p>
        <p className="mt-2 text-xs font-semibold text-muted">{club.playNote}</p>

        <dl className="mt-4 grid grid-cols-3 gap-2">
          {club.stats.map((stat, index) => (
            <div
              key={index}
              className="rounded-xl border border-line bg-cream px-3 py-2 text-center"
            >
              <dt className="text-[11px] font-semibold text-muted">
                {stat.label}
              </dt>
              <dd className="text-lg font-black text-brand">{stat.value}</dd>
            </div>
          ))}
        </dl>

        <h2 className="mt-6 text-sm font-black text-ink">Thẻ ôn nhanh</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-2">
          {club.theory.map((card, index) => (
            <article
              key={index}
              className="rounded-2xl border border-line bg-cream/60 p-3"
            >
              <p className="text-xs font-black text-brand">Thẻ {index + 1}</p>
              <p className="mt-1 text-sm font-black text-ink">{card.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">{card.body}</p>
            </article>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-black text-ink">Thế mạnh</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {club.strengths.map((item, index) => (
            <article
              key={index}
              className="rounded-2xl border border-line bg-cream/60 p-3"
            >
              <p className="text-sm font-black text-ink">{item.title}</p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {item.description}
              </p>
            </article>
          ))}
        </div>

        <h2 className="mt-6 text-sm font-black text-ink">Hoạt động</h2>
        <div className="mt-2 grid gap-2 sm:grid-cols-3">
          {club.activities.map((activity, index) => (
            <article
              key={index}
              className="rounded-2xl border border-line bg-cream/60 p-3"
            >
              <p className="text-[11px] font-black uppercase tracking-wide text-brand">
                {activity.time}
              </p>
              <p className="mt-1 text-sm font-black text-ink">
                {activity.title}
              </p>
              <p className="mt-1 text-xs leading-5 text-muted">
                {activity.description}
              </p>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-black text-ink">
          Chặng truyện ({stages.length})
        </h2>
        <p className="mt-1 text-xs leading-5 text-muted">
          Mỗi chặng gồm 1–6 lời thoại, hiện trước 4 câu hỏi của chặng đó.
        </p>

        <div className="mt-3 grid gap-4">
          {stages.map((stage, index) => (
            <article key={stage.id} className="card p-4 sm:p-5">
              <p className="text-xs font-black uppercase tracking-wide text-brand">
                Chặng {index + 1} · {stage.id}
              </p>
              <h3 className="mt-1 text-lg font-black text-ink">
                {stage.title}
              </h3>
              <StoryScene
                stage={stage}
                label={`Chặng ${index + 1}`}
                className="mt-3 h-52 sm:h-64"
              />
              <div className="mt-3 grid gap-2">
                {stage.lines.map((line, lineIndex) => (
                  <div
                    key={lineIndex}
                    className="rounded-xl border border-line bg-cream/60 px-3 py-2"
                  >
                    <p className="text-[11px] font-black uppercase tracking-wide text-brand">
                      {line.speaker}
                    </p>
                    <p className="mt-1 text-sm leading-6 text-ink">
                      {line.text}
                    </p>
                    {line.image && (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img
                        src={line.image}
                        alt=""
                        className="mt-2 max-h-56 w-auto max-w-full rounded-lg border border-line object-contain"
                      />
                    )}
                  </div>
                ))}
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="mt-6">
        <h2 className="text-lg font-black text-ink">
          Câu hỏi ({questions.length})
        </h2>
        <p className="mt-1 text-xs text-muted">
          Đây là bản xem trước đầy đủ, bao gồm đáp án. Không chia sẻ trang này.
        </p>

        {questions.map((question, index) => {
          const stageIndex = Math.floor(index / 4);
          const stage = stages[stageIndex];

          return (
            <Fragment key={question.id}>
              {index % 4 === 0 && (
                <h3 className="mt-6 text-sm font-black uppercase tracking-wide text-brand">
                  Chặng {stageIndex + 1}
                  {stage?.title ? ` · ${stage.title}` : ""}
                </h3>
              )}
              <article className="card mt-4 p-5 sm:p-6">
                <p className="text-xs font-black uppercase tracking-wide text-brand">
                  Câu {index + 1} · {question.id}
                </p>
                <h3 className="mt-2 text-lg font-black leading-snug text-ink">
                  {question.prompt}
                </h3>
                <p className="mt-2 text-sm leading-6 text-muted">
                  {question.explanation}
                </p>
                <div className="mt-3 grid gap-2">
                  {question.variants.map((variant) => (
                    <VariantPreview key={variant.type} variant={variant} />
                  ))}
                </div>
              </article>
            </Fragment>
          );
        })}
      </section>

      <Link href="/admin/content" className="btn-secondary mt-6 w-full">
        ← Về trang sửa nội dung
      </Link>
    </main>
  );
}
