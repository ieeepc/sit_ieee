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

type SessionContextValue = {
  member: SessionMember;
  loading: boolean;
  refresh: () => Promise<void>;
  setMember: (m: SessionMember) => void;
};

const SessionContext = createContext<SessionContextValue | null>(null);

export function SessionProvider({ children }: { children: ReactNode }) {
  const [member, setMember] = useState<SessionMember>(null);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const data = await res.json();
      setMember(data.member ?? null);
    } catch {
      setMember(null);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial session fetch on mount
    refresh();
  }, [refresh]);

  return (
    <SessionContext.Provider value={{ member, loading, refresh, setMember }}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const ctx = useContext(SessionContext);
  if (!ctx) throw new Error("useSession must be used within SessionProvider");
  return ctx;
}
