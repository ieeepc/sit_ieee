type Point = readonly [number, number];

function polygon(cx: number, cy: number, r: number, sides: number, rotationDeg = 0): Point[] {
  return Array.from({ length: sides }, (_, i) => {
    const angle = ((rotationDeg + (360 / sides) * i) * Math.PI) / 180;
    return [cx + r * Math.cos(angle), cy + r * Math.sin(angle)] as const;
  });
}

function toPath(points: Point[], close = true) {
  return `${points.map(([x, y], i) => `${i ? "L" : "M"}${x.toFixed(1)} ${y.toFixed(1)}`).join(" ")}${close ? " Z" : ""}`;
}

function HudFrame({ x, y, w, h, tone }: { x: number; y: number; w: number; h: number; tone: string }) {
  const c = 13;
  return (
    <g fill="none" strokeWidth="1.6" strokeLinecap="square" className={tone}>
      <path d={`M${x} ${y + c} V${y} H${x + c}`} />
      <path d={`M${x + w - c} ${y} H${x + w} V${y + c}`} />
      <path d={`M${x + w} ${y + h - c} V${y + h} H${x + w - c}`} />
      <path d={`M${x + c} ${y + h} H${x} V${y + h - c}`} />
      <path d={`M${x + 9} ${y + 9} H${x + 34}`} opacity=".55" />
      <path d={`M${x + 9} ${y + h - 9} H${x + 24}`} opacity=".3" />
    </g>
  );
}

const STARS = Array.from({ length: 30 }, (_, i) => ({
  x: Number((((i * 137.508) % 448) + 6).toFixed(1)),
  y: Number((((i * 89.73) % 236) + 8).toFixed(1)),
  r: i % 6 === 0 ? 1.4 : 0.8,
  delay: `${(i % 8) * 0.55}s`,
  tone: i % 3 === 0 ? "fill-accent-rose" : i % 3 === 1 ? "fill-accent-cyan" : "fill-text",
}));

const gemOuter = polygon(237, 86, 47, 6, -90);
const gemInner = polygon(237, 86, 25, 6, -60);
const gemCore = polygon(237, 86, 9, 6, -90);
const gemSpokes = gemOuter
  .flatMap(([x, y], i) => {
    const a = gemInner[i];
    const b = gemInner[(i + 1) % 6];
    return [
      `M${x.toFixed(1)} ${y.toFixed(1)} L${a[0].toFixed(1)} ${a[1].toFixed(1)}`,
      `M${x.toFixed(1)} ${y.toFixed(1)} L${b[0].toFixed(1)} ${b[1].toFixed(1)}`,
    ];
  })
  .join(" ");

const BARS = [
  { x: 15, h: 13 },
  { x: 27, h: 21 },
  { x: 39, h: 9 },
  { x: 51, h: 25 },
  { x: 63, h: 17 },
  { x: 75, h: 22 },
];

export default function StageHoloArt({ className = "" }: { className?: string }) {
  return (
    <div aria-hidden className={`holo-art ${className}`}>
      <div className="stage-grid pointer-events-none absolute inset-0 opacity-70" />
      <div className="stage-scan pointer-events-none absolute inset-x-0 top-0 h-1/3 opacity-40" />
      <svg viewBox="0 0 460 250" className="relative block h-auto w-full">
        <defs>
          <radialGradient id="holo-rose-glow">
            <stop offset="0%" stopColor="var(--accent-rose)" stopOpacity=".4" />
            <stop offset="55%" stopColor="var(--accent-rose)" stopOpacity=".12" />
            <stop offset="100%" stopColor="var(--accent-rose)" stopOpacity="0" />
          </radialGradient>
          <radialGradient id="holo-cyan-glow">
            <stop offset="0%" stopColor="var(--accent-cyan)" stopOpacity=".3" />
            <stop offset="60%" stopColor="var(--accent-cyan)" stopOpacity=".08" />
            <stop offset="100%" stopColor="var(--accent-cyan)" stopOpacity="0" />
          </radialGradient>
        </defs>

        <ellipse cx="237" cy="90" rx="158" ry="86" fill="url(#holo-rose-glow)" opacity=".8" />
        <ellipse cx="70" cy="210" rx="140" ry="62" fill="url(#holo-cyan-glow)" opacity=".7" />
        <ellipse cx="410" cy="40" rx="110" ry="60" fill="url(#holo-cyan-glow)" opacity=".35" />

        {STARS.map((star, i) => (
          <circle
            key={i}
            cx={star.x}
            cy={star.y}
            r={star.r}
            className={`holo-twinkle ${star.tone}`}
            opacity=".6"
            style={{ animationDelay: star.delay }}
          />
        ))}

        {/* Left: wireframe globe inside HUD brackets */}
        <g className="holo-float" style={{ animationDelay: "-2.5s" }}>
          <HudFrame x={14} y={12} w={134} h={138} tone="stroke-accent-cyan/60" />
          <g strokeWidth="1" fill="none" opacity=".85">
            <circle cx="82" cy="84" r="36" className="stroke-text/80" />
            <ellipse cx="82" cy="84" rx="36" ry="12" className="stroke-text/60" />
            <ellipse cx="82" cy="84" rx="36" ry="12" className="stroke-text/60" transform="rotate(58 82 84)" />
            <ellipse cx="82" cy="84" rx="36" ry="12" className="stroke-text/60" transform="rotate(-58 82 84)" />
            <g className="holo-spin">
              <ellipse cx="82" cy="84" rx="12" ry="36" className="stroke-accent-cyan/70" />
              <ellipse cx="82" cy="84" rx="12" ry="36" className="stroke-accent-cyan/40" transform="rotate(60 82 84)" />
            </g>
            <path d={toPath(polygon(82, 84, 16, 6, -90))} className="stroke-text/40" />
            <path d={toPath(polygon(82, 84, 16, 6, -60), false)} className="stroke-text/30" />
          </g>
          <ellipse cx="82" cy="84" rx="52" ry="14" className="holo-orbit fill-none stroke-accent-cyan/70" strokeWidth="1" transform="rotate(-16 82 84)" />
          <circle cx="82" cy="84" r="2" className="fill-accent-cyan" />
        </g>

        {/* Middle: faceted holo core on a projector base */}
        <g className="holo-float">
          <HudFrame x={166} y={4} w={142} h={160} tone="stroke-accent-rose/70" />
          <ellipse cx="237" cy="158" rx="30" ry="7" className="fill-accent-rose/15 stroke-accent-rose/60" strokeWidth="1" />
          <path d="M217 158 V166 M257 158 V166" className="stroke-accent-rose/50" strokeWidth="1.4" />
          <g
            className="holo-gem"
            fill="none"
            strokeWidth="1.1"
            style={{ filter: "drop-shadow(0 0 9px color-mix(in srgb, var(--accent-rose) 55%, transparent))" }}
          >
            <path d={toPath(gemOuter)} className="stroke-accent-rose/90" />
            <path d={toPath(gemInner)} className="stroke-accent-rose/70" />
            <path d={toPath(gemCore)} className="stroke-text/70" />
            <path d={gemSpokes} className="stroke-accent-rose/45" />
          </g>
          <ellipse cx="237" cy="86" rx="74" ry="21" className="holo-orbit fill-none stroke-text/50" strokeWidth="1.2" transform="rotate(-10 237 86)" />
          <g transform="translate(237 86) scale(1, 0.27) rotate(-10)">
            <g className="holo-dot-orbit">
              <circle r="74" fill="none" />
              <circle cx="74" cy="0" r="2.3" className="fill-accent-rose" style={{ filter: "drop-shadow(0 0 5px var(--accent-rose))" }} />
            </g>
          </g>
        </g>

        {/* Right: dotted globe with a tilted ring */}
        <g className="holo-float" style={{ animationDelay: "-4.5s" }}>
          <HudFrame x={324} y={20} w={126} h={128} tone="stroke-accent-violet/60" />
          <g fill="none">
            <circle cx="387" cy="84" r="32" strokeDasharray="1.5 5" strokeWidth="2.4" className="stroke-text/70" />
            <g strokeDasharray="1.5 4" strokeWidth="1">
              <ellipse cx="387" cy="84" rx="32" ry="9" className="stroke-text/45" />
              <ellipse cx="387" cy="84" rx="22" ry="30" className="stroke-text/35" transform="rotate(28 387 84)" />
            </g>
          </g>
          <ellipse cx="387" cy="84" rx="52" ry="13" className="holo-orbit fill-none stroke-accent-violet/70" strokeWidth="1" transform="rotate(-20 387 84)" />
        </g>

        {/* Holographic monitor row */}
        <g transform="translate(34 190) rotate(-5 54 22)">
          <rect width="108" height="44" rx="5" className="fill-bg-elevated/80 stroke-accent-rose/50" strokeWidth="1" />
          <path d="M0 8 H108" className="stroke-accent-rose/30" strokeWidth="1" />
          <circle cx="7" cy="4" r="1.3" className="fill-accent-rose/70" />
          <circle cx="12" cy="4" r="1.3" className="fill-accent-cyan/60" />
          {BARS.map((bar, i) => (
            <rect
              key={bar.x}
              x={bar.x}
              y={36 - bar.h}
              width="6"
              height={bar.h}
              rx="1"
              className="holo-bar fill-accent-rose/75"
              style={{ animationDelay: `${i * 0.28}s` }}
            />
          ))}
          <path d="M10 37 H98" className="stroke-accent-rose/35" strokeWidth="1" />
        </g>

        <g transform="translate(176 182)">
          <rect width="108" height="52" rx="5" className="fill-bg-elevated/80 stroke-accent-cyan/50" strokeWidth="1" />
          <path d="M0 9 H108" className="stroke-accent-cyan/30" strokeWidth="1" />
          <circle cx="7" cy="4.5" r="1.3" className="fill-accent-cyan/80" />
          <path d="M14 30 H96 M14 38 H96 M14 46 H96" className="stroke-text/10" strokeWidth="1" />
          <path
            d="M12 42 L26 33 L40 37 L54 23 L68 29 L82 17 L96 22"
            fill="none"
            strokeWidth="1.6"
            strokeLinejoin="round"
            className="holo-draw stroke-accent-cyan"
          />
          <circle cx="96" cy="22" r="2.2" className="holo-twinkle fill-accent-cyan" />
        </g>

        <g transform="translate(318 190) rotate(4 54 22)">
          <rect width="108" height="44" rx="5" className="fill-bg-elevated/80 stroke-accent-violet/50" strokeWidth="1" />
          <path d="M0 8 H108" className="stroke-accent-violet/30" strokeWidth="1" />
          <circle cx="7" cy="4" r="1.3" className="fill-accent-violet/80" />
          <rect x="10" y="14" width="62" height="3" rx="1.5" className="fill-accent-violet/60" />
          <rect x="10" y="21" width="44" height="3" rx="1.5" className="fill-accent-cyan/50" />
          <rect x="10" y="28" width="72" height="3" rx="1.5" className="fill-accent-rose/50" />
          <rect x="10" y="35" width="34" height="3" rx="1.5" className="fill-text/25" />
          <rect x="48" y="34" width="4" height="5" className="holo-twinkle fill-accent-cyan" />
        </g>
      </svg>
    </div>
  );
}
