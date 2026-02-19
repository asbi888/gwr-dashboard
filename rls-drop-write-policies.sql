-- ============================================================
-- GWR Dashboard: Lock down RLS to SELECT-only on data tables
-- Run this ONCE in Supabase SQL Editor (Dashboard > SQL Editor)
--
-- This drops all INSERT/UPDATE/DELETE policies on gwr_* tables.
-- SELECT policies remain — frontend can still read all data.
-- All writes now go through Next.js API routes using service role key.
-- ============================================================

-- gwr_expenses
DROP POLICY IF EXISTS "Authenticated write" ON public.gwr_expenses;
DROP POLICY IF EXISTS "Authenticated update" ON public.gwr_expenses;
DROP POLICY IF EXISTS "Authenticated delete" ON public.gwr_expenses;

-- gwr_suppliers
DROP POLICY IF EXISTS "Authenticated write" ON public.gwr_suppliers;
DROP POLICY IF EXISTS "Authenticated update" ON public.gwr_suppliers;
DROP POLICY IF EXISTS "Authenticated delete" ON public.gwr_suppliers;

-- gwr_revenue
DROP POLICY IF EXISTS "Authenticated write" ON public.gwr_revenue;
DROP POLICY IF EXISTS "Authenticated update" ON public.gwr_revenue;
DROP POLICY IF EXISTS "Authenticated delete" ON public.gwr_revenue;

-- gwr_revenue_lines
DROP POLICY IF EXISTS "Authenticated write" ON public.gwr_revenue_lines;
DROP POLICY IF EXISTS "Authenticated update" ON public.gwr_revenue_lines;
DROP POLICY IF EXISTS "Authenticated delete" ON public.gwr_revenue_lines;

-- gwr_food_usage
DROP POLICY IF EXISTS "Authenticated write" ON public.gwr_food_usage;
DROP POLICY IF EXISTS "Authenticated update" ON public.gwr_food_usage;
DROP POLICY IF EXISTS "Authenticated delete" ON public.gwr_food_usage;

-- gwr_drinks_usage
DROP POLICY IF EXISTS "Authenticated write" ON public.gwr_drinks_usage;
DROP POLICY IF EXISTS "Authenticated update" ON public.gwr_drinks_usage;
DROP POLICY IF EXISTS "Authenticated delete" ON public.gwr_drinks_usage;

-- gwr_wr_revenue
DROP POLICY IF EXISTS "Authenticated write" ON public.gwr_wr_revenue;
DROP POLICY IF EXISTS "Authenticated update" ON public.gwr_wr_revenue;
DROP POLICY IF EXISTS "Authenticated delete" ON public.gwr_wr_revenue;

-- ============================================================
-- DONE!
-- The 7 gwr_* tables are now SELECT-only via anon key.
-- user_profiles is NOT changed (admin UPDATE policy still needed).
-- ============================================================
