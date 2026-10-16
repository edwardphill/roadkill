"use server";

import { eq } from "drizzle-orm";
import { redirect } from "next/navigation";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { db, schema } from "@/db";
import { evaluate, getState, REGS_VERSION } from "@/lib/regs";
import { findSpecies } from "@/lib/species";

const reportSchema = z.object({
  lat: z.coerce.number().min(-90).max(90),
  lng: z.coerce.number().min(-180).max(180),
  accuracyM: z.coerce.number().int().nonnegative().optional(),
  stateCode: z.string().length(2),
  roadName: z.string().max(200).optional(),
  species: z.string(),
  sex: z.enum(["male", "female", "unknown"]).default("unknown"),
  ageClass: z.enum(["adult", "juvenile", "unknown"]).default("unknown"),
  condition: z.enum(["fresh", "bloated", "decomposed", "unknown"]).default("unknown"),
  // datetime-local value plus the browser's getTimezoneOffset(), so the server
  // stores the true instant regardless of its own timezone.
  observedAtLocal: z.string().regex(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}/),
  tzOffset: z.coerce.number().int().min(-840).max(840),
  reporterHandle: z.string().max(60).optional(),
  notes: z.string().max(1000).optional(),
});

export type ActionState = { error?: string };

function formObject(formData: FormData) {
  // Empty inputs come through as "", which should mean "not provided".
  return Object.fromEntries([...formData.entries()].filter(([k, v]) => !k.startsWith("$") && v !== ""));
}

export async function createReport(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = reportSchema.safeParse(formObject(formData));
  if (!parsed.success) return { error: parsed.error.issues.map((i) => `${i.path}: ${i.message}`).join("; ") };
  const { observedAtLocal, tzOffset, ...input } = parsed.data;
  const observedAt = new Date(Date.parse(`${observedAtLocal.slice(0, 16)}:00Z`) + tzOffset * 60_000);
  const species = findSpecies(input.species);
  if (!species) return { error: "Unknown species" };
  if (!getState(input.stateCode)) return { error: "Unknown state" };

  const guidance = evaluate(input.stateCode, species.category);
  const [row] = await db
    .insert(schema.reports)
    .values({
      ...input,
      observedAt,
      stateCode: input.stateCode.toUpperCase(),
      speciesCategory: species.category,
      eligibility: guidance.eligibility,
      regsVersion: REGS_VERSION,
    })
    .returning({ id: schema.reports.id });

  revalidatePath("/");
  redirect(`/reports/${row.id}`);
}

const claimSchema = z.object({
  claimantHandle: z.string().min(1).max(60),
  permitNumber: z.string().max(80).optional(),
  intendedUse: z.enum(["meat", "hide", "antlers", "skull", "research", "other"]).optional(),
  acknowledgedRules: z.literal("on"),
});

export async function claimReport(reportId: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const parsed = claimSchema.safeParse(formObject(formData));
  if (!parsed.success) return { error: "Add your name and confirm you've followed your state's rules." };

  const [report] = await db.select().from(schema.reports).where(eq(schema.reports.id, reportId));
  if (!report) return { error: "Report not found" };
  if (report.status !== "reported") return { error: "Someone already claimed this one." };
  if (report.eligibility === "prohibited") return { error: "This animal can't legally be salvaged here." };
  if (report.eligibility === "permit" && !parsed.data.permitNumber) {
    return { error: "This state requires a salvage permit. Enter your permit or authorization number." };
  }

  await db.insert(schema.claims).values({ reportId, ...parsed.data, acknowledgedRules: true });
  await db.update(schema.reports).set({ status: "claimed" }).where(eq(schema.reports.id, reportId));
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/");
  return {};
}

export async function markStatus(reportId: string, status: "salvaged" | "gone") {
  await db.update(schema.reports).set({ status }).where(eq(schema.reports.id, reportId));
  if (status === "salvaged") {
    await db.update(schema.claims).set({ salvagedAt: new Date() }).where(eq(schema.claims.reportId, reportId));
  }
  revalidatePath(`/reports/${reportId}`);
  revalidatePath("/");
}
