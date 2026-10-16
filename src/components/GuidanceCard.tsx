import type { Guidance } from "@/lib/regs";

const TONE: Record<Guidance["eligibility"], string> = {
  allowed: "border-green-600 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
  notify: "border-green-600 bg-green-50 text-green-900 dark:bg-green-950 dark:text-green-100",
  permit: "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  unclear: "border-amber-500 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100",
  prohibited: "border-red-600 bg-red-50 text-red-900 dark:bg-red-950 dark:text-red-100",
};

export function GuidanceCard({ guidance }: { guidance: Guidance }) {
  return (
    <div className={`rounded-lg border-l-4 p-4 ${TONE[guidance.eligibility]}`}>
      <p className="font-semibold">{guidance.headline}</p>
      {guidance.details.length > 0 && (
        <ul className="mt-2 list-disc space-y-1 pl-5 text-sm">
          {guidance.details.map((d) => (
            <li key={d}>{d}</li>
          ))}
        </ul>
      )}
      {guidance.url && (
        <a className="mt-2 inline-block text-sm underline" href={guidance.url} target="_blank" rel="noreferrer">
          Official rules
        </a>
      )}
      <p className="mt-2 text-xs opacity-70">Summary only, not legal advice. Rules change; confirm with the agency.</p>
    </div>
  );
}
