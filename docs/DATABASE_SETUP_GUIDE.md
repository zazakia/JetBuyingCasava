# Database Setup Guide

## Step-by-Step Authentication Setup

If you're getting table/relation errors, follow this step-by-step approach to set up authentication safely.

### Prerequisites
- Supabase project created
- Access to Supabase SQL Editor
- Basic database schema already installed

### Step 1: Create User Profiles Table
```sql
-- Run this file in Supabase SQL Editor:
-- database/AUTH_SETUP_STEP_BY_STEP.sql
```
**What it does:** Creates the basic user_profiles table and grants permissions.

### Step 2: Create Functions and Triggers
```sql
-- Run this file AFTER Step 1 succeeds:
-- database/AUTH_SETUP_STEP_2_FUNCTIONS.sql
```
**What it does:** 
- Creates trigger functions for auto-profile creation
- Sets up user login tracking
- Adds error handling to prevent auth failures

### Step 3: Set Up Row Level Security
```sql
-- Run this file AFTER Step 2 succeeds:
-- database/AUTH_SETUP_STEP_3_RLS_FIXED.sql
```
**What it does:**
- Enables RLS on user_profiles table
- Creates policies for data access control
- Ensures users only see authorized data

### Step 4: Create Utility Functions
```sql
-- Run this file AFTER Step 3 succeeds:
-- database/AUTH_SETUP_STEP_4_UTILITIES_FIXED.sql
```
**What it does:**
- Creates `get_user_profile()` function
- Creates `create_admin_user()` function  
- Migrates existing auth users to profiles

### Step 5: Add Performance Indexes
```sql
-- Run this file AFTER Step 4 succeeds:
-- database/AUTH_SETUP_STEP_5_INDEXES.sql
```
**What it does:**
- Creates indexes for fast user lookups
- Adds indexes to main tables (if they exist)
- Optimizes query performance

## Verification

After completing all steps, verify the setup:

```sql
-- Check that user_profiles table exists
SELECT COUNT(*) FROM jetagritracker.user_profiles;

-- Check that triggers exist
SELECT tgname FROM pg_trigger WHERE tgname LIKE '%auth%';

-- Test the get_user_profile function
SELECT * FROM jetagritracker.get_user_profile();

-- Check RLS policies
SELECT policyname FROM pg_policies WHERE tablename = 'user_profiles';
```

## Create Your First Admin User

1. **Register a user** through the application
2. **Promote them to admin:**
   ```sql
   SELECT jetagritracker.create_admin_user('your-email@example.com');
   ```

## Quick Fix for Immediate Errors

### "syntax error at or near 'current_user'"
```sql
-- Run this quick fix immediately:
-- database/QUICK_FIX_CURRENT_USER.sql
```

## Troubleshooting

### "relation does not exist"
- Make sure you're running the steps in order
- Verify each step completes before moving to the next

### "trigger already exists"  
- The step scripts handle this with `DROP TRIGGER IF EXISTS`
- You can safely re-run any step

### "syntax error at or near 'current_user'"
- `current_user` is a PostgreSQL reserved keyword
- Use the FIXED versions of Step 3 and Step 4
- Or run the quick fix script above

### "permission denied"
- Ensure you're running as database admin in Supabase
- Check that the jetagritracker schema exists

### "function does not exist"
- Complete Step 4 (utilities) before testing functions
- Re-run Step 4 if functions are missing

## Alternative: All-in-One Script

If you prefer a single script (and don't have existing conflicts):
```sql
-- For fresh installations only:
-- database/AUTH_USER_MANAGEMENT_SCHEMA.sql
```

## Next Steps

After database setup:
1. Set environment variables in your application
2. Test user registration/login
3. Verify role-based access control
4. Add users and assign roles as needed

The step-by-step approach ensures reliable setup even if you have existing database objects or partial installations.