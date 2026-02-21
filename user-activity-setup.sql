-- ============================================================
-- User Activity Tracking Table
-- Run in Supabase SQL Editor: Dashboard > SQL Editor > New Query
-- ============================================================

CREATE TABLE public.user_activity (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id    UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  email      TEXT NOT NULL DEFAULT '',
  action     TEXT NOT NULL CHECK (action IN ('login', 'page_view', 'logout')),
  page       TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_user_activity_user_id ON public.user_activity(user_id);
CREATE INDEX idx_user_activity_action ON public.user_activity(action);
CREATE INDEX idx_user_activity_created_at ON public.user_activity(created_at DESC);

-- RLS: only admins can read (writes go through API with service role key)
ALTER TABLE public.user_activity ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins read all activity"
  ON public.user_activity FOR SELECT
  USING (user_has_role(ARRAY['admin']));
