import { notFound } from "next/navigation";
import { getState, STATES } from "@/lib/regs";

export function generateStaticParams() {
  return STATES.map((s) => ({ code: s.code }));
}

const ALLOWED: Record<string, string> = { yes: "Yes", no: "No", unclear: "Unclear" };

export default async function StateRegsPage({ params }: PageProps<"/regs/[code]">) {
  const { code } = await params;
  const st = getState(code);
  if (!st) notFound();

  const rows: [string, string][] = [
    ["Status", st.statusLabel],
    ["How to", st.howTo],
    ["Timing", st.timing],
    ["Big game", ALLOWED[st.categories.bigGame]],
    ["Bear", ALLOWED[st.categories.bear]],
    ["Wild turkey", ALLOWED[st.categories.turkey]],
    ["Other upland birds", ALLOWED[st.categories.uplandBirds]],
    ["Game bird details", st.gameBirdsNote],
    ["Small game", ALLOWED[st.categories.smallGame]],
    ["Furbearers", ALLOWED[st.categories.furbearers]],
    ["Excluded", st.excluded],
    ["Selling parts", st.saleOfParts],
    ["Other restrictions", st.otherRestrictions],
    ["Law", st.citation],
    ["Agency", st.agency],
    ["Confidence", st.confidence],
  ];

  return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold">{st.name}</h1>
      <dl className="space-y-3 text-sm">
        {rows
          .filter(([, v]) => v)
          .map(([k, v]) => (
            <div key={k}>
              <dt className="text-zinc-500">{k}</dt>
              <dd>{v}</dd>
            </div>
          ))}
      </dl>
      <p className="text-sm">
        Migratory birds (ducks, geese, doves, woodcock) can&apos;t be salvaged in any state without a federal permit.
      </p>
      <a className="underline" href={st.url} target="_blank" rel="noreferrer">
        Official source
      </a>
    </div>
  );
}
