"use client";

import Link from "next/link";
import { motion, useReducedMotion } from "framer-motion";
import { Check } from "lucide-react";

const STEPS = [
  { number: 1, label: "Your team", slug: "leader" },
  { number: 2, label: "Members", slug: "team" },
  { number: 3, label: "Abstract", slug: "abstract" },
] as const;

export default function StageStepper({ eventId, current }: { eventId: string; current: 1 | 2 | 3 }) {
  const reduce = useReducedMotion();
  const fill = (current - 1) / (STEPS.length - 1);

  return (
    <nav aria-label="Registration stages" className="relative">
      <div
        aria-hidden
        className="absolute inset-x-[16.6667%] top-[1.375rem] h-[3px] -translate-y-1/2 overflow-hidden rounded-full bg-fg/[0.08]"
      >
        <motion.span
          initial={{ scaleX: 0 }}
          animate={{ scaleX: fill }}
          transition={reduce ? { duration: 0 } : { type: "spring", stiffness: 110, damping: 22, delay: 0.15 }}
          className="absolute inset-0 origin-left rounded-full bg-accent-cyan"
        />
      </div>

      <ol className="relative grid grid-cols-3 gap-1">
        {STEPS.map((step, index) => {
          const active = step.number === current;
          const complete = step.number < current;

          return (
            <li key={step.slug} className="relative z-10 flex justify-center">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.08, type: "spring", stiffness: 220, damping: 22 }}
                className="w-full max-w-[9.5rem]"
              >
                <Link
                  href={`/upcoming-events/${eventId}/register/${step.slug}`}
                  aria-current={active ? "step" : undefined}
                  className="group flex flex-col items-center gap-2.5 text-center"
                >
                  <span className="relative flex h-11 w-11 items-center justify-center">
                    {active && (
                      <span
                        aria-hidden
                        className="stage-active-ring absolute inset-0 rounded-full border border-accent-cyan/50"
                      />
                    )}
                    <motion.span
                      whileHover={{ scale: 1.08 }}
                      whileTap={{ scale: 0.94 }}
                      className={`relative flex h-11 w-11 items-center justify-center rounded-full border text-sm font-semibold transition-colors duration-300 ${
                        active
                          ? "border-accent-cyan bg-accent-cyan text-on-accent"
                          : complete
                            ? "border-accent-cyan/60 bg-accent-cyan/10 text-accent-cyan"
                            : "border-border-strong bg-fg/[0.03] text-text-muted group-hover:border-accent-cyan/50 group-hover:text-text"
                      }`}
                    >
                      {complete ? (
                        <motion.span
                          initial={{ scale: 0, rotate: -25 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 420, damping: 15 }}
                        >
                          <Check size={18} strokeWidth={3} />
                        </motion.span>
                      ) : (
                        step.number
                      )}
                    </motion.span>
                  </span>
                  <span
                    className={`px-1 text-[10px] font-medium leading-tight transition-colors duration-300 sm:text-xs ${
                      active
                        ? "text-accent-cyan"
                        : complete
                          ? "text-accent-cyan"
                          : "text-text-muted group-hover:text-text"
                    }`}
                  >
                    {step.label}
                  </span>
                </Link>
              </motion.div>
            </li>
          );
        })}
      </ol>
    </nav>
  );
}
