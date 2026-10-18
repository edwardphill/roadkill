import type { Report } from "./types";

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
export function reportsCsv(rows: Report[]) {
  const sorted = [...rows].sort((a, b) => a.observedAt.getTime() - b.observedAt.getTime());
  return [COLUMNS.join(","), ...sorted.map((r) => COLUMNS.map((c) => cell(r[c])).join(","))].join("\n");
}

export function downloadCsv(rows: Report[]) {
  const url = URL.createObjectURL(new Blob([reportsCsv(rows)], { type: "text/csv;charset=utf-8" }));
  const a = Object.assign(document.createElement("a"), { href: url, download: "roadkill-reports.csv" });
  a.click();
  URL.revokeObjectURL(url);
}
