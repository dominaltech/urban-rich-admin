-- ==============================================================================
-- 14_offer_banner_table.sql
-- Creates dynamic festive offer banner table for homepage promotional combos
-- (Supports Diwali, Eid, Christmas, Black Friday, and Royal color themes)
-- ==============================================================================

CREATE TABLE IF NOT EXISTS public.offer_banners (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  title VARCHAR(255) NOT NULL DEFAULT 'Diwali Special Offer',
  badge_tag VARCHAR(100) DEFAULT '✨ FESTIVE MEGA COMBO',
  theme VARCHAR(50) NOT NULL DEFAULT 'diwali',
  items JSONB NOT NULL DEFAULT '[]'::jsonb,
  contact_number VARCHAR(30) DEFAULT '8484943585',
  show_contact BOOLEAN DEFAULT true,
  is_active BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Row Level Security
ALTER TABLE public.offer_banners ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Public Read Offer Banners" ON public.offer_banners;
CREATE POLICY "Public Read Offer Banners" ON public.offer_banners 
  FOR SELECT USING (true);

DROP POLICY IF EXISTS "Public All Offer Banners" ON public.offer_banners;
CREATE POLICY "Public All Offer Banners" ON public.offer_banners 
  FOR ALL USING (true) WITH CHECK (true);

-- Permissions
GRANT ALL ON TABLE public.offer_banners TO anon, authenticated, service_role;

-- Seed Default Diwali Festive Deal (Configurable via Admin Panel)
INSERT INTO public.offer_banners (
  title, 
  badge_tag, 
  theme, 
  items, 
  contact_number, 
  show_contact, 
  is_active
) VALUES (
  'Diwali Special Offer',
  '✨ DIWALI MEGA DEALS',
  'diwali',
  '[
    {"name": "Oversized T-Shirt", "price": "999", "qty": "3 Pic"},
    {"name": "Denim Shirt", "price": "1200", "qty": "2 Pic"},
    {"name": "Linen Trouser Pant", "price": "1499", "qty": "2 Pic"},
    {"name": "Linen Shirt", "price": "1200", "qty": "2 Pic"}
  ]'::jsonb,
  '8484943585',
  true,
  false
)
ON CONFLICT DO NOTHING;
