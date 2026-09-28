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

  return (
    <div className="mx-auto max-w-5xl px-5 py-14 sm:py-20">
      <Link
        href="/upcoming-events"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={14} />
        All upcoming events
      </Link>

      <div className="mt-6 grid gap-8 lg:grid-cols-[0.9fr_1fr] lg:items-start">
        {event.poster && (
          <Reveal>
            <div className="glass-card overflow-hidden rounded-3xl">
              <Image
                src={event.poster}
                alt={event.name}
                width={1131}
                height={1600}
                sizes="(min-width: 1024px) 460px, 100vw"
                className="h-auto w-full"
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
                <EventRegisterForm eventId={event.slug || event._id} />
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
