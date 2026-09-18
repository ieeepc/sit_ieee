"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";

const WORDS = ["Learn", "Teach", "Excel"];

export default function RotatingTagline() {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setIndex((i) => (i + 1) % WORDS.length), 2200);
    return () => clearInterval(id);
  }, []);

  return (
    <span className="inline-flex items-center gap-2.5">
      <span>Where we</span>
      <span className="relative inline-flex h-[1.15em] min-w-[4.5ch] items-center overflow-hidden text-left">
        <AnimatePresence mode="wait">
          <motion.span
            key={WORDS[index]}
            initial={{ y: "60%", opacity: 0 }}
            animate={{ y: "0%", opacity: 1 }}
            exit={{ y: "-60%", opacity: 0 }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="text-gradient-animated absolute left-0"
          >
            {WORDS[index]}
          </motion.span>
        </AnimatePresence>
      </span>
    </span>
  );
}
