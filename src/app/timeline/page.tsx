import { connectDB } from "@/lib/db";
import Event from "@/models/Event";
import Reveal from "@/components/Reveal";
import TimelineTrack from "@/components/TimelineTrack";

export const dynamic = "force-dynamic";

type EventItem = {
  _id: string;
  name: string;
  date: string;
  description: string;
  photos: { _id: string; url: string }[];
};

async function getEvents(): Promise<EventItem[]> {
  await connectDB();
  const events = await Event.find({}).sort({ date: -1 }).lean();
  return JSON.parse(JSON.stringify(events));
}

export default async function TimelinePage() {
  const events = await getEvents();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-24">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">Since 2019</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Our <span className="text-gradient">Timeline</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-text-muted sm:text-lg">
          A look back at every workshop, hackathon, and fest that shaped this chapter.
        </p>
      </Reveal>

      <TimelineTrack events={events} />
    </div>
  );
}
