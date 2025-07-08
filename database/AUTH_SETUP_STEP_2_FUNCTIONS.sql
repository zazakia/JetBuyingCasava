-- =============================================
-- STEP 2: Create functions and triggers
-- =============================================
-- Run this AFTER Step 1 completes successfully

-- Drop existing functions/triggers if they exist
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP TRIGGER IF EXISTS update_user_profiles_updated_at ON jetagritracker.user_profiles;
DROP FUNCTION IF EXISTS jetagritracker.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.update_last_login() CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.update_updated_at_column() CASCADE;

-- Create updated_at trigger function
CREATE OR REPLACE FUNCTION jetagritracker.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger for user_profiles updated_at
CREATE TRIGGER update_user_profiles_updated_at
    BEFORE UPDATE ON jetagritracker.user_profiles
    FOR EACH ROW
    EXECUTE FUNCTION jetagritracker.update_updated_at_column();

-- Function to automatically create user profile when user signs up
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

-- Trigger to create profile on user signup
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW
    EXECUTE FUNCTION jetagritracker.handle_new_user();

-- Function to update last_login_at
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

-- Trigger to update last login on auth
CREATE TRIGGER on_auth_user_login
    AFTER UPDATE OF last_sign_in_at ON auth.users
    FOR EACH ROW
    WHEN (OLD.last_sign_in_at IS DISTINCT FROM NEW.last_sign_in_at)
    EXECUTE FUNCTION jetagritracker.update_last_login();

-- Verify triggers were created
SELECT 'Functions and triggers created successfully' as status;