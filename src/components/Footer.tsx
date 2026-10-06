import Link from "next/link";
import { Mail } from "lucide-react";
import { InstagramIcon, FacebookIcon, LinkedinIcon } from "@/components/BrandIcons";

export default function Footer() {
  return (
    <footer className="border-t border-border bg-bg-elevated/60">
      <div className="mx-auto max-w-6xl px-5 py-12">
        <div className="grid gap-10 sm:grid-cols-2 md:grid-cols-3">
          <div>
            <p className="font-display text-lg font-semibold">
              SIT IEEE Photonics <span className="text-text-muted">&</span> ComSoc
            </p>
            <p className="mt-3 max-w-xs text-sm leading-relaxed text-text-muted">
              Empowering students in both technical and personal growth since 2019.
            </p>
          </div>

          <div>
            <p className="text-sm font-semibold text-text">Explore</p>
            <div className="mt-3 flex flex-col gap-2 text-sm text-text-muted">
              <Link href="/upcoming-events" className="transition-colors hover:text-text">
                Upcoming Events
              </Link>
              <Link href="/timeline" className="transition-colors hover:text-text">
                Timeline
              </Link>
              <Link href="/our-team" className="transition-colors hover:text-text">
                Our Team
              </Link>
              <Link href="/join-us" className="transition-colors hover:text-text">
                Join Us
              </Link>
              <Link href="/member-login" className="transition-colors hover:text-text">
                Member Login
              </Link>
            </div>
          </div>

          <div>
            <p className="text-sm font-semibold text-text">Connect</p>
            <div className="mt-3 flex gap-3">
              <a
                href="https://www.instagram.com/sit.ieee.photonics.comsoc/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border p-2 text-text-muted transition-colors hover:border-border-strong hover:text-text"
                aria-label="Instagram"
              >
                <InstagramIcon size={16} />
              </a>
              <a
                href="https://www.facebook.com/sit.photonics/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border p-2 text-text-muted transition-colors hover:border-border-strong hover:text-text"
                aria-label="Facebook"
              >
                <FacebookIcon size={16} />
              </a>
              <a
                href="https://www.linkedin.com/company/ieee-photonics-and-comsoc-sit-chapter/"
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-full border border-border p-2 text-text-muted transition-colors hover:border-border-strong hover:text-text"
                aria-label="LinkedIn"
              >
                <LinkedinIcon size={16} />
              </a>
              <a
                href="mailto:sit.photonics.chapter@gmail.com"
                className="rounded-full border border-border p-2 text-text-muted transition-colors hover:border-border-strong hover:text-text"
                aria-label="Email"
              >
                <Mail size={16} />
              </a>
            </div>
            <p className="mt-4 text-sm leading-relaxed text-text-muted">
              Dr. Sree Sree Sivakumara Swamiji Road,
              <br />
              Tumakuru – 572 103,
              <br />
              Karnataka, India
            </p>
          </div>
        </div>

        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-text-faint">
          © {new Date().getFullYear()} Team IEEE Photonics & ComSoc. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
