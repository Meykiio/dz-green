/**
 * E2E fixture credentials. Passwords come from the environment (never
 * committed): the fixture accounts live in the real Supabase project during
 * a run, so a password in a public repo would be a working admin login if a
 * run ever skipped cleanup. Set them in your shell or a gitignored .env.e2e
 * before running and use the same values in the fixture SQL
 * (docs/SYSTEM_INSTRUCTIONS.md, E2E fixture recipe).
 */
function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`Set ${name} before running the E2E suite (see e2e/fixtures.ts).`);
  return value;
}

export const ADMIN_EMAIL = "e2e.admin@test.local";
export const MOD_EMAIL = "e2e.moderator@test.local";
export const MOD2_EMAIL = "e2e.mod2@test.local";
export const REG_EMAIL = "e2e.regular@test.local";

export const ADMIN_PASSWORD = () => required("E2E_ADMIN_PASSWORD");
export const MOD_PASSWORD = () => required("E2E_MOD_PASSWORD");
export const MOD2_PASSWORD = () => required("E2E_MOD2_PASSWORD");
export const REG_PASSWORD = () => required("E2E_REGULAR_PASSWORD");
