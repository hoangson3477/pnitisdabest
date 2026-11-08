"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

import { api } from "@/lib/client";
import type { LeaderboardEntry, LeaderboardResponse } from "@/lib/types";

const ATTEMPT_KEY = "clb_quiz_attempt";
const POLL_MS = 8000;

function rankStyle(rank: number) {
  if (rank === 1) return "bg-brand text-white";
  if (rank === 2) return "bg-ink text-cream";
  if (rank === 3) return "bg-teal text-white";
  return "bg-cream text-muted";
}

function Row({
  entry,
  highlight,
}: {
  entry: LeaderboardEntry;
  highlight: boolean;
}) {
  return (
    <li
      className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${
        highlight
          ? "border-brand bg-brand-soft"
          : "border-line bg-paper"
      }`}
    >
      <span
        className={`grid h-9 w-9 shrink-0 place-items-center rounded-full text-sm font-black ${rankStyle(entry.rank)}`}
      >
        {entry.rank}
      </span>
      <span className="min-w-0 flex-1 truncate text-sm font-bold text-ink">
        {entry.name}
        {highlight && (
          <span className="ml-2 text-xs font-black text-brand">Bạn</span>
        )}
      </span>
      <span className="shrink-0 text-lg font-black text-ink">
        {entry.score}
        <span className="ml-1 text-xs font-bold text-muted">điểm</span>
      </span>
    </li>
  );
}

export default function LeaderboardView() {
  const [data, setData] = useState<LeaderboardResponse | null>(null);
  const [meId, setMeId] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const inFlight = useRef(false);

  const load = useCallback(async () => {
    if (inFlight.current) return;
    inFlight.current = true;

    let attemptId = "";
    try {
      attemptId = window.localStorage.getItem(ATTEMPT_KEY) ?? "";
    } catch {
      // localStorage bị chặn: vẫn xem được bảng, chỉ không thấy dòng "Bạn".
    }

    try {
      const response = await api<LeaderboardResponse>(
        `/api/leaderboard${
          attemptId ? `?attemptId=${encodeURIComponent(attemptId)}` : ""
        }`,
      );
      setData(response);
      setMeId(attemptId);
      setError("");
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không tải được bảng xếp hạng.",
      );
    } finally {
      inFlight.current = false;
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();

    const timer = window.setInterval(() => {
      if (document.visibilityState === "visible") void load();
    }, POLL_MS);

    const onVisibility = () => {
      if (document.visibilityState === "visible") void load();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      window.clearInterval(timer);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [load]);

  const top = data?.top ?? [];
  const me = data?.me ?? null;
  const meInTop = Boolean(me && top.some((entry) => entry.id === me.id));

  if (loading && !data) {
    return (
      <div className="card mt-6 p-6 text-center sm:p-8">
        <p className="text-lg font-black text-ink">Đang tải bảng xếp hạng…</p>
        <p className="mt-2 text-sm text-muted">Chỉ mất vài giây.</p>
      </div>
    );
  }

  if (error && !data) {
    return (
      <div className="card mt-6 p-6 text-center sm:p-8">
        <p className="pill">Mất kết nối</p>
        <h2 className="mt-4 text-2xl font-black text-ink">
          Chưa tải được bảng xếp hạng
        </h2>
        <p className="mt-2 text-sm leading-7 text-muted">{error}</p>
        <button
          type="button"
          onClick={() => void load()}
          className="btn-primary mt-5 w-full"
        >
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="card flex items-center justify-between gap-4 p-5">
        <div>
          <p className="text-xs font-black uppercase tracking-[0.16em] text-brand">
            Đã hoàn thành
          </p>
          <p className="mt-1 text-3xl font-black leading-none text-ink">
            {data?.total ?? 0}
            <span className="ml-2 text-sm font-bold text-muted">lượt</span>
          </p>
        </div>
        <p className="max-w-[10rem] text-right text-xs leading-5 text-muted">
          Tự làm mới mỗi 8 giây khi tab đang mở.
        </p>
      </div>

      {error && (
        <p
          role="alert"
          className="mt-4 rounded-2xl border border-warning/30 bg-warning-soft px-4 py-3 text-sm font-semibold text-warning"
        >
          {error} Đang hiển thị dữ liệu lần trước.
        </p>
      )}

      {top.length === 0 ? (
        <div className="card mt-4 p-6 text-center sm:p-8">
          <h2 className="text-2xl font-black text-ink">
            Chưa có ai hoàn thành
          </h2>
          <p className="mt-2 text-sm leading-7 text-muted">
            Bạn có thể là người đầu tiên xuất hiện trên bảng xếp hạng.
          </p>
          <Link href="/play" className="btn-primary mt-5 w-full">
            Chơi ngay
          </Link>
        </div>
      ) : (
        <ol className="mt-4 grid gap-2" aria-label="Bảng xếp hạng">
          {top.map((entry) => (
            <Row
              key={entry.id}
              entry={entry}
              highlight={entry.id === meId}
            />
          ))}
        </ol>
      )}

      {me && !meInTop && (
        <>
          <h2 className="mt-6 text-sm font-black text-ink">Vị trí của bạn</h2>
          <ol className="mt-2" aria-label="Vị trí của bạn">
            <Row entry={me} highlight />
          </ol>
        </>
      )}

      {!me && data && data.total > 0 && (
        <p className="mt-5 rounded-2xl bg-cream px-4 py-3 text-center text-sm text-muted">
          Bạn chưa hoàn thành hành trình nên chưa có thứ hạng.{" "}
          <Link href="/play" className="font-black text-brand underline">
            Chơi ngay
          </Link>
        </p>
      )}
    </div>
  );
}
