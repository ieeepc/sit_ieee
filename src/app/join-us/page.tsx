import type { Metadata } from "next";
import Link from "next/link";
import { ArrowUpRight, BookOpen, Lightbulb, Users, Rocket, Sparkles } from "lucide-react";
import Reveal from "@/components/Reveal";

export const metadata: Metadata = {
  title: "Join Us — SIT IEEE Photonics & ComSoc",
  description: "We are recruiting 1st and 2nd year students from all branches. Learn, create, connect and lead with us.",
};

const expectations = [
  { icon: BookOpen, title: "Learn", text: "Gain exposure to new technologies, tools, and real-world experiences." },
  { icon: Lightbulb, title: "Create", text: "Turn your ideas into projects, initiatives, and meaningful experiences." },
  { icon: Users, title: "Connect", text: "Collaborate with like-minded students and learn from experienced peers." },
  {
    icon: Rocket,
    title: "Lead",
    text: "Develop the confidence, communication, teamwork, and leadership skills that set you apart.",
  },
];

export default function JoinUsPage() {
  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-6 sm:pb-20 sm:pt-10 lg:pb-24">
      <Reveal>
        <span className="inline-flex items-center gap-1.5 rounded-full bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
          <Sparkles size={14} />
          1st &amp; 2nd Year Students | All Branches
        </span>
        <h1 className="mt-4 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          We Are <span className="text-gradient">Recruiting</span>
        </h1>
        <p className="mt-4 font-display text-xl font-medium sm:text-2xl">
          Your journey starts with a choice. Make it count.
        </p>
        <p className="mt-4 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
          Step beyond the classroom and become part of a community where ideas are explored, skills are built, and
          people grow together.
        </p>
        <p className="mt-3 max-w-2xl text-base leading-relaxed text-text-muted sm:text-lg">
          Whether you are passionate about technology, creativity, design, communication, leadership, or simply eager
          to try something new, there is a place for you here.
        </p>
        <Link
          href="/join-us/register"
          className="mt-8 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
        >
          Register Now
          <ArrowUpRight size={16} />
        </Link>
      </Reveal>

      <section className="mt-16 sm:mt-20">
        <Reveal>
          <h2 className="font-display text-2xl font-semibold sm:text-3xl">What You Can Expect</h2>
        </Reveal>
        <div className="mt-8 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
          {expectations.map((e, i) => (
            <Reveal key={e.title} delay={i * 0.06}>
              <div className="glass-card flex h-full flex-col rounded-2xl p-6 transition-colors hover:border-border-strong">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 text-accent-cyan">
                  <e.icon size={20} />
                </span>
                <p className="mt-4 font-display text-lg font-semibold">{e.title}</p>
                <p className="mt-2 text-sm leading-relaxed text-text-muted">{e.text}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      <Reveal delay={0.1}>
        <section className="glass-card mt-16 rounded-3xl px-7 py-12 text-center sm:mt-20 sm:px-12">
          <p className="mx-auto max-w-xl text-base leading-relaxed text-text-muted sm:text-lg">
            You do not need to have everything figured out.
            <br />
            All you need is <span className="text-text">curiosity, enthusiasm, and the willingness to learn.</span>
          </p>
          <h2 className="mt-8 font-display text-2xl font-semibold sm:text-3xl">Ready to Be Part of Something More?</h2>
          <p className="mx-auto mt-3 max-w-xl text-sm text-text-muted sm:text-base">
            Take the first step. Join us and make your college journey more meaningful.
          </p>
          <Link
            href="/join-us/register"
            className="mt-7 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
          >
            Register Now
            <ArrowUpRight size={16} />
          </Link>
        </section>
      </Reveal>
    </div>
  );
}
