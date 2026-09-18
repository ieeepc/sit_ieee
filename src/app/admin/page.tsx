"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Loader2, CalendarClock, History, Users, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import Reveal from "@/components/Reveal";
import UpcomingEventsAdmin from "@/components/admin/UpcomingEventsAdmin";
import EventsAdmin from "@/components/admin/EventsAdmin";
import MembersAdmin from "@/components/admin/MembersAdmin";

const tabs = [
  { key: "upcoming", label: "Upcoming Events", icon: CalendarClock },
  { key: "timeline", label: "Timeline", icon: History },
  { key: "members", label: "Members", icon: Users },
] as const;

type TabKey = (typeof tabs)[number]["key"];

export default function AdminPage() {
  const router = useRouter();
  const [checking, setChecking] = useState(true);
  const [tab, setTab] = useState<TabKey>("upcoming");

  useEffect(() => {
    fetch("/api/admin/me")
      .then((r) => r.json())
      .then((d) => {
        if (!d.isAdmin) router.replace("/admin/login");
        else setChecking(false);
      });
  }, [router]);

  async function handleLogout() {
    await fetch("/api/admin/logout", { method: "POST" });
    router.push("/admin/login");
  }

  if (checking) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-text-muted" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <Reveal>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">Admin</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">Content Dashboard</h1>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm font-medium transition-colors hover:bg-white/[0.05]"
          >
            <LogOut size={14} /> Logout
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.06}>
        <div className="glass-card mt-8 flex w-fit gap-1 rounded-full p-1">
          {tabs.map((t) => (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className={cn(
                "flex items-center gap-1.5 rounded-full px-4 py-2 text-sm font-medium transition-colors",
                tab === t.key ? "bg-white/[0.1] text-text" : "text-text-muted hover:text-text"
              )}
            >
              <t.icon size={14} />
              {t.label}
            </button>
          ))}
        </div>
      </Reveal>

      <div className="mt-8">
        {tab === "upcoming" && <UpcomingEventsAdmin />}
        {tab === "timeline" && <EventsAdmin />}
        {tab === "members" && <MembersAdmin />}
      </div>
    </div>
  );
}
