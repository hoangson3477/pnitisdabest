import type { StoryScene, StoryStage } from "@/lib/types";

export const SCENE_LABELS: Record<StoryScene, string> = {
  thought: "Suy nghĩ (nền sáng)",
  bus: "Trên xe bus",
  yard: "Sân trường",
  lab: "Phòng tin học",
  home: "Trên đường về",
};

const SCENE_STYLES: Record<StoryScene, React.CSSProperties> = {
  thought: {
    background:
      "radial-gradient(circle at 72% 26%, rgba(255,255,255,.95) 0 9%, transparent 10%), linear-gradient(180deg, #cfe8ff 0%, #e8f5ff 55%, #fff8ec 100%)",
  },
  bus: {
    background: "linear-gradient(180deg, #b9dcff 0%, #dff0ff 100%)",
  },
  yard: {
    background:
      "linear-gradient(180deg, #bfe5ff 0%, #e8f7ff 58%, #d8f0c8 59%, #b9dfa5 100%)",
  },
  lab: {
    background:
      "linear-gradient(180deg, #0b1b3a 0%, #12305e 58%, #1b4a7a 100%)",
  },
  home: {
    background:
      "linear-gradient(180deg, #ffd9a8 0%, #ffe9c9 55%, #fff8ec 100%)",
  },
};

export default function StoryScene({
  stage,
  label,
  className = "",
  fullBleed = false,
  showPortrait = true,
}: {
  stage: StoryStage;
  label?: string;
  className?: string;
  fullBleed?: boolean;
  showPortrait?: boolean;
}) {
  const isHomeScene = stage.scene === "home";
  const useCssBackground = !stage.background || (fullBleed && isHomeScene);
  const style: React.CSSProperties = useCssBackground
    ? SCENE_STYLES[stage.scene]
    : {
        backgroundImage: `linear-gradient(180deg, rgba(8,20,40,.06), rgba(8,20,40,.22)), url("${stage.background}")`,
        backgroundSize: isHomeScene ? "contain" : "cover",
        backgroundPosition: isHomeScene ? "center bottom" : "center",
        backgroundRepeat: "no-repeat",
        backgroundColor:
          stage.scene === "yard" ? "#dff3ff" : isHomeScene ? "#ffe9c9" : "#e8f5ff",
        imageRendering:
          fullBleed || stage.scene === "yard" ? "pixelated" : undefined,
      };

  return (
    <div
      role="img"
      aria-label={label ? `${label}: ${stage.title}` : stage.title}
      className={`relative ${
        fullBleed
          ? "h-full w-full"
          : "overflow-hidden rounded-3xl border border-line"
      } ${className}`}
      style={style}
    >
      <div
        className={`pointer-events-none absolute inset-0 ${
          fullBleed
            ? "bg-gradient-to-t from-black/45 via-transparent to-black/15"
            : "bg-gradient-to-t from-ink/25 via-transparent to-transparent"
        }`}
      />

      {label && !fullBleed && (
        <span className="absolute left-3 top-3 rounded-full bg-ink/80 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-cream">
          {label}
        </span>
      )}

      {!fullBleed && stage.scene === "thought" && !stage.background && (
        <div className="absolute left-[8%] top-[12%] grid h-20 w-20 place-items-center rounded-full border-4 border-white bg-paper/95 text-4xl font-black text-brand shadow-sm sm:h-24 sm:w-24">
          ?
        </div>
      )}

      {stage.scene === "lab" && !stage.background && (
        <>
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              backgroundImage:
                "repeating-linear-gradient(0deg, transparent 0 23px, rgba(120,200,255,.35) 24px), repeating-linear-gradient(90deg, transparent 0 23px, rgba(120,200,255,.2) 24px)",
            }}
          />
          {!fullBleed && (
            <span className="absolute right-3 top-3 rounded-xl border border-cyan-200/40 bg-ink/70 px-3 py-1 text-[11px] font-black uppercase tracking-wide text-cyan-100">
              Phòng tin học số 3
            </span>
          )}
        </>
      )}

      {fullBleed && isHomeScene && stage.background && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stage.background}
          alt=""
          className="pointer-events-none absolute bottom-[14%] left-[8%] h-[24%] w-auto max-w-[55%] object-contain drop-shadow-2xl sm:left-[12%] sm:h-[28%]"
          style={{ imageRendering: "pixelated" }}
        />
      )}

      {showPortrait && stage.portrait && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={stage.portrait}
          alt=""
          className={
            fullBleed
              ? "pointer-events-none absolute bottom-[-6%] left-1/2 h-[82%] w-auto max-w-[92vw] -translate-x-1/2 object-contain drop-shadow-2xl"
              : `absolute bottom-0 h-[82%] w-auto object-contain drop-shadow-xl ${
                  stage.scene === "thought"
                    ? "left-1/2 -translate-x-1/2"
                    : "right-2 sm:right-6"
                }`
          }
          style={{ imageRendering: "pixelated" }}
        />
      )}
    </div>
  );
}
