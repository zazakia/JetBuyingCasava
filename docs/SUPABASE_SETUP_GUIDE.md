# 🗄️ Supabase Database Setup Guide - JetAgriTracker

This guide will help you set up the database schema for AgriTracker Pro in Supabase.

## 🚨 UUID Error Fix

If you're getting the error `function uuid_generate_v4() does not exist`, follow these steps:

### Option 1: Use the Simple Schema (Recommended)

1. **Open Supabase SQL Editor**
   - Go to your Supabase project dashboard
   - Click on "SQL Editor" in the left sidebar

2. **Run the Simple Schema**
   - Copy the contents of `DATABASE_SCHEMA_JETAGRITRACKER_SIMPLE.sql`
   - Paste it into the SQL Editor
   - Click "Run" button

This version uses `gen_random_uuid()` which is built into PostgreSQL 13+ (Supabase default).

### Option 2: Enable UUID Extension First

If the simple version doesn't work, try this approach:

1. **Enable UUID Extension**
   ```sql
   CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
   ```

2. **Then run the fixed schema**
   - Use `DATABASE_SCHEMA_JETAGRITRACKER_FIXED.sql`

### Option 3: Minimal Setup (Fallback)

If both above fail, use the minimal setup:

1. **Use Minimal Schema**
   - Copy contents of `DATABASE_MINIMAL_SETUP.sql`
   - This creates basic tables without advanced constraints

## 📋 Step-by-Step Setup Instructions

### 1. Choose Your Schema File

| File | Description | Recommended For |
|------|-------------|-----------------|
| `DATABASE_SCHEMA_JETAGRITRACKER_SIMPLE.sql` | Uses `gen_random_uuid()` | ✅ **Most users** |
| `DATABASE_SCHEMA_JETAGRITRACKER_FIXED.sql` | Uses `uuid-ossp` extension | If simple fails |
| `DATABASE_MINIMAL_SETUP.sql` | Basic setup only | Last resort |

### 2. Execute the Schema

1. **Login to Supabase**
   - Go to [supabase.com/dashboard](https://supabase.com/dashboard)
   - Select your project

2. **Open SQL Editor**
   - Click "SQL Editor" in the left sidebar
   - Click "New query"

3. **Copy and Paste Schema**
   - Open the chosen SQL file
   - Copy ALL contents
   - Paste into the SQL Editor

4. **Run the Query**
   - Click the "Run" button (or Ctrl/Cmd + Enter)
   - Wait for completion

### 3. Verify Setup

After running the schema, verify these tables exist:

```sql
-- Check if tables were created
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'JetAgriTracker';
```

You should see:
- ✅ `farmers`
- ✅ `lands`
- ✅ `crops`
- ✅ `transactions`
- ✅ `sync_log`

### 4. Test the Connection

1. **Check Environment Variables**
   ```bash
   # In your .env.local file
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. **Test in Application**
   - Start your development server: `npm run dev`
   - Go to Settings > Sync Status
   - Should show connection status

## 🔧 Troubleshooting

### Common Errors and Solutions

#### 1. UUID Function Not Found
```
ERROR: function uuid_generate_v4() does not exist
```
**Solution**: Use `DATABASE_SCHEMA_JETAGRITRACKER_SIMPLE.sql` which uses `gen_random_uuid()`

#### 2. Schema Already Exists
```
ERROR: schema "jetagritracker" already exists
```
**Solution**: Either drop the existing schema or use `IF NOT EXISTS` (already included in scripts)

#### 3. Permission Denied
```
ERROR: permission denied for schema
```
**Solution**: Make sure you're using the project owner account or have proper permissions

#### 4. RLS Policies Conflict
```
ERROR: policy already exists
```
**Solution**: Drop existing policies first:
```sql
DROP POLICY IF EXISTS "Users can view their own farmers" ON JetAgriTracker.farmers;
-- Repeat for other policies
```

### Manual UUID Extension Setup

If you need to manually enable UUID extension:

```sql
-- Method 1: Standard extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Method 2: In public schema
CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;

-- Method 3: Check if extension exists
SELECT * FROM pg_extension WHERE extname = 'uuid-ossp';
```

### Check PostgreSQL Version

Supabase uses PostgreSQL 13+ which has `gen_random_uuid()` built-in:

```sql
SELECT version();
-- Should show PostgreSQL 13.x or higher
```

## 🎯 Schema Features

The JetAgriTracker schema includes:

### Tables
- **farmers**: Farmer profiles and contact information
- **lands**: Land parcels owned by farmers
- **crops**: Crop plantings and harvest data
- **transactions**: Sales, purchases, and financial records
- **sync_log**: Synchronization tracking for offline support

### Security
- ✅ **Row Level Security (RLS)**: Users can only access their own data
- ✅ **User Authentication**: Integrated with Supabase Auth
- ✅ **Proper Permissions**: Secure access control

### Performance
- ✅ **Indexes**: Optimized for common queries
- ✅ **Triggers**: Auto-update timestamps
- ✅ **Constraints**: Data integrity validation

### Sync Support
- ✅ **Sync Logging**: Track all data changes
- ✅ **Status Views**: Monitor sync progress
- ✅ **Offline Support**: Queue operations when offline

## 🚀 Next Steps

After successful database setup:

1. **Update Environment Variables**
   - Copy your Supabase URL and API key
   - Add to `.env.local` file

2. **Test the Application**
   - Run `npm run dev`
   - Try adding farmers, lands, crops
   - Check sync status in Settings

3. **Deploy to Production**
   - Use deployment scripts: `npm run deploy`
   - Set environment variables in Vercel/Netlify

4. **Monitor Performance**
   - Check sync status regularly
   - Monitor for failed operations
   - Review database logs in Supabase dashboard

## 📞 Support

If you continue having issues:

1. **Check Supabase Logs**
   - Go to Supabase Dashboard > Logs
   - Look for database errors

2. **Verify Permissions**
   - Ensure you have admin access to the project
   - Check API key permissions

3. **Test Basic Connection**
   ```sql
   SELECT NOW(); -- Should return current timestamp
   ```

4. **Contact Support**
   - Supabase Community: [discord.gg/supabase](https://discord.gg/supabase)
   - Documentation: [supabase.com/docs](https://supabase.com/docs)

---

*This guide is part of the AgriTracker Pro farmers management system* 🌾