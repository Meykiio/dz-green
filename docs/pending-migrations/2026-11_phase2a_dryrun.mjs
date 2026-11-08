// Dry run of the Phase 2a migration against stand-ins of the live schema.
import { readFileSync } from "node:fs";
import { PGlite } from "@electric-sql/pglite";

const migration = readFileSync(process.argv[2], "utf8");
const db = new PGlite();

// --- stand-ins for what the live project already has ---------------------
await db.exec(`
  CREATE ROLE anon; CREATE ROLE authenticated; CREATE ROLE service_role;
  CREATE SCHEMA auth; CREATE TABLE auth.users (id uuid PRIMARY KEY);
  CREATE FUNCTION auth.uid() RETURNS uuid LANGUAGE sql STABLE AS
    $$ SELECT nullif(current_setting('test.uid', true), '')::uuid $$;
  CREATE SCHEMA private;
  CREATE TABLE public.mods (user_id uuid, wilaya_code text);
  CREATE FUNCTION private.can_moderate(_u uuid, _w text) RETURNS boolean
    LANGUAGE sql STABLE AS $$ SELECT EXISTS (SELECT 1 FROM public.mods WHERE user_id=_u AND wilaya_code=_w) $$;
  GRANT USAGE ON SCHEMA private, auth TO anon, authenticated;
  GRANT EXECUTE ON FUNCTION private.can_moderate(uuid, text), auth.uid() TO anon, authenticated;
  GRANT SELECT ON public.mods TO anon, authenticated;
  CREATE TYPE public.site_status AS ENUM ('pending','approved','rejected');
  CREATE TABLE public.sites (
    id uuid PRIMARY KEY, wilaya_code text NOT NULL, tree_count int NOT NULL DEFAULT 1,
    planted_date date NOT NULL, status public.site_status NOT NULL DEFAULT 'pending',
    user_id uuid, contact_phone text);
  ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
  CREATE POLICY sites_public_read_approved ON public.sites FOR SELECT USING (status = 'approved');
  GRANT SELECT (id, wilaya_code, tree_count, planted_date, status, user_id) ON public.sites TO anon, authenticated;
  CREATE TABLE public.submission_meta (id serial, kind text NOT NULL
    CONSTRAINT submission_meta_kind_check CHECK (kind = ANY (ARRAY['planting','care','fire','feedback','volunteer'])));
  CREATE PUBLICATION supabase_realtime;
`);

await db.exec(migration);
console.log("migration applied");

// --- sample data ----------------------------------------------------------
const d = (monthsAgo) => `(CURRENT_DATE - INTERVAL '${monthsAgo} months')::date`;
await db.exec(`
  INSERT INTO public.sites VALUES
   ('00000000-0000-0000-0000-000000000001','06',10,${d(12)},'approved','00000000-0000-0000-0000-0000000000aa',NULL),
   ('00000000-0000-0000-0000-000000000002','06',20,${d(12)},'approved',NULL,NULL),
   ('00000000-0000-0000-0000-000000000003','06',5, ${d(13)},'approved',NULL,NULL),
   ('00000000-0000-0000-0000-000000000004','06',5, ${d(3)}, 'approved',NULL,NULL),
   ('00000000-0000-0000-0000-000000000005','15',5, ${d(12)},'pending', NULL,NULL),
   ('00000000-0000-0000-0000-000000000006','06',5, ${d(1)}, 'approved',NULL,NULL);
  INSERT INTO public.survival_checks (site_id,status,trees_checked,trees_alive,photo_url,photo_sha256,checked_date,independence,grade) VALUES
   -- site 1: an independent check (8/10) and a later self check (10/10, must not count)
   ('00000000-0000-0000-0000-000000000001','alive',10,8,'p','h1',${d(1)},'independent','unverified'),
   -- site 2: staff check 5/20 (counts), plus a rejected independent 20/20 (must not count)
   ('00000000-0000-0000-0000-000000000002','stressed',20,5,'p','h2',${d(2)},'staff','verified'),
   ('00000000-0000-0000-0000-000000000002','alive',20,20,'p','h3',${d(1)},'independent','rejected'),
   -- site 3: only a self check -> eligible but unchecked for the headline
   ('00000000-0000-0000-0000-000000000003','alive',5,5,'p','h4',${d(2)},'self','unverified');
  INSERT INTO public.survival_checks (site_id,status,trees_checked,trees_alive,photo_url,photo_sha256,checked_date,independence,grade)
   VALUES ('00000000-0000-0000-0000-000000000001','alive',10,10,'p','h5',CURRENT_DATE,'self','unverified');
`);

const asAnon = async (sql) => {
  await db.exec("SET ROLE anon");
  try { return (await db.query(sql)).rows; } finally { await db.exec("RESET ROLE"); }
};

const stats = await asAnon("SELECT * FROM public.survival_stats_wilaya ORDER BY wilaya_code");
console.log("stats as anon:", JSON.stringify(stats));
const status = await asAnon("SELECT site_id, last_status, due FROM public.site_survival_status ORDER BY site_id");
console.log("status as anon:", JSON.stringify(status));
const visible = await asAnon("SELECT count(*)::int AS n FROM public.survival_checks");
console.log("checks visible to anon (rejected hidden):", visible[0].n);

// Column grants: hidden columns must fail for anon.
for (const col of ["user_id", "photo_sha256", "client_request_id"]) {
  try { await asAnon(`SELECT ${col} FROM public.survival_checks LIMIT 1`); console.log(`LEAK: ${col} readable`); }
  catch { console.log(`hidden from anon: ${col}`); }
}
// Writes must fail for anon.
try {
  await asAnon(`INSERT INTO public.survival_checks (site_id,status,trees_checked,trees_alive,photo_url,photo_sha256,checked_date)
                VALUES ('00000000-0000-0000-0000-000000000004','alive',1,1,'p','x',CURRENT_DATE)`);
  console.log("LEAK: anon insert allowed");
} catch { console.log("anon insert denied"); }
// Constraints.
for (const [label, sql] of [
  ["alive > checked", `INSERT INTO public.survival_checks (site_id,status,trees_checked,trees_alive,photo_url,photo_sha256,checked_date) VALUES ('00000000-0000-0000-0000-000000000004','alive',2,3,'p','y',CURRENT_DATE)`],
  ["bad independence", `INSERT INTO public.survival_checks (site_id,status,trees_checked,trees_alive,photo_url,photo_sha256,checked_date,independence) VALUES ('00000000-0000-0000-0000-000000000004','alive',2,1,'p','z',CURRENT_DATE,'me')`],
]) {
  try { await db.exec(sql); console.log(`CONSTRAINT MISSING: ${label}`); } catch { console.log(`rejected: ${label}`); }
}
await db.exec("INSERT INTO public.submission_meta (kind) VALUES ('survival'), ('push')");
console.log("throttle kinds accepted: survival, push");
// Rollback block parses and runs.
await db.exec(`ALTER PUBLICATION supabase_realtime DROP TABLE public.survival_checks;
  DROP VIEW public.survival_stats_wilaya; DROP VIEW public.site_survival_status;
  DROP TABLE public.survival_checks; DROP TYPE public.survival_status;`);
console.log("rollback ok");
