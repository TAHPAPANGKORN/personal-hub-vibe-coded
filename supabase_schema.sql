-- ==========================================
-- DESK SETUP DASHBOARD: CONSOLIDATED SCHEMA
-- Version: Latest (Hardened Security + GPS + Master Controls)
-- ==========================================

-- 1. STORAGE SETUP
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gear_images', 'gear_images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;

CREATE POLICY "Public Read Access" ON storage.objects FOR SELECT USING ( bucket_id = 'gear_images' );
CREATE POLICY "Admin Upload Access" ON storage.objects FOR INSERT TO authenticated WITH CHECK ( bucket_id = 'gear_images' );


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

INSERT INTO categories (name, sort_order) VALUES
('Keyboard', 1), ('Mouse', 2), ('Monitor', 3), ('Audio', 4)
ON CONFLICT (name) DO NOTHING;


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
CREATE POLICY "Allow public read access" ON gear_items FOR SELECT USING (true);
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


-- 6. SITE SETTINGS TABLE (Master Toggles)
CREATE TABLE IF NOT EXISTS site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  show_games BOOLEAN DEFAULT true,
  show_pc_specs BOOLEAN DEFAULT true,
  show_gear BOOLEAN DEFAULT true,
  show_floating_comments BOOLEAN DEFAULT true,
  show_comment_input BOOLEAN DEFAULT true,
  enable_gps BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public read access on site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage site_settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

INSERT INTO site_settings (id, show_games, show_pc_specs, show_gear, show_floating_comments, show_comment_input, enable_gps) 
VALUES ('00000000-0000-0000-0000-000000000001', true, true, true, true, true, true)
ON CONFLICT (id) DO NOTHING;


-- 7. COMMENTS TABLE (Enhanced tracking)
CREATE TABLE IF NOT EXISTS comments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  content TEXT NOT NULL,
  user_name TEXT DEFAULT 'Vibe Visitor',
  color TEXT DEFAULT '#A855F7',
  device_info TEXT,
  location TEXT DEFAULT 'Unknown',
  latitude TEXT,
  longitude TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE comments ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Allow public to read comments" ON comments FOR SELECT USING (true);
CREATE POLICY "Allow public to post comments" ON comments FOR INSERT WITH CHECK (char_length(content) <= 100);
CREATE POLICY "Allow admin to manage comments" ON comments FOR ALL TO authenticated USING (true) WITH CHECK (true);


-- 8. SECURITY FUNCTIONS (Atomic Increment)
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


-- 9. REALTIME CONFIGURATION
-- Force replica identity for full real-time payload updates
ALTER TABLE gear_items REPLICA IDENTITY FULL;
ALTER TABLE pc_specs REPLICA IDENTITY FULL;
ALTER TABLE site_settings REPLICA IDENTITY FULL;
ALTER TABLE comments REPLICA IDENTITY FULL;

-- Ensure all tables are in the publication
-- Use try-catch style via SQL editor if possible, or run manually:
-- ALTER PUBLICATION supabase_realtime ADD TABLE gear_items, pc_specs, site_settings, comments;
