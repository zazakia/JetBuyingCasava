-- =============================================
-- STEP 5: Create indexes for performance
-- =============================================
-- Run this AFTER Steps 1-4 complete successfully

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_user_profiles_user_id ON jetagritracker.user_profiles(user_id);
CREATE INDEX IF NOT EXISTS idx_user_profiles_role ON jetagritracker.user_profiles(role);
CREATE INDEX IF NOT EXISTS idx_user_profiles_organization ON jetagritracker.user_profiles(organization);
CREATE INDEX IF NOT EXISTS idx_user_profiles_active ON jetagritracker.user_profiles(is_active);

-- Create indexes on main tables for user_id if they don't exist
-- (These might fail if the columns don't exist yet - that's OK)
DO $$
BEGIN
    -- Try to create indexes on main tables
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_farmers_user_id ON jetagritracker.farmers(user_id);
    EXCEPTION
        WHEN undefined_column THEN
            RAISE NOTICE 'user_id column does not exist in farmers table yet - skip index';
        WHEN undefined_table THEN
            RAISE NOTICE 'farmers table does not exist yet - skip index';
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_lands_user_id ON jetagritracker.lands(user_id);
    EXCEPTION
        WHEN undefined_column THEN
            RAISE NOTICE 'user_id column does not exist in lands table yet - skip index';
        WHEN undefined_table THEN
            RAISE NOTICE 'lands table does not exist yet - skip index';
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_crops_user_id ON jetagritracker.crops(user_id);
    EXCEPTION
        WHEN undefined_column THEN
            RAISE NOTICE 'user_id column does not exist in crops table yet - skip index';
        WHEN undefined_table THEN
            RAISE NOTICE 'crops table does not exist yet - skip index';
    END;
    
    BEGIN
        CREATE INDEX IF NOT EXISTS idx_transactions_user_id ON jetagritracker.transactions(user_id);
    EXCEPTION
        WHEN undefined_column THEN
            RAISE NOTICE 'user_id column does not exist in transactions table yet - skip index';
        WHEN undefined_table THEN
            RAISE NOTICE 'transactions table does not exist yet - skip index';
    END;
END $$;

-- Test that everything is working
SELECT 
    'Auth setup complete! ' ||
    'User profiles: ' || COUNT(*) ||
    ' | Next step: Register a user and promote them to admin'
FROM jetagritracker.user_profiles;