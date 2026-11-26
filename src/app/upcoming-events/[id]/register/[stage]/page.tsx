import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, Download } from "lucide-react";
import { connectDB } from "@/lib/db";
import { findUpcomingEvent, isRegistrationOpen } from "@/lib/events";
import EventRegisterForm from "@/components/EventRegisterForm";
import StageStepper from "@/components/StageStepper";

export const dynamic = "force-dynamic";

type Stage = "leader" | "team" | "abstract";

async function getEvent(id: string) {
  await connectDB();
  const event = await findUpcomingEvent(id).lean();
  return event ? JSON.parse(JSON.stringify(event)) : null;
}

export async function generateMetadata({
  params,
}: PageProps<"/upcoming-events/[id]/register/[stage]">): Promise<Metadata> {
  const { id, stage } = await params;
  const event = await getEvent(id);
  const titles = { leader: "Your team", team: "Members", abstract: "Abstract submission" };
  return {
    title: event ? `${titles[stage as Stage] ?? "Register"} — ${event.name}` : "Register",
  };
}

export default async function RegistrationStagePage({
  params,
}: PageProps<"/upcoming-events/[id]/register/[stage]">) {
  const { id, stage } = await params;
  if (!["leader", "team", "abstract"].includes(stage)) notFound();

  const event = await getEvent(id);
  if (!event || !event.openRegistration) notFound();
  if (!/hack[- ]?z/i.test(`${event.name} ${event.slug ?? ""}`)) {
    redirect(`/upcoming-events/${event.slug || event._id}/register`);
  }
  if (!isRegistrationOpen(event)) notFound();

  const stageNumber = stage === "leader" ? 1 : stage === "team" ? 2 : 3;
  const stageLabels = ["Your team", "Members", "Abstract"];
  const eventId = event.slug || event._id;

  return (
    <main className="bg-bg px-5 py-10 text-text sm:py-14">
      <div className="mx-auto w-full max-w-3xl">
        <Link
          href="/upcoming-events"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={14} />
          All upcoming events
        </Link>

        <header className="mt-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">{event.name}</p>
          <h1 className="mt-2 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
            Registration — stage {stageNumber} of 3
          </h1>
        </header>

        <div className="mt-6">
          <StageStepper eventId={eventId} current={stageNumber as 1 | 2 | 3} />
        </div>

        <section className="mt-6 rounded-xl border border-border bg-bg-elevated/60 p-5 sm:p-7">
          {stageNumber === 3 && (
            <div className="mb-6 flex flex-col gap-3 rounded-lg border border-border bg-fg/[0.02] px-4 py-3 sm:flex-row sm:items-center sm:justify-between">
              <span className="text-sm font-semibold">Abstract template</span>
              <a
                href="/HACK-Z-2026-Abstract-Template.docx"
                download="HACK-Z-2026-Abstract-Template.docx"
                className="inline-flex w-fit items-center gap-2 rounded-lg border border-border-strong px-4 py-2 text-xs font-semibold transition-colors hover:bg-fg/[0.04]"
              >
                <Download size={14} />
                Download
              </a>
            </div>
          )}

          <h2 className="mb-5 font-display text-xl font-semibold">{stageLabels[stageNumber - 1]}</h2>

          <EventRegisterForm eventId={eventId} hackathon stage={stageNumber as 1 | 2 | 3} />
        </section>
      </div>
    </main>
  );
}
