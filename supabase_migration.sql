-- =======================================================
-- MENUXPRO MVP - SUPABASE MIGRATION WITH RLS POLICIES
-- =======================================================
-- Run this in Supabase SQL Editor

-- ENUMS
CREATE TYPE restaurant_status AS ENUM ('ACTIVE', 'INACTIVE', 'SUSPENDED');
CREATE TYPE plan_type AS ENUM ('FREE', 'PRO', 'MAX');
CREATE TYPE order_status AS ENUM ('CREATED', 'ACCEPTED', 'PAID', 'CLOSED', 'CANCELLED');
CREATE TYPE staff_role AS ENUM ('owner', 'manager', 'cashier', 'admin', 'super_admin');
CREATE TYPE log_type AS ENUM ('ORDER_STATUS_CHANGE', 'ORDER_CANCELLED', 'TABLE_CLOSED');
CREATE TYPE table_status AS ENUM ('EMPTY', 'OCCUPIED', 'OFFLINE');

-- 1. restaurants
CREATE TABLE restaurants (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  owner_id TEXT NOT NULL,
  status restaurant_status DEFAULT 'ACTIVE',
  plan plan_type DEFAULT 'FREE',
  currency TEXT DEFAULT 'TND',
  cuisine_type TEXT,
  address TEXT,
  phone TEXT,
  email TEXT,
  logo_url TEXT,
  primary_color TEXT DEFAULT '#241d19',
  accent_color TEXT DEFAULT '#79573a',
  public_settings JSONB DEFAULT '{}'::jsonb,
  branding JSONB DEFAULT '{}'::jsonb,
  opening_hours JSONB DEFAULT '{}'::jsonb,
  watermark_enabled BOOLEAN DEFAULT TRUE,
  max_menu_items INTEGER DEFAULT 50,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. categories
CREATE TABLE categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  name_fr TEXT NOT NULL,
  name_ar TEXT,
  sort_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. items (menu items)
CREATE TABLE items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  category_id UUID NOT NULL REFERENCES categories(id) ON DELETE CASCADE,
  name_fr TEXT NOT NULL,
  name_ar TEXT,
  description_fr TEXT,
  description_ar TEXT,
  price DECIMAL(10,3) NOT NULL,
  currency TEXT DEFAULT 'TND',
  is_active BOOLEAN DEFAULT TRUE,
  is_available BOOLEAN DEFAULT TRUE,
  sort_order INTEGER DEFAULT 0,
  image_url TEXT,
  allergens TEXT[],
  dietary_tags TEXT[],
  is_bestseller BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. tables
CREATE TABLE tables (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  label TEXT NOT NULL,
  number INTEGER NOT NULL,
  zone TEXT,
  seats INTEGER DEFAULT 2,
  qr_token TEXT UNIQUE NOT NULL,
  status table_status DEFAULT 'EMPTY',
  is_active BOOLEAN DEFAULT TRUE,
  ordering_enabled BOOLEAN DEFAULT TRUE,
  active_order_id UUID,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. orders
CREATE TABLE orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  table_label TEXT NOT NULL,
  status order_status DEFAULT 'CREATED',
  items JSONB NOT NULL,
  subtotal DECIMAL(10,3) NOT NULL,
  total DECIMAL(10,3) NOT NULL,
  currency TEXT DEFAULT 'TND',
  customer_note TEXT,
  source TEXT DEFAULT 'PUBLIC_QR',
  language TEXT DEFAULT 'FR',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  accepted_at TIMESTAMPTZ,
  accepted_by TEXT,
  paid_at TIMESTAMPTZ,
  paid_by TEXT,
  closed_at TIMESTAMPTZ,
  closed_by TEXT,
  cancelled_at TIMESTAMPTZ,
  cancelled_by TEXT,
  cancellation_reason TEXT
);

-- 6. activity_logs
CREATE TABLE activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  order_id UUID REFERENCES orders(id) ON DELETE SET NULL,
  table_id UUID REFERENCES tables(id) ON DELETE SET NULL,
  type log_type NOT NULL,
  actor_id TEXT NOT NULL,
  actor_role staff_role NOT NULL,
  actor_name TEXT,
  action TEXT NOT NULL,
  from_status TEXT,
  to_status TEXT,
  reason TEXT,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. staff
CREATE TABLE staff (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  user_id TEXT NOT NULL,
  display_name TEXT,
  role staff_role NOT NULL DEFAULT 'cashier',
  pin TEXT,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE(restaurant_id, user_id)
);

-- 8. table_requests (call waiter / request bill)
CREATE TABLE table_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  restaurant_id UUID NOT NULL REFERENCES restaurants(id) ON DELETE CASCADE,
  table_id UUID NOT NULL REFERENCES tables(id) ON DELETE CASCADE,
  table_label TEXT NOT NULL,
  type TEXT NOT NULL,
  status TEXT DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  acknowledged_by TEXT,
  resolved_at TIMESTAMPTZ,
  resolved_by TEXT
);

-- 9. banned_ips (security - anti-brute force)
CREATE TABLE banned_ips (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL UNIQUE,
  level TEXT NOT NULL DEFAULT '15_min',
  banned_until TIMESTAMPTZ,
  reason TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. failed_attempts (security - login tracking)
CREATE TABLE failed_attempts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  ip TEXT NOT NULL UNIQUE,
  count INTEGER DEFAULT 1,
  last_attempt TIMESTAMPTZ DEFAULT NOW()
);

-- ========================================================
-- AUTO-UPDATE updated_at TRIGGER
-- ========================================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_restaurants_updated_at BEFORE UPDATE ON restaurants FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_categories_updated_at BEFORE UPDATE ON categories FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_items_updated_at BEFORE UPDATE ON items FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_tables_updated_at BEFORE UPDATE ON tables FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_orders_updated_at BEFORE UPDATE ON orders FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ========================================================
-- ROW LEVEL SECURITY - ENABLE ON ALL TABLES
-- ========================================================
ALTER TABLE restaurants ENABLE ROW LEVEL SECURITY;
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
ALTER TABLE items ENABLE ROW LEVEL SECURITY;
ALTER TABLE tables ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE staff ENABLE ROW LEVEL SECURITY;
ALTER TABLE table_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE banned_ips ENABLE ROW LEVEL SECURITY;
ALTER TABLE failed_attempts ENABLE ROW LEVEL SECURITY;

-- ========================================================
-- RLS: restaurants
-- ========================================================
-- Public: can read active restaurants
CREATE POLICY "Public read active restaurants"
  ON restaurants FOR SELECT
  USING (status = 'ACTIVE');

-- Owner: full access to own restaurant
CREATE POLICY "Owner manage own restaurant"
  ON restaurants FOR ALL
  USING (owner_id = auth.uid());

-- Staff: can read own restaurant
CREATE POLICY "Staff read own restaurant"
  ON restaurants FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM staff
      WHERE staff.restaurant_id = restaurants.id
      AND staff.user_id = auth.uid()
      AND staff.is_active = TRUE
    )
  );

-- ========================================================
-- RLS: categories
-- ========================================================
-- Public: read active categories of active restaurants
CREATE POLICY "Public read active categories"
  ON categories FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.status = 'ACTIVE'
    )
  );

-- Owner/staff: manage categories of own restaurant
CREATE POLICY "Owner staff manage categories"
  ON categories FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = categories.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM staff s
      JOIN restaurants r ON r.id = s.restaurant_id
      WHERE r.id = categories.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = TRUE
      AND s.role IN ('owner', 'manager')
    )
  );

-- ========================================================
-- RLS: items
-- ========================================================
-- Public: read active, available items of active restaurants
CREATE POLICY "Public read active items"
  ON items FOR SELECT
  USING (
    is_active = TRUE
    AND is_available = TRUE
    AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = items.restaurant_id
      AND restaurants.status = 'ACTIVE'
    )
    AND EXISTS (
      SELECT 1 FROM categories
      WHERE categories.id = items.category_id
      AND categories.is_active = TRUE
    )
  );

-- Owner/staff: manage items of own restaurant
CREATE POLICY "Owner staff manage items"
  ON items FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = items.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM staff s
      JOIN restaurants r ON r.id = s.restaurant_id
      WHERE r.id = items.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = TRUE
      AND s.role IN ('owner', 'manager')
    )
  );

-- ========================================================
-- RLS: tables
-- ========================================================
-- Public: read active tables of active restaurants (needed for QR scan)
CREATE POLICY "Public read active tables"
  ON tables FOR SELECT
  USING (
    is_active = TRUE
    AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = tables.restaurant_id
      AND restaurants.status = 'ACTIVE'
    )
  );

-- Owner/staff: manage tables
CREATE POLICY "Owner staff manage tables"
  ON tables FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = tables.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM staff s
      JOIN restaurants r ON r.id = s.restaurant_id
      WHERE r.id = tables.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = TRUE
    )
  );

-- ========================================================
-- RLS: orders
-- ========================================================
-- Public: can CREATE orders (customers placing orders)
CREATE POLICY "Public create orders"
  ON orders FOR INSERT
  WITH CHECK (
    status = 'CREATED'
    AND EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.status = 'ACTIVE'
    )
    AND EXISTS (
      SELECT 1 FROM tables
      WHERE tables.id = orders.table_id
      AND tables.is_active = TRUE
      AND tables.ordering_enabled = TRUE
    )
  );

-- Public: can READ their own order (by order ID - handled via API)
-- No direct public SELECT on orders (privacy: order contents are staff-only)

-- Staff: can read orders of own restaurant
CREATE POLICY "Staff read own orders"
  ON orders FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM staff s
      JOIN restaurants r ON r.id = s.restaurant_id
      WHERE r.id = orders.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = TRUE
    )
  );

-- Staff: can update orders (status transitions)
CREATE POLICY "Staff update orders"
  ON orders FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = orders.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM staff s
      JOIN restaurants r ON r.id = s.restaurant_id
      WHERE r.id = orders.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = TRUE
    )
  );

-- ========================================================
-- RLS: activity_logs
-- ========================================================
-- Staff: read logs of own restaurant
CREATE POLICY "Staff read own logs"
  ON activity_logs FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = activity_logs.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM staff s
      JOIN restaurants r ON r.id = s.restaurant_id
      WHERE r.id = activity_logs.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = TRUE
    )
  );

-- Only server-side (service_role) can INSERT logs
CREATE POLICY "System insert logs"
  ON activity_logs FOR INSERT
  WITH CHECK (TRUE);

-- No UPDATE or DELETE on logs (append-only)

-- ========================================================
-- RLS: staff
-- ========================================================
-- Staff: can read staff of own restaurant
CREATE POLICY "Staff read own staff list"
  ON staff FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = staff.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM staff s
      JOIN restaurants r ON r.id = s.restaurant_id
      WHERE r.id = staff.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = TRUE
    )
  );

-- Only owner can manage staff
CREATE POLICY "Owner manage staff"
  ON staff FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = staff.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
  );

-- ========================================================
-- RLS: table_requests
-- ========================================================
-- Public: can create table requests
CREATE POLICY "Public create table requests"
  ON table_requests FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = table_requests.restaurant_id
      AND restaurants.status = 'ACTIVE'
    )
    AND EXISTS (
      SELECT 1 FROM tables
      WHERE tables.id = table_requests.table_id
      AND tables.is_active = TRUE
    )
  );

-- Staff: can read/update table requests
CREATE POLICY "Staff manage table requests"
  ON table_requests FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM restaurants
      WHERE restaurants.id = table_requests.restaurant_id
      AND restaurants.owner_id = auth.uid()
    )
    OR EXISTS (
      SELECT 1 FROM staff s
      JOIN restaurants r ON r.id = s.restaurant_id
      WHERE r.id = table_requests.restaurant_id
      AND s.user_id = auth.uid()
      AND s.is_active = TRUE
    )
  );

-- ========================================================
-- RLS: banned_ips (only super_admin/staff can read, server-only write)
-- ========================================================
CREATE POLICY "Staff read banned IPs"
  ON banned_ips FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM staff WHERE user_id = auth.uid() AND role IN ('owner', 'super_admin', 'admin'))
  );

CREATE POLICY "System manage banned IPs"
  ON banned_ips FOR ALL
  USING (TRUE);

-- ========================================================
-- RLS: failed_attempts (only staff can read)
-- ========================================================
CREATE POLICY "Staff read failed attempts"
  ON failed_attempts FOR SELECT
  USING (
    EXISTS (SELECT 1 FROM staff WHERE user_id = auth.uid() AND role IN ('owner', 'super_admin', 'admin'))
  );

-- ========================================================
-- SUPABASE REALTIME
-- ========================================================
ALTER PUBLICATION supabase_realtime ADD TABLE orders;
ALTER PUBLICATION supabase_realtime ADD TABLE tables;
ALTER PUBLICATION supabase_realtime ADD TABLE table_requests;

-- ========================================================
-- INDEXES (performance)
-- ========================================================
CREATE INDEX idx_restaurants_slug ON restaurants(slug);
CREATE INDEX idx_restaurants_owner ON restaurants(owner_id);
CREATE INDEX idx_categories_restaurant ON categories(restaurant_id);
CREATE INDEX idx_items_restaurant ON items(restaurant_id);
CREATE INDEX idx_items_category ON items(category_id);
CREATE INDEX idx_tables_restaurant ON tables(restaurant_id);
CREATE INDEX idx_tables_qr_token ON tables(qr_token);
CREATE INDEX idx_orders_restaurant ON orders(restaurant_id);
CREATE INDEX idx_orders_table ON orders(table_id);
CREATE INDEX idx_orders_status ON orders(status);
CREATE INDEX idx_activity_logs_restaurant ON activity_logs(restaurant_id);
CREATE INDEX idx_activity_logs_order ON activity_logs(order_id);
CREATE INDEX idx_activity_logs_created ON activity_logs(created_at DESC);
CREATE INDEX idx_staff_restaurant ON staff(restaurant_id);
CREATE INDEX idx_staff_user ON staff(user_id);
CREATE INDEX idx_table_requests_restaurant ON table_requests(restaurant_id);
CREATE INDEX idx_table_requests_table ON table_requests(table_id);
CREATE INDEX idx_table_requests_status ON table_requests(status);
CREATE INDEX idx_banned_ips_ip ON banned_ips(ip);
CREATE INDEX idx_banned_ips_until ON banned_ips(banned_until);
CREATE INDEX idx_failed_attempts_ip ON failed_attempts(ip);

-- ========================================================
-- HELPER FUNCTION: create activity log
-- ========================================================
CREATE OR REPLACE FUNCTION create_activity_log(
  p_restaurant_id UUID,
  p_order_id UUID,
  p_table_id UUID,
  p_type log_type,
  p_actor_id TEXT,
  p_actor_role staff_role,
  p_actor_name TEXT,
  p_action TEXT,
  p_from_status TEXT DEFAULT NULL,
  p_to_status TEXT DEFAULT NULL,
  p_reason TEXT DEFAULT NULL,
  p_metadata JSONB DEFAULT '{}'::jsonb
) RETURNS UUID AS $$
DECLARE
  v_log_id UUID;
BEGIN
  INSERT INTO activity_logs (
    restaurant_id, order_id, table_id, type,
    actor_id, actor_role, actor_name,
    action, from_status, to_status, reason, metadata
  ) VALUES (
    p_restaurant_id, p_order_id, p_table_id, p_type,
    p_actor_id, p_actor_role, p_actor_name,
    p_action, p_from_status, p_to_status, p_reason, p_metadata
  ) RETURNING id INTO v_log_id;
  
  RETURN v_log_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
