import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, ArrowLeft } from "lucide-react";
import { connectDB } from "@/lib/db";
import { findUpcomingEvent, isRegistrationOpen } from "@/lib/events";
import { formatDate } from "@/lib/utils";
import Reveal from "@/components/Reveal";
import EventRegisterForm from "@/components/EventRegisterForm";
import RegistrationChooser from "@/components/RegistrationChooser";

export const dynamic = "force-dynamic";

type EventItem = {
  _id: string;
  name: string;
  slug?: string;
  date?: string;
  time?: string;
  description: string;
  location?: string;
  poster?: string;
  openRegistration?: boolean;
  registrationDeadline?: string;
};

async function getEvent(id: string): Promise<EventItem | null> {
  await connectDB();
  const event = await findUpcomingEvent(id).lean();
  return event ? JSON.parse(JSON.stringify(event)) : null;
}

export async function generateMetadata({ params }: PageProps<"/upcoming-events/[id]/register">): Promise<Metadata> {
  const { id } = await params;
  const event = await getEvent(id);
  return { title: event ? `Register — ${event.name}` : "Register" };
}

export default async function RegisterPage({ params }: PageProps<"/upcoming-events/[id]/register">) {
  const { id } = await params;
  const event = await getEvent(id);
  if (!event || !event.openRegistration) notFound();

  const open = isRegistrationOpen(event);
  if (/hack[- ]?z/i.test(`${event.name} ${event.slug ?? ""}`) && open) {
    const stageLabels = [
      { number: "01", name: "Your team", description: "Team name, college, domain and size", stage: "leader", icon: "01" },
      { number: "02", name: "Members", description: "Three or four team members", stage: "team", icon: "02" },
      { number: "03", name: "Abstract", description: "Submit your idea and presentation", stage: "abstract", icon: "03" },
    ] as const;
    const eventId = event.slug || event._id;

    return (
      <main className="relative min-h-[calc(100svh-5rem)] overflow-hidden bg-bg px-5 py-10 text-text sm:py-14">
        <div className="stage-grid pointer-events-none absolute inset-0 opacity-100" />
        <div className="stage-particles pointer-events-none absolute inset-0 opacity-40" />
        <div className="stage-aurora pointer-events-none absolute -left-[20%] -top-[45%] h-[130%] w-[140%] opacity-60" />
        <div className="stage-orb pointer-events-none absolute -right-24 top-1/3 h-80 w-80 rounded-full bg-accent-cyan/20 blur-[100px]" />
        <div
          className="stage-orb pointer-events-none absolute bottom-0 left-1/4 h-72 w-72 rounded-full bg-accent-violet/20 blur-[110px]"
          style={{ animationDelay: "-5s" }}
        />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_75%_65%,rgba(226,29,72,.12),transparent_28%),radial-gradient(circle_at_20%_15%,rgba(59,130,246,.10),transparent_25%)]" />
        <div className="relative mx-auto max-w-3xl">
          <Link
            href="/upcoming-events"
            className="group inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft size={14} className="transition-transform duration-300 group-hover:-translate-x-1" />
            All upcoming events
          </Link>

          <div className="stage-enter mt-10 sm:mt-14">
            <p className="flex items-center gap-2 text-xs font-bold uppercase tracking-[0.32em] text-accent-cyan">
              <span className="relative flex h-1.5 w-1.5">
                <span className="stage-blink absolute inline-flex h-full w-full rounded-full bg-accent-cyan" />
              </span>
              HACK-Z registration
            </p>
            <h1 className="mt-4 font-display text-2xl font-semibold tracking-tight sm:text-4xl lg:text-5xl">
              HACK-Z <span className="text-gradient-animated">12 Hour National Level Hackathon</span>
            </h1>
            <RegistrationChooser eventId={eventId} stages={stageLabels} />
          </div>
        </div>
      </main>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
      <Link
        href="/upcoming-events"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={14} />
        All upcoming events
      </Link>

      <div className="mx-auto mt-6 flex max-w-2xl flex-col gap-8">
        {event.poster && (
          <Reveal>
            <div className="glass-card mx-auto w-fit max-w-full overflow-hidden rounded-3xl">
              <Image
                src={event.poster}
                alt={event.name}
                width={1131}
                height={1600}
                sizes="(min-width: 640px) 512px, 100vw"
                className="h-auto max-h-[75vh] w-auto max-w-full"
                priority
              />
            </div>
          </Reveal>
        )}

        <Reveal delay={0.1}>
          <div className="glass-card rounded-3xl p-7 sm:p-9">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">Register Now</p>
            <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">{event.name}</h1>
            <div className="mt-4 flex flex-wrap gap-x-4 gap-y-1.5 text-xs font-medium text-accent-cyan sm:text-sm">
              {event.date && (
                <span className="flex items-center gap-1.5">
                  <CalendarDays size={15} />
                  {formatDate(event.date)}
                </span>
              )}
              {event.time && (
                <span className="flex items-center gap-1.5">
                  <Clock size={15} />
                  {event.time}
                </span>
              )}
              {event.location && (
                <span className="flex items-center gap-1.5 text-text-muted">
                  <MapPin size={15} />
                  {event.location}
                </span>
              )}
            </div>
            {event.description && (
              <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-text-muted">{event.description}</p>
            )}

            <div className="mt-8 border-t border-border pt-7">
              {open ? (
                <EventRegisterForm
                  eventId={event.slug || event._id}
                  hackathon={/hack[- ]?z/i.test(`${event.name} ${event.slug ?? ""}`)}
                />
              ) : (
                <p className="text-sm text-accent-amber">Registrations for this event are closed.</p>
              )}
            </div>
          </div>
        </Reveal>
      </div>
    </div>
  );
}
