-- ==========================================
-- NZ Tea Business Database Schema
-- ==========================================

-- 1. Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 2. Products Table
CREATE TABLE IF NOT EXISTS public.products (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    description TEXT,
    price NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    category TEXT NOT NULL CHECK (category IN ('Green', 'Black', 'Herbal', 'Oolong', 'Matcha', 'Other', 'Premium')),
    image_url TEXT,
    sizes TEXT[] DEFAULT '{}'
);

-- 3. Customers Table
CREATE TABLE IF NOT EXISTS public.customers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    name TEXT NOT NULL,
    email TEXT UNIQUE NOT NULL,
    phone TEXT,
    address TEXT
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    customer_id UUID REFERENCES public.customers(id) ON DELETE SET NULL,
    total_amount NUMERIC(10, 2) NOT NULL DEFAULT 0.00,
    paid_amount NUMERIC(10, 2) DEFAULT 0.00,
    payment_type TEXT DEFAULT 'Full' CHECK (payment_type IN ('Full', 'Partial')),
    status TEXT DEFAULT 'Pending' CHECK (status IN ('Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled')),
    payment_status TEXT DEFAULT 'Unpaid' CHECK (payment_status IN ('Unpaid', 'Paid', 'Refunded'))
);

-- 5. Order Items Table
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    product_id UUID REFERENCES public.products(id) ON DELETE RESTRICT,
    quantity INTEGER NOT NULL CHECK (quantity > 0),
    unit_price NUMERIC(10, 2) NOT NULL,
    size TEXT
);

-- 6. Inventory Logs (for tracking stock changes)
CREATE TABLE IF NOT EXISTS public.inventory_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    product_id UUID REFERENCES public.products(id) ON DELETE CASCADE,
    change_amount INTEGER NOT NULL,
    reason TEXT NOT NULL
);

-- ==========================================
-- RPC Function to decrement inventory
-- ==========================================
CREATE OR REPLACE FUNCTION public.decrement_inventory(p_id UUID, qnty INTEGER)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    UPDATE public.products
    SET stock_count = stock_count - qnty,
        in_stock = (stock_count - qnty) > 0,
        updated_at = NOW()
    WHERE id = p_id AND stock_count >= qnty;
END;
$$;

-- ==========================================
-- RLS (Row Level Security) Policies
-- ==========================================

-- Enable RLS for all tables
ALTER TABLE public.products ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.inventory_logs ENABLE ROW LEVEL SECURITY;

-- Products: public read access
DROP POLICY IF EXISTS "Public read access for products" ON public.products;
CREATE POLICY "Public read access for products" ON public.products
    FOR SELECT USING (true);

-- Products: authenticated users can modify
DROP POLICY IF EXISTS "Auth users modify products" ON public.products;
CREATE POLICY "Auth users modify products" ON public.products
    FOR ALL USING (true);

-- Customers: public insert, authenticated read
DROP POLICY IF EXISTS "Public insert customers" ON public.customers;
CREATE POLICY "Public insert customers" ON public.customers
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Auth read customers" ON public.customers;
CREATE POLICY "Auth read customers" ON public.customers
    FOR SELECT USING (true);

-- Orders: public insert, authenticated full access
DROP POLICY IF EXISTS "Public insert orders" ON public.orders;
CREATE POLICY "Public insert orders" ON public.orders
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Auth orders access" ON public.orders;
CREATE POLICY "Auth orders access" ON public.orders
    FOR ALL USING (true);

-- Order items: public insert, authenticated access
DROP POLICY IF EXISTS "Public insert order_items" ON public.order_items;
CREATE POLICY "Public insert order_items" ON public.order_items
    FOR INSERT WITH CHECK (true);

DROP POLICY IF EXISTS "Auth order_items access" ON public.order_items;
CREATE POLICY "Auth order_items access" ON public.order_items
    FOR ALL USING (true);

-- Inventory logs: authenticated only
DROP POLICY IF EXISTS "Auth inventory logs" ON public.inventory_logs;
CREATE POLICY "Auth inventory logs" ON public.inventory_logs
    FOR ALL USING (true);

-- ==========================================
-- Sample Data Seed (run only if table empty)
-- ==========================================
INSERT INTO public.products (name, description, price, category, stock_count, in_stock)
SELECT * FROM (VALUES 
    ('Saffron Gold Blend', 'Organic Black Tea with premium saffron strands for a luxurious golden cup', 28.00, 'Black', 50, true),
    ('Desert Mint', 'Fresh spearmint leaves from the High Atlas mountains', 24.00, 'Green', 100, true),
    ('Ceremonial Matcha', 'Stone-ground umami-rich matcha from Uji region', 42.00, 'Matcha', 30, true),
    ('Ancient Oolong', 'Limited harvest from century-old tea trees', 35.00, 'Oolong', 25, true),
    ('Chamomile Fields', 'Dried chamomile flowers with subtle honey notes', 18.00, 'Herbal', 75, true),
    ('Earl Grey Classic', 'Black tea infused with bergamot oil', 22.00, 'Black', 60, true)
) AS v(name, description, price, category, stock_count, in_stock)
WHERE NOT EXISTS (SELECT 1 FROM public.products LIMIT 1);