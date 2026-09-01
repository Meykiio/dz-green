/**
 * Admin-only server functions — barrel. Split 2026-08-31 to stay under the
 * 250-line rule; the public import path (`@/lib/admin.functions`) is
 * unchanged. Every function re-checks the caller's admin role live from the
 * request token (see `admin-shared.server.ts`).
 *
 * - `admin-users.functions.ts`   — accounts: list/create/role/wilayas/sign-out/delete
 * - `admin-content.functions.ts` — feedback, volunteers, content hard-deletes
 * - `admin-stats.functions.ts`   — Overview tab stats
 */
export * from "./admin-users.functions";
export * from "./admin-content.functions";
export * from "./admin-stats.functions";
export * from "./announcements.functions";
