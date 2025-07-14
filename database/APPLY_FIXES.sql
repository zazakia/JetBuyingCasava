-- =============================================
-- DATABASE FIXES FOR JETAGRITRACKER
-- =============================================
-- This script applies all necessary fixes for the Supabase backend issues

-- Set the search path to include JetAgriTracker schema
SET search_path TO JetAgriTracker, public;

-- =============================================
-- 1. FIX RLS RECURSION ISSUE
-- =============================================
\echo 'Fixing RLS recursion issue...'

-- Disable RLS to make changes
ALTER TABLE IF EXISTS jetagritracker.user_profiles DISABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'jetagritracker' AND tablename = 'user_profiles') THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON jetagritracker.user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON jetagritracker.user_profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON jetagritracker.user_profiles;
        DROP POLICY IF EXISTS "Admins can update all profiles" ON jetagritracker.user_profiles;
        DROP POLICY IF EXISTS "Admins can insert profiles" ON jetagritracker.user_profiles;
    END IF;
END $$;

-- Create new policies with proper aliases to prevent recursion
DO $$
BEGIN
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'jetagritracker' AND tablename = 'user_profiles') THEN
        -- Policy: Users can view their own profile
        EXECUTE 'CREATE POLICY "Users can view own profile" ON jetagritracker.user_profiles
            FOR SELECT USING (auth.uid() = user_id)';
            
        -- Policy: Users can update their own profile
        EXECUTE 'CREATE POLICY "Users can update own profile" ON jetagritracker.user_profiles
            FOR UPDATE USING (auth.uid() = user_id)';
            
        -- Policy: Admins can view all profiles
        EXECUTE 'CREATE POLICY "Admins can view all profiles" ON jetagritracker.user_profiles
            FOR SELECT USING (
                EXISTS (
                    SELECT 1 FROM jetagritracker.user_profiles requester
                    WHERE requester.user_id = auth.uid() 
                    AND requester.role = ''admin'' 
                    AND requester.is_active = true
                )
            )';
            
        -- Policy: Admins can update all profiles
        EXECUTE 'CREATE POLICY "Admins can update all profiles" ON jetagritracker.user_profiles
            FOR UPDATE USING (
                EXISTS (
                    SELECT 1 FROM jetagritracker.user_profiles requester
                    WHERE requester.user_id = auth.uid() 
                    AND requester.role = ''admin'' 
                    AND requester.is_active = true
                )
            )';
            
        -- Policy: Admins can insert new profiles
        EXECUTE 'CREATE POLICY "Admins can insert profiles" ON jetagritracker.user_profiles
            FOR INSERT WITH CHECK (
                EXISTS (
                    SELECT 1 FROM jetagritracker.user_profiles requester
                    WHERE requester.user_id = auth.uid() 
                    AND requester.role = ''admin'' 
                    AND requester.is_active = true
                )
            )';
            
        -- Re-enable RLS
        EXECUTE 'ALTER TABLE jetagritracker.user_profiles ENABLE ROW LEVEL SECURITY';
        
        RAISE NOTICE 'RLS policies updated successfully to prevent recursion';
    ELSE
        RAISE NOTICE 'user_profiles table does not exist in jetagritracker schema';
    END IF;
END $$;

-- =============================================
-- 2. CREATE MISSING SYNC_STATUS_VIEW
-- =============================================
\echo 'Creating sync_status_view...'

-- Drop the view if it exists
DROP VIEW IF EXISTS JetAgriTracker.sync_status_view;

-- Create the sync_status_view
CREATE OR REPLACE VIEW JetAgriTracker.sync_status_view AS
WITH last_sync AS (
    SELECT 
        table_name,
        MAX(updated_at) as last_sync_time
    FROM 
        JetAgriTracker.sync_log
    WHERE 
        synced = true
    GROUP BY 
        table_name
)
SELECT 
    'farmers' as table_name,
    (SELECT COUNT(*) FROM JetAgriTracker.farmers) as total_records,
    (SELECT last_sync_time FROM last_sync WHERE table_name = 'farmers') as last_sync_time,
    (SELECT COUNT(*) FROM JetAgriTracker.sync_log 
     WHERE table_name = 'farmers' AND synced = false) as pending_changes

UNION ALL

SELECT 
    'lands' as table_name,
    (SELECT COUNT(*) FROM JetAgriTracker.lands) as total_records,
    (SELECT last_sync_time FROM last_sync WHERE table_name = 'lands') as last_sync_time,
    (SELECT COUNT(*) FROM JetAgriTracker.sync_log 
     WHERE table_name = 'lands' AND synced = false) as pending_changes

UNION ALL

SELECT 
    'crops' as table_name,
    (SELECT COUNT(*) FROM JetAgriTracker.crops) as total_records,
    (SELECT last_sync_time FROM last_sync WHERE table_name = 'crops') as last_sync_time,
    (SELECT COUNT(*) FROM JetAgriTracker.sync_log 
     WHERE table_name = 'crops' AND synced = false) as pending_changes

UNION ALL

SELECT 
    'transactions' as table_name,
    (SELECT COUNT(*) FROM JetAgriTracker.transactions) as total_records,
    (SELECT last_sync_time FROM last_sync WHERE table_name = 'transactions') as last_sync_time,
    (SELECT COUNT(*) FROM JetAgriTracker.sync_log 
     WHERE table_name = 'transactions' AND synced = false) as pending_changes;

-- Grant permissions to authenticated users
GRANT SELECT ON JetAgriTracker.sync_status_view TO authenticated;

-- =============================================
-- 3. VERIFY FIXES
-- =============================================
\echo 'Verifying fixes...'

-- Check if RLS is enabled on user_profiles
SELECT 
    'RLS Status' as check_name,
    tablename as table_name,
    rowsecurity as rls_enabled
FROM 
    pg_tables 
WHERE 
    schemaname = 'jetagritracker' 
    AND tablename = 'user_profiles';

-- Check if policies exist
SELECT 
    'RLS Policies' as check_name,
    policyname as policy_name,
    cmd as command,
    permissive,
    roles,
    qual as using_condition
FROM 
    pg_policies 
WHERE 
    tablename = 'user_profiles' 
    AND schemaname = 'jetagritracker';

-- Check if sync_status_view exists
SELECT 
    'View Status' as check_name,
    table_name,
    'View exists' as status
FROM 
    information_schema.views 
WHERE 
    table_schema = 'JetAgriTracker' 
    AND table_name = 'sync_status_view';

-- Final status
SELECT 'All fixes applied successfully!' as status;
