-- Create gear_items table
CREATE TABLE gear_items (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  category TEXT NOT NULL,
  model_name TEXT NOT NULL,
  brand TEXT NOT NULL,
  image_url TEXT,
  affiliate_link TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE gear_items ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view gear_items
CREATE POLICY "Allow public read access"
  ON gear_items
  FOR SELECT
  USING (true);

-- Policy: Only authenticated users (Admin) can insert/update/delete
CREATE POLICY "Allow admin to manage gear_items"
  ON gear_items
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Create a storage bucket for images
INSERT INTO storage.buckets (id, name, public) 
VALUES ('gear_images', 'gear_images', true)
ON CONFLICT (id) DO NOTHING;

-- Storage Policy: Allow public to read images
CREATE POLICY "Public Read Access"
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'gear_images' );

-- Storage Policy: Allow authenticated users to upload images
CREATE POLICY "Admin Upload Access"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'gear_images' );

-- Create categories table
CREATE TABLE categories (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for categories
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view categories
CREATE POLICY "Allow public read access on categories"
  ON categories
  FOR SELECT
  USING (true);

-- Policy: Only Admin can manage categories
CREATE POLICY "Allow admin to manage categories"
  ON categories
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- Insert some default categories
INSERT INTO categories (name, sort_order) VALUES
('Keyboard', 1),
('Mouse', 2),
('Monitor', 3),
('Audio', 4)
ON CONFLICT (name) DO NOTHING;

-- Create games table
CREATE TABLE games (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  rank TEXT NOT NULL,
  image_url TEXT,
  sort_order INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS for games
ALTER TABLE games ENABLE ROW LEVEL SECURITY;

-- Policy: Everyone can view games
CREATE POLICY "Allow public read access on games"
  ON games
  FOR SELECT
  USING (true);

-- Policy: Only Admin can manage games
CREATE POLICY "Allow admin to manage games"
  ON games
  FOR ALL
  TO authenticated
  USING (true)
  WITH CHECK (true);
