/**
 * PlantNet species identification — server-only (key stays secret).
 * The planting photo goes to PlantNet's identify endpoint; we return the top
 * suggestions for the user to confirm. Suggestion only, never auto-assert.
 * Fails soft (null) on quota/network — the form works fine without it.
 */

export interface SpeciesSuggestion {
  /** Display label: common name if any, else the scientific name. */
  label: string;
  scientific: string;
  /** 0..1 confidence from PlantNet. */
  score: number;
}

const FETCH_TIMEOUT_MS = 15_000;
const MIN_SCORE = 0.15;
const MAX_SUGGESTIONS = 2;

interface PlantNetResponse {
  results?: {
    score?: number;
    species?: {
      scientificNameWithoutAuthor?: string;
      commonNames?: string[];
    };
  }[];
}

export function mapPlantNet(json: PlantNetResponse): SpeciesSuggestion[] {
  return (json.results ?? [])
    .filter((r) => (r.score ?? 0) >= MIN_SCORE && r.species?.scientificNameWithoutAuthor)
    .slice(0, MAX_SUGGESTIONS)
    .map((r) => {
      const scientific = r.species!.scientificNameWithoutAuthor!;
      const common = r.species!.commonNames?.[0];
      return {
        label: common ? `${common} (${scientific})` : scientific,
        scientific,
        score: Math.round((r.score ?? 0) * 100) / 100,
      };
    });
}

export async function identifyPlant(
  imageBase64: string,
  locale: "en" | "ar",
): Promise<SpeciesSuggestion[]> {
  const key = process.env["PLANTNET_API_KEY"];
  if (!key) throw new Error("PLANTNET_API_KEY is not set (see .env.example).");

  const base64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");
  const bytes = Buffer.from(base64, "base64");
  const form = new FormData();
  form.append("images", new Blob([bytes], { type: "image/jpeg" }), "photo.jpg");

  const url = `https://my-api.plantnet.org/v2/identify/all?api-key=${key}&lang=${locale}`;
  const res = await fetch(url, {
    method: "POST",
    body: form,
    signal: AbortSignal.timeout(FETCH_TIMEOUT_MS),
  });
  if (!res.ok) throw new Error(`PlantNet responded ${res.status}`);
  return mapPlantNet((await res.json()) as PlantNetResponse);
}
