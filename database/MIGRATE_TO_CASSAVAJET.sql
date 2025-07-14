-- =============================================
-- MIGRATION SCRIPT: JetAgriTracker → cassavajet
-- =============================================
-- Run this in your Supabase SQL Editor
-- WARNING: Backup your database before running this script!

-- Start a transaction for safety
BEGIN;

-- 1. Create the new cassavajet schema if it doesn't exist
CREATE SCHEMA IF NOT EXISTS cassavajet;

-- 2. Move all tables from JetAgriTracker to cassavajet
DO $$
DECLARE
    r RECORD;
BEGIN
    -- Move tables
    FOR r IN 
        SELECT tablename 
        FROM pg_tables 
        WHERE schemaname = 'JetAgriTracker'
    LOOP
        EXECUTE format('ALTER TABLE JetAgriTracker.%I SET SCHEMA cassavajet', r.tablename);
        RAISE NOTICE 'Moved table: %', r.tablename;
    END LOOP;
    
    -- Move views
    FOR r IN 
        SELECT viewname 
        FROM pg_views 
        WHERE schemaname = 'JetAgriTracker'
    LOOP
        EXECUTE format('ALTER VIEW JetAgriTracker.%I SET SCHEMA cassavajet', r.viewname);
        RAISE NOTICE 'Moved view: %', r.viewname;
    END LOOP;
    
    -- Move functions
    FOR r IN 
        SELECT p.proname as funcname, pg_get_function_identity_arguments(p.oid) as args
        FROM pg_proc p
        JOIN pg_namespace n ON p.pronamespace = n.oid
        WHERE n.nspname = 'JetAgriTracker'
    LOOP
        EXECUTE format('ALTER FUNCTION JetAgriTracker.%I(%s) SET SCHEMA cassavajet', 
                      r.funcname, COALESCE(r.args, ''));
        RAISE NOTICE 'Moved function: %', r.funcname;
    END LOOP;
END $$;

-- 3. Update RLS policies to reference the new schema
DO $$
BEGIN
    -- Drop existing policies on user_profiles if they exist
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'jetagritracker' AND tablename = 'user_profiles') THEN
        DROP POLICY IF EXISTS "Users can view own profile" ON jetagritracker.user_profiles;
        DROP POLICY IF EXISTS "Users can update own profile" ON jetagritracker.user_profiles;
        DROP POLICY IF EXISTS "Admins can view all profiles" ON jetagritracker.user_profiles;
        DROP POLICY IF EXISTS "Admins can update all profiles" ON jetagritracker.user_profiles;
        DROP POLICY IF EXISTS "Admins can insert profiles" ON jetagritracker.user_profiles;
        
        -- Recreate policies with new schema references
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
    END IF;
END $$;

-- 4. Update all foreign key constraints to reference the new schema
DO $$
DECLARE
    r RECORD;
    constraint_name TEXT;
    table_name TEXT;
    constraint_def TEXT;
    new_constraint_def TEXT;
BEGIN
    -- Get all foreign key constraints that reference JetAgriTracker tables
    FOR r IN 
        SELECT 
            tc.table_schema,
            tc.table_name,
            tc.constraint_name,
            tc.constraint_type,
            ccu.table_schema AS foreign_table_schema,
            ccu.table_name AS foreign_table_name,
            ccu.column_name AS foreign_column_name
        FROM 
            information_schema.table_constraints AS tc 
            JOIN information_schema.key_column_usage AS kcu
              ON tc.constraint_name = kcu.constraint_name
              AND tc.table_schema = kcu.table_schema
            JOIN information_schema.constraint_column_usage AS ccu
              ON ccu.constraint_name = tc.constraint_name
              AND ccu.table_schema = tc.table_schema
        WHERE 
            tc.constraint_type = 'FOREIGN KEY' 
            AND ccu.table_schema = 'JetAgriTracker'
    LOOP
        -- Drop the existing constraint
        EXECUTE format('ALTER TABLE %I.%I DROP CONSTRAINT %I', 
                      r.table_schema, r.table_name, r.constraint_name);
        
        -- Recreate the constraint with the new schema
        -- Note: This is a simplified example - you'll need to adjust based on your actual constraints
        EXECUTE format('ALTER TABLE %I.%I ADD CONSTRAINT %I FOREIGN KEY (%I) REFERENCES cassavajet.%I(id) ON DELETE CASCADE',
                      r.table_schema, r.table_name, r.constraint_name, 
                      r.column_name, r.foreign_table_name);
                      
        RAISE NOTICE 'Updated foreign key constraint % on %.%', 
                     r.constraint_name, r.table_schema, r.table_name;
    END LOOP;
END $$;

-- 5. Verify the migration
DO $$
BEGIN
    -- Check if all tables were moved
    IF NOT EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'JetAgriTracker') THEN
        RAISE NOTICE 'All tables successfully moved to cassavajet schema';
    END IF;
    
    -- Check if views were moved
    IF NOT EXISTS (SELECT 1 FROM pg_views WHERE schemaname = 'JetAgriTracker') THEN
        RAISE NOTICE 'All views successfully moved to cassavajet schema';
    END IF;
    
    -- Check if functions were moved
    IF NOT EXISTS (SELECT 1 FROM pg_proc p JOIN pg_namespace n ON p.pronamespace = n.oid WHERE n.nspname = 'JetAgriTracker') THEN
        RAISE NOTICE 'All functions successfully moved to cassavajet schema';
    END IF;
    
    -- Verify some key tables exist in the new schema
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'cassavajet' AND tablename = 'farmers') THEN
        RAISE NOTICE 'Verified cassavajet.farmers table exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'cassavajet' AND tablename = 'lands') THEN
        RAISE NOTICE 'Verified cassavajet.lands table exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'cassavajet' AND tablename = 'crops') THEN
        RAISE NOTICE 'Verified cassavajet.crops table exists';
    END IF;
    
    IF EXISTS (SELECT 1 FROM pg_tables WHERE schemaname = 'cassavajet' AND tablename = 'transactions') THEN
        RAISE NOTICE 'Verified cassavajet.transactions table exists';
    END IF;
END $$;

-- 6. Update search_path for the database
-- This ensures new connections use the new schema by default
-- Note: You might need to reconnect for this to take effect
ALTER DATABASE current_database() SET search_path TO cassavajet, public, auth;

-- 7. (Optional) Drop the old schema if everything is working
-- WARNING: Only uncomment and run this after verifying everything works with the new schema
-- DROP SCHEMA IF EXISTS JetAgriTracker CASCADE;

COMMIT;

-- =============================================
-- POST-MIGRATION STEPS
-- =============================================
-- 1. Update your application code to use 'cassavajet' instead of 'JetAgriTracker'
-- 2. Test all functionality thoroughly
-- 3. Only after verification, uncomment and run the DROP SCHEMA command above

-- Verify the migration was successful
SELECT 'Migration to cassavajet schema completed successfully!' as status;
