/**
 * Planting calendar for northern Algeria (Mediterranean and semi-arid).
 * Seedlings go in during the rainy season so roots settle before the first
 * summer drought, which is the main cause of seedling death in
 * Mediterranean reforestation (Vallejo et al. 2012). National planting days
 * fall in this window too (25 October, February).
 *
 * - "now":  November to March, plant.
 * - "soon": September and October, prepare sites and order seedlings;
 *           planting can start with the first autumn rains.
 * - "off":  April to August, too late for new seedlings; water and check
 *           what is already planted.
 */
export type PlantingSeason = "now" | "soon" | "off";

export function plantingSeason(date: Date = new Date()): PlantingSeason {
  const month = date.getMonth() + 1;
  if (month >= 11 || month <= 3) return "now";
  if (month >= 9) return "soon";
  return "off";
}
