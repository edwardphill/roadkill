import { findSpecies } from "./species";

export const speciesLabel = (id: string) => findSpecies(id)?.label ?? id;

export const STATUS_LABEL: Record<string, string> = {
  reported: "Available",
  claimed: "Claimed",
  salvaged: "Picked up",
  gone: "Gone",
};

export function fmtDate(d: Date) {
  return d.toLocaleString("en-US", { dateStyle: "medium", timeStyle: "short" });
}
