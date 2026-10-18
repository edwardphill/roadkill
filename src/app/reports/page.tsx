"use client";

import { useSearchParams } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";
import { RequireSignIn, useAuth } from "@/components/Auth";
import { GuidanceCard } from "@/components/GuidanceCard";
import { fmtDate, speciesLabel, STATUS_LABEL } from "@/lib/format";
import { evaluate } from "@/lib/regs";
import type { SpeciesCategory } from "@/lib/species";
import { getReport, markStatus } from "@/lib/store";
import type { Claim, Report } from "@/lib/types";
import { ClaimForm } from "./ClaimForm";

// A static site can't have a page per report, so the id rides in the query string: /reports/?id=…
function ReportDetail() {
  const id = useSearchParams().get("id") ?? "";
  const validId = /^[0-9a-f-]{36}$/i.test(id);
  const { user, canWrite } = useAuth();
  const [data, setData] = useState<{ report: Report; claim: Claim | null } | null | undefined>(undefined);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!validId) return;
    getReport(id)
      .then(setData)
      .catch((e: Error) => setError(e.message));
  }, [id, validId]);
  useEffect(load, [load]);

  async function setStatus(status: "salvaged" | "gone") {
    try {
      await markStatus(id, status);
      load();
    } catch (e) {
      setError((e as Error).message);
    }
  }

  if (!validId) return <p>Report not found.</p>;
  if (error) return <p className="text-red-600">{error}</p>;
  if (data === undefined) return <p className="text-zinc-500">Loading…</p>;
  if (data === null) return <p>Report not found.</p>;

  const { report, claim } = data;
  const guidance = evaluate(report.stateCode, report.speciesCategory as SpeciesCategory);
  // Demo mode has no accounts (claimantId is null), so anyone on the device may mark pickup.
  const isClaimant = !!claim && (claim.claimantId === null || claim.claimantId === user?.id);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold">{speciesLabel(report.species)}</h1>
        <p className="text-sm text-zinc-500">
          {report.stateCode}
          {report.roadName ? ` · ${report.roadName}` : ""} · {fmtDate(report.observedAt)} · {STATUS_LABEL[report.status]}
        </p>
      </div>
      <dl className="grid grid-cols-2 gap-2 text-sm">
        <dt className="text-zinc-500">Location</dt>
        <dd>
          <a
            className="underline"
            href={`https://www.google.com/maps/search/?api=1&query=${report.lat},${report.lng}`}
            target="_blank"
            rel="noreferrer"
          >
            {report.lat.toFixed(5)}, {report.lng.toFixed(5)}
          </a>
        </dd>
        <dt className="text-zinc-500">Sex / age</dt>
        <dd>
          {report.sex} / {report.ageClass}
        </dd>
        <dt className="text-zinc-500">Condition</dt>
        <dd>{report.condition}</dd>
        {report.reporterHandle && (
          <>
            <dt className="text-zinc-500">Reported by</dt>
            <dd>{report.reporterHandle}</dd>
          </>
        )}
      </dl>
      {report.notes && <p className="text-sm">{report.notes}</p>}

      <GuidanceCard guidance={guidance} />

      {report.status === "reported" && guidance.eligibility !== "prohibited" && (
        <RequireSignIn action="claim this pickup">
          <ClaimForm reportId={report.id} needsPermit={guidance.eligibility === "permit"} onClaimed={load} />
        </RequireSignIn>
      )}
      {claim && (
        <p className="text-sm">
          Claimed by {claim.claimantHandle} on {fmtDate(claim.claimedAt)}
          {claim.salvagedAt ? `, picked up ${fmtDate(claim.salvagedAt)}` : ""}.
        </p>
      )}
      {canWrite && (report.status === "reported" || report.status === "claimed") && (
        <div className="flex gap-2 text-sm">
          {report.status === "claimed" && isClaimant && (
            <button onClick={() => setStatus("salvaged")} className="rounded border px-3 py-1">
              Mark picked up
            </button>
          )}
          <button onClick={() => setStatus("gone")} className="rounded border px-3 py-1">
            It&apos;s gone
          </button>
        </div>
      )}
    </div>
  );
}

export default function ReportPage() {
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
      <ReportDetail />
    </Suspense>
  );
}
