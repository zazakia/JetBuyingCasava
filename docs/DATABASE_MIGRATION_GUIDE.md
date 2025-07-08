# Database Migration Guide

## Authentication Schema Migration

If you encounter errors like "trigger already exists" when running the auth schema, use the safe migration script instead.

### Problem: Existing Triggers/Functions
```
ERROR: 42710: trigger "on_auth_user_created" for relation "users" already exists
```

### Solution: Safe Migration Script

**Run this instead of the original schema:**
```sql
-- File: database/AUTH_USER_MANAGEMENT_MIGRATION_SAFE.sql
```

### What the Safe Migration Does:

1. **Safely drops existing triggers/functions** using `IF EXISTS`
2. **Recreates all auth components** with latest versions
3. **Handles existing users** by creating profiles for them
4. **Updates RLS policies** without conflicts
5. **Adds error handling** to prevent auth failures

### Migration Steps:

#### 1. Use Safe Migration Script
```sql
-- In Supabase SQL Editor, run:
-- database/AUTH_USER_MANAGEMENT_MIGRATION_SAFE.sql
```

#### 2. Verify Migration Success
```sql
-- Check that triggers exist
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%auth%';

-- Check user profiles table exists
SELECT COUNT(*) FROM jetagritracker.user_profiles;

-- Test user profile function
SELECT * FROM jetagritracker.get_user_profile();
```

#### 3. Create Admin User
```sql
-- After first user registers, promote them:
SELECT jetagritracker.create_admin_user('your-email@example.com');
```

### Troubleshooting Common Issues:

#### Issue: "relation already exists"
**Solution:** The safe migration handles this - it uses `IF NOT EXISTS` clauses.

#### Issue: "function does not exist"
**Solution:** The migration recreates all functions with proper error handling.

#### Issue: "permission denied"
**Solution:** Ensure you're running the script as a database admin in Supabase.

#### Issue: No user profiles for existing users
**Solution:** The migration automatically creates profiles for existing auth users.

### Rollback (if needed):

If you need to completely remove the auth system:

```sql
-- WARNING: This removes all auth functionality
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
DROP TRIGGER IF EXISTS on_auth_user_login ON auth.users;
DROP TABLE IF EXISTS jetagritracker.user_profiles CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.handle_new_user() CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.update_last_login() CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.get_user_profile(UUID) CASCADE;
DROP FUNCTION IF EXISTS jetagritracker.create_admin_user(TEXT) CASCADE;
```

### Verification Checklist:

After running the safe migration:

- [ ] User registration creates profile automatically
- [ ] Login updates last_login_at timestamp  
- [ ] RLS policies filter data correctly
- [ ] Admin users can access user management
- [ ] Regular users can only see their data
- [ ] get_user_profile() function works
- [ ] create_admin_user() function works

### Performance Notes:

The migration includes optimized indexes:
- `idx_user_profiles_user_id` - Fast user lookups
- `idx_user_profiles_role` - Role-based filtering
- `idx_*_user_id` - All main tables indexed on user_id

### Security Notes:

- All functions use `SECURITY DEFINER` for proper permissions
- RLS policies are comprehensive and prevent data leaks
- Error handling prevents auth failures from breaking user experience
- Existing users get profiles automatically without data loss

This safe migration approach ensures you can upgrade to the authentication system without conflicts or data loss.