"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";
import { User, GraduationCap, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "./SessionProvider";
import ThemeToggle from "./ThemeToggle";

const links = [
  { href: "/", label: "Home" },
  { href: "/upcoming-events", label: "Upcoming Events" },
  { href: "/timeline", label: "Timeline" },
  { href: "/our-team", label: "Our Team" },
];

export default function Navbar() {
  const pathname = usePathname();
  const { member, faculty, loading } = useSession();
  const [open, setOpen] = useState(false);

  useEffect(() => {
    setOpen(false);
  }, [pathname]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const authControl = !loading ? (
    member ? (
      <Link
        href="/member/dashboard"
        onClick={() => setOpen(false)}
        className="flex w-full items-center gap-2 rounded-full border border-border-strong bg-fg/[0.04] py-1.5 pl-1.5 pr-4 text-sm font-medium transition-colors duration-200 hover:border-accent-cyan/50 hover:bg-fg/[0.08] sm:w-auto"
      >
        {member.photo ? (
          <Image
            src={member.photo}
            alt={member.name}
            width={26}
            height={26}
            className="h-[26px] w-[26px] rounded-full object-cover"
          />
        ) : (
          <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-accent-violet/30">
            <User size={14} />
          </span>
        )}
        <span className="truncate">{member.name.split(" ")[0]}</span>
      </Link>
    ) : faculty ? (
      <Link
        href="/faculty/dashboard"
        onClick={() => setOpen(false)}
        className="flex w-full items-center gap-2 rounded-full border border-border-strong bg-fg/[0.04] py-1.5 pl-1.5 pr-4 text-sm font-medium transition-colors duration-200 hover:border-accent-cyan/50 hover:bg-fg/[0.08] sm:w-auto"
      >
        <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-accent-cyan/25">
          <GraduationCap size={14} />
        </span>
        <span className="truncate">{faculty.username}</span>
      </Link>
    ) : (
      <Link
        href="/login"
        onClick={() => setOpen(false)}
        className="flex w-full items-center justify-center rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-2.5 text-sm font-semibold text-on-accent transition-[filter,box-shadow] duration-300 hover:brightness-110 hover:shadow-[0_10px_30px_-10px_var(--accent-cyan)] sm:w-auto sm:py-2"
      >
        Login
      </Link>
    )
  ) : null;

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-border bg-bg/70 backdrop-blur-xl">
        <nav className="relative mx-auto w-full px-4 sm:px-8 lg:px-12">
          <div className="flex items-center justify-between gap-x-3 py-3 sm:flex-wrap sm:gap-x-6 sm:gap-y-2 sm:py-3.5">
            <Link href="/" className="flex min-w-0 items-center gap-2 sm:gap-2.5">
              <Image
                src="/sit-logo.png"
                alt="Siddaganga Institute of Technology logo"
                width={44}
                height={44}
                priority
                className="h-8 w-8 shrink-0 object-contain drop-shadow-sm sm:h-11 sm:w-11"
              />
              <span aria-hidden className="hidden h-7 w-px shrink-0 bg-border-strong sm:block" />
              <Image
                src="/logo.jpeg"
                alt="SIT IEEE Photonics & ComSoc logo"
                width={38}
                height={38}
                className="h-8 w-8 shrink-0 rounded-full object-cover ring-1 ring-border-strong sm:h-10 sm:w-10"
              />
              <span aria-hidden className="hidden h-7 w-px shrink-0 bg-border-strong sm:block" />
              <span className="truncate font-display text-xs font-semibold leading-tight tracking-tight sm:text-base">
                <span className="hidden sm:inline">IEEE </span>
                Photonics <span className="text-text-muted">&</span> ComSoc
              </span>
              <span aria-hidden className="ml-1 hidden h-7 w-px shrink-0 bg-border-strong xl:block" />
              <Image
                src="/ieee-bangalore-section-logo-trim.png"
                alt="IEEE Bangalore Section"
                width={1905}
                height={417}
                className="ml-1 hidden h-5 w-auto shrink-0 brightness-0 invert xl:block light:brightness-100 light:invert-0"
              />
            </Link>

            <div className="hidden items-center gap-2 sm:flex sm:flex-wrap sm:justify-end sm:gap-x-3">
              <nav aria-label="Primary" className="flex flex-wrap items-center gap-0.5">
                {links.map((l) => (
                  <Link
                    key={l.href}
                    href={l.href}
                    className={cn(
                      "rounded-lg px-2.5 py-2 text-[13px] font-medium text-text-muted transition-colors duration-200 hover:bg-fg/[0.05] hover:text-text",
                      pathname === l.href && "bg-fg/[0.06] text-text"
                    )}
                  >
                    {l.label}
                  </Link>
                ))}
              </nav>

              <ThemeToggle />
              {authControl}
            </div>

            <button
              type="button"
              onClick={() => setOpen((value) => !value)}
              aria-expanded={open}
              aria-controls="mobile-menu"
              aria-label={open ? "Close menu" : "Open menu"}
              className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-fg/[0.04] text-text transition-colors duration-200 hover:border-accent-cyan/60 hover:bg-fg/[0.08] hover:text-accent-cyan sm:hidden"
            >
              {open ? <X size={18} /> : <Menu size={18} />}
            </button>
          </div>

          <AnimatePresence initial={false}>
            {open && (
              <motion.div
                id="mobile-menu"
                key="mobile-menu"
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: "auto", opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
                className="overflow-hidden sm:hidden"
              >
                <div className="border-t border-border/70 pb-4 pt-2">
                  <nav aria-label="Mobile" className="flex flex-col gap-0.5">
                    {links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        onClick={() => setOpen(false)}
                        className={cn(
                          "rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted transition-colors duration-200 hover:bg-fg/[0.05] hover:text-text",
                          pathname === l.href && "bg-fg/[0.06] text-text"
                        )}
                      >
                        {l.label}
                      </Link>
                    ))}
                  </nav>

                  <div className="mt-3 flex items-center justify-between border-t border-border/70 px-1 pt-3">
                    <span className="text-xs font-medium text-text-muted">Appearance</span>
                    <ThemeToggle className="h-8 w-8" />
                  </div>

                  {authControl && <div className="mt-3">{authControl}</div>}
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </nav>
      </div>
    </header>
  );
}
