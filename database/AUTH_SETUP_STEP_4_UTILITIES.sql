-- =============================================
-- STEP 4: Create utility functions
-- =============================================
-- Run this AFTER Steps 1, 2, and 3 complete successfully

-- Drop existing utility functions if they exist
DROP FUNCTION IF EXISTS jetagritracker.get_user_profile(UUID) CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.create_admin_user(TEXT) CASCADE;

-- Function to get user profile with auth data
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

-- Function to create initial admin user
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
    ELSE
        RAISE NOTICE 'User % has been promoted to admin.', admin_email;
    END IF;
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION jetagritracker.get_user_profile(UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION jetagritracker.create_admin_user(TEXT) TO authenticated;

-- Create profiles for any existing auth users
DO $$
DECLARE
    auth_user RECORD;
    profile_count INTEGER := 0;
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
        
        profile_count := profile_count + 1;
        RAISE NOTICE 'Created profile for existing user: %', auth_user.email;
    END LOOP;
    
    RAISE NOTICE 'Created % user profiles for existing auth users.', profile_count;
END $$;

-- Verify everything is working
SELECT 'Utility functions created and existing users migrated successfully' as status;