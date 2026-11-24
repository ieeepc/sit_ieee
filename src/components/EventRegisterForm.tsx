"use client";

import { useSyncExternalStore, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "framer-motion";
import { toast } from "sonner";
import {
  ArrowUpRight,
  CheckCircle2,
  ChevronDown,
  FileText,
  Loader2,
  Lock,
  MessageCircle,
  Presentation,
  Search,
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

type ResumeData = { registrationId: string; stage: number; teamSize?: number };

function readTeamDetails(eventId: string): TeamDetails | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(`hackz-team-details-${eventId}`);
    return raw ? (JSON.parse(raw) as TeamDetails) : null;
  } catch {
    return null;
  }
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
  const reduce = useReducedMotion();
  const ready = useIsClient();
  const [form, setForm] = useState({ name: "", usn: "", phone: "", email: "" });
  const [step, setStep] = useState<1 | 2 | 3>(() => {
    return stage ?? 1;
  });
  const [registrationId, setRegistrationId] = useState(() =>
    typeof window === "undefined" ? "" : sessionStorage.getItem(`hackz-registration-${eventId}`) ?? ""
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
  const [teamSize, setTeamSize] = useState(() => {
    const details = readTeamDetails(eventId);
    const storedSize =
      typeof window === "undefined" ? "" : sessionStorage.getItem(`hackz-team-size-${eventId}`) ?? "";
    if (storedSize) return storedSize;
    if (details?.teamSize) return String(details.teamSize);
    return stage === 2 ? "3" : "";
  });
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>(
    Array.from({ length: 4 }, () => ({ name: "", year: "", usn: "", phone: "", email: "" }))
  );
  const [abstract, setAbstract] = useState<File | null>(null);
  const [dragging, setDragging] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<{ whatsappLink: string; alreadyRegistered: boolean } | null>(null);
  const memberCount = teamSize === "4" ? 4 : 3;

  function applyResume(data: ResumeData) {
    sessionStorage.setItem(`hackz-registration-${eventId}`, data.registrationId);
    setRegistrationId(data.registrationId);
    setTeamDetailsSaved(true);
    if (data.teamSize) {
      const size = String(Math.min(4, Math.max(3, data.teamSize)));
      setTeamSize(size);
      sessionStorage.setItem(`hackz-team-size-${eventId}`, size);
    }
    if (data.stage >= 2) {
      setTeamSubmitted(true);
      sessionStorage.setItem(`hackz-team-${eventId}`, "submitted");
    }
    if (data.stage >= 3) {
      sessionStorage.setItem(`hackz-abstract-${eventId}`, "submitted");
    }
  }

  function handleResume(data: ResumeData) {
    applyResume(data);
    if (step === 2 && data.stage >= 2) {
      router.push(`/upcoming-events/${eventId}/register/abstract`);
    }
  }

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
        const required = teamMembers.slice(0, memberCount);
        if (required.some((member) => Object.values(member).some((value) => !value.trim()))) {
          throw new Error(`Please complete all ${memberCount} required team member details.`);
        }
        const members = teamMembers.filter((member) => member.name.trim());
        const partiallyFilledOptionalMember = teamMembers.slice(memberCount).some(
          (member) => member.name.trim() && Object.values(member).some((value) => !value.trim())
        );
        if (partiallyFilledOptionalMember) {
          throw new Error("For an optional member, complete every detail or leave the member blank.");
        }
        if (members.length < memberCount) throw new Error(`At least ${memberCount} team members are required.`);

        let id = registrationId;
        if (!id) {
          const raw = sessionStorage.getItem(`hackz-team-details-${eventId}`);
          const details = raw ? (JSON.parse(raw) as { teamName: string; collegeName: string; domain: string; teamSize: number }) : null;
          if (!details?.teamName) throw new Error("Add your team details first.");
          const leader = members[0];
          const createRes = await fetch(`/api/upcoming-events/${eventId}/register`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              stage: 1,
              name: leader.name,
              phone: leader.phone,
              email: leader.email,
              teamName: details.teamName,
              collegeName: details.collegeName,
              domain: details.domain,
              teamSize: details.teamSize,
            }),
          });
          const createData = await createRes.json();
          if (createRes.status === 409) {
            if (createData.registrationId) {
              applyResume(createData);
              if (createData.stage >= 2) {
                toast.success("We found your earlier registration. Continuing where you left off.");
                router.push(`/upcoming-events/${eventId}/register/abstract`);
                return;
              }
              toast.success("We found your earlier registration. Finishing your team details.");
              id = createData.registrationId;
            } else {
              setDone({ whatsappLink: createData.whatsappLink ?? "", alreadyRegistered: true });
              return;
            }
          } else {
            if (!createRes.ok) throw new Error(createData.message);
            id = createData.registrationId;
            setRegistrationId(id);
            sessionStorage.setItem(`hackz-registration-${eventId}`, id);
          }
        }

        const res = await fetch(`/api/upcoming-events/${eventId}/register`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ stage: 2, registrationId: id, teamMembers: members }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.message);
        setTeamSubmitted(true);
        sessionStorage.setItem(`hackz-team-${eventId}`, "submitted");
        setStep(3);
        router.push(`/upcoming-events/${eventId}/register/abstract`);
        toast.success("Team details saved. Submit your abstract within 2 days.");
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
    if (!abstract) {
      toast.error("Please choose an abstract file.");
      return;
    }
    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.set("registrationId", registrationId);
      formData.set("abstract", abstract);
      const res = await fetch(`/api/upcoming-events/${eventId}/register`, { method: "POST", body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      sessionStorage.setItem(`hackz-abstract-${eventId}`, "submitted");
      setDone({ whatsappLink: data.whatsappLink ?? "", alreadyRegistered: false });
      toast.success("Abstract submitted successfully!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not upload the abstract.");
    } finally {
      setSubmitting(false);
    }
  }

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ type: "spring", stiffness: 200, damping: 22 }}
        className="relative flex flex-col items-center gap-3 overflow-hidden rounded-2xl border border-accent-cyan/25 bg-accent-cyan/[0.045] px-6 py-10 text-center"
      >
        <span
          aria-hidden
          className="pointer-events-none absolute inset-x-12 top-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/70 to-transparent"
        />
        {[0, 1, 2, 3, 4, 5, 6, 7].map((i) => {
          const angle = (i / 8) * Math.PI * 2;
          return (
            <motion.span
              key={i}
              aria-hidden
              initial={{ opacity: 0, x: 0, y: 0, scale: 0 }}
              animate={
                reduce
                  ? undefined
                  : {
                      opacity: [0, 0.9, 0],
                      x: Math.cos(angle) * 76,
                      y: Math.sin(angle) * 54,
                      scale: [0, 1, 0.4],
                    }
              }
              transition={{ delay: 0.2 + i * 0.03, duration: 1.2, ease: "easeOut" }}
              className="pointer-events-none absolute left-1/2 top-10 h-1.5 w-1.5 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{ background: ["var(--accent-cyan)", "var(--accent-violet)", "var(--accent-rose)"][i % 3] }}
            />
          );
        })}
        <motion.span
          initial={{ scale: 0.4, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ type: "spring", stiffness: 260, damping: 15 }}
          className="relative flex h-16 w-16 items-center justify-center rounded-full bg-accent-cyan/10 text-accent-cyan"
        >
          <motion.span
            aria-hidden
            animate={reduce ? undefined : { scale: [0.9, 1.9], opacity: [0.6, 0] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border border-accent-cyan/60"
          />
          <CheckCircle2 size={38} />
        </motion.span>
        <p className="font-display text-2xl font-semibold">
          <span className="text-gradient">
            {done.alreadyRegistered ? "You're already registered!" : "You're in! 🎬"}
          </span>
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
            className="stage-sheen mt-3 inline-flex items-center gap-2 rounded-full bg-[#25D366] px-6 py-3 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
          >
            <MessageCircle size={17} />
            Join WhatsApp Group
          </a>
        )}
      </motion.div>
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

  if (hackathon && step === 2 && !registrationId && !teamDetailsSaved) {
    return (
      <StageGate
        eventId={eventId}
        title="Add your team details first"
        description="Stage 1 gets your team name, college, domain and size. Once that's done, members unlock automatically."
        href="leader"
        label="Go to stage 1"
        onResume={handleResume}
      />
    );
  }

  if (hackathon && step === 3 && (!registrationId || !teamSubmitted)) {
    const nextStage = registrationId || teamDetailsSaved ? "team" : "leader";
    return (
      <StageGate
        eventId={eventId}
        title={nextStage === "team" ? "Finish stage 2 first" : "Start from stage 1"}
        description={
          nextStage === "team"
            ? "Adding your team members unlocks the abstract submission. Complete stage 2 and come back here."
            : "Your team details are needed before the abstract can be submitted."
        }
        href={nextStage}
        label={nextStage === "team" ? "Go to stage 2" : "Go to stage 1"}
        onResume={handleResume}
      />
    );
  }

  if (hackathon && step === 2) {
    return (
      <motion.form
        key="team-step"
        initial={{ opacity: 0, x: 42, filter: "blur(8px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        onSubmit={handleSubmit}
        className="grid gap-7 lg:grid-cols-[150px_1fr]"
      >
        <div className="flex flex-col gap-5 lg:col-span-2">
          <p className="text-sm leading-relaxed text-accent-amber">
            {memberCount === 4
              ? "Your team size is 4. Complete all 4 team members."
              : `Your team size is ${memberCount}. Complete ${memberCount} members — the 4th member is optional.`}
          </p>
          {teamMembers.map((member, index) => (
          <motion.div
            key={index}
            initial={{ opacity: 0, y: 24, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ delay: index * 0.08, type: "spring", stiffness: 240, damping: 22 }}
            whileHover={{ y: -3, borderColor: "rgba(34,211,238,.38)" }}
            className="group relative overflow-hidden rounded-2xl border border-border-strong/70 bg-fg/[0.035] p-4 shadow-[0_18px_70px_rgba(0,0,0,.18)] backdrop-blur-md sm:p-5"
          >
            <span
              aria-hidden
              className={`absolute inset-x-0 top-0 h-px bg-gradient-to-r ${
                index < memberCount ? "from-transparent via-accent-cyan/50 to-transparent" : "from-transparent via-accent-violet/40 to-transparent"
              }`}
            />
            <div className="mb-3 flex items-center justify-between gap-3">
              <p className="flex items-center gap-2 text-sm font-semibold">
                <span className="flex h-6 w-6 items-center justify-center rounded-md border border-accent-cyan/30 bg-accent-cyan/10 font-display text-[10px] font-bold text-accent-cyan">
                  {index + 1}
                </span>
                Team member {index + 1}
              </p>
              <span
                className={`rounded-full border px-2.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${
                  index < memberCount
                    ? "border-accent-rose/30 bg-accent-rose/10 text-accent-rose"
                    : "border-border-strong/70 bg-fg/[0.03] text-text-faint"
                }`}
              >
                {index < memberCount ? "Required" : "Optional"}
              </span>
            </div>
            <div className="grid gap-3 sm:grid-cols-2">
              <Field
                label="Full name"
                value={member.name}
                required={index < memberCount}
                onChange={(value) => updateMember(index, "name", value)}
              />
              <Select
                label="Year"
                value={member.year}
                required={index < memberCount}
                placeholder="Select year"
                options={YEARS.map((year) => ({ value: year, label: year }))}
                onChange={(value) => updateMember(index, "year", value)}
              />
              <Field
                label="USN"
                value={member.usn}
                required={index < memberCount}
                onChange={(value) => updateMember(index, "usn", value)}
              />
              <Field
                label="Phone number"
                type="tel"
                inputMode="tel"
                value={member.phone}
                required={index < memberCount}
                placeholder="10-digit mobile number"
                onChange={(value) => updateMember(index, "phone", value)}
              />
              <Field
                label="Email ID"
                type="email"
                value={member.email}
                required={index < memberCount}
                onChange={(value) => updateMember(index, "email", value)}
              />
            </div>
          </motion.div>
          ))}
          <motion.button
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="stage-sheen mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan via-[#4f7cff] to-accent-violet px-6 py-3.5 text-sm font-bold text-black shadow-[0_14px_50px_rgba(34,211,238,.22)] disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            Register team
          </motion.button>
        </div>
      </motion.form>
    );
  }

  if (hackathon && step === 3) {
    const fileIcon =
      abstract && /\.pptx?$/i.test(abstract.name) ? (
        <Presentation size={20} />
      ) : abstract ? (
        <FileText size={20} />
      ) : (
        <Upload size={20} className={dragging ? "animate-bounce" : undefined} />
      );

    return (
      <motion.form
        key="abstract-step"
        initial={{ opacity: 0, x: 42, filter: "blur(8px)" }}
        animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
        transition={{ type: "spring", stiffness: 220, damping: 24 }}
        onSubmit={submitAbstract}
        className="grid gap-7 lg:grid-cols-[150px_1fr]"
      >
        <div className="flex flex-col gap-4 lg:col-span-2">
          <motion.div
            whileHover={{ scale: 1.006 }}
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
            className="stage-dropzone relative flex items-center gap-3 rounded-2xl border border-dashed border-accent-cyan/35 bg-accent-cyan/[0.045] shadow-[0_16px_60px_rgba(34,211,238,.07)] transition-colors focus-within:border-accent-cyan/70 focus-within:bg-accent-cyan/[0.07]"
          >
            <label className="flex min-w-0 flex-1 cursor-pointer items-center gap-3 px-5 py-6 sm:py-7">
              <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan">
                {fileIcon}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate text-sm font-semibold text-text">
                  {abstract ? abstract.name : dragging ? "Drop your file here" : "Choose your abstract"}
                </span>
                <span className="mt-0.5 block text-xs text-text-muted">
                  {abstract
                    ? `${formatBytes(abstract.size)} · click to replace`
                    : "PDF, DOC, DOCX, PPT or PPTX · up to 4 MB · drag & drop welcome"}
                </span>
              </span>
              <span className="hidden shrink-0 rounded-full border border-accent-cyan/40 bg-accent-cyan/10 px-4 py-1.5 text-[11px] font-bold tracking-wide text-accent-cyan sm:inline-flex">
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
                className="mr-3 flex h-8 w-8 shrink-0 items-center justify-center rounded-full border border-border-strong/70 text-text-muted transition-colors hover:border-accent-rose/60 hover:bg-accent-rose/10 hover:text-accent-rose"
              >
                <X size={15} />
              </button>
            )}
          </motion.div>
          <motion.button
            whileHover={{ scale: 1.015, y: -2 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            disabled={submitting}
            className="stage-sheen mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan via-[#4f7cff] to-accent-violet px-6 py-3.5 text-sm font-bold text-black shadow-[0_14px_50px_rgba(34,211,238,.22)] disabled:opacity-60"
          >
            {submitting ? <Loader2 size={16} className="animate-spin" /> : <Upload size={16} />}
            Submit abstract
          </motion.button>
        </div>
      </motion.form>
    );
  }

  return (
    <motion.form
      key="leader-step"
      initial={{ opacity: 0, x: -42, filter: "blur(8px)" }}
      animate={{ opacity: 1, x: 0, filter: "blur(0px)" }}
      transition={{ type: "spring", stiffness: 220, damping: 24 }}
      onSubmit={handleSubmit}
      className="grid gap-7 lg:grid-cols-[150px_1fr]"
    >
    <div className="flex flex-col gap-4 lg:col-span-2">
        {hackathon ? (
          <>
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
          </>
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
        <motion.button
          whileHover={{ scale: 1.015, y: -2 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={submitting}
          className="stage-sheen mt-3 flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-accent-cyan via-[#4f7cff] to-accent-violet px-6 py-3.5 text-sm font-bold text-black shadow-[0_14px_50px_rgba(34,211,238,.22)] disabled:opacity-60"
        >
          {submitting ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
          {hackathon ? "Continue to members" : "Register"}
        </motion.button>
      </div>
    </motion.form>
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
        className="w-full rounded-xl border border-border-strong/80 bg-fg/[0.04] px-4 py-3 text-sm outline-none transition-all duration-300 hover:border-accent-cyan/35 focus:-translate-y-0.5 focus:border-accent-cyan/70 focus:bg-accent-cyan/[0.045] focus:shadow-[0_12px_34px_rgba(34,211,238,.08)]"
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
          className={`w-full appearance-none rounded-xl border border-border-strong/80 bg-fg/[0.04] px-4 py-3 pr-10 text-sm outline-none transition-all duration-300 hover:border-accent-cyan/35 focus:-translate-y-0.5 focus:border-accent-cyan/70 focus:bg-accent-cyan/[0.045] focus:shadow-[0_12px_34px_rgba(34,211,238,.08)] ${
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

function StageGate({
  eventId,
  title,
  description,
  href,
  label,
  onResume,
}: {
  eventId: string;
  title: string;
  description: string;
  href: "leader" | "team";
  label: string;
  onResume: (data: ResumeData) => void;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 14 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ type: "spring", stiffness: 200, damping: 22 }}
      className="relative overflow-hidden rounded-2xl border border-dashed border-accent-cyan/40 bg-accent-cyan/[0.035] px-6 py-10 text-center"
    >
      <div className="pointer-events-none absolute inset-x-10 top-0 h-px bg-gradient-to-r from-transparent via-accent-cyan/60 to-transparent" />
      <span className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border border-accent-cyan/30 bg-accent-cyan/10 text-accent-cyan">
        <Lock size={20} />
      </span>
      <p className="mt-4 font-display text-lg font-semibold">{title}</p>
      <p className="mx-auto mt-1.5 max-w-sm text-sm leading-relaxed text-text-muted">{description}</p>
      <Link
        href={`/upcoming-events/${eventId}/register/${href}`}
        className="stage-sheen mt-5 inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-5 py-2.5 text-xs font-bold text-on-accent"
      >
        {label}
        <ArrowUpRight size={14} />
      </Link>

      <div className="mx-auto mt-7 max-w-sm border-t border-border/60 pt-5">
        <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-text-faint">
          Registered on another device?
        </p>
        <p className="mt-1 text-xs text-text-muted">
          Find your registration with the leader&apos;s email and phone number.
        </p>
        <ResumeForm eventId={eventId} onResume={onResume} />
      </div>
    </motion.div>
  );
}

function ResumeForm({ eventId, onResume }: { eventId: string; onResume: (data: ResumeData) => void }) {
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [busy, setBusy] = useState(false);

  async function handleFind(e: React.FormEvent) {
    e.preventDefault();
    setBusy(true);
    try {
      const res = await fetch(`/api/upcoming-events/${eventId}/register/resume`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, phone }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message);
      onResume(data);
      toast.success("Registration found — continuing.");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Could not find your registration.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <form onSubmit={handleFind} className="mt-4 space-y-3 text-left">
      <Field
        label="Leader email"
        type="email"
        value={email}
        onChange={setEmail}
        placeholder="you@example.com"
        autoComplete="email"
      />
      <Field
        label="Leader phone"
        type="tel"
        inputMode="tel"
        value={phone}
        onChange={setPhone}
        placeholder="10-digit mobile number"
        autoComplete="tel"
      />
      <button
        type="submit"
        disabled={busy}
        className="flex w-full items-center justify-center gap-2 rounded-xl border border-accent-cyan/50 bg-accent-cyan/10 py-2.5 text-xs font-bold uppercase tracking-wide text-accent-cyan transition-colors hover:bg-accent-cyan/15 disabled:opacity-60"
      >
        {busy ? <Loader2 size={14} className="animate-spin" /> : <Search size={14} />}
        Find my registration
      </button>
    </form>
  );
}
