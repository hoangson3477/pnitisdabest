"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";

import { ApiError, api } from "@/lib/client";
import type { AdminAttempt } from "@/lib/types";

type AttemptsResponse = { attempts: AdminAttempt[] };

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function AdminPanel({
  initialAuthed,
}: {
  initialAuthed: boolean;
}) {
  const [authed, setAuthed] = useState(initialAuthed);
  const [password, setPassword] = useState("");
  const [attempts, setAttempts] = useState<AdminAttempt[]>([]);
  const [loading, setLoading] = useState(initialAuthed);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [resetText, setResetText] = useState("");
  const [showReset, setShowReset] = useState(false);

  const handleAuthError = useCallback((caught: unknown) => {
    if (caught instanceof ApiError && caught.status === 401) {
      setAuthed(false);
      setError("Phiên đăng nhập đã hết hạn. Đăng nhập lại nhé.");
      return;
    }
    setError(
      caught instanceof Error ? caught.message : "Có lỗi xảy ra. Thử lại nhé.",
    );
  }, []);

  const load = useCallback(async () => {
    try {
      const data = await api<AttemptsResponse>("/api/admin/attempts");
      setAttempts(data.attempts);
      setError("");
    } catch (caught) {
      handleAuthError(caught);
    } finally {
      setLoading(false);
    }
  }, [handleAuthError]);

  useEffect(() => {
    if (!authed) return;

    // Chờ render xong mới tải danh sách, tránh setState đồng bộ trong effect.
    const timer = window.setTimeout(() => void load(), 0);
    return () => window.clearTimeout(timer);
  }, [authed, load]);

  async function handleLogin(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (busy) return;

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api("/api/admin/login", {
        method: "POST",
        body: JSON.stringify({ password }),
      });
      setPassword("");
      setLoading(true);
      setAuthed(true);
    } catch (caught) {
      setError(
        caught instanceof Error
          ? caught.message
          : "Không đăng nhập được. Thử lại nhé.",
      );
    } finally {
      setBusy(false);
    }
  }

  async function handleLogout() {
    setBusy(true);
    try {
      await api("/api/admin/logout", { method: "POST" });
      setAuthed(false);
      setAttempts([]);
      setPassword("");
      setError("");
      setNotice("");
    } catch (caught) {
      handleAuthError(caught);
    } finally {
      setBusy(false);
    }
  }

  async function handleDelete(attempt: AdminAttempt) {
    if (
      !window.confirm(
        `Xóa lượt chơi của "${attempt.name}" (${attempt.score} điểm)?`,
      )
    ) {
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api(`/api/admin/attempts/${attempt.id}`, { method: "DELETE" });
      setAttempts((previous) =>
        previous.filter((item) => item.id !== attempt.id),
      );
      setNotice(`Đã xóa lượt chơi của "${attempt.name}".`);
    } catch (caught) {
      handleAuthError(caught);
    } finally {
      setBusy(false);
    }
  }

  async function handleReset() {
    if (resetText !== "RESET") {
      setError('Nhập đúng chữ RESET để xác nhận xóa toàn bộ dữ liệu.');
      return;
    }

    setBusy(true);
    setError("");
    setNotice("");

    try {
      await api("/api/admin/reset", {
        method: "POST",
        body: JSON.stringify({ confirm: "RESET" }),
      });
      setAttempts([]);
      setResetText("");
      setShowReset(false);
      setNotice("Đã reset toàn bộ lượt chơi và câu trả lời.");
    } catch (caught) {
      handleAuthError(caught);
    } finally {
      setBusy(false);
    }
  }

  if (!authed) {
    return (
      <section className="mx-auto mt-10 max-w-md">
        <h1 className="text-3xl font-black text-ink">Đăng nhập quản trị</h1>
        <p className="mt-2 text-sm leading-7 text-muted">
          Dùng mật khẩu đã đặt trong biến môi trường ADMIN_PASSWORD.
        </p>

        <form onSubmit={handleLogin} className="card mt-6 p-5 sm:p-6">
          <label
            htmlFor="admin-password"
            className="block text-sm font-black text-ink"
          >
            Mật khẩu
          </label>
          <input
            id="admin-password"
            type="password"
            value={password}
            onChange={(event) => setPassword(event.target.value)}
            autoFocus
            autoComplete="current-password"
            className="mt-2 h-14 w-full rounded-2xl border border-line bg-cream px-4 text-lg font-semibold text-ink outline-none"
          />

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
            disabled={busy || password.length === 0}
            className="btn-primary mt-5 w-full"
          >
            {busy ? "Đang kiểm tra…" : "Đăng nhập"}
          </button>
        </form>
      </section>
    );
  }

  const finishedCount = attempts.filter((attempt) => attempt.finished_at).length;

  return (
    <section>
      <div className="mt-3 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-ink">Quản trị dữ liệu</h1>
          <p className="mt-1 text-sm text-muted">
            {attempts.length} lượt chơi · {finishedCount} đã hoàn thành
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link href="/admin/content" className="btn-primary">
            Sửa nội dung
          </Link>
          <button
            type="button"
            onClick={() => {
              setLoading(true);
              void load();
            }}
            disabled={busy || loading}
            className="btn-secondary"
          >
            {loading ? "Đang tải…" : "Làm mới"}
          </button>
          <button
            type="button"
            onClick={() => void handleLogout()}
            disabled={busy}
            className="btn-secondary"
          >
            Đăng xuất
          </button>
        </div>
      </div>

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

      <div className="card mt-5 overflow-hidden">
        {attempts.length === 0 ? (
          <p className="p-6 text-center text-sm text-muted">
            {loading ? "Đang tải danh sách…" : "Chưa có lượt chơi nào."}
          </p>
        ) : (
          <ul className="divide-y divide-line">
            {attempts.map((attempt) => (
              <li
                key={attempt.id}
                className="flex flex-wrap items-center gap-3 p-4"
              >
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-black text-ink">
                    {attempt.name}
                  </p>
                  <p className="mt-1 text-xs text-muted">
                    Bắt đầu {formatTime(attempt.started_at)}
                    {attempt.finished_at
                      ? ` · Xong ${formatTime(attempt.finished_at)}`
                      : " · Chưa hoàn thành"}
                  </p>
                </div>
                <p className="text-lg font-black text-ink">
                  {attempt.score}
                  <span className="ml-1 text-xs font-bold text-muted">điểm</span>
                </p>
                <button
                  type="button"
                  onClick={() => void handleDelete(attempt)}
                  disabled={busy}
                  aria-label={`Xóa lượt chơi của ${attempt.name}`}
                  className="rounded-xl border border-danger/30 bg-danger-soft px-3 py-2 text-xs font-black text-danger hover:bg-danger/10 disabled:opacity-50"
                >
                  Xóa
                </button>
              </li>
            ))}
          </ul>
        )}
      </div>

      <div className="card mt-6 border-danger/30 p-5">
        <h2 className="text-lg font-black text-danger">Xóa toàn bộ dữ liệu</h2>
        <p className="mt-2 text-sm leading-7 text-muted">
          Dùng trước khi bắt đầu ngày hội hoặc khi cần chạy lại từ đầu. Thao
          tác này xóa mọi lượt chơi và câu trả lời, không thể hoàn tác.
        </p>

        {showReset ? (
          <div className="mt-4">
            <label
              htmlFor="reset-confirm"
              className="block text-sm font-black text-ink"
            >
              Nhập <span className="text-danger">RESET</span> để xác nhận
            </label>
            <input
              id="reset-confirm"
              value={resetText}
              onChange={(event) => setResetText(event.target.value)}
              autoComplete="off"
              className="mt-2 h-12 w-full rounded-2xl border border-line bg-cream px-4 text-base font-semibold text-ink outline-none"
            />
            <div className="mt-3 flex flex-col gap-2 sm:flex-row">
              <button
                type="button"
                onClick={() => void handleReset()}
                disabled={busy || resetText !== "RESET"}
                className="rounded-2xl bg-danger px-4 py-3 text-sm font-black text-white hover:opacity-90 disabled:opacity-50"
              >
                {busy ? "Đang xóa…" : "Xóa toàn bộ dữ liệu"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowReset(false);
                  setResetText("");
                }}
                disabled={busy}
                className="btn-secondary"
              >
                Hủy
              </button>
            </div>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => {
              setShowReset(true);
              setError("");
              setNotice("");
            }}
            className="mt-4 rounded-2xl border border-danger/40 px-4 py-3 text-sm font-black text-danger hover:bg-danger-soft"
          >
            Reset dữ liệu
          </button>
        )}
      </div>

      <p className="mt-6 text-xs leading-6 text-muted">
        Trang này không được liên kết công khai. Đừng chia sẻ URL /admin hoặc
        mật khẩu quản trị cho người chơi.
      </p>
    </section>
  );
}
