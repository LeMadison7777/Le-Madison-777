BEGIN;

INSERT INTO categories (name, slug, sort_order) VALUES
  ('Robes & Tenues', 'robes-tenues', 10),
  ('Chemises & Hauts', 'chemises-hauts', 20),
  ('Pantalons & Jeans', 'pantalons-jeans', 30),
  ('Chaussures', 'chaussures', 40),
  ('Sacs & Maroquinerie', 'sacs-maroquinerie', 50),
  ('Montres & Bijoux', 'montres-bijoux', 60),
  ('Casquettes & Chapeaux', 'casquettes-chapeaux', 70),
  ('Lunettes & Accessoires', 'lunettes-accessoires', 80)
ON CONFLICT (slug) DO NOTHING;

INSERT INTO platform_settings (key, value) VALUES
  ('commission_rates', '{"seller_bps":0,"buyer_bps":0,"configured":false}'::jsonb)
ON CONFLICT (key) DO NOTHING;

COMMIT;
