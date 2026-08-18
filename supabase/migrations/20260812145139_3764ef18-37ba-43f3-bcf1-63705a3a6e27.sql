CREATE EXTENSION IF NOT EXISTS postgis;

CREATE TABLE public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text,
  avatar_url text,
  is_moderator boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE ON public.profiles TO authenticated;
GRANT SELECT ON public.profiles TO anon;
GRANT ALL ON public.profiles TO service_role;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
CREATE POLICY "profiles_public_read" ON public.profiles FOR SELECT USING (true);
CREATE POLICY "profiles_insert_own" ON public.profiles FOR INSERT TO authenticated WITH CHECK (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles FOR UPDATE TO authenticated USING (auth.uid() = id) WITH CHECK (auth.uid() = id AND is_moderator = (SELECT p.is_moderator FROM public.profiles p WHERE p.id = auth.uid()));

CREATE OR REPLACE FUNCTION public.is_moderator(_user_id uuid)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = _user_id AND is_moderator = true)
$$;

CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)))
  ON CONFLICT (id) DO NOTHING;
  RETURN NEW;
END; $$;
CREATE TRIGGER on_auth_user_created AFTER INSERT ON auth.users FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

CREATE TYPE public.site_status AS ENUM ('pending','approved','rejected');
CREATE TYPE public.care_action AS ENUM ('watered','checked','needs_attention','other');
CREATE TYPE public.fire_status AS ENUM ('active','resolved','false_alarm');

CREATE TABLE public.sites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  location geography(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,
  wilaya_code text NOT NULL,
  commune text,
  photo_url text NOT NULL,
  species text,
  tree_count integer NOT NULL DEFAULT 1 CHECK (tree_count > 0 AND tree_count <= 100000),
  planted_date date NOT NULL DEFAULT CURRENT_DATE,
  notes text,
  planter_display_name text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.site_status NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now(),
  reviewed_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  reviewed_at timestamptz,
  moderator_notes text
);
CREATE INDEX sites_location_gix ON public.sites USING GIST (location);
CREATE INDEX sites_status_idx ON public.sites (status);
CREATE INDEX sites_created_at_idx ON public.sites (created_at DESC);
CREATE INDEX sites_wilaya_idx ON public.sites (wilaya_code);
GRANT SELECT ON public.sites TO anon, authenticated;
GRANT ALL ON public.sites TO service_role;
ALTER TABLE public.sites ENABLE ROW LEVEL SECURITY;
CREATE POLICY "sites_public_read_approved" ON public.sites FOR SELECT USING (status = 'approved');
CREATE POLICY "sites_read_own" ON public.sites FOR SELECT TO authenticated USING (user_id = auth.uid());
CREATE POLICY "sites_moderator_read" ON public.sites FOR SELECT TO authenticated USING (public.is_moderator(auth.uid()));
CREATE POLICY "sites_moderator_update" ON public.sites FOR UPDATE TO authenticated USING (public.is_moderator(auth.uid())) WITH CHECK (public.is_moderator(auth.uid()));

CREATE TABLE public.care_logs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  site_id uuid NOT NULL REFERENCES public.sites(id) ON DELETE CASCADE,
  action public.care_action NOT NULL DEFAULT 'watered',
  submitter_name text,
  photo_url text,
  notes text,
  logged_date date NOT NULL DEFAULT CURRENT_DATE,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX care_logs_site_idx ON public.care_logs (site_id);
CREATE INDEX care_logs_created_idx ON public.care_logs (created_at DESC);
GRANT SELECT ON public.care_logs TO anon, authenticated;
GRANT ALL ON public.care_logs TO service_role;
ALTER TABLE public.care_logs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "care_logs_public_read" ON public.care_logs FOR SELECT USING (
  EXISTS (SELECT 1 FROM public.sites s WHERE s.id = site_id AND s.status = 'approved')
);

CREATE TABLE public.fire_reports (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  lat double precision NOT NULL,
  lng double precision NOT NULL,
  location geography(Point,4326) GENERATED ALWAYS AS (ST_SetSRID(ST_MakePoint(lng, lat), 4326)::geography) STORED,
  wilaya_code text NOT NULL,
  commune text,
  severity text CHECK (severity IN ('small','large')),
  description text,
  photo_url text,
  reporter_name text,
  reporter_phone text,
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  status public.fire_status NOT NULL DEFAULT 'active',
  created_at timestamptz NOT NULL DEFAULT now(),
  resolved_at timestamptz
);
CREATE INDEX fire_location_gix ON public.fire_reports USING GIST (location);
CREATE INDEX fire_status_idx ON public.fire_reports (status);
CREATE INDEX fire_created_idx ON public.fire_reports (created_at DESC);
GRANT SELECT ON public.fire_reports TO anon, authenticated;
GRANT ALL ON public.fire_reports TO service_role;
ALTER TABLE public.fire_reports ENABLE ROW LEVEL SECURITY;
CREATE POLICY "fire_public_read" ON public.fire_reports FOR SELECT USING (true);
CREATE POLICY "fire_moderator_update" ON public.fire_reports FOR UPDATE TO authenticated USING (public.is_moderator(auth.uid())) WITH CHECK (public.is_moderator(auth.uid()));

CREATE TABLE public.alert_contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  type text NOT NULL CHECK (type IN ('email','phone')),
  value text NOT NULL,
  region_filter jsonb NOT NULL DEFAULT '{"wilayas": []}'::jsonb,
  active boolean NOT NULL DEFAULT true,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.alert_contacts TO authenticated;
GRANT ALL ON public.alert_contacts TO service_role;
ALTER TABLE public.alert_contacts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "alert_contacts_moderator_all" ON public.alert_contacts FOR ALL TO authenticated
  USING (public.is_moderator(auth.uid())) WITH CHECK (public.is_moderator(auth.uid()));

CREATE TABLE public.submission_meta (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kind text NOT NULL CHECK (kind IN ('planting','care','fire')),
  ip_hash text NOT NULL,
  device_fingerprint text,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE INDEX submission_meta_lookup_idx ON public.submission_meta (ip_hash, created_at DESC);
GRANT ALL ON public.submission_meta TO service_role;
ALTER TABLE public.submission_meta ENABLE ROW LEVEL SECURITY;

ALTER PUBLICATION supabase_realtime ADD TABLE public.sites;
ALTER PUBLICATION supabase_realtime ADD TABLE public.fire_reports;
ALTER PUBLICATION supabase_realtime ADD TABLE public.care_logs;