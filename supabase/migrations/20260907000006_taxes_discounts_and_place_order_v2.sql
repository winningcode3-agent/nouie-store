-- ============================================
-- NOUIE Store: Taxes, Discounts & Dynamic Order RPC
-- Migration: 20260907000006_taxes_discounts_and_place_order_v2.sql
-- ============================================

-- 1. Ajoute kolòn taks ak rabè sou tab orders
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_rate NUMERIC(6,4) DEFAULT 0.0000;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS tax_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_code TEXT;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS discount_amount NUMERIC(10,2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS notes_internal TEXT;

-- 2. Kreye tab discounts
CREATE TABLE IF NOT EXISTS public.discounts (
  id BIGSERIAL PRIMARY KEY,
  code TEXT UNIQUE NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('percentage', 'fixed')),
  value NUMERIC(10,2) NOT NULL,
  min_subtotal NUMERIC(10,2) DEFAULT 0.00,
  starts_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  ends_at TIMESTAMP WITH TIME ZONE,
  max_uses INTEGER,
  uses INTEGER DEFAULT 0,
  active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.discounts ENABLE ROW LEVEL SECURITY;

-- discounts pa piblik: sèlman admins ki ka jere li
DROP POLICY IF EXISTS "Admins manage discounts" ON public.discounts;
CREATE POLICY "Admins manage discounts"
ON public.discounts FOR ALL
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

-- 3. Fonksyon pou valide yon kòd rabè anvan kòmand san ekspoze tout tab la
CREATE OR REPLACE FUNCTION public.validate_discount(
  p_code TEXT,
  p_subtotal NUMERIC
) RETURNS JSONB
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_discount discounts%ROWTYPE;
  v_discount_amt NUMERIC(10,2) := 0.00;
BEGIN
  IF p_code IS NULL OR trim(p_code) = '' THEN
    RETURN jsonb_build_object('valid', false, 'message', 'KÒD MANKE');
  END IF;

  SELECT * INTO v_discount FROM public.discounts
  WHERE upper(code) = upper(trim(p_code)) AND active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object('valid', false, 'message', 'KÒD RABÈ ENVALID');
  END IF;

  IF v_discount.starts_at IS NOT NULL AND v_discount.starts_at > NOW() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'KÒD RABÈ POKO KÒMANSE');
  END IF;

  IF v_discount.ends_at IS NOT NULL AND v_discount.ends_at < NOW() THEN
    RETURN jsonb_build_object('valid', false, 'message', 'KÒD RABÈ EKSPIRE');
  END IF;

  IF v_discount.max_uses IS NOT NULL AND v_discount.uses >= v_discount.max_uses THEN
    RETURN jsonb_build_object('valid', false, 'message', 'LIMIT ITILIZASYON ATENN');
  END IF;

  IF p_subtotal < COALESCE(v_discount.min_subtotal, 0) THEN
    RETURN jsonb_build_object('valid', false, 'message', format('MINIMÒM PANYEN SE $%s', v_discount.min_subtotal));
  END IF;

  IF v_discount.type = 'percentage' THEN
    v_discount_amt := round(p_subtotal * (v_discount.value / 100.0), 2);
  ELSE
    v_discount_amt := least(p_subtotal, v_discount.value);
  END IF;

  RETURN jsonb_build_object(
    'valid', true,
    'code', v_discount.code,
    'type', v_discount.type,
    'value', v_discount.value,
    'discount_amount', v_discount_amt
  );
END $$;

GRANT EXECUTE ON FUNCTION public.validate_discount(TEXT, NUMERIC) TO anon, authenticated;

-- 4. Fonksyon place_order modènize (v2): Li livrezon, taks nan store_settings, valide rabè atomikman
CREATE OR REPLACE FUNCTION public.place_order(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address TEXT,
  p_notes TEXT,
  p_items JSONB,
  p_shipping_method TEXT DEFAULT 'standard',
  p_discount_code TEXT DEFAULT NULL
) RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item JSONB;
  v_product products%ROWTYPE;
  v_qty INT;
  v_size TEXT;
  v_subtotal NUMERIC(10,2) := 0.00;
  v_items_clean JSONB := '[]'::jsonb;
  v_shipping NUMERIC(10,2) := 0.00;
  v_shipping_conf JSONB;
  v_std_rate NUMERIC(10,2) := 10.00;
  v_exp_rate NUMERIC(10,2) := 25.00;
  v_free_threshold NUMERIC(10,2) := 250.00;
  v_tax_conf JSONB;
  v_tax_rate NUMERIC(6,4) := 0.0000;
  v_tax_amount NUMERIC(10,2) := 0.00;
  v_discount discounts%ROWTYPE;
  v_discount_amount NUMERIC(10,2) := 0.00;
  v_applied_discount_code TEXT := NULL;
  v_total NUMERIC(10,2);
  v_order_id BIGINT;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'PANYEN_VID';
  END IF;

  -- 1. Verifye epi dedwi estòk pou chak atik
  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_size := v_item->>'size';
    v_qty  := (v_item->>'qty')::int;

    SELECT * INTO v_product FROM public.products
      WHERE id = v_item->>'id' AND is_active = true FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'PWODWI_ENDISPONIB: %', v_item->>'id';
    END IF;

    IF v_qty IS NULL OR v_qty < 1 THEN
      RAISE EXCEPTION 'KANTITE_ENVALID';
    END IF;

    IF v_size IS NULL OR v_size = '' THEN
      RAISE EXCEPTION 'GWOSE_MANKE';
    END IF;

    IF COALESCE((v_product.stock_by_size->>v_size)::int, 0) < v_qty THEN
      RAISE EXCEPTION 'ESTOK_ENSIFIZAN: % %', v_product.name, v_size;
    END IF;

    -- Pri soti nan baz done a sèlman
    v_subtotal := v_subtotal + (v_product.price * v_qty);

    v_items_clean := v_items_clean || jsonb_build_object(
      'id',    v_product.id,
      'name',  v_product.name,
      'size',  v_size,
      'qty',   v_qty,
      'price', v_product.price
    );

    UPDATE public.products SET
      stock_by_size = jsonb_set(
        COALESCE(stock_by_size, '{}'::jsonb),
        ARRAY[v_size],
        to_jsonb(COALESCE((stock_by_size->>v_size)::int, 0) - v_qty)
      ),
      stock_qty = greatest(COALESCE(stock_qty, 0) - v_qty, 0)
    WHERE id = v_product.id;
  END LOOP;

  -- 2. Li tarif livrezon nan store_settings
  SELECT value INTO v_shipping_conf FROM public.store_settings WHERE key = 'shipping';
  IF v_shipping_conf IS NOT NULL THEN
    v_std_rate       := COALESCE((v_shipping_conf->>'standard')::numeric, 10.00);
    v_exp_rate       := COALESCE((v_shipping_conf->>'express')::numeric, 25.00);
    v_free_threshold := COALESCE((v_shipping_conf->>'free_threshold')::numeric, 250.00);
  END IF;

  IF p_shipping_method = 'express' THEN
    v_shipping := v_exp_rate;
  ELSIF v_subtotal >= v_free_threshold THEN
    v_shipping := 0.00;
  ELSE
    v_shipping := v_std_rate;
  END IF;

  -- 3. Li taks nan store_settings
  SELECT value INTO v_tax_conf FROM public.store_settings WHERE key = 'tax';
  IF v_tax_conf IS NOT NULL AND COALESCE((v_tax_conf->>'enabled')::boolean, false) THEN
    v_tax_rate := COALESCE((v_tax_conf->>'rate')::numeric, 0.0000);
    v_tax_amount := round(v_subtotal * v_tax_rate, 2);
  ELSE
    v_tax_rate := 0.0000;
    v_tax_amount := 0.00;
  END IF;

  -- 4. Valide rabè si genyen
  IF p_discount_code IS NOT NULL AND trim(p_discount_code) <> '' THEN
    SELECT * INTO v_discount FROM public.discounts
    WHERE upper(code) = upper(trim(p_discount_code)) AND active = true
    FOR UPDATE;

    IF NOT FOUND THEN
      RAISE EXCEPTION 'RABE_ENVALID';
    END IF;

    IF v_discount.starts_at IS NOT NULL AND v_discount.starts_at > NOW() THEN
      RAISE EXCEPTION 'RABE_POKO_KÒMANSE';
    END IF;

    IF v_discount.ends_at IS NOT NULL AND v_discount.ends_at < NOW() THEN
      RAISE EXCEPTION 'RABE_EKSPIRE';
    END IF;

    IF v_discount.max_uses IS NOT NULL AND v_discount.uses >= v_discount.max_uses THEN
      RAISE EXCEPTION 'RABE_LIMIT_ATENN';
    END IF;

    IF v_subtotal < COALESCE(v_discount.min_subtotal, 0) THEN
      RAISE EXCEPTION 'RABE_MINIMÒM_ENSIFIZAN';
    END IF;

    IF v_discount.type = 'percentage' THEN
      v_discount_amount := round(v_subtotal * (v_discount.value / 100.0), 2);
    ELSE
      v_discount_amount := least(v_subtotal, v_discount.value);
    END IF;

    UPDATE public.discounts SET uses = uses + 1 WHERE id = v_discount.id;
    v_applied_discount_code := v_discount.code;
  END IF;

  -- 5. Kalkile total final
  v_total := greatest(0.00, v_subtotal + v_shipping + v_tax_amount - v_discount_amount);

  -- 6. Enskri kòmand lan
  INSERT INTO public.orders (
    customer_name, customer_email, customer_phone,
    shipping_address, notes, items, subtotal, shipping_method,
    shipping_cost, tax_rate, tax_amount, discount_code, discount_amount,
    total, status
  )
  VALUES (
    p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, p_notes, v_items_clean, v_subtotal, p_shipping_method,
    v_shipping, v_tax_rate, v_tax_amount, v_applied_discount_code, v_discount_amount,
    v_total, 'pending'
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END $$;

GRANT EXECUTE ON FUNCTION public.place_order(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT, TEXT) TO anon, authenticated;

-- Verifikasyon
SELECT proname, nargdefs FROM (
  SELECT proname, count(*) as nargdefs FROM pg_proc WHERE proname IN ('place_order', 'validate_discount') GROUP BY proname
) s;
