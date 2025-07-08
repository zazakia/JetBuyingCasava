-- Quick fix for the current_user syntax error
-- Run this to fix the immediate issue

-- Drop and recreate the problematic function
DROP FUNCTION IF EXISTS jetagritracker.get_user_profile(UUID) CASCADE;

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
            SELECT 1 FROM jetagritracker.user_profiles requester
            WHERE requester.user_id = auth.uid() 
            AND requester.role IN ('admin', 'manager')
            AND requester.is_active = true
        )
    );
END;
$$ language 'plpgsql' SECURITY DEFINER;

-- Grant permissions
GRANT EXECUTE ON FUNCTION jetagritracker.get_user_profile(UUID) TO authenticated;

-- Test the function
SELECT 'Function fixed - current_user replaced with requester alias' as status;