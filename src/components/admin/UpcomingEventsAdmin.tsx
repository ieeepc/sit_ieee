"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ImagePlus } from "lucide-react";
import { fileToDataUrl, formatDate } from "@/lib/utils";

type UpcomingEvent = {
  _id: string;
  name: string;
  date?: string;
  description: string;
  location: string;
  registrationLink: string;
  poster: string;
};

const emptyForm = {
  name: "",
  date: "",
  description: "",
  location: "",
  registrationLink: "",
  registrationDeadline: "",
  time: "",
  slug: "",
  openRegistration: false,
  whatsappLink: "",
};

export default function UpcomingEventsAdmin() {
  const [events, setEvents] = useState<UpcomingEvent[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [posterDataUrl, setPosterDataUrl] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/upcoming-events", { cache: "no-store" });
    const data = await res.json();
    setEvents(data.events ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/upcoming-events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...form,
          date: form.date || undefined,
          slug: form.slug || undefined,
          registrationDeadline: form.registrationDeadline || undefined,
          posterDataUrl: posterDataUrl ?? undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Event added");
      setForm(emptyForm);
      setPosterDataUrl(null);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add event");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event?")) return;
    const res = await fetch(`/api/upcoming-events/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Event deleted");
      load();
    } else {
      toast.error("Could not delete event");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={handleCreate} className="glass-card flex h-fit flex-col gap-4 rounded-2xl p-6">
        <p className="font-display text-lg font-semibold">Add upcoming event</p>
        <Input label="Name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} required />
        <Input
          label="Date (optional — leave blank for TBA)"
          type="date"
          value={form.date}
          onChange={(v) => setForm({ ...form, date: v })}
        />
        <Input label="Time (e.g. 5:00 PM)" value={form.time} onChange={(v) => setForm({ ...form, time: v })} />
        <Input
          label="Location"
          value={form.location}
          onChange={(v) => setForm({ ...form, location: v })}
        />
        <label className="flex cursor-pointer items-center gap-2 text-sm">
          <input
            type="checkbox"
            checked={form.openRegistration}
            onChange={(e) => setForm({ ...form, openRegistration: e.target.checked })}
          />
          Collect registrations on this site (name, USN, phone)
        </label>
        {form.openRegistration ? (
          <>
            <Input
              label="URL slug (optional, e.g. cineverse)"
              value={form.slug}
              onChange={(v) => setForm({ ...form, slug: v })}
            />
            <Input
              label="WhatsApp group link (shown after registering)"
              value={form.whatsappLink}
              onChange={(v) => setForm({ ...form, whatsappLink: v })}
            />
          </>
        ) : (
          <Input
            label="Registration Link"
            value={form.registrationLink}
            onChange={(v) => setForm({ ...form, registrationLink: v })}
          />
        )}
        <Input
          label="Registration Deadline (optional)"
          type="date"
          value={form.registrationDeadline}
          onChange={(v) => setForm({ ...form, registrationDeadline: v })}
        />
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-muted">Description</span>
          <textarea
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            rows={3}
            className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:border-accent-cyan/60"
          />
        </label>
        <label className="flex cursor-pointer items-center gap-2 text-sm text-text-muted">
          <ImagePlus size={16} />
          {posterDataUrl ? "Poster selected" : "Upload poster (optional)"}
          <input
            type="file"
            accept="image/*"
            className="hidden"
            onChange={async (e) => {
              const f = e.target.files?.[0];
              if (f) setPosterDataUrl(await fileToDataUrl(f));
            }}
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Add event
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {loading ? (
          <Loader2 className="mx-auto animate-spin text-text-muted" />
        ) : events.length === 0 ? (
          <p className="text-sm text-text-muted">No upcoming events yet.</p>
        ) : (
          events.map((e) => (
            <div key={e._id} className="glass-card flex gap-4 rounded-2xl p-4">
              {e.poster ? (
                <div className="relative h-16 w-16 shrink-0 overflow-hidden rounded-lg">
                  <Image src={e.poster} alt={e.name} fill className="object-cover" />
                </div>
              ) : (
                <div className="h-16 w-16 shrink-0 rounded-lg bg-white/[0.05]" />
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{e.name}</p>
                <p className="text-xs text-text-muted">{e.date ? formatDate(e.date) : "Date TBA"}</p>
              </div>
              <button
                onClick={() => handleDelete(e._id)}
                className="shrink-0 self-start rounded-lg p-1.5 text-text-muted transition-colors hover:bg-accent-rose/10 hover:text-accent-rose"
                aria-label="Delete"
              >
                <Trash2 size={15} />
              </button>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

function Input({
  label,
  value,
  onChange,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-text-muted">{label}</span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:border-accent-cyan/60"
      />
    </label>
  );
}
