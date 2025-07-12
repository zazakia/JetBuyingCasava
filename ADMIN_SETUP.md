# Admin User Setup

Since the database schema may not be fully set up yet, here's the simplest way to create an admin user:

## Method 1: Register through the app (Recommended)

1. **Start the development server:**
   ```bash
   pnpm run dev
   ```

2. **Open the app:** http://localhost:5173

3. **Click "Create Account" and register with:**
   - **Email:** `admin@example.com`
   - **Password:** `admin123456`
   - **First Name:** `Admin`
   - **Last Name:** `User`
   - **Role:** `User` (will be promoted to admin)

4. **After registration, promote to admin using SQL:**
   - Go to your Supabase dashboard
   - Open the SQL Editor
   - Run this command:
   ```sql
   SELECT jetagritracker.create_admin_user('admin@example.com');
   ```

## Method 2: If database schema needs setup

If you get errors during registration, you need to set up the database first:

1. **Go to Supabase dashboard → SQL Editor**
2. **Run the auth schema setup:**
   ```sql
   -- Copy and paste the contents of database/AUTH_USER_MANAGEMENT_SCHEMA.sql
   ```

3. **Then follow Method 1 above**

## Login Credentials

Once created, you can login with:
- **Email:** `admin@example.com`
- **Password:** `admin123456`

⚠️ **Important:** Change the password after first login!

## Verify Admin Access

After logging in, you should see:
- User management options in the navigation
- Access to all data across organizations
- Admin-only features and settings
