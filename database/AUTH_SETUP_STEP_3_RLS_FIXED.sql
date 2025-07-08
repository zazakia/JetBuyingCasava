-- =============================================
-- STEP 3: Set up Row Level Security (FIXED)
-- =============================================
-- Run this AFTER Steps 1 and 2 complete successfully

-- Enable RLS on user_profiles table
ALTER TABLE jetagritracker.user_profiles ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON jetagritracker.user_profiles;
DROP POLICY IF EXISTS "Users can update own profile" ON jetagritracker.user_profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON jetagritracker.user_profiles;
DROP POLICY IF EXISTS "Admins can update all profiles" ON jetagritracker.user_profiles;
DROP POLICY IF EXISTS "Admins can insert profiles" ON jetagritracker.user_profiles;

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
            SELECT 1 FROM jetagritracker.user_profiles requester
            WHERE requester.user_id = auth.uid() AND requester.role = 'admin' AND requester.is_active = true
        )
    );

-- Policy: Admins can update all profiles
CREATE POLICY "Admins can update all profiles" ON jetagritracker.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles requester
            WHERE requester.user_id = auth.uid() AND requester.role = 'admin' AND requester.is_active = true
        )
    );

-- Policy: Admins can insert new profiles
CREATE POLICY "Admins can insert profiles" ON jetagritracker.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles requester
            WHERE requester.user_id = auth.uid() AND requester.role = 'admin' AND requester.is_active = true
        )
    );

-- Test RLS policies by checking if they were created
DO $$
DECLARE
    policy_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO policy_count 
    FROM pg_policies 
    WHERE tablename = 'user_profiles' AND schemaname = 'jetagritracker';
    
    RAISE NOTICE 'Created % RLS policies for user_profiles table.', policy_count;
END $$;

-- Verify RLS policies were created
SELECT 'RLS policies created successfully' as status;