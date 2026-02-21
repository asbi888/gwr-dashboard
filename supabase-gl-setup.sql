-- ── General Ledger table for Odoo GL export data ──

CREATE TABLE IF NOT EXISTS public.gwr_general_ledger (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entry_id      integer NOT NULL,
  move_id       integer NOT NULL,
  move_number   text NOT NULL,
  date          date NOT NULL,
  account_id    integer NOT NULL,
  account_name  text NOT NULL,
  partner_id    integer,
  partner_name  text,
  description   text,
  reference     text,
  journal       text NOT NULL,
  debit         numeric(15,2) NOT NULL DEFAULT 0,
  credit        numeric(15,2) NOT NULL DEFAULT 0,
  balance       numeric(15,2) NOT NULL DEFAULT 0,
  created_at    timestamptz NOT NULL DEFAULT now()
);

-- Unique on entry_id for re-runnable imports (upsert on conflict)
CREATE UNIQUE INDEX IF NOT EXISTS idx_gl_entry_id ON public.gwr_general_ledger(entry_id);

-- Query indexes
CREATE INDEX IF NOT EXISTS idx_gl_date ON public.gwr_general_ledger(date);
CREATE INDEX IF NOT EXISTS idx_gl_account_id ON public.gwr_general_ledger(account_id);
CREATE INDEX IF NOT EXISTS idx_gl_journal ON public.gwr_general_ledger(journal);

-- RLS
ALTER TABLE public.gwr_general_ledger ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies
    WHERE policyname = 'Authenticated users can read GL'
      AND tablename  = 'gwr_general_ledger'
  ) THEN
    CREATE POLICY "Authenticated users can read GL"
      ON public.gwr_general_ledger
      FOR SELECT
      TO authenticated
      USING (user_has_role(ARRAY['admin','manager','staff']));
  END IF;
END $$;
