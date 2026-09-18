"use client";

import { useRef } from "react";
import Image from "next/image";
import { motion, useScroll, useTransform } from "framer-motion";
import { formatDate } from "@/lib/utils";

type EventItem = {
  _id: string;
  name: string;
  date: string;
  description: string;
  photos: { _id: string; url: string }[];
};

export default function TimelineTrack({ events }: { events: EventItem[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: containerRef,
    offset: ["start 0.85", "end 0.6"],
  });
  const lineHeight = useTransform(scrollYProgress, [0, 1], ["0%", "100%"]);

  if (events.length === 0) {
    return (
      <div className="glass-card mt-14 flex flex-col items-center gap-3 rounded-2xl px-8 py-20 text-center">
        <p className="text-text-muted">No events recorded yet. Check back soon.</p>
      </div>
    );
  }

  return (
    <div ref={containerRef} className="relative mt-16 sm:mt-20">
      <div className="absolute left-4 top-2 bottom-2 w-px bg-white/10 sm:left-6" />
      <motion.div
        className="absolute left-4 top-2 w-px bg-gradient-to-b from-accent-cyan via-accent-violet to-accent-rose sm:left-6"
        style={{ height: lineHeight }}
      />

      <div className="flex flex-col gap-16 sm:gap-20">
        {events.map((e, i) => (
          <div key={e._id} className="relative pl-12 sm:pl-16">
            <span className="absolute left-0 top-1.5 flex h-8 w-8 -translate-x-1/2 items-center justify-center rounded-full border border-border-strong bg-bg-elevated sm:left-1.5 sm:h-9 sm:w-9">
              <span className="h-2.5 w-2.5 rounded-full bg-gradient-to-br from-accent-cyan to-accent-violet" />
            </span>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, amount: 0.25 }}
              transition={{ duration: 0.6, delay: Math.min(i, 4) * 0.05, ease: [0.22, 1, 0.36, 1] }}
            >
              <p className="text-xs font-medium text-accent-cyan sm:text-sm">{formatDate(e.date)}</p>
              <h3 className="mt-1.5 font-display text-2xl font-semibold tracking-tight sm:text-3xl lg:text-4xl">
                {e.name}
              </h3>
              {e.description && (
                <p className="mt-3 max-w-2xl text-sm leading-relaxed text-text-muted sm:text-base">
                  {e.description}
                </p>
              )}

              {e.photos.length > 0 && (
                <div className="mt-6 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  {e.photos.map((p) => (
                    <div
                      key={p._id}
                      className="group relative h-56 overflow-hidden rounded-xl border border-border sm:h-60 lg:h-64"
                    >
                      <Image
                        src={p.url}
                        alt={e.name}
                        fill
                        sizes="(min-width: 1024px) 360px, (min-width: 640px) 45vw, 90vw"
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                    </div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        ))}
      </div>
    </div>
  );
}
