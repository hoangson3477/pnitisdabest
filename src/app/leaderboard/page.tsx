import type { Metadata } from "next";
import Link from "next/link";

import LeaderboardView from "@/components/leaderboard-view";
import { getSiteContent } from "@/lib/content";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Bảng xếp hạng",
};

export default async function LeaderboardPage() {
  const { club } = await getSiteContent();

  return (
    <div className="min-h-dvh">
      <header className="mx-auto flex max-w-3xl items-center justify-between gap-4 px-5 py-5">
        <Link href="/" className="flex items-center gap-3 rounded-xl">
          <span className="grid h-10 w-10 place-items-center rounded-xl bg-ink text-xs font-black text-cream">
            {club.monogram}
          </span>
          <span className="text-sm font-black text-ink">{club.name}</span>
        </Link>
        <Link
          href="/play"
          className="rounded-xl bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-dark"
        >
          Chơi ngay
        </Link>
      </header>

      <main className="mx-auto max-w-3xl px-5 pb-16">
        <p className="pill">Bảng xếp hạng</p>
        <h1 className="mt-4 text-4xl font-black leading-tight text-ink">
          Ai hiểu CLB nhất?
        </h1>
        <p className="mt-3 max-w-xl text-base leading-7 text-muted">
          Xếp theo điểm cao nhất, cùng điểm thì ai hoàn thành sớm hơn đứng
          trước. Bảng tự cập nhật khi tab này đang mở.
        </p>

        <LeaderboardView />

        <Link href="/" className="btn-secondary mt-6 w-full">
          Về trang chủ
        </Link>
      </main>
    </div>
  );
}
