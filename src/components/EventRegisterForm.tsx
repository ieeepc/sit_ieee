"use client";

import { useEffect, useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import {
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Lock,
  MessageCircle,
  Presentation,
  Send,
  Upload,
  X,
} from "lucide-react";

const FILE_ACCEPT = ".pdf,.doc,.docx,.ppt,.pptx";
const subscribeNoop = () => () => {};
const DOMAINS = ["Open Innovation", "HealthCare", "Smart Education", "Environment and Sustainability", "Women Empowerment"];
const YEARS = ["1st", "2nd", "3rd", "4th"];

// sessionStorage state is only known on the client; gate stage 2/3 rendering until hydration finishes.
function useIsClient() {
  return useSyncExternalStore(
    subscribeNoop,
    () => true,
    () => false
  );
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

type TeamMember = {
  name: string;
  year: string;
  usn: string;
  phone: string;
  email: string;
};

type TeamDetails = { teamName?: string; collegeName?: string; domain?: string; teamSize?: number };

function readTeamDetails(eventId: string): TeamDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`hackz-team-details-${eventId}`);
    return raw ? (JSON.parse(raw) as TeamDetails) : null;
  } catch {
    return null;
  }
}

function readTeamMembers(eventId: string): TeamMember[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`hackz-team-members-${eventId}`);
    return raw ? (JSON.parse(raw) as TeamMember[]) : null;
  } catch {
    return null;
  }
}

function readStoredTeamSize(eventId: string, stage?: number) {
  if (typeof window === "undefined") return stage === 2 ? "3" : "";
  const stored = sessionStorage.getItem(`hackz-team-size-${eventId}`);
  if (stored) return stored;
  const details = readTeamDetails(eventId);
  if (details?.teamSize) return String(details.teamSize);
  return stage === 2 ? "3" : "";
}

function normalizePhone(value: string) {
  return value.replace(/[\s-]/g, "").replace(/^(\+91|91|0)(?=\d{10}$)/, "");
}

const MEMBER_UNIQUE_FIELDS = [
  { key: "email", label: "email ID", normalize: (value: string) => value.trim().toLowerCase() },
  { key: "phone", label: "phone number", normalize: normalizePhone },
  { key: "usn", label: "USN", normalize: (value: string) => value.trim().toUpperCase() },
] as const;

function findDuplicateMember(members: TeamMember[]) {
  for (const field of MEMBER_UNIQUE_FIELDS) {
    const seen = new Map<string, number>();
    for (let index = 0; index < members.length; index += 1) {
      const value = field.normalize(members[index][field.key]);
      if (!value) continue;
      const previous = seen.get(value);
      if (previous !== undefined) {
        return `Team member ${previous + 1} and team member ${index + 1} share the same ${field.label}. Each member must be unique.`;
      }
      seen.set(value, index);
    }
  }
  return null;
}

export default function EventRegisterForm({
  eventId,
  hackathon = false,
  stage,
}: {
  eventId: string;
  hackathon?: boolean;
  stage?: 1 | 2 | 3;
}) {
  const router = useRouter();
  const ready = useIsClient();
  const [form, setForm] = useState({ name: "", usn: "", phone: "", email: "" });
  const [step, setStep] = useState<1 | 2 | 3>(() => {
    return stage ?? 1;
  });
  const [submitted, setSubmitted] = useState(() =>
    typeof window === "undefined" ? false : sessionStorage.getItem(`hackz-abstract-${eventId}`) === "submitted"
  );
  const [teamSubmitted, setTeamSubmitted] = useState(() =>
    typeof window === "undefined" ? false : sessionStorage.getItem(`hackz-team-${eventId}`) === "submitted"
  );
  const [teamDetailsSaved, setTeamDetailsSaved] = useState(() =>
    typeof window === "undefined" ? false : Boolean(sessionStorage.getItem(`hackz-team-details-${eventId}`))
  );
  const [teamName, setTeamName] = useState(() => readTeamDetails(eventId)?.teamName ?? "");
  const [collegeName, setCollegeName] = useState(() => readTeamDetails(eventId)?.collegeName ?? "");
  const [domain, setDomain] = useState(() => readTeamDetails(eventId)?.domain ?? "");
  const [teamSize, setTeamSize] = useState(() => readStoredTeamSize(eventId, stage));
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(() => {
    const stored = readTeamMembers(eventId);
    if (stored?.length) return stored;
    return Array.from({ length: readStoredTeamSize(eventId, stage) === "4" ? 4 : 3 }, () => ({
      name: "",
      year: "",
      usn: "",
      phone: "",
      email: "",
    }));
  });
  const [abstract, setAbstract] = useState<File | null>(null);
  const [uploadedAbstracts, setUploadedAbstracts] = useState<{ fileName: string; url: string }[]>([]);
  const [whatsappLink, setWhatsappLink] = useState("");
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ whatsappLink: string; alreadyRegistered: boolean } | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const memberCount = teamSize === "4" ? 4 : 3;

  useEffect(() => {
    if (!showSuccess) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setShowSuccess(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [showSuccess]);

  function chooseAbstract(file?: File | null) {
    if (!file) return;
    if (!/\.(pdf|docx?|pptx?)$/i.test(file.name)) {
      toast.error("Choose a PDF, DOC, DOCX, PPT or PPTX file.");
      return;
    }
    if (file.size > 4 * 1024 * 1024) {
      toast.error("Please keep the abstract under 4 MB.");
      return;
    }
    setAbstract(file);
  }

  function updateMember(index: number, key: keyof TeamMember, value: string) {
    setTeamMembers((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, [key]: key === "usn" ? value.toUpperCase() : value } : item
      )
    );
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (hackathon && step === 1) {
        if (!teamName.trim() || !collegeName.trim()) throw new Error("Add your team name and college name.");
        if (!domain) throw new Error("Please choose a domain.");
        if (!teamSize) throw new Error("Please choose your team size.");
        sessionStorage.setItem(
          `hackz-team-details-${eventId}`,
          JSON.stringify({ teamName, collegeName, domain, teamSize: memberCount })
        );
        sessionStorage.setItem(`hackz-team-size-${eventId}`, String(memberCount));
        setTeamDetailsSaved(true);
        setStep(2);
        router.push(`/upcoming-events/${eventId}/register/team`);
        return;
      }
      if (hackathon && step === 2) {
        if (teamMembers.some((member) => Object.values(member).some((value) => !value.trim()))) {
          throw new Error(`Complete all ${memberCount} team members. Every detail is required.`);
        }
        const duplicate = findDuplicateMember(teamMembers);
        if (duplicate) throw new Error(duplicate);
        if (!readTeamDetails(eventId)?.teamName) throw new Error("Add your team details first.");

        sessionStorage.setItem(`hackz-team-members-${eventId}`, JSON.stringify(teamMembers));
        setTeamSubmitted(true);
        sessionStorage.setItem(`hackz-team-${eventId}`, "submitted");
        setStep(3);
        router.push(`/upcoming-events/${eventId}/register/abstract`);
        toast.success("Team details ready. Upload your abstract to complete registration.");
        return;
      }
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

  async function submitAbstract(e: React.FormEvent) {
    e.preventDefault();
    if (!teamSubmitted) {
      toast.error("Complete stages 1 and 2 first — your registration is saved when you submit the abstract.");
      return;
    }
    if (!abstract) {
      toast.error("Please choose an abstract file.");
      return;
    }
    setSubmitting(true);
    try {
      const details = readTeamDetails(eventId);
      const members = readTeamMembers(eventId);
      if (!details?.teamName || !details.collegeName || !details.domain || !members?.length) {
        throw new Error("Your team details are missing in this tab. Go back to stage 1 and fill them again.");
      }
      const formData = new FormData();
      formData.set(
        "application",
        JSON.stringify({
          teamName: details.teamName,
          collegeName: details.collegeName,
          domain: details.domain,
          teamSize: members.length,
          teamMembers: members,
        })
      );
      formData.set("abstract", abstract);
      const res = await fetch(`/api/upcoming-events/${eventId}/register`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      sessionStorage.setItem(`hackz-abstract-${eventId}`, "submitted");
      setUploadedAbstracts([data.abstract ?? { fileName: abstract.name, url: "" }]);
      setWhatsappLink(data.whatsappLink ?? "");
      setAbstract(null);
      setSubmitted(true);
      setShowSuccess(true);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload the abstract.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <div className="flex flex-col items-center gap-3 rounded-xl border border-border bg-bg-elevated/60 px-6 py-10 text-center">
        <span className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-cyan/10 text-accent-cyan">
          <CheckCircle2 size={30} />
        </span>
        <p className="font-display text-xl font-semibold">
          {done.alreadyRegistered ? "You're already registered" : "Registration complete"}
        </p>
        <p className="max-w-sm text-sm text-text-muted">
          {done.whatsappLink
            ? "Join the WhatsApp group for updates, venue and schedule details."
            : "See you at the event."}
        </p>
        {done.whatsappLink && (
          <a
            href={done.whatsappLink}
            target="_blank"
            rel="noopener noreferrer"
            className="mt-2 inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-semibold text-black transition-opacity hover:opacity-90"
          >
            <MessageCircle size={16} />
            Join WhatsApp group
          </a>
        )}
      </div>
    );
  }

  if (hackathon && !ready) {
    return (
      <div className="flex flex-col gap-4" aria-busy="true">
        <div className="h-4 w-48 animate-pulse rounded-full bg-fg/[0.05]" />
        <div className="h-11 w-full animate-pulse rounded-xl bg-fg/[0.04]" />
        <div className="h-44 w-full animate-pulse rounded-2xl bg-fg/[0.035]" />
      </div>
    );
  }

  if (hackathon && step === 2 && !teamDetailsSaved) {
    return (
      <StageGate
        eventId={eventId}
        title="Add your team details first"
        description="Stage 1 gets your team name, college, domain and size. Once that's done, members unlock automatically."
        href="leader"
        label="Go to stage 1"
      />
    );
  }

  if (hackathon && step === 2) {
    return (
      <form key="team-step" onSubmit={handleSubmit} className="flex flex-col gap-5">
        <p className="text-sm text-text-muted">
          Your team has {memberCount} members. All details are required and each member must be unique.
        </p>
        {teamMembers.map((member, index) => (
          <div key={index} className="rounded-xl border border-border bg-fg/[0.02] p-4 sm:p-5">
            <p className="mb-3 flex items-center gap-2 text-sm font-semibold">
              <span className="flex h-6 w-6 items-center justify-center rounded-md border border-border-strong text-[11px] font-semibold text-text-muted">
                {index + 1}
              </span>
              Team member {index + 1}
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Full name"
                value={member.name}
                onChange={(value) => updateMember(index, "name", value)}
              />
              <Select
                label="Year"
                value={member.year}
                placeholder="Select year"
                options={YEARS.map((year) => ({ value: year, label: year }))}
                onChange={(value) => updateMember(index, "year", value)}
              />
              <Field
                label="USN"
                value={member.usn}
                onChange={(value) => updateMember(index, "usn", value)}
              />
              <Field
                label="Phone number"
                type="tel"
                inputMode="tel"
                value={member.phone}
                placeholder="10-digit mobile number"
                onChange={(value) => updateMember(index, "phone", value)}
              />
              <Field
                label="Email ID"
                type="email"
                value={member.email}
                onChange={(value) => updateMember(index, "email", value)}
              />
            </div>
          </div>
        ))}
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent-cyan px-6 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-cyan/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          Continue to abstract
        </button>
      </form>
    );
  }

  if (hackathon && step === 3 && submitted) {
    return (
      <>
        <div className="rounded-xl border border-border bg-fg/[0.02] p-6 text-center sm:p-8">
          <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-cyan/10 text-accent-cyan">
            <CheckCircle2 size={30} />
          </span>
          <p className="mt-4 font-display text-xl font-semibold">Registration complete</p>
          <p className="mt-1.5 text-sm text-text-muted">Your abstract has been submitted.</p>
          {uploadedAbstracts.length > 0 && (
            <ul className="mx-auto mt-4 max-w-sm space-y-1.5 text-left">
              {uploadedAbstracts.map((item, index) => (
                <li key={`${item.fileName}-${index}`} className="flex items-center gap-2 text-xs text-text-muted">
                  <FileText size={13} className="shrink-0" />
                  <span className="truncate">{item.fileName}</span>
                  {item.url && (
                    <a
                      href={item.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="shrink-0 font-semibold text-accent-cyan hover:underline"
                    >
                      View
                    </a>
                  )}
                </li>
              ))}
            </ul>
          )}
          {whatsappLink && (
            <a
              href={whatsappLink}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 inline-block text-sm font-semibold text-accent-cyan hover:underline"
            >
              Join the WhatsApp group
            </a>
          )}
        </div>
        {showSuccess && <SuccessDialog onClose={() => setShowSuccess(false)} />}
      </>
    );
  }

  if (hackathon && step === 3) {
    const unlocked = teamSubmitted;
    const fileIcon =
      abstract && /\.pptx?$/i.test(abstract.name) ? (
        <Presentation size={20} />
      ) : abstract ? (
        <FileText size={20} />
      ) : (
        <Upload size={20} />
      );

    return (
      <form key="abstract-step" onSubmit={submitAbstract} className="flex flex-col gap-4">
        {!unlocked && (
          <div className="rounded-xl border border-border bg-fg/[0.02] p-5">
            <p className="flex items-center gap-2 text-sm font-semibold text-text">
              <Lock size={15} className="text-text-muted" />
              Upload unlocks after your team members are saved
            </p>
            <p className="mt-1.5 text-xs leading-relaxed text-text-muted">
              Finish stage 2 first — the upload unlocks once every team member is saved.
            </p>
            <Link
              href={`/upcoming-events/${eventId}/register/${teamDetailsSaved ? "team" : "leader"}`}
              className="mt-3 inline-block text-sm font-semibold text-accent-cyan hover:underline"
            >
              {teamDetailsSaved ? "Go to stage 2" : "Go to stage 1"}
            </Link>
          </div>
        )}
        <div
          data-dragging={dragging}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            chooseAbstract(e.dataTransfer.files?.[0]);
          }}
          className="stage-dropzone relative flex items-center gap-3 rounded-xl border border-dashed border-border-strong bg-fg/[0.02] transition-colors"
        >
          <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-5 py-6 sm:py-7">
            <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full border border-border-strong text-text-muted">
              {fileIcon}
            </span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-sm font-semibold text-text">
                {abstract ? abstract.name : dragging ? "Drop your file here" : "Choose your abstract"}
              </span>
              <span className="mt-0.5 block text-xs text-text-muted">
                {abstract
                  ? `${formatBytes(abstract.size)} · click to change`
                  : "PDF, DOC, DOCX, PPT or PPTX · up to 4 MB"}
              </span>
            </span>
            <span className="hidden shrink-0 text-xs font-semibold text-accent-cyan sm:inline">
              {abstract ? "Change" : "Browse"}
            </span>
            <input
              type="file"
              accept={FILE_ACCEPT}
              className="sr-only"
              onChange={(e) => chooseAbstract(e.target.files?.[0])}
            />
          </label>
          {abstract && (
            <button
              type="button"
              aria-label="Remove chosen file"
              onClick={() => setAbstract(null)}
              className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full text-text-muted transition-colors hover:bg-fg/[0.05] hover:text-text"
            >
              <X size={15} />
            </button>
          )}
        </div>
        <button
          type="submit"
          disabled={submitting}
          className="mt-1 flex items-center justify-center gap-2 rounded-lg bg-accent-cyan px-6 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-cyan/90 disabled:opacity-60"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
          Submit abstract
        </button>
      </form>
    );
  }

  return (
    <form key="leader-step" onSubmit={handleSubmit} className="flex flex-col gap-4">
      {hackathon ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <Field
            label="Team name"
            value={teamName}
            onChange={setTeamName}
            placeholder="Enter your team name"
            required
          />
          <Field
            label="College name"
            value={collegeName}
            onChange={setCollegeName}
            placeholder="Enter your college name"
            required
          />
          <Select
            label="Domain"
            value={domain}
            onChange={setDomain}
            placeholder="Select a domain"
            options={DOMAINS.map((item) => ({ value: item, label: item }))}
          />
          <Select
            label="Team size"
            value={teamSize}
            onChange={setTeamSize}
            placeholder="Select team size"
            options={["3", "4"].map((size) => ({ value: size, label: `${size} members` }))}
          />
        </div>
      ) : (
        <>
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
        </>
      )}
      <button
        type="submit"
        disabled={submitting}
        className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-accent-cyan px-6 py-3.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-cyan/90 disabled:opacity-60"
      >
        {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
        {hackathon ? "Continue to members" : "Register"}
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
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  type?: string;
  placeholder?: string;
  autoComplete?: string;
  inputMode?: React.HTMLAttributes<HTMLInputElement>["inputMode"];
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-text-muted">
        {label}
        {required && <span className="ml-0.5 text-accent-rose">*</span>}
      </span>
      <input
        type={type}
        required={required}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        autoComplete={autoComplete}
        inputMode={inputMode}
        className="w-full rounded-lg border border-border-strong bg-fg/[0.03] px-3.5 py-2.5 text-sm outline-none transition-colors placeholder:text-text-faint focus:border-accent-cyan"
      />
    </label>
  );
}

function Select({
  label,
  value,
  onChange,
  options,
  placeholder,
  required = true,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  options: { value: string; label: string }[];
  placeholder?: string;
  required?: boolean;
}) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-xs font-medium text-text-muted">
        {label}
        {required && <span className="ml-0.5 text-accent-rose">*</span>}
      </span>
      <div className="relative">
        <select
          required={required}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className={`w-full appearance-none rounded-lg border border-border-strong bg-fg/[0.03] px-3.5 py-2.5 pr-10 text-sm outline-none transition-colors focus:border-accent-cyan ${
            value ? "" : "text-text-faint"
          }`}
        >
          {placeholder && (
            <option value="" disabled>
              {placeholder}
            </option>
          )}
          {options.map((option) => (
            <option key={option.value} value={option.value} className="bg-bg-elevated text-text">
              {option.label}
            </option>
          ))}
        </select>
        <ChevronDown
          size={16}
          className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 text-text-faint"
        />
      </div>
    </label>
  );
}

function SuccessDialog({ onClose }: { onClose: () => void }) {
  return (
    <div
      role="presentation"
      onClick={onClose}
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 px-4"
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="registration-success-title"
        onClick={(event) => event.stopPropagation()}
        className="w-full max-w-sm rounded-xl border border-border bg-bg-elevated p-6 text-center shadow-xl"
      >
        <span className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-accent-cyan/10 text-accent-cyan">
          <CheckCircle2 size={30} />
        </span>
        <p id="registration-success-title" className="mt-4 font-display text-xl font-semibold">
          You have registered successfully
        </p>
        <p className="mt-1.5 text-sm text-text-muted">Your abstract has been received.</p>
        <button
          type="button"
          onClick={onClose}
          className="mt-5 w-full rounded-lg bg-accent-cyan px-5 py-2.5 text-sm font-semibold text-on-accent transition-colors hover:bg-accent-cyan/90"
        >
          Close
        </button>
      </div>
    </div>
  );
}

function StageGate({
  eventId,
  title,
  description,
  href,
  label,
}: {
  eventId: string;
  title: string;
  description: string;
  href: "leader" | "team";
  label: string;
}) {
  return (
    <div className="rounded-xl border border-dashed border-border-strong bg-fg/[0.02] px-6 py-10 text-center">
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-border-strong text-text-muted">
        <Lock size={20} />
      </span>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-text-muted">{description}</p>
      <Link
        href={`/upcoming-events/${eventId}/register/${href}`}
        className="mt-5 inline-flex items-center gap-2 rounded-lg bg-accent-cyan px-5 py-2.5 text-xs font-semibold text-on-accent transition-colors hover:bg-accent-cyan/90"
      >
        {label}
      </Link>
    </div>
  );
}
