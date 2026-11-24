import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ArrowLeft, CalendarDays, Clock, Download, MapPin, MessageCircle } from "lucide-react";
import { connectDB } from "@/lib/db";
import { findUpcomingEvent, isRegistrationOpen } from "@/lib/events";
import { formatDate } from "@/lib/utils";
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
    <main className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-bg px-3 py-5 text-text sm:px-5 sm:py-8">
      <div className="stage-grid pointer-events-none absolute inset-0 opacity-100" />
      <div className="stage-particles pointer-events-none absolute inset-0 opacity-35" />
      <div className="stage-aurora pointer-events-none absolute -left-[30%] -top-[55%] h-[140%] w-[160%] opacity-70" />
      <div className="stage-orb pointer-events-none absolute -left-20 top-10 h-[28rem] w-[28rem] rounded-full bg-accent-violet/35 blur-[100px]" />
      <div
        className="stage-orb pointer-events-none absolute -right-24 bottom-[-10%] h-[32rem] w-[32rem] rounded-full bg-accent-cyan/30 blur-[110px]"
        style={{ animationDelay: "-6s" }}
      />
      <div className="stage-scan pointer-events-none absolute inset-x-0 top-0 h-40 opacity-70" />

      <div className="relative mx-auto max-w-[92rem]">
        <Link
          href="/upcoming-events"
          className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={14} />
          All upcoming events
        </Link>

        <div className="stage-enter mx-auto mt-6 max-w-5xl sm:mt-8">
            <header className="mb-5 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="flex items-center gap-2 text-[10px] font-bold uppercase tracking-[0.3em] text-accent-cyan sm:text-[11px]">
                  <span className="relative flex h-1.5 w-1.5">
                    <span className="stage-blink absolute inline-flex h-full w-full rounded-full bg-accent-cyan" />
                  </span>
                  {event.name}
                </p>
                <h1 className="mt-3 font-display text-2xl font-semibold tracking-tight sm:text-3xl">
                  Registration <span className="text-gradient-animated">stages</span>
                </h1>
                <p className="mt-1.5 text-sm text-text-muted">
                  Stage {stageNumber} of 3 · {stageLabels[stageNumber - 1]}
                </p>
              </div>
              <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs font-medium text-text-muted">
                {event.date && (
                  <span className="flex items-center gap-1.5">
                    <CalendarDays size={14} className="text-accent-cyan" />
                    {formatDate(event.date)}
                  </span>
                )}
                {event.time && (
                  <span className="flex items-center gap-1.5">
                    <Clock size={14} className="text-accent-cyan" />
                    {event.time}
                  </span>
                )}
                {event.location && (
                  <span className="flex items-center gap-1.5">
                    <MapPin size={14} className="text-accent-cyan" />
                    {event.location}
                  </span>
                )}
                {event.registrationDeadline && (
                  <span className="inline-flex items-center gap-1.5 rounded-full border border-accent-amber/30 bg-accent-amber/10 px-2.5 py-1 text-[11px] text-accent-amber">
                    <Clock size={12} />
                    Closes {formatDate(event.registrationDeadline)}
                  </span>
                )}
              </div>
            </header>

            <section className="stage-neon-panel relative overflow-hidden rounded-[1.6rem] p-4 sm:p-6 lg:p-8">
              <span
                aria-hidden
                className="stage-ghost pointer-events-none absolute -top-10 right-3 select-none font-display text-[10rem] font-bold leading-none text-fg/[0.03] sm:right-6 sm:text-[13rem]"
              >
                0{stageNumber}
              </span>
              <div className="stage-orb pointer-events-none absolute right-[-8%] top-[-18%] h-80 w-80 rounded-full bg-accent-violet/25 blur-[90px]" />
              <div
                className="stage-orb pointer-events-none absolute bottom-[-15%] left-[-8%] h-72 w-72 rounded-full bg-accent-cyan/20 blur-[100px]"
                style={{ animationDelay: "-4s" }}
              />

              <div className="relative">
                <StageStepper eventId={eventId} current={stageNumber as 1 | 2 | 3} />
              </div>

              <div className="relative mt-7 border-t border-border pt-7 sm:mt-8 sm:pt-8">
                {stageNumber === 3 && (
                  <div className="mb-7 flex flex-col gap-4">
                    <div className="group relative flex flex-col gap-4 overflow-hidden rounded-2xl border border-dashed border-accent-rose/50 bg-accent-rose/[0.055] px-5 py-5 transition-colors hover:border-accent-rose/80 hover:bg-accent-rose/[0.08] sm:flex-row sm:items-center sm:justify-between">
                      <div className="pointer-events-none absolute -right-10 -top-10 h-32 w-32 rounded-full bg-accent-rose/15 blur-2xl transition-transform duration-500 group-hover:scale-125" />
                      <div className="relative">
                        <p className="font-display text-lg font-semibold text-accent-rose">Abstract template</p>
                        <p className="mt-1 text-xs text-text-muted">Use the template so your submission is formatted correctly.</p>
                      </div>
                      <a
                        href="/HACK-Z-2026-Abstract-Template.docx"
                        download="HACK-Z-2026-Abstract-Template.docx"
                        className="stage-sheen relative inline-flex w-fit items-center gap-2 rounded-lg border border-accent-rose/60 px-5 py-2.5 text-xs font-bold tracking-wider text-accent-rose transition-colors hover:bg-accent-rose/10"
                      >
                        <Download size={15} />
                        Download
                      </a>
                    </div>
                    {event.whatsappLink && (
                      <a
                        href={event.whatsappLink}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-between gap-4 rounded-2xl border border-[#25D366]/40 bg-[#25D366]/10 px-5 py-4 transition-colors hover:bg-[#25D366]/15"
                      >
                        <span className="flex items-center gap-2 text-sm font-semibold text-[#25D366]">
                          <MessageCircle size={17} />
                          Join the WhatsApp group
                        </span>
                        <span className="text-xs text-text-muted">Updates, venue and dress code</span>
                      </a>
                    )}
                  </div>
                )}

                <div className="mb-6 flex items-center gap-3">
                  <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border border-accent-rose/40 bg-accent-rose/10 font-display text-[11px] font-bold text-accent-rose shadow-[0_0_22px_rgba(251,113,133,.18)]">
                    0{stageNumber}
                  </span>
                  <h2 className="font-display text-2xl font-semibold text-accent-rose sm:text-3xl">
                    {stageLabels[stageNumber - 1]}
                  </h2>
                </div>

                <EventRegisterForm eventId={eventId} hackathon stage={stageNumber as 1 | 2 | 3} />
              </div>
            </section>
        </div>
      </div>
    </main>
  );
}
