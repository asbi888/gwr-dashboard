import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
config({ path: path.resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing env vars. Ensure .env.local has NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const sb = createClient(supabaseUrl, serviceRoleKey);

const sql = `
CREATE TABLE IF NOT EXISTS public.user_activity_log (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  user_id       uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_type    text NOT NULL CHECK (event_type IN ('login', 'page_view')),
  page_path     text,
  created_at    timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_activity_user_id ON public.user_activity_log(user_id);
CREATE INDEX IF NOT EXISTS idx_activity_created_at ON public.user_activity_log(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_activity_event_type ON public.user_activity_log(event_type);

ALTER TABLE public.user_activity_log ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Users can insert own activity' AND tablename = 'user_activity_log') THEN
    CREATE POLICY "Users can insert own activity"
      ON public.user_activity_log
      FOR INSERT
      TO authenticated
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE policyname = 'Admins can read all activity' AND tablename = 'user_activity_log') THEN
    CREATE POLICY "Admins can read all activity"
      ON public.user_activity_log
      FOR SELECT
      TO authenticated
      USING (
        EXISTS (
          SELECT 1 FROM public.user_profiles
          WHERE user_profiles.id = auth.uid()
            AND user_profiles.role = 'admin'
        )
      );
  END IF;
END $$;
`;

const { data, error } = await sb.rpc('exec_sql', { sql_text: sql });
if (error) {
  console.log('rpc failed:', error.message);
  console.log('Trying direct SQL via management API...');

  const res = await fetch(`${supabaseUrl}/rest/v1/rpc/exec_sql`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': serviceRoleKey,
      'Authorization': `Bearer ${serviceRoleKey}`
    },
    body: JSON.stringify({ sql_text: sql })
  });
  console.log('Status:', res.status, await res.text());
} else {
  console.log('SUCCESS');
}
