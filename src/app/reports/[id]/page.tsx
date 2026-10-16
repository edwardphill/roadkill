import { eq } from "drizzle-orm";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";
import { markStatus } from "@/app/actions";
import { GuidanceCard } from "@/components/GuidanceCard";
import { db, schema } from "@/db";
import { fmtDate, speciesLabel, STATUS_LABEL } from "@/lib/format";
import { evaluate } from "@/lib/regs";
import type { SpeciesCategory } from "@/lib/species";
import { ClaimForm } from "./ClaimForm";

async function ReportDetail({ params }: { params: Promise<{ id: string }> }) {
  await connection();
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const [report] = await db.select().from(schema.reports).where(eq(schema.reports.id, id));
  if (!report) notFound();
  const [claim] = await db.select().from(schema.claims).where(eq(schema.claims.reportId, id));
  const guidance = evaluate(report.stateCode, report.speciesCategory as SpeciesCategory);

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
        <ClaimForm reportId={report.id} needsPermit={guidance.eligibility === "permit"} />
      )}
      {claim && (
        <p className="text-sm">
          Claimed by {claim.claimantHandle} on {fmtDate(claim.claimedAt)}
          {claim.salvagedAt ? `, picked up ${fmtDate(claim.salvagedAt)}` : ""}.
        </p>
      )}
      {(report.status === "reported" || report.status === "claimed") && (
        <div className="flex gap-2 text-sm">
          {report.status === "claimed" && (
            <form action={markStatus.bind(null, report.id, "salvaged")}>
              <button className="rounded border px-3 py-1">Mark picked up</button>
            </form>
          )}
          <form action={markStatus.bind(null, report.id, "gone")}>
            <button className="rounded border px-3 py-1">It&apos;s gone</button>
          </form>
        </div>
      )}
    </div>
  );
}

export default function ReportPage({ params }: PageProps<"/reports/[id]">) {
  return (
    <Suspense fallback={<p className="text-zinc-500">Loading…</p>}>
      <ReportDetail params={params} />
    </Suspense>
  );
}
