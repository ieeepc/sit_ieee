"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import QRCode from "qrcode";
import { toast } from "sonner";
import { ArrowLeft, Copy, Download, FileDown, Loader2, QrCode, Search, Users } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { formatDate } from "@/lib/utils";
import Reveal from "@/components/Reveal";

type Registration = { _id: string; name: string; usn: string; phone: string; createdAt: string };
type EventWithRegistrations = {
  _id: string;
  name: string;
  slug: string;
  date?: string;
  time?: string;
  registrations: Registration[];
};

export default function MemberRegistrationsPage() {
  const router = useRouter();
  const { member, loading } = useSession();
  const [events, setEvents] = useState<EventWithRegistrations[] | null>(null);
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
  }, [member]);

  if (loading || !member || events === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-text-muted" />
      </div>
    );
  }

  const selected = events.find((e) => e._id === selectedId) ?? events[0];

  return (
    <div className="mx-auto max-w-5xl px-5 py-20">
      <Link
        href="/member/dashboard"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={14} />
        Back to profile
      </Link>
      <Reveal>
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">Event Registrations</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Who&apos;s coming</h1>
      </Reveal>

      {!selected ? (
        <p className="glass-card mt-8 rounded-2xl p-7 text-sm text-text-muted">
          No events are taking registrations on the site yet.
        </p>
      ) : (
        <>
          {events.length > 1 && (
            <div className="mt-8 flex flex-wrap gap-2">
              {events.map((e) => (
                <button
                  key={e._id}
                  onClick={() => setSelectedId(e._id)}
                  className={`rounded-full px-4 py-2 text-xs font-semibold transition-colors ${
                    e._id === selected._id
                      ? "bg-gradient-to-r from-accent-cyan to-accent-violet text-black"
                      : "border border-border-strong hover:bg-white/[0.05]"
                  }`}
                >
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
  const [qr, setQr] = useState<string | null>(null);
  const [registerUrl, setRegisterUrl] = useState("");

  useEffect(() => {
    const url = `${window.location.origin}/upcoming-events/${event.slug || event._id}/register`;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- origin is only known in the browser
    setRegisterUrl(url);
    QRCode.toDataURL(url, { width: 1024, margin: 2 }).then(setQr);
  }, [event]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return event.registrations;
    return event.registrations.filter(
      (r) => r.name.toLowerCase().includes(q) || r.usn.toLowerCase().includes(q) || r.phone.includes(q)
    );
  }, [event.registrations, query]);

  function downloadCsv() {
    const escape = (v: string) => `"${v.replace(/"/g, '""')}"`;
    const rows = [
      ["#", "Name", "USN", "Phone", "Registered At"],
      ...event.registrations.map((r, i) => [
        String(i + 1),
        r.name,
        r.usn,
        r.phone,
        new Date(r.createdAt).toLocaleString("en-IN"),
      ]),
    ];
    const blob = new Blob([rows.map((r) => r.map(escape).join(",")).join("\n")], { type: "text/csv" });
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${event.slug || event.name}-registrations.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  }

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_280px]">
      <Reveal delay={0.05}>
        <div className="glass-card rounded-2xl p-6">
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
            <span className="flex items-center gap-1.5 rounded-full bg-accent-cyan/10 px-3 py-1 text-xs font-semibold text-accent-cyan">
              <Users size={14} />
              {event.registrations.length} registered
            </span>
          </div>

          <div className="mt-5 flex flex-wrap gap-3">
            <label className="relative min-w-0 flex-1">
              <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" />
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search name, USN or phone"
                className="w-full rounded-xl border border-border bg-white/[0.03] py-2.5 pl-10 pr-4 text-sm outline-none transition-colors focus:border-accent-cyan/60"
              />
            </label>
            <button
              onClick={downloadCsv}
              disabled={event.registrations.length === 0}
              className="flex items-center gap-2 rounded-xl border border-border-strong px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-white/[0.05] disabled:opacity-50"
            >
              <FileDown size={15} />
              Export CSV
            </button>
          </div>

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
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-text-muted">
                      {event.registrations.length === 0 ? "No registrations yet." : "No matches."}
                    </td>
                  </tr>
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
                      <td className="py-2.5 text-xs text-text-faint">
                        {new Date(r.createdAt).toLocaleString("en-IN", {
                          day: "numeric",
                          month: "short",
                          hour: "numeric",
                          minute: "2-digit",
                        })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="glass-card flex flex-col items-center gap-4 rounded-2xl p-6 text-center">
          <p className="flex items-center gap-2 text-sm font-semibold">
            <QrCode size={16} />
            Registration QR
          </p>
          <div className="w-full overflow-hidden rounded-xl bg-white p-2">
            {qr ? (
              // eslint-disable-next-line @next/next/no-img-element -- generated data URL
              <img src={qr} alt={`QR code to register for ${event.name}`} className="h-auto w-full" />
            ) : (
              <div className="aspect-square" />
            )}
          </div>
          <p className="break-all text-xs text-text-faint">{registerUrl}</p>
          <div className="flex w-full flex-col gap-2">
            <a
              href={qr ?? undefined}
              download={`${event.slug || "event"}-register-qr.png`}
              className="flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet py-2.5 text-xs font-semibold text-black"
            >
              <Download size={15} />
              Download QR
            </a>
            <button
              onClick={() => {
                navigator.clipboard.writeText(registerUrl);
                toast.success("Link copied");
              }}
              className="flex items-center justify-center gap-2 rounded-xl border border-border-strong py-2.5 text-xs font-semibold transition-colors hover:bg-white/[0.05]"
            >
              <Copy size={15} />
              Copy link
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
