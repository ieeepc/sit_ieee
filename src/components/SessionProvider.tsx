"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";

export type SessionMember = {
  id: string;
  name: string;
  usn: string;
  email?: string;
  tag: string;
  photo: string;
  linkedin?: string;
  github?: string;
  year?: number;
  isAdmin: boolean;
} | null;

export type SessionFaculty = {
  id: string;
  username: string;
  email: string;
} | null;

type SessionContextValue = {
  member: SessionMember;
  faculty: SessionFaculty;
  loading: boolean;
  refresh: () => Promise<void>;
  setMember: (m: SessionMember) => void;
  setFaculty: (f: SessionFaculty) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

async function fetchJson<T>(url: string, key: string): Promise<T | null> {
  try {
    const res = await fetch(url, { cache: "no-store" });
    const data = await res.json();
    return data[key] ?? null;
  } catch {
    return null;
  }
}

export function SessionProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<SessionMember>(null);
  const [faculty, setFaculty] = useState<SessionFaculty>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    const [m, f] = await Promise.all([
      fetchJson<SessionMember>("/api/auth/me", "member"),
      fetchJson<SessionFaculty>("/api/faculty/me", "faculty"),
    ]);
    setMember(m);
    setFaculty(f);
    setLoading(false);
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session fetch on mount
    refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ member, faculty, loading, refresh, setMember, setFaculty }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
