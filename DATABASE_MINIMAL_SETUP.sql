-- Minimal JetAgriTracker Database Schema for Supabase
-- If the main script fails, use this minimal version
-- This creates the most basic setup without advanced features

-- Create schema
CREATE SCHEMA IF NOT EXISTS JetAgriTracker;

-- Basic farmers table
CREATE TABLE JetAgriTracker.farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    first_name TEXT NOT NULL,
    last_name TEXT NOT NULL,
    phone TEXT NOT NULL,
    address TEXT NOT NULL,
    barangay TEXT NOT NULL,
    municipality TEXT NOT NULL,
    province TEXT NOT NULL,
    total_hectares NUMERIC DEFAULT 0,
    date_planted DATE,
    date_harvested DATE,
    date_registered TIMESTAMPTZ DEFAULT NOW(),
    is_active BOOLEAN DEFAULT true,
    profile_picture TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Basic lands table
CREATE TABLE JetAgriTracker.lands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES JetAgriTracker.farmers(id),
    name TEXT NOT NULL,
    area NUMERIC NOT NULL,
    location TEXT,
    barangay TEXT NOT NULL,
    municipality TEXT NOT NULL,
    province TEXT NOT NULL,
    soil_type TEXT,
    date_acquired DATE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Basic crops table
CREATE TABLE JetAgriTracker.crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    land_id UUID REFERENCES JetAgriTracker.lands(id),
    farmer_id UUID REFERENCES JetAgriTracker.farmers(id),
    crop_type TEXT NOT NULL,
    variety TEXT,
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_planted NUMERIC NOT NULL,
    expected_yield NUMERIC,
    actual_yield NUMERIC,
    status TEXT DEFAULT 'planted',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Basic transactions table
CREATE TABLE JetAgriTracker.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID REFERENCES JetAgriTracker.farmers(id),
    crop_id UUID REFERENCES JetAgriTracker.crops(id),
    type TEXT NOT NULL,
    buyer_seller TEXT,
    produce TEXT,
    quantity NUMERIC NOT NULL,
    price_per_kg NUMERIC,
    total_amount NUMERIC NOT NULL,
    transaction_date DATE NOT NULL,
    payment_status TEXT DEFAULT 'pending',
    delivery_status TEXT DEFAULT 'pending',
    notes TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id)
);

-- Basic sync log table
CREATE TABLE JetAgriTracker.sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name TEXT NOT NULL,
    operation TEXT NOT NULL,
    record_id UUID NOT NULL,
    sync_status TEXT DEFAULT 'pending',
    error_message TEXT,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    synced_at TIMESTAMPTZ,
    user_id UUID REFERENCES auth.users(id)
);

-- Enable RLS
ALTER TABLE JetAgriTracker.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.sync_log ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies
CREATE POLICY "farmers_policy" ON JetAgriTracker.farmers USING (auth.uid() = user_id);
CREATE POLICY "lands_policy" ON JetAgriTracker.lands USING (auth.uid() = user_id);
CREATE POLICY "crops_policy" ON JetAgriTracker.crops USING (auth.uid() = user_id);
CREATE POLICY "transactions_policy" ON JetAgriTracker.transactions USING (auth.uid() = user_id);
CREATE POLICY "sync_log_policy" ON JetAgriTracker.sync_log USING (auth.uid() = user_id);

-- Grant permissions
GRANT USAGE ON SCHEMA JetAgriTracker TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA JetAgriTracker TO anon, authenticated;