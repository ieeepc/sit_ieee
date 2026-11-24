"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { toast } from "sonner";
import { ArrowLeft, KeyRound, Loader2 } from "lucide-react";
import { useSession } from "@/components/SessionProvider";
import Reveal from "@/components/Reveal";
import PasswordInput from "@/components/PasswordInput";

export default function FacultyLoginPage() {
  const router = useRouter();
  const { faculty, loading: sessionLoading, refresh } = useSession();
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ username: "", email: "", password: "", secretKey: "" });

  useEffect(() => {
    if (!sessionLoading && faculty) router.replace("/faculty/dashboard");
  }, [sessionLoading, faculty, router]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/faculty/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await refresh();
      toast.success(`Welcome, ${data.username}!`);
      router.push("/faculty/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-20">
      <Reveal>
        <Link
          href="/login"
          className="mb-6 inline-flex items-center gap-1.5 text-xs font-medium text-text-muted transition-colors hover:text-text"
        >
          <ArrowLeft size={14} /> Back to login options
        </Link>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">
          Faculty Access
        </p>
        <h1 className="mt-3 text-center font-display text-3xl font-semibold tracking-tight">Faculty login</h1>
      </Reveal>

      <Reveal delay={0.1}>
        <form onSubmit={handleSubmit} className="glass-card mt-8 flex flex-col gap-4 rounded-2xl p-7">
          <Field label="Username">
            <input
              required
              minLength={3}
              autoComplete="username"
              value={form.username}
              onChange={(e) => setForm({ ...form, username: e.target.value })}
              placeholder="Username"
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
              placeholder="Email"
              className={inputClass}
            />
          </Field>
          <Field label="Password">
            <PasswordInput
              required
              minLength={6}
              autoComplete="current-password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder="Password"
              className={inputClass}
            />
          </Field>
          <Field label="Secret Key">
            <PasswordInput
              required
              autoComplete="off"
              value={form.secretKey}
              onChange={(e) => setForm({ ...form, secretKey: e.target.value })}
              placeholder="Secret Key"
              className={inputClass}
            />
            <span className="mt-1.5 flex items-center gap-1.5 text-xs text-text-faint">
              <KeyRound size={12} />
              Shared with faculty by the chapter. First login creates your account.
            </span>
          </Field>
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet py-3 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Login
          </button>
        </form>
      </Reveal>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-fg/[0.03] px-4 py-2.5 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent-cyan/60 focus:bg-fg/[0.05]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-text-muted">{label}</span>
      {children}
    </label>
  );
}
