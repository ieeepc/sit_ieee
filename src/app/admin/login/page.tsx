"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { Loader2, ShieldCheck } from "lucide-react";
import Reveal from "@/components/Reveal";

export default function AdminLoginPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch("/api/admin/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      router.push("/admin");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto flex min-h-[70vh] max-w-sm flex-col justify-center px-5 py-20">
      <Reveal>
        <div className="flex flex-col items-center text-center">
          <ShieldCheck className="text-accent-cyan" size={30} />
          <h1 className="mt-4 font-display text-2xl font-semibold">Admin Access</h1>
          <p className="mt-2 text-sm text-text-muted">
            Manage events, timeline, and the member roster.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="glass-card mt-8 flex flex-col gap-4 rounded-2xl p-7">
          <label className="block">
            <span className="mb-1.5 block text-xs font-medium text-text-muted">Admin Password</span>
            <input
              required
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••"
              className="w-full rounded-xl border border-border bg-white/[0.03] px-4 py-2.5 text-sm outline-none transition-colors focus:border-accent-cyan/60"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="mt-1 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.01] disabled:opacity-60"
          >
            {loading && <Loader2 size={15} className="animate-spin" />}
            Enter dashboard
          </button>
        </form>
      </Reveal>
    </div>
  );
}
