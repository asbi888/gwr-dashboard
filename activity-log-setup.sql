-- ============================================================
-- User Activity Tracking: Track logins & page views
-- Run this in Supabase SQL Editor (Dashboard > SQL Editor)
-- ============================================================

-- 1. Create the table
CREATE TABLE IF NOT EXISTS public.user_activity (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email         text NOT NULL DEFAULT '',
  action        text NOT NULL CHECK (action IN ('login', 'page_view', 'logout')),
  page          text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- 2. Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_user_activity_action ON public.user_activity(action);

-- 3. Enable Row Level Security
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- 4. No direct client access — all reads/writes go through API route with service role key
-- (The API route verifies auth session before inserting, and checks admin role before reading)
