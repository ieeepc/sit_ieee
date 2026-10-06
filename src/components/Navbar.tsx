"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Menu, X, User } from "lucide-react";
import { cn } from "@/lib/utils";
import { useSession } from "./SessionProvider";

const links = [
  { href: "/", label: "Home" },
  { href: "/upcoming-events", label: "Upcoming Events" },
  { href: "/timeline", label: "Timeline" },
  { href: "/our-team", label: "Our Team" },
  { href: "/join-us", label: "Join Us" },
];

export default function Navbar() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const { member, loading } = useSession();

  return (
    <header className="sticky top-0 z-50">
      <div className="border-b border-border bg-bg/70 backdrop-blur-xl">
        <nav className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3.5">
          <Link href="/" className="flex min-w-0 items-center gap-2.5" onClick={() => setOpen(false)}>
            <Image
              src="/logo.jpeg"
              alt="SIT IEEE Photonics & ComSoc logo"
              width={38}
              height={38}
              className="h-9 w-9 shrink-0 rounded-full object-cover ring-1 ring-border-strong sm:h-10 sm:w-10"
            />
            <span className="truncate font-display text-sm font-semibold leading-tight tracking-tight sm:text-base">
              <span className="hidden sm:inline">IEEE </span>
              Photonics <span className="text-text-muted">&</span> ComSoc
            </span>
          </Link>

          <div className="hidden items-center gap-1 md:flex">
            {links.map((l) => {
              const active = pathname === l.href;
              return (
                <Link
                  key={l.href}
                  href={l.href}
                  className={cn(
                    "relative rounded-full px-4 py-2 text-sm font-medium text-text-muted transition-colors hover:text-text",
                    active && "text-text"
                  )}
                >
                  {active && (
                    <motion.span
                      layoutId="nav-active"
                      className="absolute inset-0 rounded-full bg-white/[0.06] ring-1 ring-border"
                      transition={{ type: "spring", stiffness: 350, damping: 30 }}
                    />
                  )}
                  <span className="relative">{l.label}</span>
                </Link>
              );
            })}
          </div>

          <div className="hidden items-center gap-3 md:flex">
            {!loading &&
              (member ? (
                <Link
                  href="/member/dashboard"
                  className="flex items-center gap-2 rounded-full border border-border-strong bg-white/[0.04] py-1.5 pl-1.5 pr-4 text-sm font-medium transition-colors hover:bg-white/[0.08]"
                >
                  {member.photo ? (
                    <Image
                      src={member.photo}
                      alt={member.name}
                      width={26}
                      height={26}
                      className="rounded-full object-cover"
                    />
                  ) : (
                    <span className="flex h-[26px] w-[26px] items-center justify-center rounded-full bg-accent-violet/30">
                      <User size={14} />
                    </span>
                  )}
                  {member.name.split(" ")[0]}
                </Link>
              ) : (
                <Link
                  href="/member-login"
                  className="rounded-full bg-gradient-to-r from-accent-cyan to-accent-violet px-4 py-2 text-sm font-semibold text-black transition-transform hover:scale-[1.03]"
                >
                  Member Login
                </Link>
              ))}
          </div>

          <button
            className="rounded-lg p-2 text-text md:hidden"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X size={22} /> : <Menu size={22} />}
          </button>
        </nav>
      </div>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="overflow-hidden border-b border-border bg-bg/95 backdrop-blur-xl md:hidden"
          >
            <div className="flex flex-col gap-1 px-5 py-4">
              {links.map((l) => (
                <Link
                  key={l.href}
                  href={l.href}
                  onClick={() => setOpen(false)}
                  className={cn(
                    "rounded-lg px-3 py-2.5 text-sm font-medium text-text-muted",
                    pathname === l.href && "bg-white/[0.06] text-text"
                  )}
                >
                  {l.label}
                </Link>
              ))}
              <Link
                href={member ? "/member/dashboard" : "/member-login"}
                onClick={() => setOpen(false)}
                className="mt-2 rounded-lg bg-gradient-to-r from-accent-cyan to-accent-violet px-3 py-2.5 text-center text-sm font-semibold text-black"
              >
                {member ? `Hi, ${member.name.split(" ")[0]}` : "Member Login"}
              </Link>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
