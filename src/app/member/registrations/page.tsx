"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, FileDown, Loader2, Search, Users } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import { downloadCsv } from "@/lib/csv";
import Reveal from "@/components/Reveal";
import QrCard from "@/components/QrCard";

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
  const [applications, setApplications] = useState<Application[] | null>(null);

  useEffect(() => {
    if (!loading && !member) router.replace("/member-login");
  }, [loading, member, router]);

  useEffect(() => {
    if (!member) return;
    fetch("/api/join-us", { cache: "no-store" })
      .then((res) => res.json())
      .then((data) => setApplications(data.applications ?? []))
      .catch(() => setApplications([]));
  }, [member]);

  if (loading || !member || applications === null) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-text-muted" />
      </div>
    );
  }

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
        <p className="mt-6 text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">Recruitment</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">Who&apos;s applied</h1>
      </Reveal>

      <RecruitmentApplications applications={applications} />
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
