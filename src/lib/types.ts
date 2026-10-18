import type { Eligibility } from "./regs";

// One row per animal someone saw on the road. Kept append-only in spirit:
// status changes, but the original observation fields are never rewritten,
// so the dataset stays usable for research (species, location, time, condition).
export type ReportStatus = "reported" | "claimed" | "salvaged" | "gone";

export type Report = {
  id: string;
  createdAt: Date;
  observedAt: Date;
  lat: number;
  lng: number;
  accuracyM: number | null;
  stateCode: string;
  roadName: string | null;
  species: string;
  speciesCategory: string;
  sex: string;
  ageClass: string;
  condition: string;
  status: ReportStatus;
  // What the rules said at report time.
  eligibility: Eligibility;
  regsVersion: string;
  reporterId: string | null;
  reporterHandle: string | null;
  notes: string | null;
};

// Permit numbers are write-only from the browser; the public view never includes them.
export type Claim = {
  id: string;
  reportId: string;
  claimantId: string | null;
  claimantHandle: string;
  claimedAt: Date;
  salvagedAt: Date | null;
  // meat | hide | antlers | skull | research | other
  intendedUse: string | null;
};

export type NewReport = Omit<Report, "id" | "createdAt" | "status" | "reporterId">;

export type NewClaim = {
  claimantHandle: string;
  permitNumber?: string;
  intendedUse?: string;
};

export type Stats = { reports: number; states: number; salvaged: number };
