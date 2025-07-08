-- Safe Migration Script for Auth and User Management Schema
-- This script handles existing triggers and constraints safely
-- Run this if you get "trigger already exists" errors

-- STEP 1: Drop existing triggers if they exist (safe approach)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON jetagritracker.user_profiles;

-- STEP 2: Drop existing functions if they exist (to recreate with latest version)
DROP FUNCTION IF EXISTS jetagritracker.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.update_last_login() CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.update_updated_at_column() CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.get_user_profile(UUID) CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.create_admin_user(TEXT) CASCADE;

-- STEP 3: Create user_profiles table (with IF NOT EXISTS for safety)
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

-- STEP 4: Recreate updated_at trigger function
CREATE OR REPLACE FUNCTION jetagritracker.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- STEP 5: Recreate trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON jetagritracker.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION jetagritracker.update_updated_at_column();

-- STEP 6: Recreate function to automatically create user profile when user signs up
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
EXCEPTION
    WHEN unique_violation THEN
        -- Profile already exists, just return
        RETURN NEW;
    WHEN OTHERS THEN
        -- Log error but don't fail the auth operation
        RAISE WARNING 'Could not create user profile for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- STEP 7: Recreate trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION jetagritracker.handle_new_user();

-- STEP 8: Recreate function to update last_login_at
CREATE OR REPLACE FUNCTION jetagritracker.update_last_login()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE jetagritracker.user_profiles
    SET last_login_at = NOW()
    WHERE user_id = NEW.id;
    RETURN NEW;
EXCEPTION
    WHEN OTHERS THEN
        -- Don't fail auth if profile update fails
        RAISE WARNING 'Could not update last login for %: %', NEW.id, SQLERRM;
        RETURN NEW;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- STEP 9: Recreate trigger to update last login on auth
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION jetagritracker.update_last_login();

-- STEP 10: Add indexes for better performance (IF NOT EXISTS equivalent)
DO $$
BEGIN
    -- Check and create indexes only if they don't exist
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_user_id') THEN
        CREATE INDEX idx_user_profiles_user_id ON jetagritracker.user_profiles(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_user_profiles_role') THEN
        CREATE INDEX idx_user_profiles_role ON jetagritracker.user_profiles(role);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_farmers_user_id') THEN
        CREATE INDEX idx_farmers_user_id ON jetagritracker.farmers(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_lands_user_id') THEN
        CREATE INDEX idx_lands_user_id ON jetagritracker.lands(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_crops_user_id') THEN
        CREATE INDEX idx_crops_user_id ON jetagritracker.crops(user_id);
    END IF;
    
    IF NOT EXISTS (SELECT 1 FROM pg_indexes WHERE indexname = 'idx_transactions_user_id') THEN
        CREATE INDEX idx_transactions_user_id ON jetagritracker.transactions(user_id);
    END IF;
END $$;

-- STEP 11: Enable RLS and recreate policies (drop existing first)
ALTER TABLE jetagritracker.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies safely
DROP POLICY IF EXISTS "Users can view own profile" ON jetagritracker.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON jetagritracker.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON jetagritracker.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON jetagritracker.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON jetagritracker.user_profiles;

-- Recreate user_profiles policies
CREATE POLICY "Users can view own profile" ON jetagritracker.user_profiles
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own profile" ON jetagritracker.user_profiles
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all profiles" ON jetagritracker.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles up
            WHERE up.user_id = auth.uid() AND up.role = 'admin' AND up.is_active = true
        )
    );

CREATE POLICY "Admins can update all profiles" ON jetagritracker.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles up
            WHERE up.user_id = auth.uid() AND up.role = 'admin' AND up.is_active = true
        )
    );

CREATE POLICY "Admins can insert profiles" ON jetagritracker.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles up
            WHERE up.user_id = auth.uid() AND up.role = 'admin' AND up.is_active = true
        )
    );

-- STEP 12: Update main data tables RLS policies
-- Enable RLS on main tables
ALTER TABLE jetagritracker.farmers ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetagritracker.lands ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetagritracker.crops ENABLE ROW LEVEL SECURITY;
ALTER TABLE jetagritracker.transactions ENABLE ROW LEVEL SECURITY;

-- Drop existing policies on main tables
DROP POLICY IF EXISTS "Users can access own organization farmers" ON jetagritracker.farmers;
DROP POLICY IF EXISTS "Users can access own organization lands" ON jetagritracker.lands;
DROP POLICY IF EXISTS "Users can access own organization crops" ON jetagritracker.crops;
DROP POLICY IF EXISTS "Users can access own organization transactions" ON jetagritracker.transactions;

-- Recreate main table policies
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

-- STEP 13: Recreate utility functions
CREATE OR REPLACE FUNCTION jetagritracker.create_admin_user(admin_email TEXT)
RETURNS VOID AS $$
BEGIN
    UPDATE jetagritracker.user_profiles
    SET role = 'admin'
    WHERE user_id = (
        SELECT id FROM auth.users WHERE email = admin_email
    );
    
    -- If no rows updated, the user might not exist
    IF NOT FOUND THEN
        RAISE NOTICE 'User with email % not found. Make sure they have registered first.', admin_email;
    END IF;
END;
$$ language 'plpgsql' SECURITY DEFINER;

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
    WHERE (user_uuid IS NULL OR up.user_id = user_uuid)
    AND (
        -- User can see their own profile
        up.user_id = auth.uid() 
        OR 
        -- Admins and managers can see all profiles
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles current_user
            WHERE current_user.user_id = auth.uid() 
            AND current_user.role IN ('admin', 'manager')
            AND current_user.is_active = true
        )
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- STEP 14: Grant permissions
GRANT USAGE ON SCHEMA jetagritracker TO authenticated;
GRANT ALL ON jetagritracker.user_profiles TO authenticated;
GRANT EXECUTE ON FUNCTION jetagritracker.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION jetagritracker.create_admin_user(TEXT) TO authenticated;

-- STEP 15: Create profiles for existing auth users (if any)
DO $$
DECLARE
    auth_user RECORD;
BEGIN
    -- Create profiles for existing auth users that don't have profiles
    FOR auth_user IN 
        SELECT au.id, au.email, au.raw_user_meta_data
        FROM auth.users au
        LEFT JOIN jetagritracker.user_profiles up ON up.user_id = au.id
        WHERE up.user_id IS NULL
    LOOP
        INSERT INTO jetagritracker.user_profiles (
            user_id, 
            first_name, 
            last_name
        ) VALUES (
            auth_user.id,
            COALESCE(auth_user.raw_user_meta_data->>'first_name', ''),
            COALESCE(auth_user.raw_user_meta_data->>'last_name', '')
        );
        
        RAISE NOTICE 'Created profile for existing user: %', auth_user.email;
    END LOOP;
END $$;

-- Migration complete
SELECT 
    'Auth migration completed successfully! ' ||
    'Existing triggers updated, RLS policies refreshed, ' ||
    'and profiles created for existing users.' as result;