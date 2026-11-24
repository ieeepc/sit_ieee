"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { ArrowUpRight, CheckCircle2, Layers, RotateCcw } from "lucide-react";
import { useReducer, useState, useSyncExternalStore } from "react";
import StageHoloArt from "@/components/StageHoloArt";

type Stage = {
  number: string;
  name: string;
  description: string;
  stage: "leader" | "team" | "abstract";
  icon: string;
};

type Progress = {
  nextStage: 1 | 2 | 3;
  completed: number;
  teamName?: string;
  done: boolean;
  hasRegistration: boolean;
};

const PROGRESS_KEYS = ["registration", "team", "team-details", "team-size", "abstract"] as const;
const subscribeNoop = () => () => {};

// sessionStorage is client-only; a serialized snapshot keeps useSyncExternalStore hydration-safe.
function getSignature(eventId: string) {
  try {
    return ["registration", "team", "team-details", "abstract"]
      .map((key) => sessionStorage.getItem(`hackz-${key}-${eventId}`) ?? "")
      .join("|");
  } catch {
    return "";
  }
}

function readProgress(eventId: string): Progress | null {
  try {
    const abstract = sessionStorage.getItem(`hackz-abstract-${eventId}`);
    const team = sessionStorage.getItem(`hackz-team-${eventId}`);
    const detailsRaw = sessionStorage.getItem(`hackz-team-details-${eventId}`);
    const registration = sessionStorage.getItem(`hackz-registration-${eventId}`);
    if (!abstract && !team && !detailsRaw && !registration) return null;

    const details = detailsRaw ? (JSON.parse(detailsRaw) as { teamName?: string }) : null;
    const teamName = details?.teamName || undefined;

    if (abstract === "submitted") return { nextStage: 3, completed: 3, teamName, done: true, hasRegistration: !!registration };
    if (team === "submitted") return { nextStage: 3, completed: 2, teamName, done: false, hasRegistration: !!registration };
    return { nextStage: 2, completed: 1, teamName, done: false, hasRegistration: !!registration };
  } catch {
    return null;
  }
}

function clearProgress(eventId: string) {
  PROGRESS_KEYS.forEach((key) => sessionStorage.removeItem(`hackz-${key}-${eventId}`));
}

export default function RegistrationChooser({
  eventId,
  stages,
}: {
  eventId: string;
  stages: readonly Stage[];
}) {
  const [hovered, setHovered] = useState(0);
  const [version, bumpVersion] = useReducer((n: number) => n + 1, 0);
  const reduce = useReducedMotion();
  const signature = useSyncExternalStore(
    subscribeNoop,
    () => `${version}:${getSignature(eventId)}`,
    () => ""
  );
  const progress = signature ? readProgress(eventId) : null;

  function startNew() {
    if (
      progress?.hasRegistration &&
      !window.confirm(
        "Your team is already registered. Starting new only clears this browser — the existing registration stays, and re-entering the same leader email will continue it instead. Start a new registration anyway?"
      )
    ) {
      return;
    }
    clearProgress(eventId);
    bumpVersion();
  }

  const nextStage = progress ? stages[progress.nextStage - 1] : null;

  function trackSpotlight(e: React.MouseEvent<HTMLAnchorElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    e.currentTarget.style.setProperty("--mx", `${e.clientX - rect.left}px`);
    e.currentTarget.style.setProperty("--my", `${e.clientY - rect.top}px`);
  }

  return (
    <nav aria-label="HACK-Z registration stages" className="relative mt-9 sm:mt-12">
      <div className="grid items-center gap-6 sm:gap-8 md:grid-cols-[minmax(0,1fr)_19rem] lg:grid-cols-[minmax(0,1fr)_22rem]">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full border border-border-strong/70 bg-bg-elevated/70 px-3 py-1 text-[11px] font-semibold text-accent-cyan backdrop-blur">
            <Layers size={12} />
            {stages.length} stages
          </span>
          <h2 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            {progress && !progress.done ? (
              <>Continue your <span className="text-gradient-animated">registration</span></>
            ) : (
              <>Pick a <span className="text-gradient-animated">stage</span> to begin</>
            )}
          </h2>
          <p className="mt-2 max-w-md text-sm text-text-muted">
            {progress && !progress.done
              ? "You already started — pick up where you left off, or start a new registration below."
              : "You can come back to any stage later — start wherever you like."}
          </p>
        </div>
        <StageHoloArt className="w-full max-w-[26rem] justify-self-center md:max-w-none md:justify-self-end" />
      </div>

      {progress && (
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ type: "spring", stiffness: 200, damping: 22 }}
          className="relative mt-8 overflow-hidden rounded-2xl border border-accent-rose/40 bg-accent-rose/[0.055] p-5 shadow-[0_18px_60px_rgba(251,113,133,.12)]"
        >
          <span
            aria-hidden
            className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent-rose/70 to-transparent"
          />
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.22em] text-accent-rose">
                <CheckCircle2 size={14} />
                {progress.done ? "Registration complete" : "Already started"}
              </p>
              <p className="mt-2 font-display text-lg font-semibold">
                {progress.teamName || "Your team"}
              </p>
              <p className="mt-1 text-sm leading-relaxed text-text-muted">
                {progress.done
                  ? `All ${stages.length} stages are done. See you at the event!`
                  : `You've completed ${progress.completed} of ${stages.length} stages. Continue at stage ${progress.nextStage} — ${nextStage?.name}.`}
              </p>
            </div>
            {!progress.done && (
              <div className="flex shrink-0 flex-wrap items-center gap-2">
                <Link
                  href={`/upcoming-events/${eventId}/register/${nextStage?.stage}`}
                  className="stage-sheen inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-5 py-2.5 text-xs font-bold text-black shadow-[0_12px_40px_rgba(34,211,238,.22)] transition-transform hover:scale-[1.03]"
                >
                  Continue stage {progress.nextStage}
                  <ArrowUpRight size={14} />
                </Link>
                <button
                  type="button"
                  onClick={startNew}
                  className="inline-flex items-center gap-2 rounded-full border border-border-strong/80 px-4 py-2.5 text-xs font-semibold text-text-muted transition-colors hover:border-accent-rose/50 hover:text-text"
                >
                  <RotateCcw size={13} />
                  Start new
                </button>
              </div>
            )}
          </div>
        </motion.div>
      )}

      <div className="relative mt-8">
        <div
          aria-hidden
          className="absolute bottom-9 left-[2.375rem] top-9 w-[2px] rounded-full bg-border-strong/60 sm:left-[2.625rem]"
        />
        <motion.div
          aria-hidden
          initial={false}
          animate={{ scaleY: hovered === 0 ? 0.1 : hovered === 1 ? 0.53 : 1 }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 20 }}
          className="absolute bottom-9 left-[2.375rem] top-9 w-[3px] origin-top rounded-full bg-gradient-to-b from-accent-cyan via-accent-violet to-accent-rose shadow-[0_0_24px_rgba(34,211,238,.72)] sm:left-[2.625rem]"
        />
        <motion.span
          aria-hidden
          initial={false}
          animate={{ top: `calc(${hovered + 0.5} * (100% / 3))` }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 170, damping: 18 }}
          className="absolute left-[2.375rem] z-20 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full bg-white shadow-[0_0_16px_6px_rgba(34,211,238,.85)] light:bg-accent-cyan sm:left-[2.625rem]"
        />

        <ul className="space-y-5">
          {stages.map((item, index) => (
            <motion.li
              key={item.stage}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.08 + index * 0.09, type: "spring", stiffness: 180, damping: 20 }}
            >
              <Link
                href={`/upcoming-events/${eventId}/register/${item.stage}`}
                onMouseEnter={() => setHovered(index)}
                onFocus={() => setHovered(index)}
                onClick={() => setHovered(index)}
                onMouseMove={trackSpotlight}
                className="stage-card-glow group relative flex min-h-[78px] items-center gap-4 overflow-hidden rounded-2xl border border-border-strong/70 bg-bg-elevated/90 px-4 py-3 text-text shadow-[0_18px_55px_rgba(67,56,202,.10)] backdrop-blur-xl transition-all duration-300 hover:-translate-y-1 hover:border-accent-cyan/50 hover:bg-bg-elevated hover:shadow-[0_24px_70px_rgba(34,211,238,.16)] sm:px-5"
              >
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-0 opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                  style={{
                    background:
                      "radial-gradient(260px circle at var(--mx, 50%) var(--my, 50%), color-mix(in srgb, var(--accent-cyan) 14%, transparent), transparent 72%)",
                  }}
                />
                <span
                  aria-hidden
                  className="pointer-events-none absolute inset-x-6 top-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/60 to-transparent opacity-0 transition-opacity duration-300 group-hover:opacity-100"
                />

                <motion.span
                  animate={reduce ? undefined : { scale: hovered === index ? 1.08 : 1 }}
                  className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-accent-cyan/30 bg-gradient-to-br from-accent-cyan/20 to-accent-violet/15 font-display text-xs font-bold text-accent-cyan shadow-[0_0_28px_rgba(34,211,238,.16)]"
                >
                  {hovered === index && (
                    <motion.span
                      aria-hidden
                      initial={{ opacity: 0.5, scale: 0.8 }}
                      animate={{ opacity: 0, scale: 1.85 }}
                      transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
                      className="absolute inset-0 rounded-full border border-accent-cyan/60"
                    />
                  )}
                  {hovered > index ? (
                    <motion.span
                      initial={{ scale: 0 }}
                      animate={{ scale: 1 }}
                      transition={{ type: "spring", stiffness: 420, damping: 16 }}
                    >
                      <CheckCircle2 size={22} />
                    </motion.span>
                  ) : (
                    item.icon
                  )}
                </motion.span>

                <span className="relative z-10 min-w-0 flex-1">
                  <span className="block text-[10px] font-semibold uppercase tracking-[0.22em] text-text-faint">
                    Stage {item.number}
                  </span>
                  <span className="mt-0.5 block font-display text-lg font-semibold sm:text-xl">{item.name}</span>
                  <span className="mt-0.5 block text-xs text-text-muted sm:text-sm">{item.description}</span>
                </span>

                <motion.span
                  animate={reduce ? undefined : { x: hovered === index ? 3 : 0, y: hovered === index ? -3 : 0 }}
                  className="relative z-10 ml-auto flex h-9 w-9 shrink-0 items-center justify-center rounded-full border border-border-strong/70 bg-fg/[0.03] transition-colors duration-300 group-hover:border-accent-cyan/50 group-hover:bg-accent-cyan/10"
                >
                  <ArrowUpRight size={18} className="text-text-faint transition-colors group-hover:text-accent-cyan" />
                </motion.span>
              </Link>
            </motion.li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
