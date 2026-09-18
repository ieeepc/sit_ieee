"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, ImagePlus, X } from "lucide-react";
import { fileToDataUrl, formatDate } from "@/lib/utils";

type Photo = { _id: string; url: string };
type EventItem = {
  _id: string;
  name: string;
  date: string;
  description: string;
  photos: Photo[];
};

const emptyForm = { name: "", date: "", description: "" };

export default function EventsAdmin() {
  const [events, setEvents] = useState<EventItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [form, setForm] = useState(emptyForm);
  const [photoDataUrls, setPhotoDataUrls] = useState<string[]>([]);
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/events", { cache: "no-store" });
    const data = await res.json();
    setEvents(data.events ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function handleFiles(e: React.ChangeEvent<HTMLInputElement>) {
    const files = Array.from(e.target.files ?? []);
    const urls = await Promise.all(files.map(fileToDataUrl));
    setPhotoDataUrls((prev) => [...prev, ...urls]);
  }

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, photoDataUrls }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Event added to timeline");
      setForm(emptyForm);
      setPhotoDataUrls([]);
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add event");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this event and all its photos?")) return;
    const res = await fetch(`/api/events/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Event deleted");
      load();
    } else {
      toast.error("Could not delete event");
    }
  }

  async function handleRemovePhoto(eventId: string, photoId: string) {
    const res = await fetch(`/api/events/${eventId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ removePhotoIds: [photoId] }),
    });
    if (res.ok) load();
    else toast.error("Could not remove photo");
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.2fr]">
      <form onSubmit={handleCreate} className="glass-card flex h-fit flex-col gap-4 rounded-2xl p-6">
        <p className="font-display text-lg font-semibold">Add timeline event</p>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-muted">Name</span>
          <input
            required
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:border-accent-cyan/60"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-muted">Date</span>
          <input
            required
            type="date"
            value={form.date}
            onChange={(e) => setForm({ ...form, date: e.target.value })}
            className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:border-accent-cyan/60"
          />
        </label>
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
          {photoDataUrls.length > 0 ? `${photoDataUrls.length} photo(s) selected` : "Upload photos"}
          <input type="file" accept="image/*" multiple className="hidden" onChange={handleFiles} />
        </label>
        {photoDataUrls.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {photoDataUrls.map((u, i) => (
              <div key={i} className="relative h-14 w-14 overflow-hidden rounded-lg">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={u} alt="" className="h-full w-full object-cover" />
              </div>
            ))}
          </div>
        )}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Add to timeline
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {loading ? (
          <Loader2 className="mx-auto animate-spin text-text-muted" />
        ) : (
          events.map((e) => (
            <div key={e._id} className="glass-card rounded-2xl p-4">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-semibold">{e.name}</p>
                  <p className="text-xs text-text-muted">{formatDate(e.date)}</p>
                </div>
                <button
                  onClick={() => handleDelete(e._id)}
                  className="shrink-0 rounded-lg p-1.5 text-text-muted transition-colors hover:bg-accent-rose/10 hover:text-accent-rose"
                  aria-label="Delete"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              {e.photos.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {e.photos.map((p) => (
                    <div key={p._id} className="group relative h-14 w-14 overflow-hidden rounded-lg">
                      <Image src={p.url} alt="" fill className="object-cover" />
                      <button
                        onClick={() => handleRemovePhoto(e._id, p._id)}
                        className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 transition-opacity group-hover:opacity-100"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
