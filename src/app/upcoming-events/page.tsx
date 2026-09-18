import Image from "next/image";
import { connectDB } from "@/lib/db";
import UpcomingEvent from "@/models/UpcomingEvent";
import Reveal from "@/components/Reveal";
import { formatDate } from "@/lib/utils";
import { CalendarDays, MapPin, ArrowUpRight, PartyPopper, Clock } from "lucide-react";

export const dynamic = "force-dynamic";

type EventItem = {
  _id: string;
  name: string;
  date: string;
  description: string;
  location?: string;
  registrationLink?: string;
  registrationDeadline?: string;
  poster?: string;
};

async function getEvents(): Promise<EventItem[]> {
  await connectDB();
  const events = await UpcomingEvent.find({}).sort({ date: 1 }).lean();
  return JSON.parse(JSON.stringify(events));
}

export default async function UpcomingEventsPage() {
  const events = await getEvents();
  const [featured, ...rest] = events;

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-24">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">What&apos;s next</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Upcoming <span className="text-gradient">Events</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-text-muted sm:text-lg">
          Join us for exciting events and activities. Stay tuned for what&apos;s coming next.
        </p>
      </Reveal>

      {!featured ? (
        <Reveal delay={0.1}>
          <div className="glass-card mt-14 flex flex-col items-center gap-4 rounded-2xl px-8 py-20 text-center">
            <PartyPopper className="text-accent-cyan" size={32} />
            <p className="font-display text-xl font-semibold">Nothing on the calendar just yet</p>
            <p className="max-w-sm text-sm text-text-muted">
              We&apos;re cooking up the next workshop, hackathon, or fest. Follow our socials or check back soon.
            </p>
          </div>
        </Reveal>
      ) : (
        <>
          <Reveal delay={0.1}>
            <article className="glass-card mt-14 overflow-hidden rounded-3xl">
              {featured.registrationDeadline && (
                <div className="overflow-hidden bg-gradient-to-r from-accent-rose/20 via-accent-amber/20 to-accent-rose/20 px-4 py-2.5 text-center text-xs font-semibold text-accent-amber sm:text-sm">
                  Hurry! Registration closes on {formatDate(featured.registrationDeadline)}
                </div>
              )}
              <div className="grid gap-0 lg:grid-cols-2">
                <div className="relative h-64 w-full sm:h-80 lg:h-full lg:min-h-[420px]">
                  {featured.poster ? (
                    <Image
                      src={featured.poster}
                      alt={featured.name}
                      fill
                      sizes="(min-width: 1024px) 576px, 100vw"
                      className="object-cover"
                      priority
                    />
                  ) : (
                    <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-violet/25 to-accent-cyan/25">
                      <CalendarDays className="text-text-muted" size={40} />
                    </div>
                  )}
                </div>
                <div className="flex flex-col justify-center p-7 sm:p-10">
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs font-medium text-accent-cyan sm:text-sm">
                    <span className="flex items-center gap-1.5">
                      <CalendarDays size={15} />
                      {formatDate(featured.date)}
                    </span>
                    {featured.location && (
                      <span className="flex items-center gap-1.5 text-text-muted">
                        <MapPin size={15} />
                        {featured.location}
                      </span>
                    )}
                  </div>
                  <h2 className="mt-3 font-display text-2xl font-semibold sm:text-3xl lg:text-4xl">
                    {featured.name}
                  </h2>
                  <p className="mt-4 text-sm leading-relaxed text-text-muted sm:text-base">
                    {featured.description}
                  </p>
                  {featured.registrationLink && (
                    <a
                      href={featured.registrationLink}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="mt-7 inline-flex w-fit items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
                    >
                      Register Now
                      <ArrowUpRight size={16} />
                    </a>
                  )}
                </div>
              </div>
            </article>
          </Reveal>

          {rest.length > 0 && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              {rest.map((e, i) => (
                <Reveal key={e._id} delay={i * 0.06}>
                  <article className="glass-card group flex h-full flex-col overflow-hidden rounded-2xl transition-colors hover:border-border-strong">
                    {e.poster ? (
                      <div className="relative h-56 w-full overflow-hidden sm:h-64">
                        <Image
                          src={e.poster}
                          alt={e.name}
                          fill
                          sizes="(min-width: 640px) 50vw, 100vw"
                          className="object-cover transition-transform duration-500 group-hover:scale-105"
                        />
                      </div>
                    ) : (
                      <div className="flex h-56 w-full items-center justify-center bg-gradient-to-br from-accent-violet/20 to-accent-cyan/20 sm:h-64">
                        <CalendarDays className="text-text-muted" size={32} />
                      </div>
                    )}
                    <div className="flex flex-1 flex-col p-6">
                      <div className="flex items-center gap-2 text-xs font-medium text-accent-cyan">
                        <CalendarDays size={14} />
                        {formatDate(e.date)}
                      </div>
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
                      {e.registrationLink && (
                        <a
                          href={e.registrationLink}
                          target="_blank"
                          rel="noopener noreferrer"
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
