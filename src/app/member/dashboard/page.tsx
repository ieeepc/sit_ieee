"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { toast } from "sonner";
import { Camera, Download, LogOut, Loader2, Search, User, Save } from "lucide-react";
import { useSession, type SessionMember } from "@/components/SessionProvider";
import { fileToDataUrl } from "@/lib/utils";
import { downloadCsv } from "@/lib/csv";
import Reveal from "@/components/Reveal";
import QrCard from "@/components/QrCard";

type TeamMember = {
  name: string;
  branch?: string;
  year: string;
  college?: string;
  usn: string;
  phone?: string;
  email: string;
};

type HackzRegistration = {
  id: string;
  leaderName: string;
  leaderPhone?: string;
  leaderEmail: string;
  teamName: string;
  collegeName: string;
  domain: string;
  teamSize: number;
  teamMembers: TeamMember[];
  abstractDeadline: string | null;
  abstractSubmittedAt: string | null;
  abstract: {
    fileName: string;
    url: string;
  } | null;
  stage: number;
  createdAt: string;
};

export default function MemberDashboardPage() {
  const router = useRouter();
  const { member, loading } = useSession();

  useEffect(() => {
    if (!loading && !member) router.replace("/member-login");
  }, [loading, member, router]);

  if (loading || !member) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-text-muted" />
      </div>
    );
  }

  return <ProfileForm member={member} />;
}

function ProfileForm({ member }: { member: NonNullable<SessionMember> }) {
  const router = useRouter();
  const { refresh, setMember } = useSession();
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [tag, setTag] = useState(member.tag ?? "");
  const [linkedin, setLinkedin] = useState(member.linkedin ?? "");
  const [github, setGithub] = useState(member.github ?? "");
  const [preview, setPreview] = useState<string | null>(null);
  const [photoDataUrl, setPhotoDataUrl] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [hackzRegistrations, setHackzRegistrations] = useState<HackzRegistration[]>([]);
  const [hackzLoading, setHackzLoading] = useState(true);
  const [query, setQuery] = useState("");

  useEffect(() => {
    fetch("/api/upcoming-events/hack-z/register", { cache: "no-store" })
      .then((res) => (res.ok ? res.json() : Promise.reject()))
      .then((data) => setHackzRegistrations(data.registrations ?? []))
      .catch(() => setHackzRegistrations([]))
      .finally(() => setHackzLoading(false));
  }, []);

  async function handlePhotoChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Please choose an image under 4MB.");
      return;
    }
    const dataUrl = await fileToDataUrl(file);
    setPreview(dataUrl);
    setPhotoDataUrl(dataUrl);
  }

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/members/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          tag,
          linkedin,
          github,
          ...(photoDataUrl ? { photoDataUrl } : {}),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setMember({ ...member, tag: data.tag, photo: data.photo, linkedin: data.linkedin, github: data.github });
      setPhotoDataUrl(null);
      toast.success("Profile updated");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not save changes");
    } finally {
      setSaving(false);
    }
  }

  async function handleLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    await refresh();
    router.push("/");
  }

  const displayPhoto = preview ?? member.photo;
  const filteredHackz = hackzRegistrations.filter((registration) => {
    const q = query.trim().toLowerCase();
    if (!q) return true;
    return [
      registration.leaderName,
      registration.leaderEmail,
      registration.leaderPhone,
      registration.teamName,
      registration.collegeName,
      registration.domain,
      ...registration.teamMembers.flatMap((member) => [
        member.name,
        member.branch,
        member.year,
        member.college,
        member.usn,
        member.phone,
        member.email,
      ]),
    ].some((value) => value?.toLowerCase().includes(q));
  });

  function exportHackzCsv() {
    const rows: string[][] = [
      [
        "#",
        "Team Name",
        "Team College",
        "Domain",
        "Team Size",
        "Leader Name",
        "Leader Phone",
        "Leader Email",
        "Member",
        "Branch",
        "Year",
        "College",
        "USN",
        "Phone",
        "Email",
        "Abstract Status",
        "Abstract Deadline",
        "Registered At",
      ],
    ];

    filteredHackz.forEach((registration, teamIndex) => {
      const members = registration.teamMembers.length
        ? registration.teamMembers
        : [{ name: "", branch: "", year: "", usn: "", email: "" }];
      members.forEach((teamMember) => {
        rows.push([
          String(teamIndex + 1),
          registration.teamName,
          registration.collegeName,
          registration.domain,
          String(registration.teamSize || registration.teamMembers.length),
          registration.leaderName,
          registration.leaderPhone ?? "",
          registration.leaderEmail,
          teamMember.name,
          teamMember.branch ?? "",
          teamMember.year,
          teamMember.college ?? "",
          teamMember.usn,
          teamMember.phone ?? "",
          teamMember.email,
          registration.abstractSubmittedAt ? "Submitted" : "Pending",
          registration.abstractDeadline ? new Date(registration.abstractDeadline).toLocaleString("en-IN") : "",
          new Date(registration.createdAt).toLocaleString("en-IN"),
        ]);
      });
    });

    downloadCsv("hack-z-registrations.csv", rows);
  }

  return (
    <div className="mx-auto max-w-6xl px-5 py-20">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">My Profile</p>
        <h1 className="mt-3 font-display text-3xl font-semibold tracking-tight sm:text-4xl">
          Hey, {member.name.split(" ")[0]}
        </h1>
      </Reveal>

      <Reveal delay={0.1}>
        <div className="glass-card mt-8 rounded-2xl p-7">
          <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start">
            <div className="relative">
              <button
                onClick={() => fileInputRef.current?.click()}
                className="group relative h-28 w-28 overflow-hidden rounded-full ring-2 ring-border-strong"
              >
                {displayPhoto ? (
                  <Image src={displayPhoto} alt={member.name} fill className="object-cover" />
                ) : (
                  <div className="flex h-full w-full items-center justify-center bg-fg/[0.05]">
                    <User className="text-text-muted" size={30} />
                  </div>
                )}
                <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 transition-opacity group-hover:opacity-100">
                  <Camera size={20} />
                </div>
              </button>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="font-display text-xl font-semibold">{member.name}</p>
              <p className="text-sm text-text-muted">{member.usn.toUpperCase()}</p>
              <p className="mt-1 text-xs text-text-faint">{member.email}</p>
            </div>
          </div>

          <div className="mt-8 flex flex-col gap-4">
            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">
                Tag / Role (shown on Our Team)
              </span>
              <input
                value={tag}
                onChange={(e) => setTag(e.target.value)}
                placeholder="e.g. Web Lead, Design Head, Member"
                className="w-full rounded-xl border border-border bg-fg/[0.03] px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent-cyan/60"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">LinkedIn</span>
              <input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-xl border border-border bg-fg/[0.03] px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent-cyan/60"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">GitHub</span>
              <input
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full rounded-xl border border-border bg-fg/[0.03] px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent-cyan/60"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-5 py-2.5 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save changes
            </button>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-fg/[0.05]"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.15}>
        <section className="mt-8 grid gap-6 lg:grid-cols-[1fr_280px]">
          <div className="glass-card min-w-0 rounded-2xl p-5 sm:p-7">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <p className="font-display text-xl font-semibold">HACK-Z Registrations</p>
              <p className="mt-1 text-xs text-text-muted">
                {hackzLoading
                  ? "Loading registrations..."
                  : `${hackzRegistrations.length} team registration${hackzRegistrations.length === 1 ? "" : "s"}`}
              </p>
            </div>
            <button
              type="button"
              onClick={exportHackzCsv}
              disabled={hackzLoading || filteredHackz.length === 0}
              className="flex items-center gap-2 rounded-xl border border-border-strong px-4 py-2.5 text-xs font-semibold transition-colors hover:bg-fg/[0.05] disabled:opacity-50"
            >
              <Download size={15} />
              Download CSV
            </button>
          </div>

          <label className="relative mt-5 block">
            <Search size={15} className="absolute left-3.5 top-1/2 -translate-y-1/2 text-text-faint" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search team, leader or member"
              className="w-full rounded-xl border border-border bg-fg/[0.03] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-accent-cyan/60"
            />
          </label>

          {hackzLoading ? (
            <Loader2 className="mx-auto mt-8 animate-spin text-text-muted" />
          ) : filteredHackz.length === 0 ? (
            <p className="py-10 text-center text-sm text-text-muted">No HACK-Z registrations found.</p>
          ) : (
            <div className="mt-5 overflow-x-auto">
              <table className="w-full min-w-[980px] text-left text-sm">
                <thead className="text-xs uppercase tracking-wider text-text-faint">
                  <tr className="border-b border-border">
                    <th className="py-2.5 pr-3 font-medium">Team</th>
                    <th className="py-2.5 pr-3 font-medium">Leader</th>
                    <th className="py-2.5 pr-3 font-medium">Team members</th>
                    <th className="py-2.5 pr-3 font-medium">Abstract</th>
                    <th className="py-2.5 font-medium">Registered</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredHackz.map((registration) => (
                    <tr key={registration.id} className="border-b border-border/60 align-top last:border-0">
                      <td className="py-3 pr-3">
                        <p className="font-medium">{registration.teamName || "Not added"}</p>
                        {(registration.collegeName || registration.domain || registration.teamSize > 0) && (
                          <p className="mt-0.5 text-xs text-text-muted">
                            {[
                              registration.collegeName,
                              registration.domain,
                              registration.teamSize ? `${registration.teamSize} members` : "",
                            ]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        <p className="font-medium">{registration.leaderName}</p>
                        <p className="text-xs text-text-muted">{registration.leaderEmail}</p>
                        {registration.leaderPhone && (
                          <p className="text-xs text-text-muted">{registration.leaderPhone}</p>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {registration.teamMembers.length ? (
                          <div className="space-y-2">
                            {registration.teamMembers.map((teamMember, index) => (
                              <div key={`${teamMember.usn}-${index}`} className="text-xs">
                                <p className="font-medium">
                                  {teamMember.name} <span className="text-text-faint">({teamMember.usn})</span>
                                </p>
                                <p className="text-text-muted">
                                  {[teamMember.branch, teamMember.year, teamMember.college].filter(Boolean).join(" · ")}
                                </p>
                                <p className="text-text-muted">
                                  {[teamMember.phone, teamMember.email].filter(Boolean).join(" · ")}
                                </p>
                              </div>
                            ))}
                          </div>
                        ) : (
                          <span className="text-xs text-text-faint">Team details pending</span>
                        )}
                      </td>
                      <td className="py-3 pr-3">
                        {registration.abstract?.url ? (
                          <a
                            href={registration.abstract.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-accent-cyan"
                          >
                            <Download size={13} />
                            {registration.abstract.fileName || "Abstract"}
                          </a>
                        ) : (
                          <span className="text-xs text-accent-amber">Pending</span>
                        )}
                      </td>
                      <td className="py-3 text-xs text-text-faint">
                        {new Date(registration.createdAt).toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
          </div>
          <QrCard
            path="/upcoming-events"
            title="Upcoming Events QR"
            fileName="upcoming-events-qr.png"
          />
        </section>
      </Reveal>
    </div>
  );
}
