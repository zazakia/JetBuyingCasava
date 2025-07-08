-- AgriTracker Pro Database Schema for Supabase
-- Run this SQL in your Supabase SQL Editor to create all necessary tables

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create farmers table
CREATE TABLE IF NOT EXISTS farmers (
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
CREATE TABLE IF NOT EXISTS lands (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS crops (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    land_id UUID NOT NULL REFERENCES lands(id) ON DELETE CASCADE,
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
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
CREATE TABLE IF NOT EXISTS transactions (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    farmer_id UUID NOT NULL REFERENCES farmers(id) ON DELETE CASCADE,
    crop_id UUID REFERENCES crops(id) ON DELETE SET NULL,
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
CREATE TABLE IF NOT EXISTS sync_log (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    table_name VARCHAR(50) NOT NULL,
    record_id UUID NOT NULL,
    operation VARCHAR(20) NOT NULL CHECK (operation IN ('INSERT', 'UPDATE', 'DELETE')),
    data JSONB,
    synced BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_farmers_municipality ON farmers(municipality);
CREATE INDEX IF NOT EXISTS idx_farmers_barangay ON farmers(barangay);
CREATE INDEX IF NOT EXISTS idx_farmers_active ON farmers(is_active);

CREATE INDEX IF NOT EXISTS idx_lands_user_id ON lands(user_id);
CREATE INDEX IF NOT EXISTS idx_lands_farmer_id ON lands(farmer_id);

CREATE INDEX IF NOT EXISTS idx_crops_user_id ON crops(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_farmer_id ON crops(farmer_id);
CREATE INDEX IF NOT EXISTS idx_crops_land_id ON crops(land_id);
CREATE INDEX IF NOT EXISTS idx_crops_status ON crops(status);
CREATE INDEX IF NOT EXISTS idx_crops_harvest_date ON crops(expected_harvest_date);

CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_farmer_id ON transactions(farmer_id);
CREATE INDEX IF NOT EXISTS idx_transactions_crop_id ON transactions(crop_id);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(transaction_date);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

CREATE INDEX IF NOT EXISTS idx_sync_log_user_id ON sync_log(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_log_synced ON sync_log(synced);

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers for updated_at
CREATE TRIGGER update_farmers_updated_at BEFORE UPDATE ON farmers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_lands_updated_at BEFORE UPDATE ON lands
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_crops_updated_at BEFORE UPDATE ON crops
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Enable Row Level Security (RLS)
ALTER TABLE farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
-- Farmers policies
CREATE POLICY "Users can view own farmers" ON farmers FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own farmers" ON farmers FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own farmers" ON farmers FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own farmers" ON farmers FOR DELETE
    USING (auth.uid() = user_id);

-- Lands policies
CREATE POLICY "Users can view own lands" ON lands FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own lands" ON lands FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own lands" ON lands FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own lands" ON lands FOR DELETE
    USING (auth.uid() = user_id);

-- Crops policies
CREATE POLICY "Users can view own crops" ON crops FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own crops" ON crops FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own crops" ON crops FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own crops" ON crops FOR DELETE
    USING (auth.uid() = user_id);

-- Transactions policies
CREATE POLICY "Users can view own transactions" ON transactions FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own transactions" ON transactions FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own transactions" ON transactions FOR UPDATE
    USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own transactions" ON transactions FOR DELETE
    USING (auth.uid() = user_id);

-- Sync log policies
CREATE POLICY "Users can view own sync log" ON sync_log FOR SELECT
    USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own sync log" ON sync_log FOR INSERT
    WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own sync log" ON sync_log FOR UPDATE
    USING (auth.uid() = user_id);

-- Create views for easier querying
CREATE OR REPLACE VIEW farmer_summary AS
SELECT 
    f.*,
    COUNT(DISTINCT l.id) as land_count,
    COUNT(DISTINCT c.id) as crop_count,
    COUNT(DISTINCT t.id) as transaction_count,
    COALESCE(SUM(l.area), 0) as total_land_area
FROM farmers f
LEFT JOIN lands l ON f.id = l.farmer_id
LEFT JOIN crops c ON f.id = c.farmer_id
LEFT JOIN transactions t ON f.id = t.farmer_id
GROUP BY f.id;

CREATE OR REPLACE VIEW crop_with_details AS
SELECT 
    c.*,
    f.first_name || ' ' || f.last_name as farmer_name,
    l.name as land_name,
    l.area as land_area
FROM crops c
JOIN farmers f ON c.farmer_id = f.id
JOIN lands l ON c.land_id = l.id;

CREATE OR REPLACE VIEW transaction_with_details AS
SELECT 
    t.*,
    f.first_name || ' ' || f.last_name as farmer_name,
    c.crop_type,
    c.variety
FROM transactions t
JOIN farmers f ON t.farmer_id = f.id
LEFT JOIN crops c ON t.crop_id = c.id;

-- Insert sample data (optional - remove if you want to start fresh)
-- This matches the existing sample data in the application
INSERT INTO farmers (id, first_name, last_name, phone, address, barangay, municipality, province, total_hectares, date_planted, date_harvested, date_registered, is_active, user_id)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440001', 'Juan', 'dela Cruz', '+63 912 345 6789', '123 Barangay Street', 'San Isidro', 'Cabanatuan', 'Nueva Ecija', 4.3, '2024-03-15', '2024-08-05', '2024-01-15', true, auth.uid()),
    ('550e8400-e29b-41d4-a716-446655440002', 'Maria', 'Santos', '+63 923 456 7890', '456 Rural Road', 'San Jose', 'Cabanatuan', 'Nueva Ecija', 3.2, '2024-02-20', null, '2024-02-20', true, auth.uid()),
    ('550e8400-e29b-41d4-a716-446655440003', 'Pedro', 'Reyes', '+63 934 567 8901', '789 Farm Lane', 'Santo Tomas', 'Cabanatuan', 'Nueva Ecija', 2.8, '2024-04-10', null, '2024-03-10', true, auth.uid())
ON CONFLICT (id) DO NOTHING;

INSERT INTO lands (id, farmer_id, name, area, location, barangay, municipality, province, soil_type, date_acquired, user_id)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'East Field', 2.5, 'East side of barangay', 'San Isidro', 'Cabanatuan', 'Nueva Ecija', 'Clay loam', '2020-01-01', auth.uid()),
    ('550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'West Field', 1.8, 'West side near river', 'San Isidro', 'Cabanatuan', 'Nueva Ecija', 'Sandy loam', '2021-06-15', auth.uid()),
    ('550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Main Farm', 3.2, 'Center of barangay', 'San Jose', 'Cabanatuan', 'Nueva Ecija', 'Clay', '2019-03-20', auth.uid())
ON CONFLICT (id) DO NOTHING;

INSERT INTO crops (id, land_id, farmer_id, crop_type, variety, planting_date, expected_harvest_date, actual_harvest_date, area_planted, expected_yield, actual_yield, status, notes, user_id)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440021', '550e8400-e29b-41d4-a716-446655440011', '550e8400-e29b-41d4-a716-446655440001', 'Cassava', 'Golden Yellow', '2024-03-15', '2024-12-15', null, 2.0, 4000, null, 'growing', 'Good growing conditions', auth.uid()),
    ('550e8400-e29b-41d4-a716-446655440022', '550e8400-e29b-41d4-a716-446655440012', '550e8400-e29b-41d4-a716-446655440001', 'Sweet Potato', 'Purple', '2024-04-01', '2024-08-01', '2024-08-05', 1.5, 2250, 2400, 'harvested', null, auth.uid()),
    ('550e8400-e29b-41d4-a716-446655440023', '550e8400-e29b-41d4-a716-446655440013', '550e8400-e29b-41d4-a716-446655440002', 'Cassava', 'White Gold', '2024-02-20', '2024-11-20', null, 2.8, 5600, null, 'ready', 'Ready for harvest next week', auth.uid())
ON CONFLICT (id) DO NOTHING;

INSERT INTO transactions (id, farmer_id, crop_id, type, buyer_seller, produce, quantity, price_per_kg, total_amount, transaction_date, payment_status, delivery_status, notes, user_id)
VALUES 
    ('550e8400-e29b-41d4-a716-446655440031', '550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440022', 'sale', 'AgriCorp Processing Plant', 'Sweet Potato', 2400, 25, 60000, '2024-08-10', 'paid', 'delivered', null, auth.uid()),
    ('550e8400-e29b-41d4-a716-446655440032', '550e8400-e29b-41d4-a716-446655440002', null, 'purchase', 'Local Seed Supplier', 'Cassava Stems', 500, 5, 2500, '2024-02-15', 'paid', 'delivered', 'Quality planting materials', auth.uid())
ON CONFLICT (id) DO NOTHING; 