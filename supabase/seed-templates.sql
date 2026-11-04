-- Seed event_templates (9 template) — jalankan di Supabase SQL Editor.
-- Kebutuhan teknis: Template & Publikasi menyimpan UUID pada events.template_id (FK),
-- sementara registry invitation-engine beralamat dengan slug.
-- (Bukan pengubahan struktur; hanya data awal sesuai schema.sql yang ada.)

INSERT INTO event_templates (name, slug, category, preview_image, active) VALUES
  ('Heritage Aruna', 'heritage-aruna', 'heritage', '/templates/heritage-aruna/screenshots/thumb.jpg', true),
  ('Heritage Sandhayu', 'heritage-sandhayu', 'heritage', '/templates/heritage-sandhayu/screenshots/thumb.jpg', true),
  ('Heritage Utary', 'heritage-utary', 'heritage', '/templates/heritage-utary/screenshots/thumb.jpg', true),
  ('Premium 01', 'premium-01', 'premium', '/templates/premium-01/screenshots/thumb.jpg', true),
  ('Premium 02', 'premium-02', 'premium', '/templates/premium-02/screenshots/thumb.jpg', true),
  ('Premium Danila', 'premium-danila', 'premium', '/templates/premium-danila/screenshots/thumb.jpg', true),
  ('Premium Flara', 'premium-flara', 'premium', '/templates/premium-flara/screenshots/thumb.jpg', true),
  ('Premium Ivanna', 'premium-ivanna', 'premium', '/templates/premium-ivanna/screenshots/thumb.jpg', true),
  ('Premium Kila', 'premium-kila', 'premium', '/templates/premium-kila/screenshots/thumb.jpg', true)
ON CONFLICT (slug) DO NOTHING;
