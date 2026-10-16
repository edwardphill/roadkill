import { desc, sql } from "drizzle-orm";
import Link from "next/link";
import { connection } from "next/server";
import { Suspense } from "react";
import { db, schema } from "@/db";
import { fmtDate, speciesLabel, STATUS_LABEL } from "@/lib/format";

async function RecentReports() {
  await connection();
  const [rows, [totals]] = await Promise.all([
    db.select().from(schema.reports).orderBy(desc(schema.reports.observedAt)).limit(50),
    db
      .select({
        reports: sql<number>`count(*)::int`,
        states: sql<number>`count(distinct ${schema.reports.stateCode})::int`,
        salvaged: sql<number>`count(*) filter (where ${schema.reports.status} = 'salvaged')::int`,
      })
      .from(schema.reports),
  ]);

  return (
    <>
      <div className="grid grid-cols-3 gap-3 text-center">
        {[
          ["Reports", totals.reports],
          ["States", totals.states],
          ["Picked up", totals.salvaged],
        ].map(([label, n]) => (
          <div key={label} className="rounded-lg border border-zinc-200 p-3 dark:border-zinc-800">
            <div className="text-2xl font-bold">{n}</div>
            <div className="text-xs text-zinc-500">{label}</div>
          </div>
        ))}
      </div>
      {rows.length === 0 ? (
        <p className="text-zinc-500">No reports yet. Be the first.</p>
      ) : (
        <ul className="divide-y divide-zinc-200 dark:divide-zinc-800">
          {rows.map((r) => (
            <li key={r.id}>
              <Link href={`/reports/${r.id}`} className="flex items-center justify-between py-3">
                <span>
                  <span className="font-medium">{speciesLabel(r.species)}</span>
                  <span className="ml-2 text-sm text-zinc-500">
                    {r.stateCode}
                    {r.roadName ? ` · ${r.roadName}` : ""} · {fmtDate(r.observedAt)}
                  </span>
                </span>
                <span className="text-xs">{STATUS_LABEL[r.status]}</span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

export default function Home() {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recent roadkill</h1>
        <Link href="/report" className="rounded bg-orange-600 px-4 py-2 font-semibold text-white">
          Log one
        </Link>
      </div>
      <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
        <RecentReports />
      </Suspense>
      <p className="text-sm">
        <a href="/api/export" className="underline">
          Download all reports (CSV)
        </a>
      </p>
    </div>
  );
}
