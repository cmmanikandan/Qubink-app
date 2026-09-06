-- ==============================================================================
-- QUBINK DATABASE SCHEMA (PostgreSQL / Supabase)
-- Professional Printing, Xerox & Document Marketplace
-- Tagline: "Print. Collect. Delivered."
-- Exactly 3 Roles: customer, shop, admin
-- Authentication: Firebase Authentication (via firebase_uid)
-- Database & Storage: Supabase PostgreSQL & Supabase Storage
-- ==============================================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 1. PROFILES TABLE
-- Synchronized from Firebase Authentication using firebase_uid
CREATE TABLE IF NOT EXISTS public.profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    firebase_uid VARCHAR(128) NOT NULL UNIQUE,
    full_name VARCHAR(120) NOT NULL,
    email VARCHAR(255) NOT NULL,
    phone VARCHAR(30),
    avatar_url TEXT,
    role VARCHAR(20) NOT NULL CHECK (role IN ('customer', 'shop', 'admin')),
    is_blocked BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_profiles_firebase_uid ON public.profiles(firebase_uid);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);

-- 2. SHOPS TABLE
-- Managed by shop owners (role='shop'), approved by admin
CREATE TABLE IF NOT EXISTS public.shops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    owner_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shop_name VARCHAR(150) NOT NULL,
    description TEXT,
    phone VARCHAR(30) NOT NULL,
    email VARCHAR(255),
    address TEXT NOT NULL,
    city VARCHAR(100) NOT NULL,
    district VARCHAR(100),
    state VARCHAR(100),
    pincode VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION NOT NULL,
    longitude DOUBLE PRECISION NOT NULL,
    map_url TEXT,
    opening_time VARCHAR(10) DEFAULT '09:00',
    closing_time VARCHAR(10) DEFAULT '21:00',
    is_open BOOLEAN DEFAULT TRUE,
    pickup_available BOOLEAN DEFAULT TRUE,
    delivery_available BOOLEAN DEFAULT FALSE,
    delivery_fee NUMERIC(8, 2) DEFAULT 30.00,
    estimated_prep_time VARCHAR(50) DEFAULT '15-30 mins',
    status VARCHAR(30) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'suspended')),
    shop_image TEXT,
    rating NUMERIC(3, 2) DEFAULT 5.00,
    review_count INTEGER DEFAULT 0,
    upi_id VARCHAR(100),
    bank_beneficiary VARCHAR(150),
    bank_account VARCHAR(50),
    bank_ifsc VARCHAR(30),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shops_owner_id ON public.shops(owner_id);
CREATE INDEX IF NOT EXISTS idx_shops_status ON public.shops(status);
CREATE INDEX IF NOT EXISTS idx_shops_location ON public.shops(latitude, longitude);

-- 3. SHOP SERVICES TABLE
CREATE TABLE IF NOT EXISTS public.shop_services (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    service_name VARCHAR(60) NOT NULL, -- 'Xerox', 'Printing', 'Scanning', 'Binding', 'Lamination'
    is_available BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    UNIQUE(shop_id, service_name)
);

CREATE INDEX IF NOT EXISTS idx_shop_services_shop_id ON public.shop_services(shop_id);

-- 4. SHOP PRICING TABLE (Live dynamic rates per shop)
CREATE TABLE IF NOT EXISTS public.shop_pricing (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    shop_id UUID NOT NULL UNIQUE REFERENCES public.shops(id) ON DELETE CASCADE,
    bw_a4 NUMERIC(6, 2) NOT NULL DEFAULT 2.00,
    color_a4 NUMERIC(6, 2) NOT NULL DEFAULT 10.00,
    bw_a3 NUMERIC(6, 2) NOT NULL DEFAULT 5.00,
    color_a3 NUMERIC(6, 2) NOT NULL DEFAULT 20.00,
    binding_price NUMERIC(6, 2) NOT NULL DEFAULT 35.00,
    stapling_price NUMERIC(6, 2) NOT NULL DEFAULT 5.00,
    lamination_price NUMERIC(6, 2) NOT NULL DEFAULT 25.00,
    delivery_fee NUMERIC(6, 2) NOT NULL DEFAULT 30.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_shop_pricing_shop_id ON public.shop_pricing(shop_id);

-- 5. ADDRESSES TABLE (Customer delivery address book)
CREATE TABLE IF NOT EXISTS public.addresses (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    label VARCHAR(30) DEFAULT 'Home' CHECK (label IN ('Home', 'College', 'Office', 'Other')),
    address_line TEXT NOT NULL,
    landmark VARCHAR(150),
    city VARCHAR(100) NOT NULL,
    pincode VARCHAR(20) NOT NULL,
    latitude DOUBLE PRECISION,
    longitude DOUBLE PRECISION,
    is_default BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON public.addresses(user_id);

-- 6. DOCUMENTS TABLE (Metadata for files in Supabase Storage bucket 'customer-documents')
CREATE TABLE IF NOT EXISTS public.documents (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    file_name VARCHAR(255) NOT NULL,
    storage_path TEXT NOT NULL,
    file_type VARCHAR(50) NOT NULL,
    file_size BIGINT NOT NULL,
    page_count INTEGER NOT NULL DEFAULT 1,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_documents_customer_id ON public.documents(customer_id);

-- 7. ORDERS TABLE
CREATE TABLE IF NOT EXISTS public.orders (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_number VARCHAR(40) NOT NULL UNIQUE, -- e.g. QB-2026-1284
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    fulfillment_type VARCHAR(20) NOT NULL CHECK (fulfillment_type IN ('PICKUP', 'DELIVERY')),
    delivery_address_id UUID REFERENCES public.addresses(id) ON DELETE SET NULL,
    delivery_address_text TEXT,
    payment_method VARCHAR(40) DEFAULT 'CASH', -- 'PAY_AT_SHOP', 'CASH_ON_DELIVERY', 'UPI', 'RAZORPAY', 'CASH'
    payment_status VARCHAR(40) DEFAULT 'PENDING', -- 'PENDING', 'PENDING_VERIFICATION', 'PAID', 'REFUNDED'
    upi_ref_id VARCHAR(100),
    coupon_discount NUMERIC(8, 2) DEFAULT 0.00,
    status VARCHAR(30) NOT NULL DEFAULT 'PLACED' CHECK (
        status IN ('PLACED', 'ACCEPTED', 'PRINTING', 'READY', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY', 'COMPLETED', 'REJECTED', 'CANCELLED')
    ),
    rejection_reason TEXT,
    pickup_code VARCHAR(10) NOT NULL, -- 4-digit verification code
    subtotal NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    binding_total NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    lamination_total NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    stapling_total NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    delivery_fee NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    total_amount NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    notes TEXT,
    rating INTEGER CHECK (rating >= 1 AND rating <= 5),
    review_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_orders_customer_id ON public.orders(customer_id);
CREATE INDEX IF NOT EXISTS idx_orders_shop_id ON public.orders(shop_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON public.orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON public.orders(order_number);

-- 8. ORDER ITEMS TABLE (Per document print configuration)
CREATE TABLE IF NOT EXISTS public.order_items (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
    document_id UUID REFERENCES public.documents(id) ON DELETE SET NULL,
    document_name VARCHAR(255) NOT NULL,
    document_url TEXT,
    page_count INTEGER NOT NULL DEFAULT 1,
    print_type VARCHAR(10) NOT NULL CHECK (print_type IN ('BW', 'COLOR')),
    sides VARCHAR(10) NOT NULL CHECK (sides IN ('SINGLE', 'DOUBLE')),
    paper_size VARCHAR(10) NOT NULL CHECK (paper_size IN ('A4', 'A3')),
    copies INTEGER NOT NULL DEFAULT 1,
    has_binding BOOLEAN DEFAULT FALSE,
    has_stapling BOOLEAN DEFAULT FALSE,
    has_lamination BOOLEAN DEFAULT FALSE,
    item_total NUMERIC(8, 2) NOT NULL DEFAULT 0.00,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_order_items_order_id ON public.order_items(order_id);

-- 9. REVIEWS TABLE
CREATE TABLE IF NOT EXISTS public.reviews (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    order_id UUID NOT NULL UNIQUE REFERENCES public.orders(id) ON DELETE CASCADE,
    customer_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    shop_id UUID NOT NULL REFERENCES public.shops(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_reviews_shop_id ON public.reviews(shop_id);

-- 10. NOTIFICATIONS TABLE
CREATE TABLE IF NOT EXISTS public.notifications (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    order_id UUID REFERENCES public.orders(id) ON DELETE CASCADE,
    title VARCHAR(150) NOT NULL,
    message TEXT NOT NULL,
    type VARCHAR(50) NOT NULL,
    is_read BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_notifications_user_id ON public.notifications(user_id);

-- ==============================================================================
-- AUTOMATIC REAL SHOP RATING TRIGGER
-- ==============================================================================
CREATE OR REPLACE FUNCTION update_shop_rating()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE public.shops
    SET 
        rating = COALESCE((SELECT ROUND(AVG(rating)::numeric, 2) FROM public.reviews WHERE shop_id = NEW.shop_id), 5.00),
        review_count = (SELECT COUNT(*) FROM public.reviews WHERE shop_id = NEW.shop_id)
    WHERE id = NEW.shop_id;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_update_shop_rating ON public.reviews;
CREATE TRIGGER trg_update_shop_rating
AFTER INSERT OR UPDATE OR DELETE ON public.reviews
FOR EACH ROW EXECUTE FUNCTION update_shop_rating();

-- ==============================================================================
-- MIGRATION HELPERS (Safely upgrade any previously created table)
-- ==============================================================================
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS district VARCHAR(100);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS state VARCHAR(100);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS upi_id VARCHAR(100);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS bank_beneficiary VARCHAR(150);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS bank_account VARCHAR(50);
ALTER TABLE public.shops ADD COLUMN IF NOT EXISTS bank_ifsc VARCHAR(30);

ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_method VARCHAR(40) DEFAULT 'CASH';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS payment_status VARCHAR(40) DEFAULT 'PENDING';
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS upi_ref_id VARCHAR(100);
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS coupon_discount NUMERIC(8, 2) DEFAULT 0.00;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS rating INTEGER;
ALTER TABLE public.orders ADD COLUMN IF NOT EXISTS review_comment TEXT;

ALTER TABLE public.order_items ADD COLUMN IF NOT EXISTS document_url TEXT;

-- ==============================================================================
-- STORAGE BUCKETS CONFIGURATION (Run in Supabase SQL editor)
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES 
    ('customer-documents', 'customer-documents', false),
    ('shop-images', 'shop-images', true),
    ('profile-images', 'profile-images', true)
ON CONFLICT (id) DO NOTHING;

-- ==============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- ==============================================================================
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shops ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.shop_pricing ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.addresses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications ENABLE ROW LEVEL SECURITY;

-- Permissive client policies for smooth marketplace operations
DROP POLICY IF EXISTS "Allow all read profiles" ON public.profiles;
CREATE POLICY "Allow all read profiles" ON public.profiles FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert profiles" ON public.profiles;
CREATE POLICY "Allow all insert profiles" ON public.profiles FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update profiles" ON public.profiles;
CREATE POLICY "Allow all update profiles" ON public.profiles FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Public read approved shops" ON public.shops;
CREATE POLICY "Public read approved shops" ON public.shops FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert shops" ON public.shops;
CREATE POLICY "Allow all insert shops" ON public.shops FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update shops" ON public.shops;
CREATE POLICY "Allow all update shops" ON public.shops FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Shop pricing public read" ON public.shop_pricing;
CREATE POLICY "Shop pricing public read" ON public.shop_pricing FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all insert shop pricing" ON public.shop_pricing;
CREATE POLICY "Allow all insert shop pricing" ON public.shop_pricing FOR INSERT WITH CHECK (true);
DROP POLICY IF EXISTS "Allow all update shop pricing" ON public.shop_pricing;
CREATE POLICY "Allow all update shop pricing" ON public.shop_pricing FOR UPDATE USING (true);

DROP POLICY IF EXISTS "Shop services public read" ON public.shop_services;
CREATE POLICY "Shop services public read" ON public.shop_services FOR SELECT USING (true);
DROP POLICY IF EXISTS "Allow all manage shop services" ON public.shop_services;
CREATE POLICY "Allow all manage shop services" ON public.shop_services FOR ALL USING (true);

DROP POLICY IF EXISTS "Addresses allow all" ON public.addresses;
CREATE POLICY "Addresses allow all" ON public.addresses FOR ALL USING (true);

DROP POLICY IF EXISTS "Orders allow all" ON public.orders;
CREATE POLICY "Orders allow all" ON public.orders FOR ALL USING (true);

DROP POLICY IF EXISTS "Order items allow all" ON public.order_items;
CREATE POLICY "Order items allow all" ON public.order_items FOR ALL USING (true);

DROP POLICY IF EXISTS "Documents allow all" ON public.documents;
CREATE POLICY "Documents allow all" ON public.documents FOR ALL USING (true);

DROP POLICY IF EXISTS "Reviews allow all" ON public.reviews;
CREATE POLICY "Reviews allow all" ON public.reviews FOR ALL USING (true);

DROP POLICY IF EXISTS "Notifications allow all" ON public.notifications;
CREATE POLICY "Notifications allow all" ON public.notifications FOR ALL USING (true);

-- ==============================================================================
-- 12. SUPABASE STORAGE BUCKET: customer-documents
-- ==============================================================================
INSERT INTO storage.buckets (id, name, public)
VALUES ('customer-documents', 'customer-documents', true)
ON CONFLICT (id) DO UPDATE SET public = true;

-- Permissive storage policies for uploading and downloading documents
DROP POLICY IF EXISTS "Public access customer-documents" ON storage.objects;
CREATE POLICY "Public access customer-documents" ON storage.objects
FOR ALL USING (bucket_id = 'customer-documents')
WITH CHECK (bucket_id = 'customer-documents');

