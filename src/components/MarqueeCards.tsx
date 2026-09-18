import type { LucideIcon } from "lucide-react";

type Pillar = {
  icon: LucideIcon;
  eyebrow: string;
  title: string;
  body: string;
};

export default function MarqueeCards({ pillars }: { pillars: Pillar[] }) {
  const track = [...pillars, ...pillars];

  return (
    <div className="relative -mx-5 overflow-hidden [mask-image:linear-gradient(to_right,transparent,black_5%,black_95%,transparent)] sm:-mx-6 lg:-mx-8">
      <div
        className="animate-marquee flex w-max gap-5 px-5 sm:px-6 lg:px-8"
        style={{ "--marquee-duration": "38s" } as React.CSSProperties}
      >
        {track.map((p, i) => (
          <div
            key={i}
            className="group glass-card relative w-[300px] shrink-0 overflow-hidden rounded-2xl p-7 transition-colors hover:border-border-strong sm:w-[340px] lg:w-[380px] lg:p-9"
          >
            <div className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 blur-2xl transition-transform duration-500 group-hover:scale-125" />
            <p.icon className="text-accent-cyan" size={30} strokeWidth={1.75} />
            <p className="mt-5 text-xs font-semibold uppercase tracking-wide text-text-faint">{p.eyebrow}</p>
            <h3 className="mt-1.5 font-display text-xl font-semibold lg:text-2xl">{p.title}</h3>
            <p className="mt-3 text-sm leading-relaxed text-text-muted lg:text-base">{p.body}</p>
          </div>
        ))}
      </div>
    </div>
  );
}
