import Link from "next/link";

import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

const FANPAGE_URL = "https://www.facebook.com/PNITClub";

export default async function Home() {
  const { club, stages, questions } = await getSiteContent();
  const gameStats = [
    { value: String(stages.length), label: "chặng" },
    { value: String(questions.length), label: "câu hỏi" },
    { value: "7–10", label: "phút" },
  ];

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="flex items-center gap-3 rounded-xl">
          <span className="grid h-11 w-11 shrink-0 place-items-center overflow-hidden rounded-2xl border border-line bg-paper shadow-xs">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src="/pnit-logo.jpg"
              alt={`Logo ${club.name}`}
              className="h-full w-full object-cover"
            />
          </span>
          <span>
            <span className="block text-sm font-black text-ink">{club.name}</span>
            <span className="block text-xs font-medium text-muted">Hành trình khám phá CLB</span>
          </span>
        </Link>
        <Link
          href="/leaderboard"
          className="rounded-xl px-3 py-2 text-sm font-bold text-ink hover:bg-brand-soft"
        >
          Bảng xếp hạng
        </Link>
      </header>

      <main className="mx-auto max-w-6xl px-5 pb-16">
        <section className="grid items-center gap-10 pb-16 pt-4 lg:grid-cols-[1.05fr_.95fr] lg:pt-10">
          <div>
            <p className="pill">{club.eventNote}</p>
            <h1 className="mt-5 max-w-2xl text-4xl font-black leading-[1.06] tracking-tight text-ink sm:text-6xl">
              Theo chân Milu khám phá {club.monogram}
            </h1>
            <p className="mt-5 max-w-xl text-base leading-8 text-muted sm:text-lg">
              Một chuyến xe bus, một buổi sinh hoạt ở Phòng tin học số 3 và 20
              câu hỏi trên hành trình Milu tìm câu lạc bộ của mình. {club.description}
            </p>

            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <Link href="/play" className="btn-primary text-lg">
                Chơi ngay <span aria-hidden="true">→</span>
              </Link>
              <Link href="/leaderboard" className="btn-secondary">
                Xem bảng xếp hạng
              </Link>
            </div>
            <p className="mt-3 text-sm font-medium text-muted">{club.playNote}</p>

            <dl className="mt-8 grid grid-cols-3 gap-3">
              {gameStats.map((stat) => (
                <div
                  key={stat.label}
                  className="rounded-2xl border border-line bg-paper/80 px-3 py-4 text-center"
                >
                  <dt className="sr-only">{stat.label}</dt>
                  <dd>
                    <span className="block text-2xl font-black text-brand">
                      {stat.value}
                    </span>
                    <span className="mt-1 block text-xs font-semibold text-muted">
                      {stat.label}
                    </span>
                  </dd>
                </div>
              ))}
            </dl>
          </div>

          <div>
            <div className="card overflow-hidden p-2">
              <div className="flex flex-col gap-2 sm:flex-row">
                <div
                  role="img"
                  aria-label={`Minh họa màu sắc của ${club.name}`}
                  className="aspect-[4/3] min-w-0 flex-1 rounded-[1.35rem] bg-cover bg-center"
                  style={{ backgroundImage: `url(${club.coverImage})` }}
                />
                <a
                  href={FANPAGE_URL}
                  target="_blank"
                  rel="noreferrer"
                  className="flex shrink-0 items-center justify-center gap-3 rounded-[1.35rem] bg-brand-soft/60 p-3 transition hover:bg-brand-soft sm:w-[150px] sm:flex-col sm:gap-2 sm:p-4 sm:text-center"
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src="/pnit-fanpage-qr.png"
                    alt="Mã QR fanpage PNIT"
                    className="h-20 w-20 shrink-0 rounded-lg bg-white p-1 sm:h-24 sm:w-24"
                  />
                  <span>
                    <span className="block text-[11px] font-black uppercase tracking-wide text-brand">
                      Fanpage
                    </span>
                    <span className="mt-0.5 block text-sm font-black leading-tight text-ink">
                      Theo dõi PNIT
                    </span>
                    <span className="mt-1 block text-xs font-medium text-muted">
                      Quét mã QR
                    </span>
                  </span>
                </a>
              </div>
            </div>
            <div className="card relative z-10 mx-4 -mt-7 p-4 sm:mx-8">
              <p className="text-sm font-black text-ink">
                {stages.length} chặng · {questions.length} câu hỏi
              </p>
              <p className="mt-1 text-sm leading-6 text-muted">
                Mỗi câu tự chọn Đúng/Sai, trắc nghiệm hoặc tự luận ngắn để nhận
                điểm cao hơn.
              </p>
            </div>
          </div>
        </section>

        <section className="py-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brand">
            Thế mạnh
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight text-ink sm:text-4xl">
            Một CLB làm được nhiều hơn bạn nghĩ
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {club.strengths.map((item, index) => (
              <article key={item.title} className="card p-6">
                <span className="text-sm font-black text-brand">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <h3 className="mt-4 text-xl font-black text-ink">{item.title}</h3>
                <p className="mt-2 text-sm leading-7 text-muted">
                  {item.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="my-10 rounded-[2rem] bg-ink px-5 py-8 text-cream sm:px-8 sm:py-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-orange-300">
            Hoạt động nổi bật
          </p>
          <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
            Học từ việc thật, làm từ ý tưởng thật
          </h2>
          <div className="mt-7 grid gap-4 md:grid-cols-3">
            {club.activities.map((activity) => (
              <article
                key={activity.title}
                className="rounded-2xl border border-white/15 bg-white/5 p-5"
              >
                <p className="text-xs font-bold uppercase tracking-wider text-orange-300">
                  {activity.time}
                </p>
                <h3 className="mt-3 text-lg font-black">{activity.title}</h3>
                <p className="mt-2 text-sm leading-7 text-cream/75">
                  {activity.description}
                </p>
              </article>
            ))}
          </div>
        </section>

        <section className="grid gap-8 py-10 lg:grid-cols-[.9fr_1.1fr] lg:items-center">
          <div>
            <p className="text-sm font-black uppercase tracking-[0.2em] text-brand">
              Ôn nhanh
            </p>
            <h2 className="mt-3 text-3xl font-black leading-tight text-ink sm:text-4xl">
              Chơi mà vẫn học được điều mới
            </h2>
            <p className="mt-4 max-w-lg text-base leading-8 text-muted">
              Muốn nắm nhanh thông tin trước khi chơi? Lướt qua vài thẻ tóm tắt
              ngay tại đây. Hoàn toàn không bắt buộc — bạn có thể vào truyện
              ngay và quay lại đọc sau.
            </p>
            <Link href="/play" className="btn-primary mt-6">
              Vào truyện ngay
            </Link>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            {club.theory.map((card, index) => (
              <article key={card.title} className="card p-5">
                <span className="text-xs font-black text-brand">
                  Thẻ {index + 1}
                </span>
                <h3 className="mt-2 text-base font-black text-ink">{card.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted">{card.body}</p>
              </article>
            ))}
          </div>
        </section>

        <section className="card mt-6 flex flex-col items-center gap-4 p-7 text-center sm:p-10">
          <p className="text-sm font-black uppercase tracking-[0.2em] text-brand">
            Sẵn sàng chưa?
          </p>
          <h2 className="max-w-2xl text-3xl font-black leading-tight text-ink sm:text-4xl">
            Bạn hiểu {club.monogram} đến đâu?
          </h2>
          <p className="max-w-xl text-sm leading-7 text-muted">
            {stages.length} chặng, {questions.length} câu hỏi, khoảng 7–10 phút.
            Điểm càng cao, thứ hạng càng đẹp — và bạn sẽ hiểu hơn về {club.name}.
          </p>
          <Link href="/play" className="btn-primary text-lg">
            Chơi ngay
          </Link>
          <a href="https://docs.google.com/forms/d/e/1FAIpQLSeKfDNfWmYWHJ2uEBlFG0iPUHCN1DNRO6qBxttccCexERyUxw/viewform" target="_blank" rel="noreferrer" className="btn-secondary">
            Đăng ký tham gia PNIT
          </a>
        </section>
      </main>

      <footer className="border-t border-line/80 px-5 py-8">
        <div className="mx-auto flex max-w-6xl flex-col gap-2 text-sm text-muted sm:flex-row sm:items-center sm:justify-between">
          <p className="font-semibold text-ink">
            {club.name} · {club.tagline}
          </p>
          <p>Hành trình khám phá CLB · {club.eventNote}</p>
        </div>
      </footer>
    </div>
  );
}
