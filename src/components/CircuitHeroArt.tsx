const PADS = [
  { left: "10%", top: "62%", size: 4, delay: "-1s" },
  { left: "25%", top: "72%", size: 5, delay: "-3s" },
  { left: "38%", top: "66%", size: 3, delay: "-2s" },
  { left: "7%", top: "78%", size: 4, delay: "-4.2s" },
  { left: "52%", top: "58%", size: 4, delay: "-0.6s" },
  { left: "64%", top: "52%", size: 5, delay: "-2.4s" },
  { left: "74%", top: "62%", size: 4, delay: "-1.6s" },
  { left: "86%", top: "48%", size: 5, delay: "-3.4s" },
  { left: "92%", top: "66%", size: 4, delay: "-4.8s" },
  { left: "68%", top: "76%", size: 3, delay: "-0.9s" },
  { left: "80%", top: "82%", size: 4, delay: "-2.8s" },
];

export default function CircuitHeroArt({ className }: { className?: string }) {
  return (
    <div aria-hidden className={className}>
      <div className="absolute inset-0 hidden sm:block">
        {PADS.map((p, i) => (
          <span
            key={i}
            className="circuit-pad"
            style={{
              left: p.left,
              top: p.top,
              width: p.size,
              height: p.size,
              animationDelay: p.delay,
            }}
          />
        ))}
      </div>

      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="circuit-chip absolute right-10 top-[20%] hidden h-11 w-11 text-accent-cyan xl:block 2xl:right-16 2xl:h-12 2xl:w-12"
      >
        <rect x="11" y="11" width="26" height="26" rx="7" strokeOpacity="0.8" />
        <rect x="20" y="20" width="8" height="8" rx="1.5" strokeWidth="1.6" strokeOpacity="0.55" />
        <g strokeOpacity="0.7">
          <path d="M17 4 V11" />
          <path d="M24 4 V11" />
          <path d="M31 4 V11" />
          <path d="M17 37 V44" />
          <path d="M24 37 V44" />
          <path d="M31 37 V44" />
          <path d="M4 17 H11" />
          <path d="M4 24 H11" />
          <path d="M4 31 H11" />
          <path d="M37 17 H44" />
          <path d="M37 24 H44" />
          <path d="M37 31 H44" />
        </g>
      </svg>

      <svg
        viewBox="0 0 48 48"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        className="circuit-wave absolute right-14 top-[68%] hidden h-9 w-9 text-accent-violet opacity-70 xl:block 2xl:right-20 2xl:h-10 2xl:w-10"
      >
        <circle cx="24" cy="24" r="2.6" fill="currentColor" stroke="none" />
        <path d="M18 18 a8.5 8.5 0 0 0 0 12" strokeOpacity="0.9" />
        <path d="M13 14 a14 14 0 0 0 0 20" strokeOpacity="0.55" />
        <path d="M30 18 a8.5 8.5 0 0 1 0 12" strokeOpacity="0.9" />
        <path d="M35 14 a14 14 0 0 1 0 20" strokeOpacity="0.55" />
      </svg>
    </div>
  );
}
