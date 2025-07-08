-- Auth and User Management Schema for JetAgriTracker
-- This creates user profiles that sync with Supabase auth.users table
-- Run this after the main database schema

-- STEP 1: Create user_profiles table synced with auth.users
CREATE TABLE IF NOT EXISTS jetagritracker.user_profiles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    role VARCHAR(20) NOT NULL DEFAULT 'user' CHECK (role IN ('admin', 'manager', 'user')),
    is_active BOOLEAN DEFAULT true,
    profile_picture TEXT,
    phone VARCHAR(20),
    organization VARCHAR(100),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE
);

-- STEP 2: Create updated_at trigger function
CREATE OR REPLACE FUNCTION jetagritracker.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 3: Create trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON jetagritracker.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION jetagritracker.update_updated_at_column();

-- STEP 4: Function to automatically create user profile when user signs up
CREATE OR REPLACE FUNCTION jetagritracker.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO jetagritracker.user_profiles (user_id, first_name, last_name)
    VALUES (
        NEW.id,
        COALESCE(NEW.raw_user_meta_data->>'first_name', ''),
        COALESCE(NEW.raw_user_meta_data->>'last_name', '')
    );
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- STEP 5: Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION jetagritracker.handle_new_user();

-- STEP 6: Function to update last_login_at
CREATE OR REPLACE FUNCTION jetagritracker.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE jetagritracker.user_profiles
    SET last_login_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- STEP 7: Trigger to update last login on auth
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION jetagritracker.update_last_login();

-- STEP 8: Update existing tables to ensure proper user_id references
-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON jetagritracker.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON jetagritracker.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON jetagritracker.farmers(user_id);
CREATE INDEX IF NOT EXISTS idx_lands_user_id ON jetagritracker.lands(user_id);
CREATE INDEX IF NOT EXISTS idx_crops_user_id ON jetagritracker.crops(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON jetagritracker.transactions(user_id);

-- STEP 9: Row Level Security (RLS) Policies
ALTER TABLE jetagritracker.user_profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view their own profile
CREATE POLICY "Users can view own profile" ON jetagritracker.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

-- Policy: Users can update their own profile
CREATE POLICY "Users can update own profile" ON jetagritracker.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

-- Policy: Admins can view all profiles
CREATE POLICY "Admins can view all profiles" ON jetagritracker.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles up
            WHERE up.user_id = auth.uid() AND up.role = 'admin' AND up.is_active = true
        )
    );

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON jetagritracker.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles up
            WHERE up.user_id = auth.uid() AND up.role = 'admin' AND up.is_active = true
        )
    );

-- Policy: Admins can insert new profiles
CREATE POLICY "Admins can insert profiles" ON jetagritracker.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles up
            WHERE up.user_id = auth.uid() AND up.role = 'admin' AND up.is_active = true
        )
    );

-- STEP 10: Update RLS policies for main data tables
-- Farmers table policies
ALTER TABLE jetagritracker.farmers ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own organization farmers" ON jetagritracker.farmers
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles up
            WHERE up.user_id = auth.uid() 
            AND (up.role IN ('admin', 'manager') OR up.organization = (
                SELECT organization FROM jetagritracker.user_profiles up2 
                WHERE up2.user_id = jetagritracker.farmers.user_id
            ))
            AND up.is_active = true
        )
    );

-- Lands table policies
ALTER TABLE jetagritracker.lands ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own organization lands" ON jetagritracker.lands
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles up
            WHERE up.user_id = auth.uid() 
            AND (up.role IN ('admin', 'manager') OR up.organization = (
                SELECT organization FROM jetagritracker.user_profiles up2 
                WHERE up2.user_id = jetagritracker.lands.user_id
            ))
            AND up.is_active = true
        )
    );

-- Crops table policies
ALTER TABLE jetagritracker.crops ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own organization crops" ON jetagritracker.crops
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles up
            WHERE up.user_id = auth.uid() 
            AND (up.role IN ('admin', 'manager') OR up.organization = (
                SELECT organization FROM jetagritracker.user_profiles up2 
                WHERE up2.user_id = jetagritracker.crops.user_id
            ))
            AND up.is_active = true
        )
    );

-- Transactions table policies
ALTER TABLE jetagritracker.transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can access own organization transactions" ON jetagritracker.transactions
    FOR ALL USING (
        user_id = auth.uid() OR
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles up
            WHERE up.user_id = auth.uid() 
            AND (up.role IN ('admin', 'manager') OR up.organization = (
                SELECT organization FROM jetagritracker.user_profiles up2 
                WHERE up2.user_id = jetagritracker.transactions.user_id
            ))
            AND up.is_active = true
        )
    );

-- STEP 11: Create initial admin user function (run manually when needed)
CREATE OR REPLACE FUNCTION jetagritracker.create_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE jetagritracker.user_profiles
    SET role = 'admin'
    WHERE user_id = (
        SELECT id FROM auth.users WHERE email = admin_email
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- STEP 12: Function to get user profile with auth data
CREATE OR REPLACE FUNCTION jetagritracker.get_user_profile(user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    id UUID,
    user_id UUID,
    email TEXT,
    first_name TEXT,
    last_name TEXT,
    role TEXT,
    is_active BOOLEAN,
    profile_picture TEXT,
    phone TEXT,
    organization TEXT,
    created_at TIMESTAMPTZ,
    updated_at TIMESTAMPTZ,
    last_login_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        up.id,
        up.user_id,
        au.email,
        up.first_name,
        up.last_name,
        up.role,
        up.is_active,
        up.profile_picture,
        up.phone,
        up.organization,
        up.created_at,
        up.updated_at,
        up.last_login_at
    FROM jetagritracker.user_profiles up
    JOIN auth.users au ON au.id = up.user_id
    WHERE up.user_id = user_uuid;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant necessary permissions
GRANT USAGE ON SCHEMA jetagritracker TO authenticated;
GRANT ALL ON jetagritracker.user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION jetagritracker.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION jetagritracker.create_admin_user(TEXT) TO authenticated;