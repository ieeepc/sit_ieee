import Link from "next/link";
import { ArrowRight } from "lucide-react";

type Stage = {
  number: string;
  name: string;
  stage: "leader" | "team" | "abstract";
};

export default function RegistrationChooser({
  eventId,
  stages,
}: {
  eventId: string;
  stages: readonly Stage[];
}) {
  return (
    <nav aria-label="HACK-Z registration stages" className="mt-8">
      <ol className="divide-y divide-border overflow-hidden rounded-xl border border-border bg-bg-elevated/60">
        {stages.map((item) => (
          <li key={item.stage}>
            <Link
              href={`/upcoming-events/${eventId}/register/${item.stage}`}
              className="group flex items-center gap-4 px-5 py-4 transition-colors hover:bg-fg/[0.03]"
            >
              <span className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg border border-border-strong bg-fg/[0.02] text-xs font-semibold text-accent-cyan">
                {item.number}
              </span>
              <span className="min-w-0 flex-1">
                <span className="block text-sm font-semibold text-text">{item.name}</span>
              </span>
              <ArrowRight
                size={16}
                className="shrink-0 text-text-faint transition-colors group-hover:text-accent-cyan"
              />
            </Link>
          </li>
        ))}
      </ol>
    </nav>
  );
}
