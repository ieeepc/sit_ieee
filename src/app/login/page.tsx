"use client";

import Link from "next/link";
import { ArrowRight, GraduationCap, Users } from "lucide-react";
import Reveal from "@/components/Reveal";

const options = [
  {
    href: "/member-login",
    title: "Member Login",
    description: "Students in the chapter: log in with your USN, or sign up with the chapter secret key.",
    icon: Users,
    tint: "bg-accent-violet/20 text-accent-violet",
  },
  {
    href: "/faculty-login",
    title: "Faculty Login",
    description: "Faculty coordinators: log in to upload and view chapter documents year by year.",
    icon: GraduationCap,
    tint: "bg-accent-cyan/20 text-accent-cyan",
  },
];

export default function LoginChooserPage() {
  return (
    <div className="mx-auto flex min-h-[70vh] max-w-3xl flex-col justify-center px-5 py-20">
      <Reveal>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">
          Login
        </p>
        <h1 className="mt-3 text-center font-display text-3xl font-semibold tracking-tight">
          Who&apos;s logging in?
        </h1>
      </Reveal>

      <div className="mt-10 grid gap-4 sm:grid-cols-2">
        {options.map((o, i) => (
          <Reveal key={o.href} delay={0.08 + i * 0.06}>
            <Link
              href={o.href}
              className="glass-card group flex h-full flex-col rounded-2xl p-7 transition-all hover:-translate-y-1 hover:border-accent-cyan/50"
            >
              <span className={`flex h-12 w-12 items-center justify-center rounded-xl ${o.tint}`}>
                <o.icon size={22} />
              </span>
              <h2 className="mt-5 font-display text-xl font-semibold">{o.title}</h2>
              <p className="mt-2 flex-1 text-sm leading-relaxed text-text-muted">{o.description}</p>
              <span className="mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-accent-cyan">
                Continue
                <ArrowRight size={15} className="transition-transform group-hover:translate-x-1" />
              </span>
            </Link>
          </Reveal>
        ))}
      </div>
    </div>
  );
}
