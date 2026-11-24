"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CalendarDays,
  ExternalLink,
  FileText,
  FileSpreadsheet,
  FileImage,
  FileArchive,
  Presentation,
  Loader2,
  LogOut,
  Trash2,
  Upload,
} from "lucide-react";
import { useSession, type SessionFaculty } from "@/components/SessionProvider";
import Reveal from "@/components/Reveal";

type FacultyDoc = {
  id: string;
  title: string;
  year: number;
  fileName: string;
  mimeType: string;
  size: number;
  url: string;
  uploadedBy: string;
  uploadedByName: string;
  createdAt: string;
};

const ACCEPT = ".pdf,.doc,.docx,.xls,.xlsx,.ppt,.pptx,.txt,.csv,.png,.jpg,.jpeg,.webp,.zip";
const MAX_BYTES = 10 * 1024 * 1024;

export default function FacultyDashboardPage() {
  const router = useRouter();
  const { faculty, loading } = useSession();

  useEffect(() => {
    if (!loading && !faculty) router.replace("/faculty-login");
  }, [loading, faculty, router]);

  if (loading || !faculty) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="animate-spin text-text-muted" />
      </div>
    );
  }

  return <Dashboard faculty={faculty} />;
}

function Dashboard({ faculty }: { faculty: NonNullable<SessionFaculty> }) {
  const router = useRouter();
  const { setFaculty } = useSession();
  const [docs, setDocs] = useState<FacultyDoc[] | null>(null);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/faculty/documents", { cache: "no-store" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDocs(data.documents);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not load documents");
      setDocs([]);
    }
  }, []);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- initial fetch on mount
    load();
  }, [load]);

  const byYear = useMemo(() => {
    const groups = new Map<number, FacultyDoc[]>();
    for (const d of docs ?? []) {
      const list = groups.get(d.year) ?? [];
      list.push(d);
      groups.set(d.year, list);
    }
    return [...groups.entries()].sort((a, b) => b[0] - a[0]);
  }, [docs]);

  async function handleLogout() {
    await fetch("/api/faculty/logout", { method: "POST" });
    setFaculty(null);
    toast.success("Logged out");
    router.push("/");
  }

  async function handleDelete(doc: FacultyDoc) {
    if (!confirm(`Delete "${doc.title}"? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/faculty/documents/${doc.id}`, { method: "DELETE" });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      setDocs((prev) => prev?.filter((d) => d.id !== doc.id) ?? null);
      toast.success("Document deleted");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not delete");
    }
  }

  return (
    <div className="mx-auto max-w-5xl px-5 py-16">
      <Reveal>
        <div className="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">Faculty Dashboard</p>
            <h1 className="mt-2 font-display text-3xl font-semibold tracking-tight">
              Hello, {faculty.username}
            </h1>
            <p className="mt-1 text-sm text-text-muted">{faculty.email}</p>
          </div>
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 rounded-full border border-border-strong px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:bg-fg/[0.05] hover:text-text"
          >
            <LogOut size={15} /> Logout
          </button>
        </div>
      </Reveal>

      <Reveal delay={0.08}>
        <UploadCard onUploaded={(d) => setDocs((prev) => [d, ...(prev ?? [])])} />
      </Reveal>

      <section className="mt-12">
        <h2 className="font-display text-xl font-semibold">Documents by Year</h2>

        {docs === null ? (
          <div className="flex justify-center py-16">
            <Loader2 className="animate-spin text-text-muted" />
          </div>
        ) : byYear.length === 0 ? (
          <div className="glass-card mt-5 rounded-2xl p-10 text-center text-sm text-text-muted">
            No documents yet. Upload the first one above.
          </div>
        ) : (
          <div className="mt-5 flex flex-col gap-8">
            {byYear.map(([year, list]) => (
              <div key={year}>
                <div className="mb-3 flex items-center gap-3">
                  <span className="flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-1.5 font-display text-sm font-semibold text-on-accent">
                    <CalendarDays size={14} /> {year}
                  </span>
                  <span className="text-xs text-text-faint">
                    {list.length} document{list.length === 1 ? "" : "s"}
                  </span>
                  <span className="h-px flex-1 bg-border" />
                </div>
                <ol className="grid gap-3 sm:grid-cols-2">
                  {list.map((d) => (
                    <DocRow
                      key={d.id}
                      doc={d}
                      canDelete={d.uploadedBy === faculty.id}
                      onDelete={() => handleDelete(d)}
                    />
                  ))}
                </ol>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}

function UploadCard({ onUploaded }: { onUploaded: (d: FacultyDoc) => void }) {
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: currentYear + 1 - 2000 + 1 }, (_, i) => currentYear + 1 - i);
  const fileRef = useRef<HTMLInputElement>(null);
  const [title, setTitle] = useState("");
  const [year, setYear] = useState(currentYear);
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    if (f && f.size > MAX_BYTES) {
      toast.error("File must be under 10MB.");
      e.target.value = "";
      return;
    }
    setFile(f);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!file) {
      toast.error("Choose a file to upload.");
      return;
    }
    setUploading(true);
    try {
      const body = new FormData();
      body.append("file", file);
      body.append("title", title);
      body.append("year", String(year));
      const res = await fetch("/api/faculty/documents", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onUploaded(data.document);
      setTitle("");
      setFile(null);
      if (fileRef.current) fileRef.current.value = "";
      toast.success("Document uploaded");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="glass-card mt-8 rounded-2xl p-6 sm:p-7">
      <h2 className="flex items-center gap-2 font-display text-lg font-semibold">
        <Upload size={18} className="text-accent-cyan" /> Upload a Document
      </h2>
      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_160px]">
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-muted">Title (optional)</span>
          <input
            value={title}
            maxLength={150}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Defaults to the file name"
            className={inputClass}
          />
        </label>
        <label className="block">
          <span className="mb-1.5 block text-xs font-medium text-text-muted">Year</span>
          <select value={year} onChange={(e) => setYear(Number(e.target.value))} className={inputClass}>
            {years.map((y) => (
              <option key={y} value={y} className="bg-bg-elevated text-text">
                {y}
              </option>
            ))}
          </select>
        </label>
      </div>
      <label className="mt-4 flex cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border border-dashed border-border-strong bg-fg/[0.02] px-4 py-8 text-center transition-colors hover:border-accent-cyan/60 hover:bg-fg/[0.04]">
        <FileText size={22} className="text-text-muted" />
        <span className="text-sm font-medium">{file ? file.name : "Click to choose a file"}</span>
        <span className="text-xs text-text-faint">
          {file ? formatSize(file.size) : "PDF, Word, Excel, PowerPoint, images, ZIP · up to 10MB"}
        </span>
        <input ref={fileRef} type="file" accept={ACCEPT} onChange={handleFile} className="sr-only" />
      </label>
      <button
        type="submit"
        disabled={uploading || !file}
        className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan to-accent-violet py-3 text-sm font-semibold text-on-accent transition-transform hover:scale-[1.01] disabled:opacity-60 disabled:hover:scale-100"
      >
        {uploading ? <Loader2 size={15} className="animate-spin" /> : <Upload size={15} />}
        {uploading ? "Uploading…" : "Upload"}
      </button>
    </form>
  );
}

function DocRow({ doc, canDelete, onDelete }: { doc: FacultyDoc; canDelete: boolean; onDelete: () => void }) {
  return (
    <li className="glass-card flex items-start gap-3 rounded-xl p-4">
      <span className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-accent-violet/15 text-accent-violet">
        <DocIcon fileName={doc.fileName} />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold" title={doc.title}>
          {doc.title}
        </p>
        <p className="mt-0.5 truncate text-xs text-text-faint" title={doc.fileName}>
          {doc.fileName} · {formatSize(doc.size)}
        </p>
        <p className="mt-0.5 text-xs text-text-faint">
          by {doc.uploadedByName} · {new Date(doc.createdAt).toLocaleDateString("en-IN")}
        </p>
      </div>
      <div className="flex shrink-0 items-center gap-1">
        <a
          href={doc.url}
          target="_blank"
          rel="noopener noreferrer"
          aria-label={`Open ${doc.title}`}
          className="rounded-lg p-2 text-text-muted transition-colors hover:bg-fg/[0.06] hover:text-accent-cyan"
        >
          <ExternalLink size={16} />
        </a>
        {canDelete && (
          <button
            onClick={onDelete}
            aria-label={`Delete ${doc.title}`}
            className="rounded-lg p-2 text-text-muted transition-colors hover:bg-fg/[0.06] hover:text-accent-rose"
          >
            <Trash2 size={16} />
          </button>
        )}
      </div>
    </li>
  );
}

function DocIcon({ fileName }: { fileName: string }) {
  const ext = fileName.split(".").pop()?.toLowerCase() ?? "";
  if (["xls", "xlsx", "csv"].includes(ext)) return <FileSpreadsheet size={18} />;
  if (["ppt", "pptx"].includes(ext)) return <Presentation size={18} />;
  if (["png", "jpg", "jpeg", "webp"].includes(ext)) return <FileImage size={18} />;
  if (ext === "zip") return <FileArchive size={18} />;
  return <FileText size={18} />;
}

function formatSize(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

const inputClass =
  "w-full rounded-xl border border-border bg-fg/[0.03] px-4 py-2.5 text-sm text-text placeholder:text-text-faint outline-none transition-colors focus:border-accent-cyan/60 focus:bg-fg/[0.05]";
