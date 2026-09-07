-- ============================================
-- NOUIE Store: Cancel Order with Restock RPC
-- Migration: 20260907000004_cancel_order_and_inventory.sql
-- ============================================

CREATE OR REPLACE FUNCTION public.cancel_order(p_order_id BIGINT)
RETURNS VOID LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
DECLARE
  v_order orders%ROWTYPE;
  v_item JSONB;
  v_size TEXT;
  v_qty INT;
BEGIN
  -- 1. GAD SEKIRITE OBLIGATWA: verifye si moun nan se admin
  IF NOT EXISTS (
    SELECT 1 FROM public.admins
    WHERE email = auth.jwt()->>'email'
  ) THEN
    RAISE EXCEPTION 'AKSE_REFIZE: Sèl administratè ki gen dwa anile yon kòmand.';
  END IF;

  -- 2. Lock ranje kòmand lan pou anpeche konfli
  SELECT * INTO v_order FROM public.orders
  WHERE id = p_order_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'KOMAND_PA_JWENN: Kòmand #% pa egziste.', p_order_id;
  END IF;

  -- 3. Idempotans: si kòmand lan te deja anile, pa remèt estòk la yon dezyèm fwa
  IF v_order.status = 'cancelled' THEN
    RAISE EXCEPTION 'DEJA_ANILE: Kòmand sa a te deja anile deja.';
  END IF;

  -- 4. Bouk sou tout atik ki te nan kòmand lan epi remèt estòk la
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

  -- 5. Mete estati kòmand lan sou cancelled
  UPDATE public.orders
  SET status = 'cancelled'
  WHERE id = p_order_id;

END $$;

-- Bay dwa ekzekisyon sèlman bay authenticated users (gad la verifye nan admin table)
GRANT EXECUTE ON FUNCTION public.cancel_order(BIGINT) TO authenticated;

-- Verifikasyon fonksyon an
SELECT proname, prosecdef, provolatile FROM pg_proc WHERE proname = 'cancel_order';
