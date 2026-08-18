-- 1. Move is_moderator() out of the PostgREST-exposed public schema
CREATE SCHEMA IF NOT EXISTS private;
REVOKE ALL ON SCHEMA private FROM PUBLIC;
GRANT USAGE ON SCHEMA private TO authenticated, service_role;

CREATE OR REPLACE FUNCTION private.is_moderator(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = _user_id AND p.is_moderator = true
  );
$$;

REVOKE ALL ON FUNCTION private.is_moderator(uuid) FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION private.is_moderator(uuid) TO authenticated, service_role;

-- 2. Repoint every policy that used public.is_moderator()
DROP POLICY IF EXISTS alert_contacts_moderator_all ON public.alert_contacts;
CREATE POLICY alert_contacts_moderator_all ON public.alert_contacts
  FOR ALL TO authenticated
  USING (private.is_moderator(auth.uid()))
  WITH CHECK (private.is_moderator(auth.uid()));

DROP POLICY IF EXISTS fire_moderator_update ON public.fire_reports;
CREATE POLICY fire_moderator_update ON public.fire_reports
  FOR UPDATE TO authenticated
  USING (private.is_moderator(auth.uid()))
  WITH CHECK (private.is_moderator(auth.uid()));

DROP POLICY IF EXISTS sites_moderator_read ON public.sites;
CREATE POLICY sites_moderator_read ON public.sites
  FOR SELECT TO authenticated
  USING (private.is_moderator(auth.uid()));

DROP POLICY IF EXISTS sites_moderator_update ON public.sites;
CREATE POLICY sites_moderator_update ON public.sites
  FOR UPDATE TO authenticated
  USING (private.is_moderator(auth.uid()))
  WITH CHECK (private.is_moderator(auth.uid()));

DROP FUNCTION IF EXISTS public.is_moderator(uuid);

-- 3. profiles: own row only
DROP POLICY IF EXISTS profiles_authenticated_read ON public.profiles;
CREATE POLICY profiles_read_own ON public.profiles
  FOR SELECT TO authenticated
  USING (id = auth.uid());

-- 4. fire_reports: reassert column-level privileges (reporter PII excluded)
REVOKE SELECT ON public.fire_reports FROM anon, authenticated;
GRANT SELECT (id, lat, lng, location, wilaya_code, commune, severity, description,
              photo_url, status, created_at, resolved_at)
  ON public.fire_reports TO anon, authenticated;

-- 5. spatial_ref_sys (PostGIS-owned; best effort)
DO $$
BEGIN
  EXECUTE 'ALTER TABLE public.spatial_ref_sys ENABLE ROW LEVEL SECURITY';
  EXECUTE 'CREATE POLICY spatial_ref_sys_read ON public.spatial_ref_sys FOR SELECT USING (true)';
EXCEPTION WHEN OTHERS THEN
  RAISE NOTICE 'spatial_ref_sys not alterable: %', SQLERRM;
END $$;