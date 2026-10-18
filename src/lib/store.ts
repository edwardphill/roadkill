import { supabase } from "./supabase";
import type { Claim, NewClaim, NewReport, Report, ReportStatus, Stats } from "./types";

// Every read and write the pages make. Two backends with the same rules:
// Supabase when configured (shared, needs Google sign-in), otherwise this
// browser's localStorage so the site is usable before Supabase exists.

type Row = Record<string, unknown>;

const REPORT_COLS =
  "id, created_at, observed_at, lat, lng, accuracy_m, state_code, road_name, species, species_category, sex, age_class, condition, status, eligibility, regs_version, reporter_id, reporter_handle, notes";
const CLAIM_COLS = "id, report_id, claimant_id, claimant_handle, claimed_at, salvaged_at, intended_use";

const toDate = (v: unknown) => (v == null ? null : new Date(v as string));

function toReport(r: Row): Report {
  return {
    id: r.id as string,
    createdAt: toDate(r.created_at)!,
    observedAt: toDate(r.observed_at)!,
    lat: r.lat as number,
    lng: r.lng as number,
    accuracyM: (r.accuracy_m as number | null) ?? null,
    stateCode: r.state_code as string,
    roadName: (r.road_name as string | null) ?? null,
    species: r.species as string,
    speciesCategory: r.species_category as string,
    sex: r.sex as string,
    ageClass: r.age_class as string,
    condition: r.condition as string,
    status: r.status as ReportStatus,
    eligibility: r.eligibility as Report["eligibility"],
    regsVersion: r.regs_version as string,
    reporterId: (r.reporter_id as string | null) ?? null,
    reporterHandle: (r.reporter_handle as string | null) ?? null,
    notes: (r.notes as string | null) ?? null,
  };
}

function toClaim(r: Row): Claim {
  return {
    id: r.id as string,
    reportId: r.report_id as string,
    claimantId: (r.claimant_id as string | null) ?? null,
    claimantHandle: r.claimant_handle as string,
    claimedAt: toDate(r.claimed_at)!,
    salvagedAt: toDate(r.salvaged_at),
    intendedUse: (r.intended_use as string | null) ?? null,
  };
}

function fail(error: { message: string } | null): asserts error is null {
  if (error) throw new Error(error.message);
}

// ---- Demo backend (localStorage) ----

const KEY = "roadkill:v1";
type Local = { reports: Report[]; claims: (Claim & { permitNumber?: string })[] };

function load(): Local {
  try {
    const raw = JSON.parse(localStorage.getItem(KEY) ?? "null") as Local | null;
    if (!raw) return { reports: [], claims: [] };
    // Dates come back from JSON as strings.
    return {
      reports: raw.reports.map((r) => ({ ...r, createdAt: new Date(r.createdAt), observedAt: new Date(r.observedAt) })),
      claims: raw.claims.map((c) => ({ ...c, claimedAt: new Date(c.claimedAt), salvagedAt: toDate(c.salvagedAt) })),
    };
  } catch {
    return { reports: [], claims: [] };
  }
}

function save(data: Local) {
  localStorage.setItem(KEY, JSON.stringify(data));
}

// ---- Public API ----

export async function listReports(limit?: number): Promise<Report[]> {
  if (!supabase) {
    const rows = load().reports.sort((a, b) => b.observedAt.getTime() - a.observedAt.getTime());
    return limit ? rows.slice(0, limit) : rows;
  }
  let q = supabase.from("reports").select(REPORT_COLS).order("observed_at", { ascending: false });
  if (limit) q = q.limit(limit);
  const { data, error } = await q;
  fail(error);
  return data.map(toReport);
}

export async function getStats(): Promise<Stats> {
  if (!supabase) {
    const rows = load().reports;
    return {
      reports: rows.length,
      states: new Set(rows.map((r) => r.stateCode)).size,
      salvaged: rows.filter((r) => r.status === "salvaged").length,
    };
  }
  const { data, error } = await supabase.from("report_stats").select("reports, states, salvaged").single();
  fail(error);
  return data as Stats;
}

export async function getReport(id: string): Promise<{ report: Report; claim: Claim | null } | null> {
  if (!supabase) {
    const data = load();
    const report = data.reports.find((r) => r.id === id);
    if (!report) return null;
    const found = data.claims.find((c) => c.reportId === id);
    if (!found) return { report, claim: null };
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    const { permitNumber, ...claim } = found;
    return { report, claim };
  }
  const [r, c] = await Promise.all([
    supabase.from("reports").select(REPORT_COLS).eq("id", id).maybeSingle(),
    supabase.from("claims").select(CLAIM_COLS).eq("report_id", id).maybeSingle(),
  ]);
  fail(r.error);
  fail(c.error);
  if (!r.data) return null;
  return { report: toReport(r.data), claim: c.data ? toClaim(c.data) : null };
}

export async function createReport(input: NewReport, reporterId: string | null): Promise<string> {
  if (!supabase) {
    const data = load();
    const id = crypto.randomUUID();
    data.reports.push({ ...input, id, createdAt: new Date(), status: "reported", reporterId });
    save(data);
    return id;
  }
  const { data, error } = await supabase
    .from("reports")
    .insert({
      observed_at: input.observedAt.toISOString(),
      lat: input.lat,
      lng: input.lng,
      accuracy_m: input.accuracyM,
      state_code: input.stateCode,
      road_name: input.roadName,
      species: input.species,
      species_category: input.speciesCategory,
      sex: input.sex,
      age_class: input.ageClass,
      condition: input.condition,
      eligibility: input.eligibility,
      regs_version: input.regsVersion,
      reporter_handle: input.reporterHandle,
      notes: input.notes,
    })
    .select("id")
    .single();
  fail(error);
  return data.id as string;
}

// The checks here mirror claim_report() in supabase/schema.sql, which is what
// actually enforces them for shared data.
export async function claimReport(reportId: string, claim: NewClaim, claimantId: string | null): Promise<void> {
  if (!supabase) {
    const data = load();
    const report = data.reports.find((r) => r.id === reportId);
    if (!report) throw new Error("Report not found");
    if (report.status !== "reported") throw new Error("Someone already claimed this one.");
    if (report.eligibility === "prohibited") throw new Error("This animal can't legally be salvaged here.");
    if (report.eligibility === "permit" && !claim.permitNumber) {
      throw new Error("This state requires a salvage permit. Enter your permit or authorization number.");
    }
    data.claims.push({
      id: crypto.randomUUID(),
      reportId,
      claimantId,
      claimantHandle: claim.claimantHandle,
      claimedAt: new Date(),
      salvagedAt: null,
      intendedUse: claim.intendedUse ?? null,
      permitNumber: claim.permitNumber,
    });
    report.status = "claimed";
    save(data);
    return;
  }
  const { error } = await supabase.rpc("claim_report", {
    p_report_id: reportId,
    p_claimant_handle: claim.claimantHandle,
    p_permit_number: claim.permitNumber ?? null,
    p_intended_use: claim.intendedUse ?? null,
  });
  fail(error);
}

export async function markStatus(reportId: string, status: "salvaged" | "gone"): Promise<void> {
  if (!supabase) {
    const data = load();
    const report = data.reports.find((r) => r.id === reportId);
    if (!report) throw new Error("Report not found");
    report.status = status;
    if (status === "salvaged") {
      for (const c of data.claims) if (c.reportId === reportId) c.salvagedAt = new Date();
    }
    save(data);
    return;
  }
  const { error } = await supabase.rpc("set_report_status", { p_report_id: reportId, p_status: status });
  fail(error);
}
