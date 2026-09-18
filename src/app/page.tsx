import Link from "next/link";
import { ArrowRight, Sparkles, Lightbulb, Users2, Briefcase, Radio, Cpu } from "lucide-react";
import Reveal from "@/components/Reveal";
import MarqueeCards from "@/components/MarqueeCards";
import HeroSpotlight from "@/components/HeroSpotlight";
import CountUp from "@/components/CountUp";
import RotatingTagline from "@/components/RotatingTagline";
import { connectDB } from "@/lib/db";
import Event from "@/models/Event";

export const dynamic = "force-dynamic";

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
        <section className="relative mx-auto max-w-6xl overflow-hidden px-5 pb-20 pt-20 sm:pt-28">
          <Cpu
            className="animate-float pointer-events-none absolute right-[6%] top-16 hidden text-accent-cyan/25 lg:block"
            size={54}
            strokeWidth={1.25}
          />
          <Radio
            className="animate-float pointer-events-none absolute right-[14%] top-[26rem] hidden text-accent-violet/25 lg:block"
            size={44}
            strokeWidth={1.25}
            style={{ animationDelay: "1.5s" }}
          />

          <Reveal>
            <span className="inline-flex items-center gap-2 rounded-full border border-border-strong bg-white/[0.04] px-4 py-1.5 text-xs font-medium text-text-muted">
              <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-accent-cyan" />
              Welcome to IEEE Photonics and ComSoc! Join us for exciting events and activities. Stay tuned!
            </span>
          </Reveal>

          <Reveal delay={0.08}>
            <h1 className="text-gradient-animated mt-8 max-w-5xl font-display text-4xl font-semibold leading-[1.08] tracking-tight sm:text-6xl lg:text-7xl">
              SIT IEEE Photonics &amp; ComSoc Joint Chapter
            </h1>
          </Reveal>

          <Reveal delay={0.16}>
            <p className="mt-6 font-display text-xl font-semibold sm:text-2xl lg:text-3xl">
              <RotatingTagline />
            </p>
            <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg lg:text-xl">
              A student-run technical club at Siddaganga Institute of Technology, bridging academic
              learning and professional development since 2019.
            </p>
          </Reveal>

          <Reveal delay={0.24}>
            <div className="mt-10 flex flex-wrap items-center gap-4">
              <Link
                href="/upcoming-events"
                className="group inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
              >
                See Upcoming Events
                <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
              </Link>
              <Link
                href="/our-team"
                className="inline-flex items-center gap-2 rounded-full border border-border-strong px-6 py-3 text-sm font-semibold text-text transition-colors hover:bg-white/[0.05]"
              >
                Meet the Team
              </Link>
            </div>
          </Reveal>

          <Reveal delay={0.32}>
            <div className="mt-16 grid max-w-xl grid-cols-3 gap-6 border-t border-border pt-8">
              <div>
                <p className="font-display text-3xl font-semibold sm:text-4xl">
                  <CountUp value={FOUNDED_YEAR} />
                </p>
                <p className="mt-1 text-xs text-text-muted sm:text-sm">Founded</p>
              </div>
              <div>
                <p className="font-display text-3xl font-semibold sm:text-4xl">
                  <CountUp value={eventsHosted} suffix="+" />
                </p>
                <p className="mt-1 text-xs text-text-muted sm:text-sm">Events Hosted</p>
              </div>
              <div>
                <p className="font-display text-3xl font-semibold sm:text-4xl">
                  <CountUp value={yearsActive} suffix="+" />
                </p>
                <p className="mt-1 text-xs text-text-muted sm:text-sm">Years Active</p>
              </div>
            </div>
          </Reveal>
        </section>
      </HeroSpotlight>

      <section className="pb-28">
        <div className="mx-auto max-w-6xl px-5 sm:px-6 lg:px-8">
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
