"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { downloadCsv } from "@/lib/csv";
import { fmtDate, speciesLabel, STATUS_LABEL } from "@/lib/format";
import { getStats, listReports } from "@/lib/store";
import type { Report, Stats } from "@/lib/types";

function RecentReports() {
  const [data, setData] = useState<{ rows: Report[]; totals: Stats } | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    Promise.all([listReports(50), getStats()])
      .then(([rows, totals]) => setData({ rows, totals }))
      .catch((e: Error) => setError(e.message));
  }, []);

  if (error) return <p className="text-red-600">Couldn&apos;t load reports: {error}</p>;
  if (!data) return <p className="text-zinc-500">Loading…</p>;
  const { rows, totals } = data;

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
              <Link href={`/reports/?id=${r.id}`} className="flex items-center justify-between py-3">
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
  const [exporting, setExporting] = useState(false);

  async function exportAll() {
    setExporting(true);
    try {
      downloadCsv(await listReports());
    } catch (e) {
      alert((e as Error).message);
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Recent roadkill</h1>
        <Link href="/report" className="rounded bg-orange-600 px-4 py-2 font-semibold text-white">
          Log one
        </Link>
      </div>
      <RecentReports />
      <p className="text-sm">
        <button onClick={exportAll} disabled={exporting} className="underline disabled:opacity-50">
          {exporting ? "Preparing…" : "Download all reports (CSV)"}
        </button>
      </p>
    </div>
  );
}
