"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import Reveal from "@/components/Reveal";
import PasswordInput from "@/components/PasswordInput";

const inputClass =
  "w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent-cyan/60 focus:bg-white/[0.05]";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [form, setForm] = useState({ secretKey: "", usn: "", email: "", password: "", confirm: "" });
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (form.password !== form.confirm) {
      toast.error("The two passwords don't match.");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ secretKey: form.secretKey, usn: form.usn, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      toast.success("Password updated. Log in with your new password.");
      router.push("/member-login");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not reset password");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-16">
      <Link
        href="/member-login"
        className="inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
      >
        <ArrowLeft size={14} />
        Back to login
      </Link>
      <Reveal>
        <p className="mt-6 text-center text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">
          Member Access
        </p>
        <h1 className="mt-3 text-center font-display text-3xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-center text-sm text-text-muted">
          Enter the USN and email you signed up with, plus the chapter secret key.
        </p>
      </Reveal>

      <Reveal delay={0.1}>
        <form onSubmit={handleSubmit} className="glass-card mt-8 flex flex-col gap-4 rounded-2xl p-7">
          <Field label="Secret Key">
            <input
              required
              value={form.secretKey}
              onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
              placeholder="Secret Key"
              className={inputClass}
            />
            <span className="mt-1.5 flex items-center gap-1.5 text-xs text-text-faint">
              <KeyRound size={12} />
              Ask a chapter member for this if you don&apos;t have it.
            </span>
          </Field>
          <Field label="USN">
            <input
              required
              value={form.usn}
              onChange={(e) => setForm({ ...form, usn: e.target.value })}
              placeholder="USN"
              className={inputClass}
            />
          </Field>
          <Field label="Email">
            <input
              required
              type="email"
              autoComplete="email"
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email you signed up with"
              className={inputClass}
            />
          </Field>
          <Field label="New Password">
            <PasswordInput
              required
              minLength={6}
              autoComplete="new-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="At least 6 characters"
              className={inputClass}
            />
          </Field>
          <Field label="Confirm New Password">
            <PasswordInput
              required
              minLength={6}
              autoComplete="new-password"
              value={form.confirm}
              onChange={(e) => setForm({ ...form, confirm: e.target.value })}
              placeholder="Type it again"
              className={inputClass}
            />
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Reset password
          </button>
        </form>
      </Reveal>
    </div>
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
