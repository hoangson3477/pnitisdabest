"use client";

import Link from "next/link";
import {
  useCallback,
  useEffect,
  useState,
  type ReactNode,
} from "react";

import StoryScene from "@/components/story-scene";
import type { StoryStage } from "@/lib/types";

const AUTO_DELAY_MS = 4200;
const TOOL_CLASS =
  "inline-flex h-8 items-center gap-1.5 rounded px-2 text-[10px] font-black uppercase tracking-wide transition-colors hover:bg-white/10 hover:text-white sm:text-[11px]";

const ICONS: Record<"eye" | "list" | "play" | "quit", ReactNode> = {
  eye: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="M2.5 12S6 6.5 12 6.5 21.5 12 21.5 12 18 17.5 12 17.5 2.5 12 2.5 12Z" />
      <circle cx="12" cy="12" r="2.5" />
    </svg>
  ),
  list: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-3.5 w-3.5"
    >
      <path d="M4 6h16M4 12h16M4 18h10" />
    </svg>
  ),
  play: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinejoin="round"
      className="h-3.5 w-3.5"
    >
      <path d="m8 5 11 7-11 7V5Z" />
    </svg>
  ),
  quit: (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      className="h-3.5 w-3.5"
    >
      <path d="M6 6l12 12M18 6 6 18" />
    </svg>
  ),
};

function ToolButton({
  label,
  icon,
  active,
  onClick,
}: {
  label: string;
  icon: ReactNode;
  active?: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={`${TOOL_CLASS} ${
        active ? "bg-white/15 text-white" : "text-white/70"
      }`}
    >
      <span aria-hidden="true">{icon}</span>
      {label}
    </button>
  );
}

export default function StoryPlayer({
  stage,
  stageIndex,
  totalStages,
  badge,
  onFinish,
}: {
  stage: StoryStage;
  stageIndex: number;
  totalStages: number;
  badge?: string;
  onFinish: () => void;
}) {
  const [lineIndex, setLineIndex] = useState(0);
  const [hidden, setHidden] = useState(false);
  const [showLog, setShowLog] = useState(false);
  const [auto, setAuto] = useState(false);

  const line = stage.lines[lineIndex] ?? stage.lines[0];
  const isLast = lineIndex >= stage.lines.length - 1;
  const badgeText =
    badge ?? `Chặng ${stageIndex + 1}/${totalStages} · ${stage.title}`;

  const advance = useCallback(() => {
    if (hidden) {
      setHidden(false);
      return;
    }
    if (isLast) {
      setAuto(false);
      onFinish();
      return;
    }
    setLineIndex((current) => Math.min(current + 1, stage.lines.length - 1));
  }, [hidden, isLast, onFinish, stage.lines.length]);

  useEffect(() => {
    if (!auto || hidden || showLog) return;
    const timer = window.setTimeout(advance, AUTO_DELAY_MS);
    return () => window.clearTimeout(timer);
  }, [advance, auto, hidden, showLog]);

  useEffect(() => {
    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setShowLog(false);
        return;
      }
      if (showLog || event.repeat) return;
      if (
        event.key !== " " &&
        event.key !== "Enter" &&
        event.key !== "ArrowRight"
      ) {
        return;
      }

      const target = event.target;
      if (
        target instanceof HTMLElement &&
        target.closest("button, a, input, textarea, select")
      ) {
        return;
      }

      event.preventDefault();
      advance();
    }

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [advance, showLog]);

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = previous;
    };
  }, []);

  if (!line) return null;

  return (
    <section
      className="relative flex h-dvh w-full flex-col overflow-hidden bg-[#0b0d14] text-cream"
      aria-label={badge ?? `Chặng ${stageIndex + 1}: ${stage.title}`}
    >
      <div className="relative min-h-0 flex-1">
        <StoryScene
          stage={stage}
          fullBleed
          showPortrait={!line.image}
          className="h-full w-full"
        />

        <button
          type="button"
          onClick={advance}
          aria-label={
            hidden
              ? "Hiện lời thoại"
              : isLast
                ? "Vào câu hỏi"
                : "Tiếp tục lời thoại"
          }
          className="absolute inset-0 z-10 cursor-pointer"
        />

        {line.image && (
          <div className="pointer-events-none absolute inset-0 z-20 flex items-center justify-center p-4 pt-14 sm:p-8 sm:pt-16">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={line.image}
              alt=""
              className="max-h-full max-w-full rounded-xl border border-white/20 object-contain shadow-2xl"
            />
          </div>
        )}

        <div className="pointer-events-none absolute left-3 top-3 z-30 max-w-[85vw] truncate rounded-full border border-white/10 bg-black/55 px-3 py-1.5 text-[10px] font-black uppercase tracking-[0.16em] text-white/75 backdrop-blur sm:left-5 sm:top-5">
          {badgeText}
        </div>
      </div>

      {hidden ? (
        <button
          type="button"
          onClick={() => setHidden(false)}
          className="absolute bottom-14 left-1/2 z-30 -translate-x-1/2 rounded-full border border-white/15 bg-black/70 px-4 py-2 text-xs font-bold text-white/80 shadow-lg backdrop-blur hover:bg-black/85 hover:text-white"
        >
          Nhấn để hiện lời thoại
        </button>
      ) : (
        <div className="relative z-30 h-[28dvh] max-h-[280px] min-h-[160px] shrink-0 border-y border-white/15 bg-[#17131c]/95 shadow-[0_-24px_60px_rgba(0,0,0,.55)] backdrop-blur-sm">
          <div className="relative mx-auto flex h-full max-w-5xl flex-col px-4 py-3 sm:px-8 sm:py-5">
            <button
              type="button"
              onClick={advance}
              aria-label={isLast ? "Vào câu hỏi" : "Tiếp tục lời thoại"}
              className="absolute inset-0 z-0 cursor-pointer"
            />
            <div className="relative z-10 flex min-h-0 flex-1 flex-col">
              <p className="shrink-0 text-base font-semibold tracking-wide text-violet-300 sm:text-lg">
                {line.speaker}
              </p>
              <p
                aria-live="polite"
                className="pointer-events-auto mt-1 min-h-0 flex-1 overflow-y-auto text-lg leading-snug text-[#f7f0e6] sm:text-2xl sm:leading-relaxed"
              >
                {line.text}
              </p>
              <div className="mt-2 flex shrink-0 justify-end">
                <button
                  type="button"
                  onClick={advance}
                  className="inline-flex items-center gap-1.5 rounded-full border border-white/20 px-3 py-1.5 text-[10px] font-black uppercase tracking-wide text-white/75 transition-colors hover:border-white/40 hover:bg-white/10 hover:text-white sm:text-[11px]"
                >
                  {isLast ? "Vào câu hỏi" : "Tiếp tục"}
                  <span aria-hidden="true" className="animate-pulse">
                    ▼
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="relative z-40 flex h-11 shrink-0 items-center justify-center gap-1 border-t border-white/10 bg-black/90 px-2 sm:gap-2">
        <ToolButton
          label={hidden ? "Hiện" : "Ẩn"}
          icon={ICONS.eye}
          onClick={() => setHidden((value) => !value)}
        />
        <ToolButton
          label="Nhật ký"
          icon={ICONS.list}
          onClick={() => setShowLog(true)}
        />
        <ToolButton
          label="Tự động"
          icon={ICONS.play}
          active={auto}
          onClick={() => setAuto((value) => !value)}
        />
        <Link href="/" className={`${TOOL_CLASS} text-white/70`}>
          <span aria-hidden="true">{ICONS.quit}</span>
          Thoát
        </Link>
        <span className="absolute right-3 hidden text-[10px] font-semibold uppercase tracking-wide text-white/40 sm:block">
          {lineIndex + 1}/{stage.lines.length}
        </span>
      </div>

      {showLog && (
        <div className="absolute inset-0 z-50 flex items-end justify-center sm:items-center">
          <button
            type="button"
            aria-label="Đóng nhật ký"
            onClick={() => setShowLog(false)}
            className="absolute inset-0 bg-black/70"
          />
          <div className="relative flex max-h-[82dvh] w-full max-w-2xl flex-col overflow-hidden rounded-t-2xl border border-white/15 bg-[#17131c] shadow-2xl sm:rounded-2xl">
            <div className="flex shrink-0 items-center justify-between gap-4 border-b border-white/10 px-4 py-3">
              <p className="text-xs font-black uppercase tracking-[0.16em] text-violet-300">
                Nhật ký · {badge ?? `Chặng ${stageIndex + 1}`}
              </p>
              <button
                type="button"
                autoFocus
                onClick={() => setShowLog(false)}
                className="rounded-lg px-2 py-1 text-xs font-bold text-white/70 hover:bg-white/10 hover:text-white"
              >
                Đóng
              </button>
            </div>
            <div className="overscroll-contain overflow-y-auto px-4 py-2">
              {stage.lines.slice(0, lineIndex + 1).map((item, index) => (
                <div
                  key={`${stage.id}-log-${index}`}
                  className="border-b border-white/10 py-3 last:border-0"
                >
                  <p className="text-[11px] font-black uppercase tracking-wide text-violet-300">
                    {item.speaker}
                  </p>
                  <p className="mt-1 text-sm leading-6 text-cream/90">
                    {item.text}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
