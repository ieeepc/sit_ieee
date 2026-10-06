"use client";

import { useState } from "react";
import Link from "next/link";
import { toast } from "sonner";
import { CheckCircle2, Loader2, Send } from "lucide-react";

const emptyForm = { name: "", usn: "", year: "", branch: "", email: "", phone: "" };

const inputClass =
  "w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent-cyan/60";

export default function RecruitmentForm() {
  const [form, setForm] = useState(emptyForm);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<"applied" | "already" | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch("/api/join-us", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (res.status === 409) {
        setDone("already");
        return;
      }
      if (!res.ok) throw new Error(data.message);
      setDone("applied");
      toast.success("Application submitted!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not submit. Try again.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 text-center">
        <CheckCircle2 className="text-accent-cyan" size={40} />
        <p className="font-display text-xl font-semibold">
          {done === "already" ? "You've already applied!" : "Thanks for applying!"}
        </p>
        <p className="max-w-sm text-sm text-text-muted">
          Our team will reach out to you on your phone or email with the next steps.
        </p>
        <Link href="/" className="mt-3 text-sm font-semibold text-accent-cyan hover:underline">
          Back to home
        </Link>
      </div>
    );
  }

  const set = (key: keyof typeof emptyForm) => (v: string) => setForm({ ...form, [key]: v });

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <Field label="Full name">
        <input required value={form.name} onChange={(e) => set("name")(e.target.value)} autoComplete="name" className={inputClass} />
      </Field>
      <Field label="USN">
        <input
          required
          value={form.usn}
          onChange={(e) => set("usn")(e.target.value.toUpperCase())}
          placeholder="e.g. 1SI25EC001"
          className={inputClass}
        />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Year">
          <select
            required
            value={form.year}
            onChange={(e) => set("year")(e.target.value)}
            className={`${inputClass} appearance-none bg-bg`}
          >
            <option value="" disabled>
              Select year
            </option>
            <option value="1">1st Year</option>
            <option value="2">2nd Year</option>
          </select>
        </Field>
        <Field label="Branch">
          <input
            required
            value={form.branch}
            onChange={(e) => set("branch")(e.target.value)}
            placeholder="e.g. ECE, CSE, ISE"
            className={inputClass}
          />
        </Field>
      </div>
      <Field label="Email">
        <input
          required
          type="email"
          value={form.email}
          onChange={(e) => set("email")(e.target.value)}
          autoComplete="email"
          placeholder="you@example.com"
          className={inputClass}
        />
      </Field>
      <Field label="Phone number">
        <input
          required
          type="tel"
          inputMode="tel"
          value={form.phone}
          onChange={(e) => set("phone")(e.target.value)}
          autoComplete="tel"
          placeholder="10-digit mobile number"
          className={inputClass}
        />
      </Field>
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 flex items-center justify-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.02] disabled:opacity-60"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        Submit Application
      </button>
    </form>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-text-muted">{label}</span>
      {children}
    </label>
  );
}
