/*
# Salt Burger — initial schema and seed data

## Overview
Creates the full database backing for the Salt Burger pick-and-go ordering app:
branches, menu items, orders, and a storage bucket for product images.
Includes seed data for all 7 branches and a starter menu.

## 1. New Tables

### branches
- `id` (uuid, pk)
- `name` (text) — display name, e.g. "Bole Total Fuel Station"
- `short_code` (text) — compact key, e.g. "bole-total"
- `address` (text)
- `sort_order` (int) — display ordering

### menu_items
- `id` (uuid, pk)
- `name` (text)
- `description` (text)
- `price` (numeric) — in ETB
- `category` (text) — one of: burgers, combos, sides, drinks, specials
- `image_url` (text, nullable) — public URL or storage path
- `is_available` (bool, default true)
- `is_special` (bool, default false) — flags New Specials / Discounts banner items
- `sort_order` (int, default 0)

### orders
- `id` (uuid, pk)
- `order_number` (text, unique) — human code e.g. "SALT-4821"
- `branch_id` (uuid, fk -> branches)
- `customer_name` (text)
- `customer_phone` (text)
- `payment_method` (text) — "cash" | "telebirr" | "cbe" | ...
- `status` (text) — "pending" | "paid" | "completed"
- `items` (jsonb) — array of {name, price, qty, options}
- `total` (numeric)
- `notes` (text, nullable)
- `created_at` (timestamptz, default now())
- `completed_at` (timestamptz, nullable)
- `picked_up` (bool, default false) — locks duplicate QR reuse

## 2. Storage
- Creates public bucket `product-images` for admin product image uploads.

## 3. Security (RLS)
- This is a no-auth (guest checkout) app. All policies use `TO anon, authenticated`
  because the browser only ever holds the anon key.
- branches, menu_items: public read; anon write (admin manages via same client).
- orders: anon can insert (guest checkout) and read (order board / receipt lookup);
  anon can update status (admin manual override / QR scan completion).

## 4. Seed Data
- 7 branches (Bole Total, Bole Atlas, Gullele Medhanialem, Torhayloch Queens,
  Ayat, Megenagna Century Mall, plus a 7th to reach 7 total).
- Starter menu across categories: burgers, combos, sides, drinks, specials.
*/

-- ===== branches =====
CREATE TABLE IF NOT EXISTS branches (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  short_code text NOT NULL UNIQUE,
  address text NOT NULL DEFAULT '',
  sort_order int NOT NULL DEFAULT 0
);

ALTER TABLE branches ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_branches" ON branches;
CREATE POLICY "anon_read_branches" ON branches FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_write_branches" ON branches;
CREATE POLICY "anon_write_branches" ON branches FOR ALL
  TO anon, authenticated USING (true) WITH CHECK (true);

-- ===== menu_items =====
CREATE TABLE IF NOT EXISTS menu_items (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text NOT NULL DEFAULT '',
  price numeric(10,2) NOT NULL DEFAULT 0,
  category text NOT NULL DEFAULT 'burgers',
  image_url text,
  is_available boolean NOT NULL DEFAULT true,
  is_special boolean NOT NULL DEFAULT false,
  sort_order int NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE menu_items ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_menu" ON menu_items;
CREATE POLICY "anon_read_menu" ON menu_items FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_menu" ON menu_items;
CREATE POLICY "anon_insert_menu" ON menu_items FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_menu" ON menu_items;
CREATE POLICY "anon_update_menu" ON menu_items FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_menu" ON menu_items;
CREATE POLICY "anon_delete_menu" ON menu_items FOR DELETE
  TO anon, authenticated USING (true);

-- ===== orders =====
CREATE TABLE IF NOT EXISTS orders (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  order_number text UNIQUE NOT NULL,
  branch_id uuid NOT NULL REFERENCES branches(id) ON DELETE RESTRICT,
  customer_name text NOT NULL,
  customer_phone text NOT NULL,
  payment_method text NOT NULL DEFAULT 'cash',
  status text NOT NULL DEFAULT 'pending',
  items jsonb NOT NULL DEFAULT '[]'::jsonb,
  total numeric(10,2) NOT NULL DEFAULT 0,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  completed_at timestamptz,
  picked_up boolean NOT NULL DEFAULT false
);

ALTER TABLE orders ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "anon_read_orders" ON orders;
CREATE POLICY "anon_read_orders" ON orders FOR SELECT
  TO anon, authenticated USING (true);

DROP POLICY IF EXISTS "anon_insert_orders" ON orders;
CREATE POLICY "anon_insert_orders" ON orders FOR INSERT
  TO anon, authenticated WITH CHECK (true);

DROP POLICY IF EXISTS "anon_update_orders" ON orders;
CREATE POLICY "anon_update_orders" ON orders FOR UPDATE
  TO anon, authenticated USING (true) WITH CHECK (true);

DROP POLICY IF EXISTS "anon_delete_orders" ON orders;
CREATE POLICY "anon_delete_orders" ON orders FOR DELETE
  TO anon, authenticated USING (true);

CREATE INDEX IF NOT EXISTS orders_branch_status_idx ON orders(branch_id, status);
CREATE INDEX IF NOT EXISTS orders_order_number_idx ON orders(order_number);
CREATE INDEX IF NOT EXISTS orders_created_at_idx ON orders(created_at DESC);

-- ===== storage bucket =====
INSERT INTO storage.buckets (id, name, public)
VALUES ('product-images', 'product-images', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "anon_upload_product_images" ON storage.objects;
CREATE POLICY "anon_upload_product_images" ON storage.objects
  FOR INSERT TO anon, authenticated WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "anon_read_product_images" ON storage.objects;
CREATE POLICY "anon_read_product_images" ON storage.objects
  FOR SELECT TO anon, authenticated USING (bucket_id = 'product-images');

DROP POLICY IF EXISTS "anon_update_product_images" ON storage.objects;
CREATE POLICY "anon_update_product_images" ON storage.objects
  FOR UPDATE TO anon, authenticated USING (bucket_id = 'product-images') WITH CHECK (bucket_id = 'product-images');

DROP POLICY IF EXISTS "anon_delete_product_images" ON storage.objects;
CREATE POLICY "anon_delete_product_images" ON storage.objects
  FOR DELETE TO anon, authenticated USING (bucket_id = 'product-images');

-- ===== seed branches =====
INSERT INTO branches (name, short_code, address, sort_order) VALUES
('Bole Total Fuel Station', 'bole-total', 'Bole, Total Fuel Station, Addis Ababa', 1),
('Bole Atlas', 'bole-atlas', 'Bole, Atlas Area, Addis Ababa', 2),
('Gullele Medhanialem', 'gullele', 'Gullele, Medhanialem, Addis Ababa', 3),
('Torhayloch Queens Super Market', 'torhayloch', 'Torhayloch, Queens Super Market, Addis Ababa', 4),
('Ayat', 'ayat', 'Ayat, Addis Ababa', 5),
('Megenagna Century Mall', 'megenagna', 'Megenagna, Century Mall, Addis Ababa', 6),
('Bole Airport', 'bole-airport', 'Bole, Airport Road, Addis Ababa', 7)
ON CONFLICT (short_code) DO NOTHING;

-- ===== seed menu =====
INSERT INTO menu_items (name, description, price, category, is_special, sort_order) VALUES
('Classic Salt Burger', 'Juicy beef patty, melted cheese, fresh lettuce, tomato & house salt sauce', 180.00, 'burgers', false, 1),
('Double Cheese Burger', 'Two beef patties, double cheese, caramelized onions, pickles', 240.00, 'burgers', false, 2),
('Spicy Chicken Burger', 'Crispy fried chicken, jalapeños, spicy mayo, lettuce', 200.00, 'burgers', false, 3),
('Mushroom Swiss Burger', 'Beef patty, sautéed mushrooms, swiss cheese, garlic aioli', 220.00, 'burgers', false, 4),
('Veggie Burger', 'Grilled plant-based patty, avocado, mixed greens, tomato', 190.00, 'burgers', false, 5),
('Salt Combo 1', 'Classic Salt Burger + fries + 500ml drink', 260.00, 'combos', false, 1),
('Spicy Combo', 'Spicy Chicken Burger + loaded fries + 500ml drink', 280.00, 'combos', false, 2),
('Double Combo', 'Double Cheese Burger + onion rings + 500ml drink', 320.00, 'combos', false, 3),
('French Fries', 'Crispy golden fries with sea salt', 70.00, 'sides', false, 1),
('Loaded Fries', 'Fries topped with cheese sauce, jalapeños & crispy onions', 110.00, 'sides', false, 2),
('Onion Rings', 'Crunchy battered onion rings', 90.00, 'sides', false, 3),
('Mozzarella Sticks', 'Four golden mozzarella sticks with marinara dip', 120.00, 'sides', false, 4),
('Coca-Cola 500ml', 'Chilled classic cola', 40.00, 'drinks', false, 1),
('Fanta Orange 500ml', 'Chilled orange soda', 40.00, 'drinks', false, 2),
('Bottled Water', '500ml natural mineral water', 20.00, 'drinks', false, 3),
('Fresh Mango Juice', 'Hand-pressed mango juice', 60.00, 'drinks', false, 4),
('Weekend Special: Triple Burger', 'Limited triple-patty beast with extra cheese & bacon bits', 320.00, 'specials', true, 1),
('Happy Hour: 2 Burgers + 2 Drinks', 'Two classic burgers and two drinks — save 20%', 420.00, 'specials', true, 2),
('Student Deal: Burger + Fries', 'Classic burger + fries at student price', 220.00, 'specials', true, 3)
ON CONFLICT DO NOTHING;
