-- ============================================================
-- User Activity Tracking Table
-- Run this in Supabase SQL Editor (https://supabase.com/dashboard)
-- ============================================================

CREATE TABLE IF NOT EXISTS public.user_activity (
  id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  activity_type TEXT NOT NULL CHECK (activity_type IN ('login', 'page_view')),
  page_path TEXT,
  page_title TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Indexes for fast lookups
CREATE INDEX IF NOT EXISTS idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX IF NOT EXISTS idx_user_activity_type ON public.user_activity(activity_type);
CREATE INDEX IF NOT EXISTS idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- RLS
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

-- Only admins can read activity logs
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE policyname = 'Admins read all activity' AND tablename = 'user_activity'
  ) THEN
    CREATE POLICY "Admins read all activity"
      ON public.user_activity FOR SELECT
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles up
          WHERE up.id = auth.uid() AND up.role = 'admin'
        )
      );
  END IF;
END $$;

-- Grant service role full access (for API inserts)
GRANT ALL ON public.user_activity TO service_role;
GRANT USAGE, SELECT ON ALL SEQUENCES IN SCHEMA public TO service_role;
