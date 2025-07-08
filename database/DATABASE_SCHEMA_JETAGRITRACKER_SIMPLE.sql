-- JetAgriTracker Database Schema for Supabase (Simple Version)
-- Run this SQL in your Supabase SQL Editor to create all necessary tables
-- This uses gen_random_uuid() which is built into PostgreSQL 13+ (Supabase default)

-- STEP 1: Create JetAgriTracker schema
CREATE SCHEMA IF NOT EXISTS JetAgriTracker;

-- STEP 2: Create farmers table
CREATE TABLE IF NOT EXISTS JetAgriTracker.farmers (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
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

-- STEP 3: Create lands table
CREATE TABLE IF NOT EXISTS JetAgriTracker.lands (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES JetAgriTracker.farmers(id) ON DELETE CASCADE,
    name VARCHAR(100) NOT NULL,
    area DECIMAL(10,2) NOT NULL,
    location TEXT,
    barangay VARCHAR(100) NOT NULL,
    municipality VARCHAR(100) NOT NULL,
    province VARCHAR(100) NOT NULL,
    soil_type VARCHAR(50),
    date_acquired DATE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- STEP 4: Create crops table
CREATE TABLE IF NOT EXISTS JetAgriTracker.crops (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    land_id UUID NOT NULL REFERENCES JetAgriTracker.lands(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES JetAgriTracker.farmers(id) ON DELETE CASCADE,
    crop_type VARCHAR(50) NOT NULL,
    variety VARCHAR(100),
    planting_date DATE NOT NULL,
    expected_harvest_date DATE,
    actual_harvest_date DATE,
    area_planted DECIMAL(10,2) NOT NULL,
    expected_yield DECIMAL(10,2),
    actual_yield DECIMAL(10,2),
    status VARCHAR(20) DEFAULT 'planted' CHECK (status IN ('planted', 'growing', 'ready', 'harvested', 'failed')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- STEP 5: Create transactions table
CREATE TABLE IF NOT EXISTS JetAgriTracker.transactions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    farmer_id UUID NOT NULL REFERENCES JetAgriTracker.farmers(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES JetAgriTracker.crops(id) ON DELETE SET NULL,
    type VARCHAR(20) NOT NULL CHECK (type IN ('sale', 'purchase', 'expense', 'income')),
    buyer_seller VARCHAR(200),
    produce VARCHAR(100),
    quantity DECIMAL(10,2) NOT NULL,
    price_per_kg DECIMAL(10,2),
    total_amount DECIMAL(12,2) NOT NULL,
    transaction_date DATE NOT NULL,
    payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'paid', 'overdue')),
    delivery_status VARCHAR(20) DEFAULT 'pending' CHECK (delivery_status IN ('pending', 'delivered', 'cancelled')),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- STEP 6: Create sync_log table for tracking synchronization
CREATE TABLE IF NOT EXISTS JetAgriTracker.sync_log (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    table_name VARCHAR(50) NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('CREATE', 'UPDATE', 'DELETE')),
    record_id UUID NOT NULL,
    sync_status VARCHAR(20) DEFAULT 'pending' CHECK (sync_status IN ('pending', 'synced', 'failed')),
    error_message TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    synced_at TIMESTAMP WITH TIME ZONE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- STEP 7: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON JetAgriTracker.farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_barangay ON JetAgriTracker.farmers(barangay);
CREATE INDEX IF NOT EXISTS idx_farmers_municipality ON JetAgriTracker.farmers(municipality);
CREATE INDEX IF NOT EXISTS idx_farmers_active ON JetAgriTracker.farmers(is_active);

CREATE INDEX IF NOT EXISTS idx_lands_farmer_id ON JetAgriTracker.lands(farmer_id);
CREATE INDEX IF NOT EXISTS idx_lands_user_id ON JetAgriTracker.lands(user_id);
CREATE INDEX IF NOT EXISTS idx_lands_barangay ON JetAgriTracker.lands(barangay);

CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON JetAgriTracker.crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crops_land_id ON JetAgriTracker.crops(land_id);
CREATE INDEX IF NOT EXISTS idx_crops_user_id ON JetAgriTracker.crops(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_status ON JetAgriTracker.crops(status);
CREATE INDEX IF NOT EXISTS idx_crops_harvest_date ON JetAgriTracker.crops(expected_harvest_date);

CREATE INDEX IF NOT EXISTS idx_transactions_farmer_id ON JetAgriTracker.transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_crop_id ON JetAgriTracker.transactions(crop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON JetAgriTracker.transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON JetAgriTracker.transactions(type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON JetAgriTracker.transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_payment_status ON JetAgriTracker.transactions(payment_status);

CREATE INDEX IF NOT EXISTS idx_sync_log_table_operation ON JetAgriTracker.sync_log(table_name, operation);
CREATE INDEX IF NOT EXISTS idx_sync_log_status ON JetAgriTracker.sync_log(sync_status);
CREATE INDEX IF NOT EXISTS idx_sync_log_user_id ON JetAgriTracker.sync_log(user_id);

-- STEP 8: Create update timestamp triggers
CREATE OR REPLACE FUNCTION JetAgriTracker.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply update triggers to all tables
CREATE TRIGGER update_farmers_updated_at 
    BEFORE UPDATE ON JetAgriTracker.farmers 
    FOR EACH ROW EXECUTE FUNCTION JetAgriTracker.update_updated_at_column();

CREATE TRIGGER update_lands_updated_at 
    BEFORE UPDATE ON JetAgriTracker.lands 
    FOR EACH ROW EXECUTE FUNCTION JetAgriTracker.update_updated_at_column();

CREATE TRIGGER update_crops_updated_at 
    BEFORE UPDATE ON JetAgriTracker.crops 
    FOR EACH ROW EXECUTE FUNCTION JetAgriTracker.update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at 
    BEFORE UPDATE ON JetAgriTracker.transactions 
    FOR EACH ROW EXECUTE FUNCTION JetAgriTracker.update_updated_at_column();

-- STEP 9: Enable Row Level Security (RLS)
ALTER TABLE JetAgriTracker.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.sync_log ENABLE ROW LEVEL SECURITY;

-- STEP 10: Create RLS policies for authenticated users
-- Farmers policies
CREATE POLICY "Users can view their own farmers" ON JetAgriTracker.farmers
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own farmers" ON JetAgriTracker.farmers
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own farmers" ON JetAgriTracker.farmers
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own farmers" ON JetAgriTracker.farmers
    FOR DELETE USING (auth.uid() = user_id);

-- Lands policies
CREATE POLICY "Users can view their own lands" ON JetAgriTracker.lands
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own lands" ON JetAgriTracker.lands
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own lands" ON JetAgriTracker.lands
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own lands" ON JetAgriTracker.lands
    FOR DELETE USING (auth.uid() = user_id);

-- Crops policies
CREATE POLICY "Users can view their own crops" ON JetAgriTracker.crops
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own crops" ON JetAgriTracker.crops
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own crops" ON JetAgriTracker.crops
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own crops" ON JetAgriTracker.crops
    FOR DELETE USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view their own transactions" ON JetAgriTracker.transactions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own transactions" ON JetAgriTracker.transactions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own transactions" ON JetAgriTracker.transactions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own transactions" ON JetAgriTracker.transactions
    FOR DELETE USING (auth.uid() = user_id);

-- Sync log policies
CREATE POLICY "Users can view their own sync logs" ON JetAgriTracker.sync_log
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own sync logs" ON JetAgriTracker.sync_log
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- STEP 11: Grant permissions to authenticated users
GRANT USAGE ON SCHEMA JetAgriTracker TO anon, authenticated;
GRANT ALL ON ALL TABLES IN SCHEMA JetAgriTracker TO anon, authenticated;
GRANT ALL ON ALL SEQUENCES IN SCHEMA JetAgriTracker TO anon, authenticated;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA JetAgriTracker TO anon, authenticated;

-- STEP 12: Create a view for sync status
CREATE OR REPLACE VIEW JetAgriTracker.sync_status_view AS
SELECT 
    table_name,
    COUNT(*) as total_records,
    COUNT(CASE WHEN sync_status = 'pending' THEN 1 END) as pending_sync,
    COUNT(CASE WHEN sync_status = 'synced' THEN 1 END) as synced,
    COUNT(CASE WHEN sync_status = 'failed' THEN 1 END) as failed,
    MAX(created_at) as last_operation,
    MAX(CASE WHEN sync_status = 'synced' THEN synced_at END) as last_sync
FROM JetAgriTracker.sync_log
WHERE user_id = auth.uid()
GROUP BY table_name;

-- Grant access to the view
GRANT SELECT ON JetAgriTracker.sync_status_view TO anon, authenticated;

-- STEP 13: Create a function to help with testing (optional)
-- Use this function AFTER logging into your application to create test data
CREATE OR REPLACE FUNCTION JetAgriTracker.create_test_data()
RETURNS TEXT AS $$
DECLARE
    current_user_id UUID := auth.uid();
    farmer_id UUID;
    land_id UUID;
BEGIN
    -- Check if user is authenticated
    IF current_user_id IS NULL THEN
        RETURN 'Error: User not authenticated. Please log in to your application first.';
    END IF;
    
    -- Check if test data already exists
    IF EXISTS (SELECT 1 FROM JetAgriTracker.farmers WHERE user_id = current_user_id LIMIT 1) THEN
        RETURN 'Test data already exists for this user.';
    END IF;
    
    -- Create a test farmer
    INSERT INTO JetAgriTracker.farmers (first_name, last_name, phone, address, barangay, municipality, province, user_id)
    VALUES ('Juan', 'dela Cruz', '+63 912 345 6789', '123 Barangay Street', 'San Isidro', 'Cabanatuan', 'Nueva Ecija', current_user_id)
    RETURNING id INTO farmer_id;
    
    -- Create a test land
    INSERT INTO JetAgriTracker.lands (farmer_id, name, area, barangay, municipality, province, user_id)
    VALUES (farmer_id, 'East Field', 2.5, 'San Isidro', 'Cabanatuan', 'Nueva Ecija', current_user_id)
    RETURNING id INTO land_id;
    
    -- Create a test crop
    INSERT INTO JetAgriTracker.crops (land_id, farmer_id, crop_type, planting_date, area_planted, expected_yield, user_id)
    VALUES (land_id, farmer_id, 'Cassava', CURRENT_DATE - INTERVAL '30 days', 2.0, 4000, current_user_id);
    
    -- Create test sync log entries
    INSERT INTO JetAgriTracker.sync_log (table_name, operation, record_id, sync_status, user_id)
    VALUES 
    ('farmers', 'CREATE', farmer_id, 'synced', current_user_id),
    ('lands', 'CREATE', land_id, 'synced', current_user_id);
    
    RETURN 'Test data created successfully! You can now test the application features.';
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Grant execute permission on the function
GRANT EXECUTE ON FUNCTION JetAgriTracker.create_test_data() TO authenticated;

-- Success message
DO $$ 
BEGIN 
    RAISE NOTICE '🌾 JetAgriTracker schema created successfully!';
    RAISE NOTICE '✅ Tables created: farmers, lands, crops, transactions, sync_log';
    RAISE NOTICE '🔒 RLS policies enabled for all tables';
    RAISE NOTICE '📊 Indexes and triggers created';
    RAISE NOTICE '🔄 Sync status view created';
    RAISE NOTICE '🚀 Ready to use with AgriTracker Pro application!';
    RAISE NOTICE '';
    RAISE NOTICE '📋 Next steps:';
    RAISE NOTICE '1. Verify all tables were created in JetAgriTracker schema';
    RAISE NOTICE '2. Test the application with your environment variables';
    RAISE NOTICE '3. Check sync status in the Settings page';
END $$;