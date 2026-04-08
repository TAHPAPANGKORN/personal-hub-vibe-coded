-- ==========================================
-- DESK SETUP DASHBOARD: CONSOLIDATED SCHEMA
-- Version: 2.0 (Hotspot Pro + Visual Toggles + Enhanced Comments)
-- ==========================================

-- 1. STORAGE SETUP (Optional: ensure buckets exist)
-- INSERT INTO storage.buckets (id, name, public) VALUES ('gear_images', 'gear_images', true) ON CONFLICT (id) DO NOTHING;

-- 2. CATEGORIES TABLE
CREATE TABLE IF NOT EXISTS categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 3. GEAR ITEMS TABLE
CREATE TABLE IF NOT EXISTS gear_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL REFERENCES categories(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  model_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  image_url TEXT,
  affiliate_link TEXT,
  description TEXT,
  likes INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on gear_items" ON gear_items FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage gear_items" ON gear_items FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 4. GAMES TABLE
CREATE TABLE IF NOT EXISTS games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rank TEXT,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE games ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on games" ON games FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage games" ON games FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 5. PC SPECS TABLE
CREATE TABLE IF NOT EXISTS pc_specs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_type TEXT NOT NULL,
  name TEXT NOT NULL,
  brand TEXT,
  specs_detail TEXT,
  image_url TEXT,
  description TEXT,
  likes INTEGER DEFAULT 0,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pc_specs ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on pc_specs" ON pc_specs FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage pc_specs" ON pc_specs FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 6. SITE SETTINGS TABLE (Master Toggles + Profile)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Visibility toggles
  show_games BOOLEAN DEFAULT true,
  show_pc_specs BOOLEAN DEFAULT true,
  show_gear BOOLEAN DEFAULT true,
  show_floating_comments BOOLEAN DEFAULT true,
  show_comment_input BOOLEAN DEFAULT true,
  show_setup_visual BOOLEAN DEFAULT true,
  enable_gps BOOLEAN DEFAULT true,
  -- Profile fields
  profile_title TEXT DEFAULT 'My Personal Setup',
  profile_description TEXT DEFAULT 'A curated visual showcase of the tactical hardware...',
  profile_image_url TEXT DEFAULT NULL,
  social_youtube TEXT DEFAULT NULL,
  social_twitch TEXT DEFAULT NULL,
  social_twitter TEXT DEFAULT NULL,
  social_instagram TEXT DEFAULT NULL,
  social_website TEXT DEFAULT NULL,
  setup_main_image_url TEXT DEFAULT NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage site_settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Ensure default settings exist
INSERT INTO site_settings (id) 
VALUES ('00000000-0000-0000-0000-000000000001') 
ON CONFLICT (id) DO NOTHING;

-- 7. COMMENTS TABLE
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  author_name TEXT DEFAULT 'Anonymous',
  x_pos INTEGER DEFAULT 50,
  y_pos INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public to read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow public to post comments" ON comments FOR INSERT WITH CHECK (char_length(content) <= 100);
CREATE POLICY "Allow admin to manage comments" ON comments FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 8. HOTSPOTS TABLE
CREATE TABLE IF NOT EXISTS hotspots (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  gear_id UUID REFERENCES gear_items(id) ON DELETE CASCADE,
  pc_id UUID REFERENCES pc_specs(id) ON DELETE CASCADE,
  x_percent FLOAT NOT NULL,
  y_percent FLOAT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  CONSTRAINT one_target_only CHECK (
    (gear_id IS NOT NULL AND pc_id IS NULL) OR 
    (gear_id IS NULL AND pc_id IS NOT NULL)
  )
);

ALTER TABLE hotspots ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on hotspots" ON hotspots FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage hotspots" ON hotspots FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- 9. SECURITY FUNCTIONS (Atomic Increment)
CREATE OR REPLACE FUNCTION increment_hype(row_id uuid, table_name text)
RETURNS void AS $$
BEGIN
  IF table_name = 'gear_items' THEN
    UPDATE gear_items SET likes = COALESCE(likes, 0) + 1 WHERE id = row_id;
  ELSIF table_name = 'pc_specs' THEN
    UPDATE pc_specs SET likes = COALESCE(likes, 0) + 1 WHERE id = row_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

GRANT EXECUTE ON FUNCTION increment_hype(uuid, text) TO anon, authenticated;

-- 10. REALTIME CONFIGURATION
-- Run these in the Supabase SQL editor to enable real-time features:
-- ALTER PUBLICATION supabase_realtime ADD TABLE gear_items, pc_specs, site_settings, comments, hotspots;
