// Category drives the salvage rules lookup; keep it coarse on purpose since
// state rules are written at this level (big game, game birds, furbearers...).
export type SpeciesCategory =
  | "big_game"
  | "bear"
  | "turkey"
  | "game_bird"
  | "migratory_bird"
  | "small_game"
  | "furbearer"
  | "other";

export const SPECIES: { id: string; label: string; category: SpeciesCategory }[] = [
  { id: "white_tailed_deer", label: "White-tailed deer", category: "big_game" },
  { id: "mule_deer", label: "Mule deer", category: "big_game" },
  { id: "elk", label: "Elk", category: "big_game" },
  { id: "moose", label: "Moose", category: "big_game" },
  { id: "pronghorn", label: "Pronghorn", category: "big_game" },
  { id: "wild_hog", label: "Feral hog", category: "other" },
  { id: "black_bear", label: "Black bear", category: "bear" },
  { id: "wild_turkey", label: "Wild turkey", category: "turkey" },
  { id: "pheasant", label: "Ring-necked pheasant", category: "game_bird" },
  { id: "ruffed_grouse", label: "Ruffed grouse", category: "game_bird" },
  { id: "sage_grouse", label: "Sage / sharp-tailed grouse", category: "game_bird" },
  { id: "quail", label: "Quail", category: "game_bird" },
  { id: "chukar_partridge", label: "Chukar / partridge", category: "game_bird" },
  { id: "duck", label: "Duck", category: "migratory_bird" },
  { id: "goose", label: "Goose", category: "migratory_bird" },
  { id: "dove", label: "Dove", category: "migratory_bird" },
  { id: "woodcock", label: "Woodcock", category: "migratory_bird" },
  { id: "rabbit", label: "Rabbit / hare", category: "small_game" },
  { id: "squirrel", label: "Squirrel", category: "small_game" },
  { id: "raccoon", label: "Raccoon", category: "furbearer" },
  { id: "fox", label: "Fox", category: "furbearer" },
  { id: "coyote", label: "Coyote", category: "furbearer" },
  { id: "beaver", label: "Beaver", category: "furbearer" },
  { id: "bobcat", label: "Bobcat", category: "furbearer" },
  { id: "opossum", label: "Opossum", category: "furbearer" },
  { id: "other", label: "Other / unsure", category: "other" },
];

export const CATEGORY_LABELS: Record<SpeciesCategory, string> = {
  big_game: "Big game",
  bear: "Bear",
  turkey: "Wild turkey",
  game_bird: "Upland game bird",
  migratory_bird: "Migratory bird",
  small_game: "Small game",
  furbearer: "Furbearer",
  other: "Other",
};

export function findSpecies(id: string) {
  return SPECIES.find((s) => s.id === id);
}
