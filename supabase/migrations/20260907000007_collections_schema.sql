-- ============================================
-- NOUIE Store: Collections & Product Collections Schema
-- Migration: 20260907000007_collections_schema.sql
-- ============================================

-- 1. Tab collections
CREATE TABLE IF NOT EXISTS public.collections (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  cover_image TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_archived BOOLEAN DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE public.collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active collections" ON public.collections;
CREATE POLICY "Public can view active collections"
ON public.collections FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins manage collections" ON public.collections;
CREATE POLICY "Admins manage collections"
ON public.collections FOR ALL
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

-- 2. Tab product_collections (lyen anpil-a-anpil)
CREATE TABLE IF NOT EXISTS public.product_collections (
  product_id TEXT NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  collection_id TEXT NOT NULL REFERENCES public.collections(id) ON DELETE CASCADE,
  sort_order INTEGER DEFAULT 0,
  PRIMARY KEY (product_id, collection_id)
);

ALTER TABLE public.product_collections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view product collections" ON public.product_collections;
CREATE POLICY "Public can view product collections"
ON public.product_collections FOR SELECT
USING (true);

DROP POLICY IF EXISTS "Admins manage product collections" ON public.product_collections;
CREATE POLICY "Admins manage product collections"
ON public.product_collections FOR ALL
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

-- 3. Migrasyon done: kreye koleksyon SS26 otomatikman epi asosye pwodwi ki deja la
INSERT INTO public.collections (id, slug, title, description, cover_image, sort_order, is_active, is_archived)
VALUES (
  'COL_SS26',
  'ss26',
  'SS26 DROP',
  'Spring/Summer 2026 technical collection featuring heavyweight thermals, oversized graphics, and breathable mesh.',
  'cat1_1.jpg',
  1,
  true,
  false
)
ON CONFLICT (id) DO NOTHING;

-- Asosye pwodwi ki gen season = 'SS26' oswa ki deja nan baz done a
INSERT INTO public.product_collections (product_id, collection_id, sort_order)
SELECT p.id, 'COL_SS26', 1
FROM public.products p
WHERE p.id IN ('CAT01', 'CAT02', 'CAT03') OR p.season = 'SS26'
ON CONFLICT (product_id, collection_id) DO NOTHING;

-- Verifikasyon
SELECT c.id, c.slug, c.title, count(pc.product_id) as total_products
FROM public.collections c
LEFT JOIN public.product_collections pc ON pc.collection_id = c.id
GROUP BY c.id, c.slug, c.title;
