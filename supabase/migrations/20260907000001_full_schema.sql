-- ============================================
-- NOUIE Store: Full Schema Migration
-- Migration: 20260907000001_full_schema.sql
-- ============================================

-- 1. PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  season TEXT,
  price NUMERIC(10,2) NOT NULL,
  description TEXT,
  sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
  images TEXT[] DEFAULT ARRAY[]::TEXT[],
  stock_qty INTEGER DEFAULT 0,
  stock_by_size JSONB DEFAULT '{}'::jsonb,
  is_active BOOLEAN DEFAULT true,
  sku TEXT UNIQUE,
  brand TEXT DEFAULT 'NOUIE',
  color TEXT,
  material TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure all columns exist in case table was created previously with older schema
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_by_size JSONB DEFAULT '{}'::jsonb;
ALTER TABLE products ADD COLUMN IF NOT EXISTS stock_qty INTEGER DEFAULT 0;
ALTER TABLE products ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;
ALTER TABLE products ADD COLUMN IF NOT EXISTS sku TEXT UNIQUE;
ALTER TABLE products ADD COLUMN IF NOT EXISTS brand TEXT DEFAULT 'NOUIE';
ALTER TABLE products ADD COLUMN IF NOT EXISTS color TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS material TEXT;
ALTER TABLE products ADD COLUMN IF NOT EXISTS season TEXT;

ALTER TABLE products ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public can view active products" ON products;
CREATE POLICY "Public can view active products"
ON products FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Admins can manage products" ON products;
CREATE POLICY "Admins can manage products"
ON products FOR ALL
USING (auth.jwt()->>'email' IN ('admin@nouie.com'))
WITH CHECK (auth.jwt()->>'email' IN ('admin@nouie.com'));


-- 2. ORDERS TABLE
CREATE TABLE IF NOT EXISTS orders (
  id BIGSERIAL PRIMARY KEY,
  customer_name TEXT NOT NULL,
  customer_email TEXT NOT NULL,
  customer_phone TEXT NOT NULL,
  shipping_address TEXT NOT NULL,
  notes TEXT,
  items JSONB NOT NULL,
  subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00,
  shipping_method TEXT NOT NULL DEFAULT 'standard',
  shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 10.00,
  total NUMERIC(10,2) NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  tracking_number TEXT,
  carrier TEXT,
  stripe_session_id TEXT UNIQUE,
  paid_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Ensure drift columns exist
ALTER TABLE orders ADD COLUMN IF NOT EXISTS subtotal NUMERIC(10,2) NOT NULL DEFAULT 0.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_method TEXT NOT NULL DEFAULT 'standard';
ALTER TABLE orders ADD COLUMN IF NOT EXISTS shipping_cost NUMERIC(10,2) NOT NULL DEFAULT 10.00;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS tracking_number TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS carrier TEXT;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS stripe_session_id TEXT UNIQUE;
ALTER TABLE orders ADD COLUMN IF NOT EXISTS paid_at TIMESTAMP WITH TIME ZONE;

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Customers can view own orders" ON orders;
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
USING (
  customer_email = auth.jwt()->>'email'
  OR auth.jwt()->>'email' IN ('admin@nouie.com')
);

DROP POLICY IF EXISTS "Admins can manage orders" ON orders;
CREATE POLICY "Admins can manage orders"
ON orders FOR UPDATE
USING (auth.jwt()->>'email' IN ('admin@nouie.com'));

DROP POLICY IF EXISTS "Admins can delete orders" ON orders;
CREATE POLICY "Admins can delete orders"
ON orders FOR DELETE
USING (auth.jwt()->>'email' IN ('admin@nouie.com'));


-- 3. NEWSLETTER SUBSCRIBERS TABLE
CREATE TABLE IF NOT EXISTS newsletter_subscribers (
  id BIGSERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE newsletter_subscribers ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can subscribe to newsletter" ON newsletter_subscribers;
CREATE POLICY "Anyone can subscribe to newsletter"
ON newsletter_subscribers FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view newsletter subscribers" ON newsletter_subscribers;
CREATE POLICY "Admins can view newsletter subscribers"
ON newsletter_subscribers FOR SELECT
USING (auth.jwt()->>'email' IN ('admin@nouie.com'));


-- 4. CONTACT MESSAGES TABLE
CREATE TABLE IF NOT EXISTS contact_messages (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  subject TEXT,
  message TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

ALTER TABLE contact_messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can submit contact message" ON contact_messages;
CREATE POLICY "Anyone can submit contact message"
ON contact_messages FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Admins can view contact messages" ON contact_messages;
CREATE POLICY "Admins can view contact messages"
ON contact_messages FOR SELECT
USING (auth.jwt()->>'email' IN ('admin@nouie.com'));


-- 5. TRIGGER: updated_at sou products
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

DROP TRIGGER IF EXISTS update_products_modtime ON products;
CREATE TRIGGER update_products_modtime
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();
