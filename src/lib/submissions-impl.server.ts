import { supabaseAdmin } from "@/integrations/supabase/client.server";

import { wilayaCodeForPoint, wilayaCenterLatLng } from "./geo";
import { mintReceipt } from "./receipts.server";
import { mapCodeFor } from "./wilayas";
import { GateError, optionalUserId, storePhoto, verifyGate, type GateInput } from "./submissions.server";

interface PlantingInput extends GateInput {
  lat?: number | null | undefined;
  lng?: number | null | undefined;
  wilaya_code: string;
  commune?: string | null | undefined;
  photo: string;
  species?: string | null | undefined;
  tree_count: number;
  planted_date: string;
  notes?: string | null | undefined;
  planter_display_name?: string | null | undefined;
  contact_phone?: string | null | undefined;
}

interface CareInput extends GateInput {
  site_id: string;
  action: "watered" | "checked" | "needs_attention" | "other";
  submitter_name?: string | null | undefined;
  photo?: string | null | undefined;
  notes?: string | null | undefined;
  logged_date: string;
}

interface FireInput extends GateInput {
  lat?: number | null | undefined;
  lng?: number | null | undefined;
  wilaya_code: string;
  commune?: string | null | undefined;
  severity?: "small" | "large" | null | undefined;
  description?: string | null | undefined;
  photo?: string | null | undefined;
  reporter_name?: string | null | undefined;
  reporter_phone?: string | null | undefined;
}

function fail(error: unknown): never {
  if (error instanceof GateError) throw new Error(error.message);
  console.error(error);
  throw new Error("Something went wrong. Please try again.");
}

/**
 * Honeypot short-circuit: the bot gets a plausible success payload, but
 * nothing was inserted and no receipt exists for the synthetic id.
 */
function silentDrop(kind: "planting" | "care" | "fire") {
  return {
    id: crypto.randomUUID(),
    status: (kind === "planting" ? "pending" : kind === "fire" ? "active" : "published") as string,
    receipt: null,
  };
}

/**
 * The wilaya is derived from the actual coordinates on the server — the
 * client-supplied code is ignored, so a mismatch can never be stored again
 * (a client could pick Batna in the dropdown while the pin sits in Ghardaïa).
 * Geometry covers the 48 historic wilayas; post-2019 territories resolve to
 * their historic parent.
 */
function deriveWilaya(lat: number, lng: number): string {
  const code = wilayaCodeForPoint(lat, lng);
  if (!code) throw new GateError("That location isn't inside a mapped wilaya. Please move the pin onto Algeria.");
  return code;
}

interface ResolvedLocation {
  lat: number;
  lng: number;
  wilaya: string;
  approximate: boolean;
}

/**
 * Two honest location modes (Sprint 6):
 * - exact pin  → derive the wilaya from the coordinates (client code ignored);
 * - wilaya only → store the wilaya's display centre and mark it approximate,
 *   so the UI shows a "wilaya-level" badge instead of fake precision.
 */
function resolveLocation(data: {
  lat?: number | null | undefined;
  lng?: number | null | undefined;
  wilaya_code: string;
}): ResolvedLocation {
  if (data.lat != null && data.lng != null) {
    return {
      lat: data.lat,
      lng: data.lng,
      wilaya: deriveWilaya(data.lat, data.lng),
      approximate: false,
    };
  }
  const parent = mapCodeFor(data.wilaya_code);
  const center = parent ? wilayaCenterLatLng(parent) : null;
  if (!parent || !center) throw new GateError("Choose a valid wilaya.");
  return { ...center, wilaya: parent, approximate: true };
}

export async function submitPlantingImpl(data: PlantingInput) {
  try {
    if ((await verifyGate("planting", data)) === "dropped") return silentDrop("planting");
    const userId = await optionalUserId();
    const photoPath = await storePhoto(data.photo, "sites");
    const loc = resolveLocation(data);
    const { data: row, error } = await supabaseAdmin
      .from("sites")
      .insert({
        lat: loc.lat,
        lng: loc.lng,
        wilaya_code: loc.wilaya,
        location_approximate: loc.approximate,
        commune: data.commune ?? null,
        photo_url: photoPath,
        species: data.species ?? null,
        tree_count: data.tree_count,
        planted_date: data.planted_date,
        notes: data.notes ?? null,
        planter_display_name: data.planter_display_name ?? null,
        contact_phone: data.contact_phone ?? null,
        user_id: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    const receipt = await mintReceipt("planting", row.id as string);
    return { id: row.id as string, status: "pending" as const, receipt };
  } catch (error) {
    fail(error);
  }
}

export async function submitCareImpl(data: CareInput) {
  try {
    if ((await verifyGate("care", data)) === "dropped") return silentDrop("care");
    const userId = await optionalUserId();

    const { data: site } = await supabaseAdmin
      .from("sites")
      .select("id,status")
      .eq("id", data.site_id)
      .maybeSingle();
    if (!site || site.status !== "approved") {
      throw new GateError("That planting site is not available yet.");
    }

    const photoPath = data.photo ? await storePhoto(data.photo, "care") : null;
    const { data: row, error } = await supabaseAdmin
      .from("care_logs")
      .insert({
        site_id: data.site_id,
        action: data.action,
        submitter_name: data.submitter_name ?? null,
        photo_url: photoPath,
        notes: data.notes ?? null,
        logged_date: data.logged_date,
        user_id: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    const receipt = await mintReceipt("care", row.id as string);
    return { id: row.id as string, status: "published" as const, receipt };
  } catch (error) {
    fail(error);
  }
}

export async function submitFireImpl(data: FireInput) {
  try {
    if ((await verifyGate("fire", data)) === "dropped") return silentDrop("fire");
    const userId = await optionalUserId();
    const photoPath = data.photo ? await storePhoto(data.photo, "fires") : null;
    const loc = resolveLocation(data);
    const { data: row, error } = await supabaseAdmin
      .from("fire_reports")
      .insert({
        lat: loc.lat,
        lng: loc.lng,
        wilaya_code: loc.wilaya,
        location_approximate: loc.approximate,
        commune: data.commune ?? null,
        severity: data.severity ?? null,
        description: data.description ?? null,
        photo_url: photoPath,
        reporter_name: data.reporter_name ?? null,
        reporter_phone: data.reporter_phone ?? null,
        user_id: userId,
      })
      .select("id")
      .single();
    if (error) throw error;
    const receipt = await mintReceipt("fire", row.id as string);
    return { id: row.id as string, status: "active" as const, receipt };
  } catch (error) {
    fail(error);
  }
}