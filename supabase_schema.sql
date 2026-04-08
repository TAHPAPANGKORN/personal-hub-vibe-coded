-- 1. Create a storage bucket for images (if not exists)
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gear_images', 'gear_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Clean up old non-functioning policies if they exist
DROP POLICY IF EXISTS "Public Read Access" ON storage.objects;
DROP POLICY IF EXISTS "Admin Upload Access" ON storage.objects;

-- Storage Policy: Allow public to read images
CREATE POLICY "Public Read Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'gear_images' );

-- Storage Policy: Allow authenticated users to upload images
CREATE POLICY "Admin Upload Access"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'gear_images' );


-- 2. Categories Table (Must be created first)
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on categories" ON categories FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage categories" ON categories FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default categories
INSERT INTO categories (name, sort_order) VALUES
('Keyboard', 1), ('Mouse', 2), ('Monitor', 3), ('Audio', 4)
ON CONFLICT (name) DO NOTHING;


-- 3. Gear Items Table (Linked to categories.name)
CREATE TABLE gear_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  -- Foreign Key pointing to categories.name with ON UPDATE CASCADE
  category TEXT NOT NULL REFERENCES categories(name) ON UPDATE CASCADE ON DELETE RESTRICT,
  model_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  image_url TEXT,
  affiliate_link TEXT,
  description TEXT,           -- Story behind the gear
  likes INTEGER DEFAULT 0,     -- Hype count
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access" ON gear_items FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage gear_items" ON gear_items FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Allow public to increment likes
CREATE POLICY "Allow public to update likes" ON gear_items FOR UPDATE USING (true) WITH CHECK (true);


-- 4. Games Table
CREATE TABLE games (
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


-- 5. PC Specs Table
CREATE TABLE pc_specs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  component_type TEXT NOT NULL, -- e.g., CPU, GPU, RAM, Motherboard
  name TEXT NOT NULL,           -- e.g., AMD Ryzen 9 7950X3D
  brand TEXT,
  specs_detail TEXT,            -- e.g., 16 Cores, 32 Threads, 5.7GHz
  image_url TEXT,
  description TEXT,            -- Story behind the part
  likes INTEGER DEFAULT 0,      -- Hype count
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE pc_specs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on pc_specs" ON pc_specs FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage pc_specs" ON pc_specs FOR ALL TO authenticated USING (true) WITH CHECK (true);
-- Allow public to increment likes
CREATE POLICY "Allow public to update likes on pc_specs" ON pc_specs FOR UPDATE USING (true) WITH CHECK (true);


-- 7. RPC Function for atomic increment (Recommended to run this in SQL Editor)
-- This avoids race conditions when multiple people click at once.
/*
CREATE OR REPLACE FUNCTION increment_hype(row_id uuid, table_name text)
RETURNS void AS $$
BEGIN
  IF table_name = 'gear_items' THEN
    UPDATE gear_items SET likes = likes + 1 WHERE id = row_id;
  ELSIF table_name = 'pc_specs' THEN
    UPDATE pc_specs SET likes = likes + 1 WHERE id = row_id;
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
*/


-- 6. Site Settings Table (Visibility Flags)
CREATE TABLE site_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  show_games BOOLEAN DEFAULT true,
  show_pc_specs BOOLEAN DEFAULT true,
  show_gear BOOLEAN DEFAULT true,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE site_settings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access on site_settings" ON site_settings FOR SELECT USING (true);
CREATE POLICY "Allow admin to manage site_settings" ON site_settings FOR ALL TO authenticated USING (true) WITH CHECK (true);

-- Insert default settings row
INSERT INTO site_settings (show_games, show_pc_specs, show_gear) 
VALUES (true, true, true);
