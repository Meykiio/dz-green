-- 1. Fire reports: hide reporter PII via column-level grants
REVOKE SELECT ON public.fire_reports FROM anon, authenticated;
GRANT SELECT (id, lat, lng, location, wilaya_code, commune, severity, description, photo_url, status, created_at, resolved_at) ON public.fire_reports TO anon, authenticated;
GRANT UPDATE ON public.fire_reports TO authenticated;
GRANT ALL ON public.fire_reports TO service_role;

-- 2. Profiles: restrict reads to signed-in users
DROP POLICY IF EXISTS profiles_public_read ON public.profiles;
CREATE POLICY profiles_authenticated_read ON public.profiles
  FOR SELECT TO authenticated USING (true);
REVOKE SELECT ON public.profiles FROM anon;

-- 3. SECURITY DEFINER helper: not callable by anonymous visitors
REVOKE EXECUTE ON FUNCTION public.is_moderator(uuid) FROM anon, public;
GRANT EXECUTE ON FUNCTION public.is_moderator(uuid) TO authenticated, service_role;

-- 4. PostGIS reference table: enable RLS if we own it
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
  EXECUTE 'DROP POLICY IF EXISTS spatial_ref_sys_read ON public.spatial_ref_sys';
  EXECUTE 'CREATE POLICY spatial_ref_sys_read ON public.spatial_ref_sys FOR SELECT USING (true)';
EXCEPTION WHEN insufficient_privilege OR undefined_table THEN
  RAISE NOTICE 'spatial_ref_sys is owned by the postgis extension; skipping';
END $$;