import regsData from "@/data/regs.json";
import type { SpeciesCategory } from "./species";

export type Allowed = "yes" | "no" | "unclear";

export type StateRegs = {
  code: string;
  name: string;
  // permit | notify | open | discretion | prohibited
  status: string;
  statusLabel: string;
  reportWithinHours: number | null;
  categories: Record<"bigGame" | "bear" | "turkey" | "uplandBirds" | "smallGame" | "furbearers", Allowed>;
  saleOfParts: string;
  howTo: string;
  timing: string;
  excluded: string;
  gameBirdsNote: string;
  otherRestrictions: string;
  citation: string;
  agency: string;
  url: string;
  confidence: string;
};

export const REGS_VERSION: string = regsData.version;
export const STATES: StateRegs[] = regsData.states as StateRegs[];

export function getState(code: string) {
  return STATES.find((s) => s.code === code.toUpperCase());
}

export type Eligibility = "allowed" | "permit" | "notify" | "prohibited" | "unclear";

export type Guidance = {
  eligibility: Eligibility;
  headline: string;
  details: string[];
  url?: string;
};

const CATEGORY_KEY: Partial<Record<SpeciesCategory, keyof StateRegs["categories"]>> = {
  big_game: "bigGame",
  bear: "bear",
  turkey: "turkey",
  game_bird: "uplandBirds",
  small_game: "smallGame",
  furbearer: "furbearers",
};

// Turns the state table into a plain answer for one animal. Deliberately
// conservative: anything we can't confirm comes back "unclear" with the agency link.
export function evaluate(stateCode: string, category: SpeciesCategory): Guidance {
  const st = getState(stateCode);
  if (!st) return { eligibility: "unclear", headline: "Unknown state", details: [] };

  if (category === "migratory_bird") {
    return {
      eligibility: "prohibited",
      headline: "Leave it. Migratory birds are federally protected.",
      details: [
        "Ducks, geese, doves, woodcock and other migratory birds fall under the federal Migratory Bird Treaty Act. Possessing one, or its feathers, without a federal permit is illegal in every state.",
        "You can still log the sighting so it counts in the data.",
      ],
      url: "https://www.fws.gov/law/migratory-bird-treaty-act-1918",
    };
  }

  const base = [st.howTo, st.timing && `Timing: ${st.timing}`, st.excluded && `Not allowed: ${st.excluded}`]
    .filter(Boolean) as string[];

  if (st.status === "prohibited") {
    return { eligibility: "prohibited", headline: `Salvage isn't allowed in ${st.name}.`, details: base, url: st.url };
  }

  const key = CATEGORY_KEY[category];
  const allowed: Allowed = key ? st.categories[key] : "unclear";
  if ((category === "game_bird" || category === "turkey") && st.gameBirdsNote) base.unshift(`Game birds: ${st.gameBirdsNote}`);

  if (allowed === "no") {
    return { eligibility: "prohibited", headline: `This animal can't be salvaged in ${st.name}.`, details: base, url: st.url };
  }
  if (allowed === "unclear" || st.status === "discretion") {
    return {
      eligibility: "unclear",
      headline: `Check with ${st.agency} before picking it up.`,
      details: base,
      url: st.url,
    };
  }
  if (st.status === "permit") {
    return { eligibility: "permit", headline: `Allowed in ${st.name} with a salvage permit.`, details: base, url: st.url };
  }
  if (st.status === "notify") {
    return { eligibility: "notify", headline: `Allowed in ${st.name}. You must report it.`, details: base, url: st.url };
  }
  return { eligibility: "allowed", headline: `Allowed in ${st.name}.`, details: base, url: st.url };
}
