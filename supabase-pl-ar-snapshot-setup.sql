-- ═══════════════════════════════════════════════════
-- Profit & Loss Snapshots
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.odoo_pl_snapshots (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_year integer NOT NULL,
  row_order     integer NOT NULL,
  level         text NOT NULL,           -- 'header', 'account', 'subtotal', 'total', 'blank'
  code          text,                    -- account code e.g. '400000'
  name          text NOT NULL,
  balance       numeric(15,2) DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_pl_snapshots_year ON public.odoo_pl_snapshots(snapshot_year);

ALTER TABLE public.odoo_pl_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users"
  ON public.odoo_pl_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all for service role"
  ON public.odoo_pl_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);


-- ═══════════════════════════════════════════════════
-- Aged Receivable Snapshots
-- ═══════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS public.odoo_ar_snapshots (
  id            bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  snapshot_date date NOT NULL,
  row_order     integer NOT NULL,
  partner_name  text NOT NULL,
  is_total      boolean DEFAULT false,
  at_date       numeric(15,2) DEFAULT 0,
  bucket_1_30   numeric(15,2) DEFAULT 0,
  bucket_31_60  numeric(15,2) DEFAULT 0,
  bucket_61_90  numeric(15,2) DEFAULT 0,
  bucket_91_120 numeric(15,2) DEFAULT 0,
  older         numeric(15,2) DEFAULT 0,
  total         numeric(15,2) DEFAULT 0,
  created_at    timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_ar_snapshots_date ON public.odoo_ar_snapshots(snapshot_date);

ALTER TABLE public.odoo_ar_snapshots ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow read for authenticated users"
  ON public.odoo_ar_snapshots FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow all for service role"
  ON public.odoo_ar_snapshots FOR ALL TO service_role USING (true) WITH CHECK (true);
