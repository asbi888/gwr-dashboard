-- VAT3 Tax Report Snapshots table
-- Stores pre-computed VAT report data exported directly from Odoo
-- Each snapshot is a point-in-time capture for a specific year

CREATE TABLE IF NOT EXISTS public.odoo_vat_snapshots (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_year integer NOT NULL,        -- reporting year (e.g. 2025)
  row_order     integer NOT NULL,        -- preserve display order
  level         text NOT NULL,           -- 'section', 'item', 'subitem', 'total'
  parent_section text,                   -- 'OUTPUT', 'INPUT', 'VAT_ACCOUNT'
  line_number   text,                    -- e.g. '1.', '1.1.', '6.5.'
  name          text NOT NULL,           -- display label
  percent_value numeric(10,4),           -- percent column (rare, used in line 15)
  net_value     numeric(15,2),           -- Value column
  vat_value     numeric(15,2),           -- VAT column
  created_at    timestamptz DEFAULT now()
);

-- Index for fast lookup by year
CREATE INDEX IF NOT EXISTS idx_vat_snapshots_year ON public.odoo_vat_snapshots(snapshot_year);

-- RLS
ALTER TABLE public.odoo_vat_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users"
  ON public.odoo_vat_snapshots
  FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "Allow all for service role"
  ON public.odoo_vat_snapshots
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
