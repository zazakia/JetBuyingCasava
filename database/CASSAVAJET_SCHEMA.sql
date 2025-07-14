-- JetBuyingCasava Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create all necessary tables with jetbuyingcasava_ prefix in public schema

-- First, ensure we're using the public schema
SET search_path TO public, auth;

-- Drop the extension if it exists to ensure clean installation
DROP EXTENSION IF EXISTS "uuid-ossp" CASCADE;

-- Create the uuid-ossp extension in the public schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Verify the extension was created
SELECT extname, extversion FROM pg_extension WHERE extname = 'uuid-ossp';

-- Create farmers table with jetbuyingcasava_ prefix
CREATE TABLE IF NOT EXISTS public.jetbuyingcasava_farmers (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    first_name VARCHAR(100) NOT NULL,
    last_name VARCHAR(100) NOT NULL,
    phone VARCHAR(20) NOT NULL,
    address TEXT NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    total_hectares DECIMAL(10,2) DEFAULT 0,
    date_planted DATE,
    date_harvested DATE,
    date_registered TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    profile_picture TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create lands table
CREATE TABLE IF NOT EXISTS public.jetbuyingcasava_lands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES public.jetbuyingcasava_farmers(id) ON DELETE CASCADE,
    name VARCHAR(200) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    location TEXT NOT NULL,
    barangay VARCHAR(100) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    soil_type VARCHAR(100) NOT NULL,
    coordinates JSONB,
    date_acquired DATE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create crops table
CREATE TABLE IF NOT EXISTS public.jetbuyingcasava_crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    land_id UUID NOT NULL REFERENCES public.jetbuyingcasava_lands(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES public.jetbuyingcasava_farmers(id) ON DELETE CASCADE,
    crop_type VARCHAR(100) NOT NULL,
    variety VARCHAR(100) NOT NULL,
    planting_date DATE NOT NULL,
    expected_harvest_date DATE NOT NULL,
    actual_harvest_date DATE,
    area_planted DECIMAL(10,2) NOT NULL,
    expected_yield DECIMAL(10,2) NOT NULL,
    actual_yield DECIMAL(10,2),
    status VARCHAR(20) NOT NULL DEFAULT 'planted' CHECK (status IN ('planted', 'growing', 'ready', 'harvested')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create transactions table
CREATE TABLE IF NOT EXISTS public.jetbuyingcasava_transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES public.jetbuyingcasava_farmers(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES public.jetbuyingcasava_crops(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('purchase', 'sale')),
    buyer_seller VARCHAR(200) NOT NULL,
    produce VARCHAR(100) NOT NULL,
    quantity DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(10,2) NOT NULL,
    total_amount DECIMAL(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    payment_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
    delivery_status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create sync_log table for offline functionality
CREATE TABLE IF NOT EXISTS public.jetbuyingcasava_sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    data JSONB,
    synced BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_farmers_user_id ON public.jetbuyingcasava_farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_farmers_phone ON public.jetbuyingcasava_farmers(phone);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_lands_farmer_id ON public.jetbuyingcasava_lands(farmer_id);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_lands_location ON public.jetbuyingcasava_lands(barangay, municipality, province);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_crops_farmer_id ON public.jetbuyingcasava_crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_crops_land_id ON public.jetbuyingcasava_crops(land_id);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_crops_status ON public.jetbuyingcasava_crops(status);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_transactions_user_id ON public.jetbuyingcasava_transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_transactions_farmer_id ON public.jetbuyingcasava_transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_transactions_crop_id ON public.jetbuyingcasava_transactions(crop_id);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_sync_log_table_name ON public.jetbuyingcasava_sync_log(table_name);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_sync_log_record_id ON public.jetbuyingcasava_sync_log(record_id);
CREATE INDEX IF NOT EXISTS idx_jetbuyingcasava_sync_log_synced ON public.jetbuyingcasava_sync_log(synced) WHERE NOT synced;

-- Create views
CREATE OR REPLACE VIEW public.jetbuyingcasava_farmer_summary AS
SELECT 
    f.*,
    COUNT(DISTINCT l.id) as land_count,
    COUNT(DISTINCT c.id) as crop_count,
    COUNT(DISTINCT t.id) as transaction_count,
    SUM(c.expected_yield) as total_expected_yield,
    SUM(c.actual_yield) as total_actual_yield,
    SUM(t.total_amount) as total_transaction_amount
FROM public.jetbuyingcasava_farmers f
LEFT JOIN public.jetbuyingcasava_lands l ON f.id = l.farmer_id
LEFT JOIN public.jetbuyingcasava_crops c ON f.id = c.farmer_id
LEFT JOIN public.jetbuyingcasava_transactions t ON f.id = t.farmer_id
GROUP BY f.id;

-- Set default search path
SET search_path TO public, auth;
