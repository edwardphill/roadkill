import {
  boolean,
  doublePrecision,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";

// One row per animal someone saw on the road. Kept append-only in spirit:
// status changes, but the original observation fields are never rewritten,
// so the dataset stays usable for research (species, location, time, condition).
export const reports = pgTable(
  "reports",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    observedAt: timestamp("observed_at", { withTimezone: true }).notNull(),
    lat: doublePrecision("lat").notNull(),
    lng: doublePrecision("lng").notNull(),
    accuracyM: integer("accuracy_m"),
    stateCode: text("state_code").notNull(),
    roadName: text("road_name"),
    species: text("species").notNull(),
    speciesCategory: text("species_category").notNull(),
    sex: text("sex").notNull().default("unknown"),
    ageClass: text("age_class").notNull().default("unknown"),
    condition: text("condition").notNull().default("unknown"),
    // reported | claimed | salvaged | gone
    status: text("status").notNull().default("reported"),
    // What the rules said at report time: allowed | permit | notify | prohibited | unclear
    eligibility: text("eligibility").notNull(),
    regsVersion: text("regs_version").notNull(),
    reporterHandle: text("reporter_handle"),
    notes: text("notes"),
  },
  (t) => [index("reports_state_idx").on(t.stateCode), index("reports_observed_idx").on(t.observedAt)],
);

export const claims = pgTable("claims", {
  id: uuid("id").primaryKey().defaultRandom(),
  reportId: uuid("report_id")
    .notNull()
    .references(() => reports.id, { onDelete: "cascade" }),
  claimantHandle: text("claimant_handle").notNull(),
  claimedAt: timestamp("claimed_at", { withTimezone: true }).notNull().defaultNow(),
  salvagedAt: timestamp("salvaged_at", { withTimezone: true }),
  permitNumber: text("permit_number"),
  acknowledgedRules: boolean("acknowledged_rules").notNull(),
  // meat | hide | antlers | skull | research | other
  intendedUse: text("intended_use"),
});

export type Report = typeof reports.$inferSelect;
export type Claim = typeof claims.$inferSelect;
