import type { Metadata } from "next";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import Reveal from "@/components/Reveal";
import RecruitmentForm from "@/components/RecruitmentForm";

export const metadata: Metadata = {
  title: "Register — Join SIT IEEE Photonics & ComSoc",
};

export default function JoinUsRegisterPage() {
  return (
    <div className="mx-auto max-w-xl px-5 pb-16 pt-6 sm:pb-20 sm:pt-10">
      <Link
        href="/join-us"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={14} />
        Back to Join Us
      </Link>
      <Reveal>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">We Are Recruiting</p>
        <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Join the <span className="text-gradient">Team</span>
        </h1>
        <p className="mt-2 text-sm text-text-muted">Open to 1st &amp; 2nd year students from all branches.</p>
      </Reveal>
      <Reveal delay={0.1}>
        <div className="glass-card mt-8 rounded-3xl p-7 sm:p-9">
          <RecruitmentForm />
        </div>
      </Reveal>
    </div>
  );
}
