/**
 * Writes the app's 69 wilaya boundaries (lat/lng) to
 * ml/fire-risk/data/wilayas.geojson so the model uses exactly the shapes
 * the map draws. Run from the repo root: bun ml/fire-risk/scripts/export-wilayas.ts
 */
import { writeFileSync } from "node:fs";

import { wilayaBoundariesGeoJSON } from "@/lib/wilaya-geo";

const fc = wilayaBoundariesGeoJSON();
writeFileSync("ml/fire-risk/data/wilayas.geojson", JSON.stringify(fc));
console.log(`wrote ${fc.features.length} wilayas`);
