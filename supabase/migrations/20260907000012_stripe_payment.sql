-- ============================================
-- NOUIE Store: Stripe Payment Hardening, Internal Restock, & Stale Order Cleanup
-- Migration: 20260907000012_stripe_payment.sql
-- ============================================

-- 1. Kontrent CHECK sou estati kòmand yo
ALTER TABLE public.orders DROP CONSTRAINT IF EXISTS orders_status_check;
ALTER TABLE public.orders ADD CONSTRAINT orders_status_check 
  CHECK (status IN ('pending', 'paid', 'payment_review', 'processing', 'shipped', 'delivered', 'cancelled'));

-- 2. Fonksyon entèn _restock_order (san gad, pa aksesib depi API)
CREATE OR REPLACE FUNCTION public._restock_order(p_order_id BIGINT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_item JSONB;
  v_size TEXT;
  v_qty INT;
BEGIN
  -- Lock ranje kòmand lan pou anpeche konfli
  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  -- Idempotans: si kòmand lan te deja anile oswa pa pending/paid, pa remèt estòk la de fwa
  IF v_order.status = 'cancelled' THEN
    RETURN false;
  END IF;

  -- Remèt estòk pou chak atik
  FOR v_item IN SELECT * FROM jsonb_array_elements(v_order.items) LOOP
    v_size := v_item->>'size';
    v_qty  := (v_item->>'qty')::int;

    IF v_size IS NOT NULL AND v_qty > 0 THEN
      UPDATE public.products SET
        stock_by_size = jsonb_set(
          COALESCE(stock_by_size, '{}'::jsonb),
          ARRAY[v_size],
          to_jsonb(COALESCE((stock_by_size->>v_size)::int, 0) + v_qty)
        ),
        stock_qty = COALESCE(stock_qty, 0) + v_qty
      WHERE id = v_item->>'id';
    END IF;
  END LOOP;

  -- Mete estati a sou 'cancelled'
  UPDATE public.orders
  SET status = 'cancelled'
  WHERE id = p_order_id;

  RETURN true;
END;
$$;

-- Sekirite strik: Pa gen okenn dwa sou _restock_order depi deyò
REVOKE ALL ON FUNCTION public._restock_order(BIGINT) FROM PUBLIC, anon, authenticated;

-- 3. Re-ekri cancel_order(bigint) pou aksepte service_role (webhook) ak admins
CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id BIGINT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_success BOOLEAN;
BEGIN
  -- Gad: sèlman service_role (Edge Functions) oswa admin verifye nan tab admins.
  -- NÒT: nou sèvi auth.jwt()->>'role' epi PA auth.role(). auth.role() se yon
  -- fonksyon Supabase depresye ki ka absan sou nouvo pwojè; si l absan, tout
  -- apèl cancel_order ta echwe (admin AK webhook). auth.jwt() pwouve l ap
  -- travay sou baz sa a — se li menm politik RLS 0001 yo sèvi.
  IF COALESCE(auth.jwt()->>'role', '') <> 'service_role' AND NOT EXISTS (
    SELECT 1 FROM public.admins WHERE email = auth.jwt()->>'email'
  ) THEN
    RAISE EXCEPTION 'AKSE_REFIZE: Sèl administratè oswa sèvis otorize ki ka anile kòmand.';
  END IF;

  v_success := public._restock_order(p_order_id);

  IF NOT v_success THEN
    RAISE EXCEPTION 'DEJA_ANILE_OSWA_ENVALID: Kòmand sa a te deja anile oswa li pa egziste.';
  END IF;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cancel_order(BIGINT) TO authenticated, service_role;

-- 4. Fonksyon pou netwaye kòmand 'pending' ki gen plis pase 45 minit (release_stale_orders)
CREATE OR REPLACE FUNCTION public.release_stale_orders()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_stale RECORD;
  v_count INTEGER := 0;
BEGIN
  FOR v_stale IN
    SELECT id FROM public.orders
    WHERE status = 'pending'
      AND paid_at IS NULL
      AND created_at < NOW() - INTERVAL '45 minutes'
    FOR UPDATE SKIP LOCKED
  LOOP
    IF public._restock_order(v_stale.id) THEN
      v_count := v_count + 1;
    END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

REVOKE ALL ON FUNCTION public.release_stale_orders() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION public.release_stale_orders() TO service_role;

-- 5. pg_cron: aktive ekstansyon an epi pwograme netwayaj la chak 10 minit.
--    CREATE EXTENSION dwe rete yon deklarasyon apa: blòk DO a ap fè referans a
--    `cron.*` sèlman nan ekzekisyon (kò a se yon chèn pou analizè a), donk chema
--    a ka fèt jis anvan. Yon `SELECT cron.…` dirèk isit ta echwe nan analiz.
CREATE EXTENSION IF NOT EXISTS pg_cron;

DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    IF EXISTS (SELECT 1 FROM cron.job WHERE jobname = 'nouie-release-stale-orders') THEN
      PERFORM cron.unschedule('nouie-release-stale-orders');
    END IF;
    PERFORM cron.schedule('nouie-release-stale-orders', '*/10 * * * *', 'SELECT public.release_stale_orders()');
  END IF;
EXCEPTION
  WHEN OTHERS THEN
    -- Si pg_cron poko aktive nan Extensions dashboard, pa bloke rès migrasyon an
    RAISE NOTICE 'pg_cron poko aktive sou baz done sa a. Aktive li nan Dashboard -> Database -> Extensions si nesesè.';
END $$;

-- 6. Verifikasyon final nan pye migrasyon an
-- Dwe bay 3 liy:
SELECT proname FROM pg_proc WHERE proname IN ('_restock_order', 'cancel_order', 'release_stale_orders');
-- Dwe bay 1 liy:
SELECT conname, contype FROM pg_constraint WHERE conname = 'orders_status_check';
-- Eta cron an. NÒT: nou sèvi EXECUTE (SQL dinamik) espre — yon
-- `SELECT ... FROM cron.job` dirèk ap echwe ak 42P01 lè pg_cron poko aktive
-- (chema `cron` lan pa egziste), epi sa ta fè TOUT migrasyon an woule anaryè.
DO $$
DECLARE v_cnt INT := 0;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_extension WHERE extname = 'pg_cron') THEN
    EXECUTE 'SELECT count(*) FROM cron.job WHERE jobname = ''nouie-release-stale-orders''' INTO v_cnt;
    IF v_cnt = 1 THEN
      RAISE NOTICE 'OK: cron nouie-release-stale-orders aktif (chak 10 min).';
    ELSE
      RAISE WARNING 'pg_cron aktif men job la pa kreye — rekouri seksyon 5.';
    END IF;
  ELSE
    RAISE WARNING 'pg_cron PA AKTIVE: twazyèm filè estòk la (45 min) PA EGZISTE. Aktive nan Dashboard -> Database -> Extensions, epi rekouri seksyon 5.';
  END IF;
END $$;
