-- 20260922000014 — GAD TRANZISYON ESTATI KÒMAND
--
-- Poukisa: 22 sept 2026, premye tès bout-an-bout chèn peman an. De kòmand
-- kraze nan panèl admin lan an de minit, san okenn avètisman:
--   • #28 — peye nan Stripe (pi_…succeeded, $77.99) — tonbe sou 'pending'.
--     Opsyon PAID la `disabled` nan meni an, donk zewo fason nan UI a pou
--     remonte l. Kliyan an peye, sistèm nan di li pa peye.
--   • #27 — anile (estòk deja remèt) — vin 'delivered', ak paid_at VID.
--
-- Gad ki te egziste a te nan navigatè a sèlman epi li te konpare sou `status`.
-- Nan baz la pa te gen anyen pase yon CHECK sou lis mo yo — zewo règ sou
-- tranzisyon.
--
-- Prensip: `paid_at` = verite peman an (sèl webhook Stripe ki ekri l, yon sèl
-- fwa). `status` = eta livrezon. Yon klik nan yon meni pa gen dwa efase yon
-- peman.

-- 1. paid_at vin ENVIOLAB depi li ekri
CREATE OR REPLACE FUNCTION public._orders_protect_paid_at()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
BEGIN
  IF OLD.paid_at IS NOT NULL AND NEW.paid_at IS DISTINCT FROM OLD.paid_at THEN
    RAISE EXCEPTION 'PEMAN_ENVIOLAB: paid_at sou kòmand #% deja fikse (%). Li pa ka chanje ni efase.',
      OLD.id, OLD.paid_at;
  END IF;
  RETURN NEW;
END; $$;

-- 2. Tranzisyon estati ki otorize
CREATE OR REPLACE FUNCTION public._orders_check_status_transition()
RETURNS TRIGGER LANGUAGE plpgsql SECURITY DEFINER SET search_path TO 'public' AS $$
DECLARE v_ok BOOLEAN := false;
BEGIN
  IF NEW.status IS NOT DISTINCT FROM OLD.status THEN RETURN NEW; END IF;

  -- 'cancelled' se tèminal: estòk la deja remèt, si n louvri l ankò l ap vann de fwa
  IF OLD.status = 'cancelled' THEN
    RAISE EXCEPTION 'KÒMAND_ANILE: #% deja anile. Li pa ka tounen nan ''%''.', OLD.id, NEW.status;
  END IF;

  -- Anile toujou otorize depi nenpòt lòt eta
  IF NEW.status = 'cancelled' THEN RETURN NEW; END IF;

  -- Pa gen livrezon san peman. Nou konpare sou paid_at, PA sou status.
  IF NEW.status IN ('processing','shipped','delivered') AND NEW.paid_at IS NULL THEN
    RAISE EXCEPTION 'PA_PEYE: kòmand #% pa gen paid_at. Li pa ka ale nan ''%''.', OLD.id, NEW.status;
  END IF;

  v_ok := CASE OLD.status
    WHEN 'pending'        THEN NEW.status IN ('paid','payment_review')
    WHEN 'payment_review' THEN NEW.status IN ('paid')
    WHEN 'paid'           THEN NEW.status IN ('processing','shipped','delivered')
    WHEN 'processing'     THEN NEW.status IN ('shipped','delivered')
    WHEN 'shipped'        THEN NEW.status IN ('delivered')
    WHEN 'delivered'      THEN false
    ELSE false
  END;

  IF NOT v_ok THEN
    RAISE EXCEPTION 'TRANZISYON_ENTÈDI: kòmand #% pa ka pase de ''%'' a ''%''.', OLD.id, OLD.status, NEW.status;
  END IF;

  RETURN NEW;
END; $$;

DROP TRIGGER IF EXISTS trg_orders_protect_paid_at ON public.orders;
CREATE TRIGGER trg_orders_protect_paid_at
  BEFORE UPDATE ON public.orders FOR EACH ROW
  EXECUTE FUNCTION public._orders_protect_paid_at();

DROP TRIGGER IF EXISTS trg_orders_status_transition ON public.orders;
CREATE TRIGGER trg_orders_status_transition
  BEFORE UPDATE ON public.orders FOR EACH ROW
  EXECUTE FUNCTION public._orders_check_status_transition();

-- 3. Repare de kòmand tès 22 sept yo (repare a li menm se yon tranzisyon
--    ki entèdi kounye a, donk nou dezaktive trigger la yon moman)
ALTER TABLE public.orders DISABLE TRIGGER trg_orders_status_transition;

UPDATE public.orders SET status='paid'
WHERE id=28 AND paid_at IS NOT NULL AND status='pending';

UPDATE public.orders SET status='cancelled'
WHERE id=27 AND paid_at IS NULL AND status='delivered';

ALTER TABLE public.orders ENABLE TRIGGER trg_orders_status_transition;

-- 4. PRÈV — migrasyon an pa fini san yon prèv sou eta final la
DO $$
DECLARE v_row RECORD;
BEGIN
  FOR v_row IN SELECT id, status, paid_at FROM public.orders WHERE id IN (27,28) ORDER BY id LOOP
    RAISE NOTICE 'PRÈV kòmand #% → status=% paid_at=%', v_row.id, v_row.status, v_row.paid_at;
  END LOOP;
END $$;
