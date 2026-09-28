"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { toast } from "sonner";
import { Camera, LogOut, Loader2, User, Save, ClipboardList } from "lucide-react";
import { useSession, type SessionMember } from "@/components/SessionProvider";
import { fileToDataUrl } from "@/lib/utils";
import Reveal from "@/components/Reveal";

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

  return (
    <div className="mx-auto max-w-2xl px-5 py-20">
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
                  <div className="flex h-full w-full items-center justify-center bg-white/[0.05]">
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
                className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent-cyan/60"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">LinkedIn</span>
              <input
                value={linkedin}
                onChange={(e) => setLinkedin(e.target.value)}
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent-cyan/60"
              />
            </label>

            <label className="block">
              <span className="mb-1.5 block text-xs font-medium text-text-muted">GitHub</span>
              <input
                value={github}
                onChange={(e) => setGithub(e.target.value)}
                placeholder="https://github.com/..."
                className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent-cyan/60"
              />
            </label>
          </div>

          <div className="mt-8 flex flex-wrap gap-3">
            <button
              onClick={handleSave}
              disabled={saving}
              className="flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-5 py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-60"
            >
              {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
              Save changes
            </button>
            <Link
              href="/member/registrations"
              className="flex items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.05]"
            >
              <ClipboardList size={15} />
              View registrations
            </Link>
            <button
              onClick={handleLogout}
              className="flex items-center gap-2 rounded-full border border-border-strong px-5 py-2.5 text-sm font-semibold transition-colors hover:bg-white/[0.05]"
            >
              <LogOut size={15} />
              Logout
            </button>
          </div>
        </div>
      </Reveal>
    </div>
  );
}
