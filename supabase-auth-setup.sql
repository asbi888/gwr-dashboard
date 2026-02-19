-- ============================================================
-- GWR Dashboard: Authentication & RBAC Setup
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create user_profiles table
-- ============================================================
CREATE TABLE public.user_profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT NOT NULL DEFAULT '',
  role TEXT NOT NULL DEFAULT 'staff' CHECK (role IN ('admin', 'manager', 'staff')),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_profiles_email ON public.user_profiles(email);
CREATE INDEX idx_user_profiles_role ON public.user_profiles(role);

-- Auto-update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER user_profiles_updated_at
  BEFORE UPDATE ON public.user_profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at();


-- 2. Auto-create profile when a new auth user is created
-- ============================================================
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.user_profiles (id, email, full_name, role)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'full_name', ''),
    COALESCE(NEW.raw_user_meta_data->>'role', 'staff')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();


-- 3. RLS on user_profiles
-- ============================================================
ALTER TABLE public.user_profiles ENABLE ROW LEVEL SECURITY;

-- Users can read their own profile
CREATE POLICY "Users read own profile"
  ON public.user_profiles FOR SELECT
  USING (id = auth.uid());

-- Admins can read all profiles
CREATE POLICY "Admins read all profiles"
  ON public.user_profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );

-- Admins can update any profile (role changes, deactivation)
CREATE POLICY "Admins update profiles"
  ON public.user_profiles FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.user_profiles up
      WHERE up.id = auth.uid() AND up.role = 'admin'
    )
  );


-- 4. Helper function for data table RLS
-- ============================================================
CREATE OR REPLACE FUNCTION public.user_has_role(allowed_roles TEXT[])
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.user_profiles
    WHERE id = auth.uid()
      AND is_active = true
      AND role = ANY(allowed_roles)
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER STABLE;


-- 5. RLS on all data tables
-- ============================================================
-- Enable RLS
ALTER TABLE public.gwr_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gwr_suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gwr_revenue ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gwr_revenue_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gwr_food_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gwr_drinks_usage ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.gwr_wr_revenue ENABLE ROW LEVEL SECURITY;

-- READ policies (all authenticated active users)
CREATE POLICY "Authenticated read" ON public.gwr_expenses
  FOR SELECT USING (user_has_role(ARRAY['admin','manager','staff']));

CREATE POLICY "Authenticated read" ON public.gwr_suppliers
  FOR SELECT USING (user_has_role(ARRAY['admin','manager','staff']));

CREATE POLICY "Authenticated read" ON public.gwr_revenue
  FOR SELECT USING (user_has_role(ARRAY['admin','manager','staff']));

CREATE POLICY "Authenticated read" ON public.gwr_revenue_lines
  FOR SELECT USING (user_has_role(ARRAY['admin','manager','staff']));

CREATE POLICY "Authenticated read" ON public.gwr_food_usage
  FOR SELECT USING (user_has_role(ARRAY['admin','manager','staff']));

CREATE POLICY "Authenticated read" ON public.gwr_drinks_usage
  FOR SELECT USING (user_has_role(ARRAY['admin','manager','staff']));

CREATE POLICY "Authenticated read" ON public.gwr_wr_revenue
  FOR SELECT USING (user_has_role(ARRAY['admin','manager','staff']));

-- NOTE: No INSERT/UPDATE/DELETE policies on gwr_* tables.
-- All writes go through the Next.js API route (/api/mutations)
-- which uses the service role key (bypasses RLS).
-- The browser anon key can only SELECT data.


-- ============================================================
-- DONE! Next steps:
-- 1. Go to Authentication > Users > Invite User in Supabase Dashboard
-- 2. Invite your admin email (e.g., gwr@marine.mu)
-- 3. After they sign up, run:
--    UPDATE public.user_profiles SET role = 'admin', full_name = 'GWR Admin'
--    WHERE email = 'your-admin-email@example.com';
-- ============================================================
