import { createClient } from '@supabase/supabase-js';

const sb = createClient(
  'https://jexxgrtbflintytzjkyu.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHhncnRiZmxpbnR5dHpqa3l1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA3NzMwNCwiZXhwIjoyMDg2NjUzMzA0fQ.vVL4GzZzPYXofsgR_Ttpj9MHsbJpwkrQ-YMAtRbvBAw'
);

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
  
  const res = await fetch('https://jexxgrtbflintytzjkyu.supabase.co/rest/v1/rpc/exec_sql', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHhncnRiZmxpbnR5dHpqa3l1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA3NzMwNCwiZXhwIjoyMDg2NjUzMzA0fQ.vVL4GzZzPYXofsgR_Ttpj9MHsbJpwkrQ-YMAtRbvBAw',
      'Authorization': 'Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImpleHhncnRiZmxpbnR5dHpqa3l1Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc3MTA3NzMwNCwiZXhwIjoyMDg2NjUzMzA0fQ.vVL4GzZzPYXofsgR_Ttpj9MHsbJpwkrQ-YMAtRbvBAw'
    },
    body: JSON.stringify({ sql_text: sql })
  });
  console.log('Status:', res.status, await res.text());
} else {
  console.log('SUCCESS');
}
