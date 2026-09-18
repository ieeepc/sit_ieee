import Image from "next/image";
import { connectDB } from "@/lib/db";
import Member from "@/models/Member";
import Reveal from "@/components/Reveal";
import { UserRound } from "lucide-react";
import { LinkedinIcon, GithubIcon } from "@/components/BrandIcons";

export const dynamic = "force-dynamic";

type MemberItem = {
  _id: string;
  name: string;
  photo?: string;
  tag: string;
  linkedin?: string;
  github?: string;
};

const facultyCoordinators = [
  {
    name: "Dr.T Srinivas",
    role: "Chapter Advisor",
    photo: "/faculty-srinivas.jpg",
  },
  {
    name: "Dr. T.N Chandrika",
    role: "Associate Professor, ETE Dept.",
    photo: "/faculty-chandrika.jpeg",
  },
];

async function getMembers(): Promise<MemberItem[]> {
  await connectDB();
  const members = await Member.find({})
    .select("name photo tag linkedin github createdAt")
    .sort({ createdAt: 1 })
    .lean();
  return JSON.parse(JSON.stringify(members));
}

function initials(name: string) {
  return name
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((n) => n[0])
    .join("")
    .toUpperCase();
}

export default async function OurTeamPage() {
  const members = await getMembers();

  return (
    <div className="mx-auto max-w-6xl px-5 py-16 sm:py-20 lg:py-24">
      <Reveal>
        <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">The people behind it</p>
        <h1 className="mt-3 font-display text-4xl font-semibold tracking-tight sm:text-5xl lg:text-6xl">
          Our <span className="text-gradient">Team</span>
        </h1>
        <p className="mt-4 max-w-xl text-base text-text-muted sm:text-lg">
          Students who volunteer their time to build workshops, events, and community.
        </p>
      </Reveal>

      {/* Faculty Coordinators */}
      <section className="mt-16 sm:mt-20">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">Guided by</p>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Faculty Coordinators</h2>
        </Reveal>

        <div className="mt-8 flex flex-col items-center gap-6 sm:flex-row sm:justify-center">
          {facultyCoordinators.map((f, i) => (
            <Reveal key={f.name} delay={i * 0.1}>
              <div className="glass-card flex w-72 flex-col items-center rounded-2xl p-7 text-center transition-colors hover:border-border-strong">
                <div className="relative h-36 w-36 overflow-hidden rounded-full ring-2 ring-accent-cyan/50 sm:h-40 sm:w-40">
                  <Image src={f.photo} alt={f.name} fill sizes="160px" className="object-cover" />
                </div>
                <p className="mt-5 font-display text-lg font-semibold">{f.name}</p>
                <p className="mt-1 text-sm text-text-muted">{f.role}</p>
              </div>
            </Reveal>
          ))}
        </div>
      </section>

      {/* Team Founders */}
      <section className="mt-16 sm:mt-20">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">Where it began</p>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Team Founders</h2>
        </Reveal>

        <Reveal delay={0.08}>
          <div className="relative mt-8 aspect-[16/8] w-full overflow-hidden rounded-2xl ring-1 ring-border-strong sm:aspect-[16/7]">
            <Image
              src="/team-founders.jpeg"
              alt="Team Founders — 2019"
              fill
              sizes="(min-width: 1024px) 1152px, 100vw"
              className="object-cover"
              priority={false}
            />
          </div>
        </Reveal>
      </section>

      {/* Current roster */}
      <section className="mt-16 sm:mt-20">
        <Reveal>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-text-faint">This year</p>
          <h2 className="mt-2 font-display text-2xl font-semibold sm:text-3xl">Our Team</h2>
        </Reveal>

        {members.length === 0 ? (
          <Reveal delay={0.1}>
            <div className="glass-card mt-8 flex flex-col items-center gap-3 rounded-2xl px-8 py-20 text-center">
              <UserRound className="text-accent-cyan" size={32} />
              <p className="text-text-muted">Team roster is being updated. Check back soon.</p>
            </div>
          </Reveal>
        ) : (
          <div className="mt-8 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            {members.map((m, i) => (
              <Reveal key={m._id} delay={(i % 8) * 0.05}>
                <div className="glass-card group flex h-full flex-col items-center rounded-2xl p-6 text-center transition-colors hover:border-border-strong">
                  <div className="relative h-32 w-32 overflow-hidden rounded-full ring-2 ring-accent-cyan/40 sm:h-36 sm:w-36">
                    {m.photo ? (
                      <Image
                        src={m.photo}
                        alt={m.name}
                        fill
                        sizes="144px"
                        className="object-cover"
                      />
                    ) : (
                      <div className="flex h-full w-full items-center justify-center bg-gradient-to-br from-accent-violet/30 to-accent-cyan/30 font-display text-2xl font-semibold">
                        {initials(m.name)}
                      </div>
                    )}
                  </div>
                  <p className="mt-4 text-base font-semibold leading-tight">{m.name}</p>
                  <p className="mt-1 text-sm text-accent-cyan">{m.tag || "Member"}</p>
                  {(m.linkedin || m.github) && (
                    <div className="mt-4 flex gap-2">
                      {m.linkedin && (
                        <a
                          href={m.linkedin}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-border p-2 text-text-muted transition-colors hover:border-border-strong hover:text-text"
                          aria-label={`${m.name} LinkedIn`}
                        >
                          <LinkedinIcon size={15} />
                        </a>
                      )}
                      {m.github && (
                        <a
                          href={m.github}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="rounded-full border border-border p-2 text-text-muted transition-colors hover:border-border-strong hover:text-text"
                          aria-label={`${m.name} GitHub`}
                        >
                          <GithubIcon size={15} />
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </Reveal>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
