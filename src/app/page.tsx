import Link from "next/link";
import { ArrowRight, Sparkles, Lightbulb, Users2, Briefcase } from "lucide-react";
import Reveal from "@/components/Reveal";
import MarqueeCards from "@/components/MarqueeCards";
import HeroSpotlight from "@/components/HeroSpotlight";
import CircuitHeroArt from "@/components/CircuitHeroArt";
import CountUp from "@/components/CountUp";
import RotatingTagline from "@/components/RotatingTagline";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";

export const dynamic = "force-dynamic";

const SPARKS = [
  { left: "12%", top: "58%", delay: "0s", duration: "11s" },
  { left: "24%", top: "72%", delay: "-3s", duration: "13s" },
  { left: "38%", top: "64%", delay: "-7s", duration: "10s" },
  { left: "52%", top: "78%", delay: "-2s", duration: "12s" },
  { left: "66%", top: "66%", delay: "-9s", duration: "14s" },
  { left: "78%", top: "74%", delay: "-5s", duration: "11s" },
  { left: "88%", top: "60%", delay: "-8s", duration: "13s" },
];

const pillars = [
  {
    icon: Sparkles,
    eyebrow: "A Vision Realized",
    title: "Our Founding Story",
    body: "IEEE Photonics and ComSoc Joint Chapter was founded in 2019 by visionary students. Under the guidance of esteemed faculty Dr. TN Chandrika ma'am, our mission has always been to empower students in both technical and personal growth.",
  },
  {
    icon: Lightbulb,
    eyebrow: "Learn and Innovate",
    title: "Technical Excellence",
    body: "Our technical workshops dive into cutting-edge fields such as UI/UX Design, Machine Learning, Python Programming, and Web Development. Gain hands-on experience to turn your ideas into reality with tools and skills that set you apart.",
  },
  {
    icon: Users2,
    eyebrow: "Beyond Technology",
    title: "Soft Skills for Success",
    body: "We're not just about coding and circuits! At IEEE Photonics and ComSoc, we help members cultivate leadership, communication, and management skills to become well-rounded professionals prepared for real-world challenges.",
  },
  {
    icon: Briefcase,
    eyebrow: "Connect with the Industry",
    title: "Career and Networking Opportunities",
    body: "Explore your future with our career fairs featuring industry experts and diverse career paths.",
  },
];

const FOUNDED_YEAR = 2019;

async function getStats() {
  await connectDB();
  const eventsHosted = await Event.countDocuments();
  const yearsActive = Math.max(1, new Date().getFullYear() - FOUNDED_YEAR);
  return { eventsHosted, yearsActive };
}

export default async function Home() {
  const { eventsHosted, yearsActive } = await getStats();

  return (
    <div>
      <HeroSpotlight>
        <section className="relative mx-auto w-full overflow-hidden px-5 pb-24 pt-12 sm:px-8 sm:pt-16 lg:px-12">
          <div aria-hidden className="pointer-events-none absolute inset-0">
            <div className="hero-blob absolute left-[6%] top-8 h-64 w-64 rounded-full bg-accent-cyan/20 blur-[90px] sm:h-80 sm:w-80" />
            <div
              className="hero-blob absolute right-[4%] top-20 h-72 w-72 rounded-full bg-accent-violet/20 blur-[100px] sm:h-96 sm:w-96"
              style={{ animationDelay: "-7s" }}
            />
            <div className="absolute inset-x-0 bottom-0 flex justify-center">
              <div
                className="hero-blob h-64 w-[34rem] max-w-full rounded-full bg-accent-rose/10 blur-[110px]"
                style={{ animationDelay: "-13s" }}
              />
            </div>
            <div className="absolute inset-0 hidden overflow-hidden lg:block">
              <div className="hero-sweep absolute -top-1/4 h-[150%] w-[16rem] bg-gradient-to-r from-transparent via-fg/[0.05] to-transparent" />
            </div>
            <div className="absolute inset-0 hidden sm:block">
              {SPARKS.map((s, i) => (
                <span
                  key={i}
                  className="hero-spark"
                  style={{
                    left: s.left,
                    top: s.top,
                    animationDelay: s.delay,
                    animationDuration: s.duration,
                  }}
                />
              ))}
            </div>
            <CircuitHeroArt className="absolute inset-0" />
          </div>

          <div className="relative flex w-full flex-col items-start text-left">
            <div className="inline-grid max-w-full gap-y-8">
              <Reveal>
                <span className="flex w-full max-w-full items-center justify-start gap-2 rounded-full border border-border-strong bg-fg/[0.04] px-4 py-1.5 text-left text-xs font-medium text-text-muted">
                  <span className="h-1.5 w-1.5 shrink-0 animate-pulse rounded-full bg-accent-cyan" />
                  Welcome to IEEE Photonics and ComSoc! Join us for exciting events and activities. Stay tuned!
                </span>
              </Reveal>

              <Reveal delay={0.08}>
                <h1 className="text-gradient-animated max-w-5xl font-display text-4xl font-semibold leading-[1.08] tracking-tight drop-shadow-[0_0_45px_rgba(139,92,246,0.22)] sm:text-5xl lg:text-6xl xl:text-7xl">
                  SIT IEEE Photonics &amp; ComSoc
                  <span className="block">Joint Chapter</span>
                </h1>
              </Reveal>
            </div>

            <Reveal delay={0.16}>
              <p className="mt-6 font-display text-xl font-semibold sm:text-2xl lg:text-3xl">
                <RotatingTagline />
              </p>
              <p className="mt-3 max-w-3xl text-base leading-relaxed text-text-muted sm:text-lg lg:text-xl">
                A student-run technical club at Siddaganga Institute of Technology, bridging academic
                learning and professional development since 2019.
              </p>
            </Reveal>

            <Reveal delay={0.24}>
              <div className="mt-10 flex flex-wrap items-center justify-start gap-4">
                <Link
                  href="/upcoming-events"
                  className="cta-sheen group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-6 py-3 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.03]"
                >
                  See Upcoming Events
                  <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
                </Link>
                <Link
                  href="/our-team"
                  className="inline-flex items-center gap-2 rounded-full border border-border-strong px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-fg/[0.05]"
                >
                  Meet the Team
                </Link>
              </div>
            </Reveal>

            <Reveal delay={0.32} className="w-full">
              <div className="mx-auto mt-16 grid w-full max-w-2xl grid-cols-3 gap-6 border-t border-border pt-8 text-center">
                <div className="transition-transform duration-300 hover:-translate-y-1">
                  <p className="font-display text-3xl font-semibold sm:text-4xl">
                    <CountUp value={FOUNDED_YEAR} />
                  </p>
                  <p className="mt-1 text-xs text-text-muted sm:text-sm">Founded</p>
                </div>
                <div className="transition-transform duration-300 hover:-translate-y-1">
                  <p className="font-display text-3xl font-semibold sm:text-4xl">
                    <CountUp value={eventsHosted} suffix="+" />
                  </p>
                  <p className="mt-1 text-xs text-text-muted sm:text-sm">Events Hosted</p>
                </div>
                <div className="transition-transform duration-300 hover:-translate-y-1">
                  <p className="font-display text-3xl font-semibold sm:text-4xl">
                    <CountUp value={yearsActive} suffix="+" />
                  </p>
                  <p className="mt-1 text-xs text-text-muted sm:text-sm">Years Active</p>
                </div>
              </div>
            </Reveal>
          </div>
        </section>
      </HeroSpotlight>

      <section className="pb-28">
        <div className="mx-auto w-full px-5 sm:px-8 lg:px-12">
          <Reveal>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">
              What does our team do?
            </p>
          </Reveal>
        </div>

        <div className="mt-8">
          <MarqueeCards pillars={pillars} />
        </div>
      </section>
    </div>
  );
}
