-- 20260922000015 — PWEN KADRAJ PA PWODWI
--
-- Poukisa: foto yo pa gen menm fòma. NO UIE TENNIS DRESS la se yon foto
-- telefòn 2268 × 4032 (9:16) pandan kad katalòg la se 4/5. Ak `object-fit:
-- cover`, navigatè a ranpli lajè a epi koupe anwo ak anba — rezilta: tèt yon
-- moun ak pye yon lòt disparèt. Okenn reglaj global pa ka ranje tout foto:
-- youn bezwen kadraj anwo, yon lòt nan mitan.
--
-- Donk chak pwodwi pote pwen kadraj pa l, epi Franckley chwazi l nan panèl la.
-- Nou estoke yon JETON (pa yon valè CSS), epi kòd la tradui l — konsa anyen
-- moun tape pa ka rantre nan yon atribi `style`.

ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS image_position TEXT NOT NULL DEFAULT 'center';

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_image_position_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_image_position_check
      CHECK (image_position IN ('center', 'top', 'upper', 'lower', 'bottom'));
  END IF;
END $$;

-- Pa gen valè kode an di isit: kadraj la se yon chwa moun ki gade foto a fè,
-- nan panèl la. Yon premye eseye ak 'top' sou CAT04 te montre sèlman branch
-- pyebwa — moun yo chita nan mitan foto a, donk 'center' (defo a) bon.

-- PRÈV
DO $$
DECLARE r RECORD;
BEGIN
  FOR r IN SELECT id, image_position FROM public.products ORDER BY id LOOP
    RAISE NOTICE 'PRÈV % → kadraj=%', r.id, r.image_position;
  END LOOP;
END $$;
