"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, CalendarDays, FileDown, Loader2, Search, UserPlus, Users } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { formatDate } from "@/lib/utils";
import { downloadCsv } from "@/lib/csv";
import Reveal from "@/components/Reveal";
import QrCard from "@/components/QrCard";

type Registration = { _id: string; name: string; usn: string; phone: string; createdAt: string };
type EventWithRegistrations = {
  _id: string;
  name: string;
  slug: string;
  date?: string;
  time?: string;
  registrations: Registration[];
};
type Application = {
  _id: string;
  name: string;
  usn: string;
  year: number;
  branch: string;
  email: string;
  phone: string;
  createdAt: string;
};

const pill = (active: boolean) =>
  `flex items-center gap-1.5 rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
    active ? "bg-gradient-to-r from-accent-cyan to-accent-violet text-black" : "border border-border-strong hover:bg-white/[0.05]"
  }`;

const inputClass =
  "w-full rounded-xl border border-border bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-accent-cyan/60";

function formatRegisteredAt(date: string) {
  return new Date(date).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "numeric", minute: "2-digit" });
}

export default function MemberRegistrationsPage() {
  const router = useRouter();
  const { member, loading } = useSession();
  const [events, setEvents] = useState<EventWithRegistrations[] | null>(null);
  const [applications, setApplications] = useState<Application[] | null>(null);
  const [view, setView] = useState<"events" | "recruitment">("events");
  const [selectedId, setSelectedId] = useState<string | null>(null);

  useEffect(() => {
    if (!loading && !member) router.replace("/member-login");
  }, [loading, member, router]);

  useEffect(() => {
    if (!member) return;
    fetch("/api/registrations", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setEvents(data.events ?? []))
      .catch(() => setEvents([]));
    fetch("/api/join-us", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => setApplications([]));
  }, [member]);

  if (loading || !member || events === null || applications === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-text-muted" />
      </div>
    );
  }

  const selected = events.find((e) => e._id === selectedId) ?? events[0];

  return (
    <div className="mx-auto max-w-6xl px-5 py-16">
      <Link
        href="/member/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={14} />
        Back to profile
      </Link>
      <Reveal>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">Registrations</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Who&apos;s signed up</h1>
      </Reveal>

      <div className="mt-6 flex flex-wrap gap-2">
        <button onClick={() => setView("events")} className={pill(view === "events")}>
          <CalendarDays size={14} />
          Event Registrations
        </button>
        <button onClick={() => setView("recruitment")} className={pill(view === "recruitment")}>
          <UserPlus size={14} />
          Recruitment ({applications.length})
        </button>
      </div>

      {view === "recruitment" ? (
        <RecruitmentApplications applications={applications} />
      ) : !selected ? (
        <p className="glass-card mt-6 rounded-2xl p-7 text-sm text-text-muted">
          No events are taking registrations on the site yet.
        </p>
      ) : (
        <>
          {events.length > 1 && (
            <div className="mt-4 flex flex-wrap gap-2">
              {events.map((e) => (
                <button key={e._id} onClick={() => setSelectedId(e._id)} className={pill(e._id === selected._id)}>
                  {e.name} ({e.registrations.length})
                </button>
              ))}
            </div>
          )}
          <EventRegistrations key={selected._id} event={selected} />
        </>
      )}
    </div>
  );
}

function EventRegistrations({ event }: { event: EventWithRegistrations }) {
  const [query, setQuery] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return event.registrations;
    return event.registrations.filter(
      (r) => r.name.toLowerCase().includes(q) || r.usn.toLowerCase().includes(q) || r.phone.includes(q)
    );
  }, [event.registrations, query]);

  function exportCsv() {
    downloadCsv(`${event.slug || event.name}-registrations.csv`, [
      ["#", "Name", "USN", "Phone", "Registered At"],
      ...event.registrations.map((r, i) => [
        String(i + 1),
        r.name,
        r.usn,
        r.phone,
        new Date(r.createdAt).toLocaleString("en-IN"),
      ]),
    ]);
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <Reveal delay={0.05}>
        <div className="glass-card min-w-0 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold">{event.name}</p>
              {event.date && (
                <p className="text-xs text-text-muted">
                  {formatDate(event.date)}
                  {event.time && ` · ${event.time}`}
                </p>
              )}
            </div>
            <CountBadge count={event.registrations.length} label="registered" />
          </div>

          <Toolbar query={query} setQuery={setQuery} onExport={exportCsv} canExport={event.registrations.length > 0} />

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[520px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-text-faint">
                <tr className="border-b border-border">
                  <th className="py-2.5 pr-3 font-medium">#</th>
                  <th className="py-2.5 pr-3 font-medium">Name</th>
                  <th className="py-2.5 pr-3 font-medium">USN</th>
                  <th className="py-2.5 pr-3 font-medium">Phone</th>
                  <th className="py-2.5 font-medium">Registered</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <EmptyRow colSpan={5} none={event.registrations.length === 0} noneText="No registrations yet." />
                ) : (
                  filtered.map((r) => (
                    <tr key={r._id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3 text-text-faint">
                        {event.registrations.length - event.registrations.indexOf(r)}
                      </td>
                      <td className="py-2.5 pr-3 font-medium">{r.name}</td>
                      <td className="py-2.5 pr-3 text-text-muted">{r.usn}</td>
                      <td className="py-2.5 pr-3">
                        <a href={`tel:${r.phone}`} className="text-text-muted hover:text-accent-cyan">
                          {r.phone}
                        </a>
                      </td>
                      <td className="py-2.5 text-xs text-text-faint">{formatRegisteredAt(r.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <QrCard
          path={`/upcoming-events/${event.slug || event._id}/register`}
          title="Registration QR"
          fileName={`${event.slug || "event"}-register-qr.png`}
        />
      </Reveal>
    </div>
  );
}

function RecruitmentApplications({ applications }: { applications: Application[] }) {
  const [query, setQuery] = useState("");
  const [year, setYear] = useState<0 | 1 | 2>(0);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return applications.filter(
      (a) =>
        (year === 0 || a.year === year) &&
        (!q ||
          [a.name, a.usn, a.branch, a.email].some((v) => v.toLowerCase().includes(q)) ||
          a.phone.includes(q))
    );
  }, [applications, query, year]);

  function exportCsv() {
    downloadCsv("recruitment-applications.csv", [
      ["#", "Name", "USN", "Year", "Branch", "Email", "Phone", "Applied At"],
      ...applications.map((a, i) => [
        String(i + 1),
        a.name,
        a.usn,
        a.year === 1 ? "1st Year" : "2nd Year",
        a.branch,
        a.email,
        a.phone,
        new Date(a.createdAt).toLocaleString("en-IN"),
      ]),
    ]);
  }

  const firstYears = applications.filter((a) => a.year === 1).length;

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <Reveal delay={0.05}>
        <div className="glass-card min-w-0 rounded-2xl p-6">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-lg font-semibold">We Are Recruiting</p>
              <p className="text-xs text-text-muted">
                1st year: {firstYears} · 2nd year: {applications.length - firstYears}
              </p>
            </div>
            <CountBadge count={applications.length} label="applied" />
          </div>

          <div className="mt-5 flex flex-wrap gap-2">
            {([0, 1, 2] as const).map((y) => (
              <button key={y} onClick={() => setYear(y)} className={pill(year === y)}>
                {y === 0 ? "All years" : y === 1 ? "1st Year" : "2nd Year"}
              </button>
            ))}
          </div>

          <Toolbar
            query={query}
            setQuery={setQuery}
            onExport={exportCsv}
            canExport={applications.length > 0}
            placeholder="Search name, USN, branch, email or phone"
          />

          <div className="mt-5 overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="text-xs uppercase tracking-wider text-text-faint">
                <tr className="border-b border-border">
                  <th className="py-2.5 pr-3 font-medium">#</th>
                  <th className="py-2.5 pr-3 font-medium">Name</th>
                  <th className="py-2.5 pr-3 font-medium">USN</th>
                  <th className="py-2.5 pr-3 font-medium">Year</th>
                  <th className="py-2.5 pr-3 font-medium">Branch</th>
                  <th className="py-2.5 pr-3 font-medium">Email</th>
                  <th className="py-2.5 pr-3 font-medium">Phone</th>
                  <th className="py-2.5 font-medium">Applied</th>
                </tr>
              </thead>
              <tbody>
                {filtered.length === 0 ? (
                  <EmptyRow colSpan={8} none={applications.length === 0} noneText="No applications yet." />
                ) : (
                  filtered.map((a) => (
                    <tr key={a._id} className="border-b border-border/60 last:border-0">
                      <td className="py-2.5 pr-3 text-text-faint">{applications.length - applications.indexOf(a)}</td>
                      <td className="py-2.5 pr-3 font-medium">{a.name}</td>
                      <td className="py-2.5 pr-3 text-text-muted">{a.usn}</td>
                      <td className="py-2.5 pr-3 text-text-muted">{a.year === 1 ? "1st" : "2nd"}</td>
                      <td className="py-2.5 pr-3 text-text-muted">{a.branch}</td>
                      <td className="py-2.5 pr-3">
                        <a href={`mailto:${a.email}`} className="text-text-muted hover:text-accent-cyan">
                          {a.email}
                        </a>
                      </td>
                      <td className="py-2.5 pr-3">
                        <a href={`tel:${a.phone}`} className="text-text-muted hover:text-accent-cyan">
                          {a.phone}
                        </a>
                      </td>
                      <td className="py-2.5 text-xs text-text-faint">{formatRegisteredAt(a.createdAt)}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <QrCard path="/join-us" title="Join Us QR" fileName="join-us-qr.png" />
      </Reveal>
    </div>
  );
}

function CountBadge({ count, label }: { count: number; label: string }) {
  return (
    <span className="flex items-center gap-1.5 rounded-full bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
      <Users size={14} />
      {count} {label}
    </span>
  );
}

function Toolbar({
  query,
  setQuery,
  onExport,
  canExport,
  placeholder = "Search name, USN or phone",
}: {
  query: string;
  setQuery: (v: string) => void;
  onExport: () => void;
  canExport: boolean;
  placeholder?: string;
}) {
  return (
    <div className="mt-5 flex flex-wrap gap-3">
      <label className="relative min-w-0 flex-1">
        <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" />
        <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={placeholder} className={inputClass} />
      </label>
      <button
        onClick={onExport}
        disabled={!canExport}
        className="flex items-center gap-2 rounded-xl border border-border-strong px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-white/[0.05] disabled:opacity-50"
      >
        <FileDown size={15} />
        Export CSV
      </button>
    </div>
  );
}

function EmptyRow({ colSpan, none, noneText }: { colSpan: number; none: boolean; noneText: string }) {
  return (
    <tr>
      <td colSpan={colSpan} className="py-8 text-center text-text-muted">
        {none ? noneText : "No matches."}
      </td>
    </tr>
  );
}
