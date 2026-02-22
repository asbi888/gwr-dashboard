-- Balance Sheet Snapshots table
-- Stores pre-computed Balance Sheet data exported directly from Odoo
-- Each snapshot is a point-in-time capture of the BS as of a specific date

CREATE TABLE IF NOT EXISTS public.odoo_bs_snapshots (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_date date NOT NULL,           -- "As of" date from Odoo report
  row_order     integer NOT NULL,        -- preserve display order
  level         text NOT NULL,           -- 'section', 'category', 'subcategory', 'account'
  parent_section text,                   -- 'ASSETS', 'LIABILITIES', 'EQUITY'
  code          text,                    -- account code (e.g. '121000'), null for headers
  name          text NOT NULL,           -- display name
  balance       numeric(15,2) DEFAULT 0, -- balance amount
  created_at    timestamptz DEFAULT now()
);

-- Index for fast lookup by snapshot date
CREATE INDEX IF NOT EXISTS idx_bs_snapshots_date ON public.odoo_bs_snapshots(snapshot_date);

-- RLS
ALTER TABLE public.odoo_bs_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users"
  ON public.odoo_bs_snapshots
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all for service role"
  ON public.odoo_bs_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
