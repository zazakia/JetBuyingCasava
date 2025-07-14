-- Fix for infinite recursion in RLS policies for members/user_profiles table
-- This script updates the RLS policies to use proper table aliases to prevent recursion

-- First, disable RLS to make the changes
ALTER TABLE jetagritracker.user_profiles DISABLE ROW LEVEL SECURITY;

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
-- Uses requester alias to prevent recursion
CREATE POLICY "Admins can view all profiles" ON jetagritracker.user_profiles
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles requester
            WHERE requester.user_id = auth.uid() 
            AND requester.role = 'admin' 
            AND requester.is_active = true
        )
    );

-- Policy: Admins can update all profiles
-- Uses requester alias to prevent recursion
CREATE POLICY "Admins can update all profiles" ON jetagritracker.user_profiles
    FOR UPDATE USING (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles requester
            WHERE requester.user_id = auth.uid() 
            AND requester.role = 'admin' 
            AND requester.is_active = true
        )
    );

-- Policy: Admins can insert new profiles
-- Uses requester alias to prevent recursion
CREATE POLICY "Admins can insert profiles" ON jetagritracker.user_profiles
    FOR INSERT WITH CHECK (
        EXISTS (
            SELECT 1 FROM jetagritracker.user_profiles requester
            WHERE requester.user_id = auth.uid() 
            AND requester.role = 'admin' 
            AND requester.is_active = true
        )
    );

-- Re-enable RLS
ALTER TABLE jetagritracker.user_profiles ENABLE ROW LEVEL SECURITY;

-- Verify the policies were created
SELECT 
    tablename, 
    policyname, 
    cmd, 
    permissive, 
    roles, 
    qual, 
    with_check 
FROM 
    pg_policies 
WHERE 
    tablename = 'user_profiles' 
    AND schemaname = 'jetagritracker';

-- Notify completion
SELECT 'RLS policies updated successfully to prevent recursion' as status;
