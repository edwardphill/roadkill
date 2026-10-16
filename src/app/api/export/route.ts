import { asc } from "drizzle-orm";
import { db, schema } from "@/db";

const COLUMNS = [
  "id",
  "observedAt",
  "createdAt",
  "lat",
  "lng",
  "accuracyM",
  "stateCode",
  "roadName",
  "species",
  "speciesCategory",
  "sex",
  "ageClass",
  "condition",
  "status",
  "eligibility",
  "regsVersion",
] as const;

function cell(v: unknown) {
  if (v == null) return "";
  const s = v instanceof Date ? v.toISOString() : String(v);
  return /[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
}

// Research export: observation fields only, no reporter names or free-text notes.
export async function GET() {
  const rows = await db.select().from(schema.reports).orderBy(asc(schema.reports.observedAt));
  const lines = [COLUMNS.join(","), ...rows.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))];
  return new Response(lines.join("\n"), {
    headers: {
      "content-type": "text/csv; charset=utf-8",
      "content-disposition": 'attachment; filename="roadkill-reports.csv"',
    },
  });
}
