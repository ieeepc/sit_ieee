"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Loader2, CheckCircle2, MessageCircle, Send } from "lucide-react";

export default function EventRegisterForm({ eventId }: { eventId: string }) {
  const [form, setForm] = useState({ name: "", usn: "", phone: "" });
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ whatsappLink: string; alreadyRegistered: boolean } | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch(`/api/upcoming-events/${eventId}/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 409) {
        setDone({ whatsappLink: data.whatsappLink ?? "", alreadyRegistered: true });
        return;
      }
      if (!res.ok) throw new Error(data.message);
      setDone({ whatsappLink: data.whatsappLink ?? "", alreadyRegistered: false });
      toast.success("You're registered!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not register. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="text-accent-cyan" size={40} />
        <p className="font-display text-xl font-semibold">
          {done.alreadyRegistered ? "You're already registered!" : "You're in! 🎬"}
        </p>
        <p className="max-w-sm text-sm text-text-muted">
          {done.whatsappLink
            ? "One last step — join the WhatsApp group for updates, dress code and venue details."
            : "See you at the event!"}
        </p>
        {done.whatsappLink && (
          <a
            href={done.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
          >
            <MessageCircle size={17} />
            Join WhatsApp Group
          </a>
        )}
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Full name" value={form.name} onChange={(v) => setForm({ ...form, name: v })} autoComplete="name" />
      <Field
        label="USN"
        value={form.usn}
        onChange={(v) => setForm({ ...form, usn: v.toUpperCase() })}
        placeholder="e.g. 1SI25EC001"
      />
      <Field
        label="Phone number"
        type="tel"
        value={form.phone}
        onChange={(v) => setForm({ ...form, phone: v })}
        placeholder="10-digit mobile number"
        autoComplete="tel"
        inputMode="tel"
      />
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Register
      </button>
    </form>
  );
}

function Field({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  autoComplete,
  inputMode,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-text-muted">{label}</span>
      <input
        type={type}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent-cyan/60"
      />
    </label>
  );
}
