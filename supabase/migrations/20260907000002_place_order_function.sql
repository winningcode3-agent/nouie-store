-- ============================================
-- NOUIE Store: Atomic Order Placement & Inventory Function
-- Migration: 20260907000002_place_order_function.sql
-- ============================================

CREATE OR REPLACE FUNCTION public.place_order(
  p_customer_name TEXT,
  p_customer_email TEXT,
  p_customer_phone TEXT,
  p_shipping_address TEXT,
  p_notes TEXT,
  p_items JSONB,
  p_shipping_method TEXT DEFAULT 'standard'
) RETURNS BIGINT
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_item JSONB;
  v_product products%ROWTYPE;
  v_qty INT;
  v_size TEXT;
  v_subtotal NUMERIC(10,2) := 0;
  v_items_clean JSONB := '[]'::jsonb;
  v_shipping NUMERIC(10,2);
  v_order_id BIGINT;
BEGIN
  IF p_items IS NULL OR jsonb_array_length(p_items) = 0 THEN
    RAISE EXCEPTION 'PANYEN_VID';
  END IF;

  FOR v_item IN SELECT * FROM jsonb_array_elements(p_items) LOOP
    v_size := v_item->>'size';
    v_qty  := (v_item->>'qty')::int;

    -- Lock ranje a pou de kliyan pa pran dènye atik la ansanm
    SELECT * INTO v_product FROM products
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

    -- Pri a soti NAN BAZ DONE A, pa nan navigatè a
    v_subtotal := v_subtotal + (v_product.price * v_qty);

    -- Rebati liy lan ak done sèvè a: sa navigatè a voye pa janm anrejistre
    v_items_clean := v_items_clean || jsonb_build_object(
      'id',    v_product.id,
      'name',  v_product.name,
      'size',  v_size,
      'qty',   v_qty,
      'price', v_product.price
    );

    UPDATE products SET
      stock_by_size = jsonb_set(
        COALESCE(stock_by_size, '{}'::jsonb),
        ARRAY[v_size],
        to_jsonb(COALESCE((stock_by_size->>v_size)::int, 0) - v_qty)
      ),
      stock_qty = greatest(COALESCE(stock_qty, 0) - v_qty, 0)
    WHERE id = v_product.id;
  END LOOP;

  v_shipping := CASE
    WHEN p_shipping_method = 'express' THEN 25.00
    WHEN v_subtotal >= 250 THEN 0.00
    ELSE 10.00
  END;

  INSERT INTO orders (
    customer_name, customer_email, customer_phone,
    shipping_address, notes, items, subtotal, shipping_method,
    shipping_cost, total, status
  )
  VALUES (
    p_customer_name, p_customer_email, p_customer_phone,
    p_shipping_address, p_notes, v_items_clean, v_subtotal, p_shipping_method,
    v_shipping, v_subtotal + v_shipping, 'pending'
  )
  RETURNING id INTO v_order_id;

  RETURN v_order_id;
END $$;

-- Bay dwa ekzekisyon bay itilizatè piblik ak otantifye
GRANT EXECUTE ON FUNCTION public.place_order(TEXT, TEXT, TEXT, TEXT, TEXT, JSONB, TEXT) TO anon, authenticated;

-- Fèmen twou sekirite a: retire tout chemen INSERT dirèk sou orders.
-- Sèl `place_order()` (SECURITY DEFINER) ki gen dwa ekri — konsa pri a
-- toujou soti nan baz done a, jamè nan navigatè a.
--
-- ATANSYON: sou pwodiksyon règ la te rele `orders_access` (FOR ALL,
-- anon+authenticated, WITH CHECK true), pa `Anyone can create orders`.
-- De non yo nesesè: youn pou baz done ki soti nan ansyen script la,
-- lòt la pou sa ki te modifye alamen nan konsòl la.
DROP POLICY IF EXISTS "Anyone can create orders" ON orders;
DROP POLICY IF EXISTS "orders_access" ON orders;
