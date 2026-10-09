import Image from "next/image";
import Link from "next/link";
import { connectDB } from "@/lib/db";
import UpcomingEvent from "@/models/UpcomingEvent";
import Reveal from "@/components/Reveal";
import { formatDate } from "@/lib/utils";
import { isEventOver } from "@/lib/events";
import { CalendarDays, MapPin, ArrowUpRight, Clapperboard, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

type EventItem = {
  _id: string;
  name: string;
  date?: string;
  description: string;
  location?: string;
  registrationLink?: string;
  registrationDeadline?: string;
  poster?: string;
  slug?: string;
  time?: string;
  openRegistration?: boolean;
};

// Events that take on-site registrations get their own Register Now page; others fall back to an external link.
function registerHref(e: EventItem) {
  if (e.openRegistration) return `/upcoming-events/${e.slug || e._id}/register`;
  return e.registrationLink || "";
}

async function getEvents(): Promise<EventItem[]> {
  await connectDB();
  const all: EventItem[] = JSON.parse(JSON.stringify(await UpcomingEvent.find({}).sort({ date: 1 }).lean()));
  const events = all.filter((e) => !isEventOver(e));
  // Mongo sorts missing dates first — keep dated events up front and "TBA" ones at the end.
  return [...events.filter((e) => e.date), ...events.filter((e) => !e.date)];
}

export default async function UpcomingEventsPage() {
  const events = await getEvents();
  const [featured, ...rest] = events;

  return (
    <div className="mx-auto max-w-6xl px-5 pb-16 pt-4 sm:pb-20 sm:pt-6 lg:pb-24">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">What&apos;s next</p>
        <h1 className="mt-2 font-display text-4xl font-semibold tracking-tight sm:text-5xl">
          Upcoming <span className="text-gradient">Events</span>
        </h1>
        <p className="mt-2 max-w-xl text-base text-text-muted">
          Join us for exciting events and activities. Stay tuned for what&apos;s coming next.
        </p>
      </Reveal>

      {!featured ? (
        <Reveal delay={0.1}>
          <div className="glass-card mt-8 flex flex-col items-center gap-4 rounded-3xl px-8 py-16 text-center sm:py-20">
            <span className="flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-accent-cyan/20 to-accent-violet/20 text-accent-cyan">
              <Clapperboard size={28} />
            </span>
            <p className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Stay <span className="text-gradient">Tuned!</span>
            </p>
            <p className="max-w-md text-sm leading-relaxed text-text-muted sm:text-base">
              Something exciting is on its way. Our next workshop, talk or fest is in the making — check back soon or
              follow us on Instagram so you don&apos;t miss the announcement.
            </p>
            <div className="mt-3 flex flex-wrap justify-center gap-3">
              <a
                href="https://www.instagram.com/sit.ieee.photonics.comsoc/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
              >
                Follow on Instagram
                <ArrowUpRight size={16} />
              </a>
              <Link
                href="/join-us"
                className="inline-flex items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.05]"
              >
                Join the Team
              </Link>
            </div>
          </div>
        </Reveal>
      ) : (
        <>
          <Reveal delay={0.1}>
            <article className="glass-card mt-6 overflow-hidden rounded-3xl">
              {featured.registrationDeadline && (
                <div className="overflow-hidden bg-gradient-to-r from-accent-rose/20 via-accent-amber/20 to-accent-rose/20 px-4 py-2.5 text-center text-xs font-semibold text-accent-amber sm:text-sm">
                  Hurry! Registration closes on {formatDate(featured.registrationDeadline)}
                </div>
              )}
              <div className={featured.poster ? "lg:grid lg:grid-cols-[auto_1fr] lg:items-center" : ""}>
                {featured.poster && (
                  <div className="px-4 pt-4 sm:px-8 lg:py-6 lg:pl-6 lg:pr-0">
                    <Image
                      src={featured.poster}
                      alt={featured.name}
                      width={1131}
                      height={1600}
                      sizes="(min-width: 640px) 512px, 100vw"
                      className="mx-auto h-auto max-h-[calc(100svh-17rem)] w-auto max-w-full rounded-2xl lg:max-w-[460px]"
                      priority
                    />
                  </div>
                )}
                <div className="mx-auto flex max-w-3xl flex-col p-7 sm:p-10 lg:mx-0">
                  {(featured.date || featured.time || featured.location) && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-accent-cyan sm:text-sm">
                      {featured.date && (
                        <span className="flex items-center gap-1.5">
                          <CalendarDays size={15} />
                          {formatDate(featured.date)}
                        </span>
                      )}
                      {featured.time && (
                        <span className="flex items-center gap-1.5">
                          <Clock size={15} />
                          {featured.time}
                        </span>
                      )}
                      {featured.location && (
                        <span className="flex items-center gap-1.5 text-text-muted">
                          <MapPin size={15} />
                          {featured.location}
                        </span>
                      )}
                    </div>
                  )}
                  <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl lg:text-4xl">
                    {featured.name}
                  </h2>
                  <p className="mt-4 whitespace-pre-line text-sm leading-relaxed text-text-muted sm:text-base">
                    {featured.description}
                  </p>
                  {featured.openRegistration ? (
                    <Link
                      href={registerHref(featured)}
                      className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
                    >
                      Register Now
                      <ArrowUpRight size={16} />
                    </Link>
                  ) : featured.registrationLink ? (
                    <a
                      href={featured.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
                    >
                      Register Now
                      <ArrowUpRight size={16} />
                    </a>
                  ) : null}
                </div>
              </div>
            </article>
          </Reveal>

          {rest.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {rest.map((e, i) => (
                <Reveal key={e._id} delay={i * 0.06}>
                  <article className="glass-card group flex h-full flex-col overflow-hidden rounded-2xl transition-colors hover:border-border-strong">
                    {e.poster && (
                      <div className="relative h-56 w-full overflow-hidden sm:h-64">
                        <Image
                          src={e.poster}
                          alt={e.name}
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      {e.date && (
                        <div className="flex items-center gap-2 text-xs font-medium text-accent-cyan">
                          <CalendarDays size={14} />
                          {formatDate(e.date)}
                          {e.time && ` · ${e.time}`}
                        </div>
                      )}
                      <h3 className="mt-2 font-display text-lg font-semibold sm:text-xl">{e.name}</h3>
                      {e.location && (
                        <div className="mt-1.5 flex items-center gap-1.5 text-xs text-text-muted">
                          <MapPin size={13} />
                          {e.location}
                        </div>
                      )}
                      <p className="mt-3 flex-1 text-sm leading-relaxed text-text-muted">{e.description}</p>
                      {e.registrationDeadline && (
                        <p className="mt-3 flex items-center gap-1.5 text-xs text-accent-amber">
                          <Clock size={13} />
                          Closes {formatDate(e.registrationDeadline)}
                        </p>
                      )}
                      {registerHref(e) && (
                        <a
                          href={registerHref(e)}
                          {...(e.openRegistration ? {} : { target: "_blank", rel: "noopener noreferrer" })}
                          className="mt-5 inline-flex w-fit items-center gap-1.5 rounded-full bg-white/[0.06] px-4 py-2 text-xs font-semibold transition-colors hover:bg-white/[0.12]"
                        >
                          Register
                          <ArrowUpRight size={14} />
                        </a>
                      )}
                    </div>
                  </article>
                </Reveal>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
}
