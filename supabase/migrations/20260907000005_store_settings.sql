-- ============================================
-- NOUIE Store: Store Settings Table & Default Configs
-- Migration: 20260907000005_store_settings.sql
-- ============================================

CREATE TABLE IF NOT EXISTS public.store_settings (
  key TEXT PRIMARY KEY,
  value JSONB NOT NULL,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.store_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can read settings" ON public.store_settings;
CREATE POLICY "Public can read settings"
ON public.store_settings FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage settings" ON public.store_settings;
CREATE POLICY "Admins manage settings"
ON public.store_settings FOR ALL
USING (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = auth.jwt()->>'email'
  )
)
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = auth.jwt()->>'email'
  )
);

-- Inisyalize konfigirasyon yo
INSERT INTO public.store_settings (key, value) VALUES
 ('business', '{"name":"NOUIE","address_line1":"104 INDUSTRIAL_ZONE_04","address_line2":"","city":"NORTH_TERMINAL","state":"VOID","zip":"00000","country":"USA","phone":"","email_support":"support@nouie.com","email_studio":"studio@nouie.com"}'::jsonb),
 ('shipping', '{"standard":10.00,"express":25.00,"free_threshold":250.00,"standard_days":"5-7","express_days":"2-3"}'::jsonb),
 ('tax',      '{"enabled":false,"rate":0.00,"label":"SALES TAX"}'::jsonb),
 ('store',    '{"maintenance":false,"announcement":""}'::jsonb)
ON CONFLICT (key) DO NOTHING;

-- Verifikasyon
SELECT key, value, updated_at FROM public.store_settings;
