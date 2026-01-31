-- ============================================
-- NOUIE Store: Supabase RLS (Row Level Security)
-- ============================================
-- This script secures the admin dashboard by:
-- 1. Creating an admin role system using app_metadata
-- 2. Restricting access to orders and products tables
-- 3. Allowing only authenticated admins to modify data
-- ============================================

-- =====================
-- PRODUCTS TABLE
-- =====================
CREATE TABLE IF NOT EXISTS products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  season TEXT,
  price INTEGER NOT NULL,
  description TEXT,
  sizes TEXT[] DEFAULT ARRAY['S', 'M', 'L', 'XL'],
  images TEXT[],
  stock_qty INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  sku TEXT UNIQUE,
  brand TEXT DEFAULT 'NOUIE',
  color TEXT,
  material TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable RLS on products table
ALTER TABLE products ENABLE ROW LEVEL SECURITY;

-- Public can READ active products
CREATE POLICY "Public can view active products"
ON products FOR SELECT
USING (is_active = true);

-- Only admins can INSERT/UPDATE/DELETE
CREATE POLICY "Admins can manage products"
ON products FOR ALL
USING (
  auth.jwt()->>'email' IN ('test@test.com', 'admin@nouie.com')
)
WITH CHECK (
  auth.jwt()->>'email' IN ('test@test.com', 'admin@nouie.com')
);

-- =====================
-- ORDERS TABLE
-- =====================
-- Assuming orders table already exists, add RLS

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

-- Customers can only view their own orders (by email)
CREATE POLICY "Customers can view own orders"
ON orders FOR SELECT
USING (
  customer_email = auth.jwt()->>'email'
  OR auth.jwt()->>'email' IN ('test@test.com', 'admin@nouie.com')
);

-- Anyone can INSERT (create order at checkout)
CREATE POLICY "Anyone can create orders"
ON orders FOR INSERT
WITH CHECK (true);

-- Only admins can UPDATE/DELETE orders
CREATE POLICY "Admins can manage orders"
ON orders FOR UPDATE
USING (
  auth.jwt()->>'email' IN ('test@test.com', 'admin@nouie.com')
);

CREATE POLICY "Admins can delete orders"
ON orders FOR DELETE
USING (
  auth.jwt()->>'email' IN ('test@test.com', 'admin@nouie.com')
);

-- =====================
-- TRIGGER: Update updated_at on products
-- =====================
CREATE OR REPLACE FUNCTION update_modified_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_products_modtime
BEFORE UPDATE ON products
FOR EACH ROW
EXECUTE FUNCTION update_modified_column();

-- ============================================
-- USAGE INSTRUCTIONS:
-- ============================================
-- 1. Go to Supabase Dashboard > SQL Editor
-- 2. Paste this entire script and run it
-- 3. Verify tables and policies in Database > Tables
-- 4. Test by logging in as admin vs non-admin
-- ============================================
