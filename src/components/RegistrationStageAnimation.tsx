"use client";

import { motion } from "framer-motion";

export default function RegistrationStageAnimation({ current }: { current: 1 | 2 | 3 }) {
  const fill = current === 1 ? 0 : current === 2 ? 0.5 : 1;

  return (
    <>
      <motion.div
        aria-hidden
        initial={false}
        animate={{ scaleY: fill }}
        transition={{ type: "spring", stiffness: 140, damping: 20 }}
        className="absolute bottom-14 left-[1.38rem] top-14 origin-top"
        style={{ width: 4 }}
      >
        <div className="h-full rounded-full bg-gradient-to-b from-accent-cyan via-accent-violet to-accent-rose shadow-[0_0_20px_rgba(34,211,238,.52),0_0_42px_rgba(139,92,246,.28)]" />
      </motion.div>
      <motion.div
        aria-hidden
        initial={false}
        animate={{ top: `${current === 1 ? 18 : current === 2 ? 50 : 82}%` }}
        transition={{ type: "spring", stiffness: 180, damping: 19 }}
        className="absolute left-[1.38rem] z-[2] h-2 w-2 -translate-x-[2px] -translate-y-1/2 rounded-full bg-white shadow-[0_0_12px_4px_rgba(34,211,238,.8)]"
      />
    </>
  );
}
