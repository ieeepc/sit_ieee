import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import { CalendarDays, Clock, MapPin, ArrowLeft, Download, FileText } from "lucide-react";
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
      { number: "01", name: "Your team", stage: "leader" },
      { number: "02", name: "Members", stage: "team" },
      { number: "03", name: "Abstract", stage: "abstract" },
    ] as const;
    const eventId = event.slug || event._id;

    return (
      <main className="bg-bg px-5 py-12 text-text sm:py-16">
        <div className="mx-auto w-full max-w-3xl">
          <Link
            href="/upcoming-events"
            className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
          >
            <ArrowLeft size={14} />
            All upcoming events
          </Link>

          <div className="mt-8">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">
              HACK-Z registration
            </p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              {event.name}
            </h1>

            <div className="mt-6 flex flex-wrap gap-3">
              <a
                href="/events/hack-z-brochure-2026.pdf"
                download="HACK-Z-2026-Brochure.pdf"
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-fg/[0.04]"
              >
                <Download size={16} />
                Download brochure
              </a>
              <a
                href="/HACK-Z-2026-Abstract-Template.docx"
                download="HACK-Z-2026-Abstract-Template.docx"
                className="inline-flex items-center gap-2 rounded-lg border border-border-strong px-4 py-2.5 text-sm font-semibold transition-colors hover:bg-fg/[0.04]"
              >
                <FileText size={16} />
                Abstract template
              </a>
            </div>

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
