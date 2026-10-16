import Link from "next/link";
import { REGS_VERSION, STATES } from "@/lib/regs";

const DOT: Record<string, string> = {
  open: "bg-green-600",
  notify: "bg-green-600",
  permit: "bg-amber-500",
  discretion: "bg-amber-500",
  prohibited: "bg-red-600",
};

export default function RegsPage() {
  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">Roadkill salvage rules by state</h1>
      <p className="text-sm text-zinc-500">
        Researched {REGS_VERSION}. A summary, not legal advice. Always confirm with the state agency.
      </p>
      <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
        {STATES.map((s) => (
          <li key={s.code}>
            <Link href={`/regs/${s.code}`} className="flex items-center gap-3 py-2">
              <span className={`h-2.5 w-2.5 shrink-0 rounded-full ${DOT[s.status] ?? "bg-zinc-400"}`} />
              <span className="w-36 font-medium">{s.name}</span>
              <span className="text-sm text-zinc-500">{s.statusLabel}</span>
            </Link>
          </li>
        ))}
      </ul>
    </div>
  );
}
