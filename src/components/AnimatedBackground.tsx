"use client";

import { motion } from "framer-motion";

export default function AnimatedBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden bg-bg">
      {/* Dark theme: neon glow orbs over a grid */}
      <div className="light:hidden">
        <div className="absolute inset-0 bg-grid [mask-image:radial-gradient(ellipse_80%_60%_at_50%_0%,#000_40%,transparent_100%)]" />
        <motion.div
          className="absolute -left-40 top-[-10%] h-[38rem] w-[38rem] rounded-full bg-accent-violet/25 blur-[120px]"
          animate={{ x: [0, 60, 0], y: [0, 40, 0] }}
          transition={{ duration: 22, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-10%] top-[10%] h-[32rem] w-[32rem] rounded-full bg-accent-cyan/20 blur-[120px]"
          animate={{ x: [0, -50, 0], y: [0, 60, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-15%] left-[20%] h-[30rem] w-[30rem] rounded-full bg-accent-rose/15 blur-[130px]"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 28, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      {/* Light theme: white background with green, blue, and purple glows */}
      <div className="hidden light:block">
        <motion.div
          className="absolute left-[-14%] top-[-22%] h-[40rem] w-[40rem] rounded-full bg-[#86efac] opacity-45 blur-[120px]"
          animate={{ x: [0, 50, 0], y: [0, 30, 0] }}
          transition={{ duration: 24, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute right-[-12%] top-[-14%] h-[38rem] w-[38rem] rounded-full bg-[#60a5fa] opacity-40 blur-[120px]"
          animate={{ x: [0, -50, 0], y: [0, 40, 0] }}
          transition={{ duration: 27, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute left-[30%] top-[38%] h-[26rem] w-[34rem] rounded-full bg-[#c4b5fd] opacity-35 blur-[120px]"
          animate={{ x: [0, 40, 0], y: [0, -30, 0] }}
          transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-20%] right-[-8%] h-[36rem] w-[40rem] rounded-full bg-[#4ade80] opacity-18 blur-[130px]"
          animate={{ x: [0, -40, 0], y: [0, -30, 0] }}
          transition={{ duration: 29, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          className="absolute bottom-[-18%] left-[-10%] h-[30rem] w-[34rem] rounded-full bg-[#a78bfa] opacity-[0.20] blur-[130px]"
          animate={{ x: [0, 40, 0], y: [0, -20, 0] }}
          transition={{ duration: 26, repeat: Infinity, ease: "easeInOut" }}
        />
      </div>

      <div className="absolute inset-0 noise-overlay light:opacity-60" />
    </div>
  );
}
