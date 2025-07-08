-- Step-by-Step Auth Setup for JetAgriTracker
-- Run each step separately to avoid dependency issues

-- =============================================
-- STEP 1: Create the user_profiles table FIRST
-- =============================================

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

-- Grant permissions on the table
GRANT USAGE ON SCHEMA jetagritracker TO authenticated;
GRANT ALL ON jetagritracker.user_profiles TO authenticated;

-- Verify table was created
SELECT 'user_profiles table created successfully' as status;