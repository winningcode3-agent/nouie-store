-- ============================================
-- NOUIE — Katalòg inisyal
-- Pote 3 pwodwi ki te kode an di nan src/lib/data.ts antre nan baz done a.
-- Foto yo deja nan public/assets/. Franckley ka modifye tout bagay nan panèl admin.
-- Re-kouri san danje: ON CONFLICT DO NOTHING — yon seed pa gen dwa
-- ekrase chanjman admin lan fè nan panèl la.
-- ============================================

-- Retire pwodwi tès entèn lan
DELETE FROM orders   WHERE customer_email = 'probe@test.local';
DELETE FROM products WHERE id = 'TEST-PROBE-001';

INSERT INTO products
  (id, name, season, price, description, sizes, images,
   stock_qty, stock_by_size, is_active, sku, brand, color, material)
VALUES
  ('CAT01', 'SOLDIER THERMALS', 'SS26', 67.99,
   'Oversized thermal long-sleeve featuring hand-drawn soldier graphics. Premium cotton-blend construction with signature sleeve art.',
   ARRAY['S','M','L','XL','XXL'],
   ARRAY['soldier_thermal_1.jpg','cat1_2.jpg','cat1_3.jpg','cat1_4.png'],
   42, '{"S":8,"M":10,"L":10,"XL":8,"XXL":6}'::jsonb,
   true, 'NOUIE-SS26-ST-01', 'NOUIE', 'CREAM', 'COTTON BLEND / THERMAL KNIT'),

  ('CAT02', 'NOUIE TEE', 'SS26', 67.99,
   'Premium cotton tee with signature NOUIE graphics. Clean lines and modern fit.',
   ARRAY['S','M','L','XL'],
   ARRAY['cat2_1.jpg','cat2_2.jpg','cat2_3.jpg','cat2_4.jpg'],
   15, '{"S":3,"M":4,"L":5,"XL":3}'::jsonb,
   true, 'NOUIE-SS26-NT-02', 'NOUIE', 'BLACK', 'PREMIUM COTTON'),

  ('CAT03', 'NOUIE JERSEY', 'SS26', 44.77,
   'Classic mesh jersey with breathable construction. Perfect for layering or standalone wear.',
   ARRAY['M','L','XL'],
   ARRAY['cat3_1.png','cat3_2.png','cat3_3.png','cat3_4.png'],
   8, '{"M":3,"L":3,"XL":2}'::jsonb,
   true, 'NOUIE-SS26-NJ-03', 'NOUIE', 'BLACK', 'MESH / POLYESTER')

ON CONFLICT (id) DO NOTHING;

SELECT id, name, price, stock_qty, stock_by_size, array_length(images,1) AS nb_foto
FROM products ORDER BY id;
