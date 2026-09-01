import { SPECIES_GUIDE, WILAYA_CLIMATE, type GuideSpecies } from "@/data/species-guide";
import { WILAYA_SPECIES } from "@/data/wilaya-species";

export interface PlantSuggestion {
  species: GuideSpecies;
  /** Why this one: evidence = recorded growing in the wilaya (GBIF), fit = climate match only. */
  reason: "evidence" | "fit";
  /** GBIF occurrence count in the wilaya when reason is evidence. */
  count?: number;
}

const MAX_SUGGESTIONS = 4;

/**
 * "What to plant here" for a wilaya: curated species that fit the wilaya's
 * climate class, with the ones GBIF has recorded *inside that wilaya* first
 * (evidence beats theory). Suggestions only — local advice always wins.
 */
/** "Pistacia lentiscus L." → "pistacia lentiscus" (GBIF names carry authors). */
function binomial(latin: string): string {
  return latin.split(" ").slice(0, 2).join(" ").toLowerCase();
}

export function suggestForWilaya(code: string): PlantSuggestion[] {
  const climate = WILAYA_CLIMATE[code];
  if (!climate) return [];
  const evidenceLatin = new Map(
    (WILAYA_SPECIES[code] ?? []).map((e) => [binomial(e.latin), e.count]),
  );

  const out: PlantSuggestion[] = [];
  for (const species of SPECIES_GUIDE) {
    if (!species.fits.includes(climate)) continue;
    const count = evidenceLatin.get(binomial(species.latin));
    out.push(count != null ? { species, reason: "evidence", count } : { species, reason: "fit" });
  }
  out.sort((a, b) => {
    if (a.reason !== b.reason) return a.reason === "evidence" ? -1 : 1;
    return (b.count ?? 0) - (a.count ?? 0);
  });
  return out.slice(0, MAX_SUGGESTIONS);
}
