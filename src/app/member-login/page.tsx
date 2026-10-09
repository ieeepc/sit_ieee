"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";
import { toast } from "sonner";
import { LogIn, UserPlus, Loader2, KeyRound } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "@/components/SessionProvider";
import Reveal from "@/components/Reveal";
import PasswordInput from "@/components/PasswordInput";

export default function MemberLoginPage() {
  const router = useRouter();
  const { refresh } = useSession();
  const [mode, setMode] = useState<"login" | "signup">("login");
  const [loading, setLoading] = useState(false);

  const [loginForm, setLoginForm] = useState({ usn: "", password: "" });
  const [signupForm, setSignupForm] = useState({ secretKey: "", name: "", usn: "", email: "", password: "" });

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(loginForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await refresh();
      toast.success(`Welcome back, ${data.name.split(" ")[0]}!`);
      router.push("/member/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(signupForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      await refresh();
      toast.success(`Welcome to the chapter, ${data.name.split(" ")[0]}!`);
      router.push("/member/dashboard");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-md flex-col justify-center px-5 py-20">
      <Reveal>
        <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">
          Member Access
        </p>
        <h1 className="mt-3 text-center font-display text-3xl font-semibold tracking-tight">
          {mode === "login" ? "Welcome back" : "Join the chapter"}
        </h1>
      </Reveal>

      <Reveal delay={0.08}>
        <div className="glass-card mt-8 rounded-2xl p-2">
          <div className="relative grid grid-cols-2 gap-1">
            <motion.div
              layout
              className="absolute inset-y-1 w-[calc(50%-4px)] rounded-xl bg-white/[0.08]"
              animate={{ x: mode === "login" ? 4 : "calc(100% + 4px)" }}
              transition={{ type: "spring", stiffness: 400, damping: 32 }}
            />
            <button
              onClick={() => setMode("login")}
              className={cn(
                "relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                mode === "login" ? "text-text" : "text-text-muted"
              )}
            >
              <LogIn size={15} /> Login
            </button>
            <button
              onClick={() => setMode("signup")}
              className={cn(
                "relative z-10 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold transition-colors",
                mode === "signup" ? "text-text" : "text-text-muted"
              )}
            >
              <UserPlus size={15} /> Sign up
            </button>
          </div>
        </div>
      </Reveal>

      <Reveal delay={0.14}>
        <div className="glass-card mt-4 rounded-2xl p-7">
          {mode === "login" ? (
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              <Field label="USN">
                <input
                  required
                  value={loginForm.usn}
                  onChange={(e) => setLoginForm({ ...loginForm, usn: e.target.value })}
                  placeholder="USN"
                  className={inputClass}
                />
              </Field>
              <Field label="Password">
                <PasswordInput
                  required
                  autoComplete="current-password"
                  value={loginForm.password}
                  onChange={(e) => setLoginForm({ ...loginForm, password: e.target.value })}
                  placeholder="Password"
                  className={inputClass}
                />
              </Field>
              <Link
                href="/forgot-password"
                className="-mt-2 self-end text-xs font-medium text-accent-cyan transition-colors hover:underline"
              >
                Forgot password?
              </Link>
              <SubmitButton loading={loading} label="Login" />
            </form>
          ) : (
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <Field label="Secret Key">
                <input
                  required
                  value={signupForm.secretKey}
                  onChange={(e) => setSignupForm({ ...signupForm, secretKey: e.target.value })}
                  placeholder="Secret Key"
                  className={inputClass}
                />
                <span className="mt-1.5 flex items-center gap-1.5 text-xs text-text-faint">
                  <KeyRound size={12} />
                  Ask a chapter member for this if you don&apos;t have it.
                </span>
              </Field>
              <Field label="Full Name">
                <input
                  required
                  value={signupForm.name}
                  onChange={(e) => setSignupForm({ ...signupForm, name: e.target.value })}
                  placeholder="Full Name"
                  className={inputClass}
                />
              </Field>
              <Field label="USN">
                <input
                  required
                  value={signupForm.usn}
                  onChange={(e) => setSignupForm({ ...signupForm, usn: e.target.value })}
                  placeholder="USN"
                  className={inputClass}
                />
              </Field>
              <Field label="Email">
                <input
                  required
                  type="email"
                  value={signupForm.email}
                  onChange={(e) => setSignupForm({ ...signupForm, email: e.target.value })}
                  placeholder="Email"
                  className={inputClass}
                />
              </Field>
              <Field label="Password">
                <PasswordInput
                  required
                  autoComplete="new-password"
                  minLength={6}
                  value={signupForm.password}
                  onChange={(e) => setSignupForm({ ...signupForm, password: e.target.value })}
                  placeholder="Password"
                  className={inputClass}
                />
              </Field>
              <p className="text-xs leading-relaxed text-text-faint">
                Already on the roster from a past year? Sign up with the same USN to claim your
                existing profile and photo.
              </p>
              <SubmitButton loading={loading} label="Create account" />
            </form>
          )}
        </div>
      </Reveal>
    </div>
  );
}

const inputClass =
  "w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent-cyan/60 focus:bg-white/[0.05]";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-text-muted">{label}</span>
      {children}
    </label>
  );
}

function SubmitButton({ loading, label }: { loading: boolean; label: string }) {
  return (
    <button
      type="submit"
      disabled={loading}
      className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
    >
      {loading && <Loader2 size={15} className="animate-spin" />}
      {label}
    </button>
  );
}
