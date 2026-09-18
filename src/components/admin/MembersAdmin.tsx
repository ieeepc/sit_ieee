"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { toast } from "sonner";
import { Loader2, Plus, Trash2, Check, ShieldCheck, UserRound } from "lucide-react";

type MemberItem = {
  _id: string;
  name: string;
  usn: string;
  tag: string;
  photo?: string;
  isClaimed: boolean;
  isAdmin: boolean;
};

export default function MembersAdmin() {
  const [members, setMembers] = useState<MemberItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [edits, setEdits] = useState<Record<string, string>>({});
  const [form, setForm] = useState({ name: "", usn: "", tag: "Member" });
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    setLoading(true);
    const res = await fetch("/api/admin/members", { cache: "no-store" });
    const data = await res.json();
    setMembers(data.members ?? []);
    setLoading(false);
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial data fetch on mount
    load();
  }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Roster entry added — they can claim it by signing up with this USN");
      setForm({ name: "", usn: "", tag: "Member" });
      load();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not add member");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleSaveTag(id: string) {
    const tag = edits[id];
    if (tag === undefined) return;
    const res = await fetch(`/api/admin/members/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tag }),
    });
    if (res.ok) {
      toast.success("Tag updated");
      load();
    } else {
      toast.error("Could not update tag");
    }
  }

  async function handleToggleAdmin(m: MemberItem) {
    const res = await fetch(`/api/admin/members/${m._id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isAdmin: !m.isAdmin }),
    });
    if (res.ok) load();
    else toast.error("Could not update admin status");
  }

  async function handleDelete(id: string) {
    if (!confirm("Remove this member from the roster?")) return;
    const res = await fetch(`/api/admin/members/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Member removed");
      load();
    } else {
      toast.error("Could not remove member");
    }
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[1fr_1.4fr]">
      <form onSubmit={handleAdd} className="glass-card flex h-fit flex-col gap-4 rounded-2xl p-6">
        <p className="font-display text-lg font-semibold">Add roster placeholder</p>
        <p className="text-xs text-text-faint">
          Adds a member without login access. They activate their own account by signing up with the
          same USN — their name/tag carries over automatically.
        </p>
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
          <span className="mb-1.5 block text-xs font-medium text-text-muted">USN</span>
          <input
            required
            value={form.usn}
            onChange={(e) => setForm({ ...form, usn: e.target.value })}
            className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:border-accent-cyan/60"
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-muted">Tag / Post</span>
          <input
            required
            value={form.tag}
            onChange={(e) => setForm({ ...form, tag: e.target.value })}
            className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none focus:border-accent-cyan/60"
          />
        </label>
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet py-2.5 text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
        >
          {submitting ? <Loader2 size={15} className="animate-spin" /> : <Plus size={15} />}
          Add
        </button>
      </form>

      <div className="flex flex-col gap-3">
        {loading ? (
          <Loader2 className="mx-auto animate-spin text-text-muted" />
        ) : (
          members.map((m) => (
            <div key={m._id} className="glass-card flex flex-wrap items-center gap-3 rounded-2xl p-4">
              <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-full bg-white/[0.05]">
                {m.photo ? (
                  <Image src={m.photo} alt={m.name} fill className="object-cover" />
                ) : (
                  <UserRound className="m-auto mt-2.5 text-text-muted" size={18} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{m.name}</p>
                <p className="text-xs text-text-muted">
                  {m.usn.toUpperCase()} · {m.isClaimed ? "active" : "not claimed"}
                </p>
              </div>
              <input
                defaultValue={m.tag}
                onChange={(e) => setEdits((prev) => ({ ...prev, [m._id]: e.target.value }))}
                className="w-32 rounded-lg border border-border bg-white/[0.03] px-2.5 py-1.5 text-xs outline-none focus:border-accent-cyan/60"
              />
              <button
                onClick={() => handleSaveTag(m._id)}
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-accent-cyan/10 hover:text-accent-cyan"
                aria-label="Save tag"
              >
                <Check size={15} />
              </button>
              <button
                onClick={() => handleToggleAdmin(m)}
                className={`rounded-lg p-1.5 transition-colors ${
                  m.isAdmin ? "text-accent-cyan" : "text-text-muted hover:text-accent-cyan"
                }`}
                title={m.isAdmin ? "Remove admin" : "Make admin"}
              >
                <ShieldCheck size={15} />
              </button>
              <button
                onClick={() => handleDelete(m._id)}
                className="rounded-lg p-1.5 text-text-muted transition-colors hover:bg-accent-rose/10 hover:text-accent-rose"
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
