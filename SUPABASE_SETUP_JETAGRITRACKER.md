# JetAgriTracker Supabase Setup Guide

This guide will help you set up Supabase database integration for JetAgriTracker using a custom schema for better organization and data isolation.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Basic understanding of SQL and database schemas

## Step 1: Create a New Supabase Project

1. Log in to your Supabase dashboard
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `jetagritracker` (or your preferred name)
   - **Database Password**: Create a strong password and save it
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Set Up JetAgriTracker Schema

### Option A: Using the SQL Editor (Recommended)
1. In your Supabase dashboard, navigate to the **SQL Editor**
2. Copy the entire content from `DATABASE_SCHEMA_JETAGRITRACKER.sql` file in your project
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema creation

### Option B: Using pgAdmin or another PostgreSQL client
1. Connect to your Supabase database using the connection string from Settings → Database
2. Execute the `DATABASE_SCHEMA_JETAGRITRACKER.sql` script

## What Gets Created

The schema setup creates:

### Database Structure
- **Schema**: `JetAgriTracker` (separate from the default `public` schema)
- **Tables**: 
  - `JetAgriTracker.farmers`
  - `JetAgriTracker.lands` 
  - `JetAgriTracker.crops`
  - `JetAgriTracker.transactions`
  - `JetAgriTracker.sync_log`

### Security & Performance
- Row Level Security (RLS) policies for data isolation
- Indexes for optimized query performance
- Automatic timestamp triggers
- User-based data access controls

### Sample Data
- 3 sample farmers
- 3 sample land records
- 3 sample crop records
- 2 sample transactions

## Step 3: Configure Authentication (Optional)

If you want to add user authentication:

1. Go to **Authentication** > **Settings**
2. Configure your preferred authentication providers
3. The RLS policies are already configured for multi-user scenarios

For single-user applications, you can temporarily disable RLS:
```sql
-- Disable RLS for single-user setup (not recommended for production)
ALTER TABLE JetAgriTracker.farmers DISABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.lands DISABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.crops DISABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE JetAgriTracker.sync_log DISABLE ROW LEVEL SECURITY;
```

## Step 4: Get Your Project Credentials

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **API Key**: Copy the `anon public` key

## Step 5: Configure the Application

### Option A: Using Environment Variables (Recommended)
1. Copy `.env.example` to `.env.local`
2. Fill in your credentials:
   ```env
   VITE_SUPABASE_URL=https://your-project-id.supabase.co
   VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

### Option B: Using the Settings Page
1. Start your JetAgriTracker application
2. Navigate to **Settings** > **Supabase Configuration**
3. Enter your Project URL and API Key
4. Click **Test Connection** to verify the setup
5. If successful, click **Save Configuration**

## Step 6: Verify the Setup

### Test Connection
The application will test the connection by querying the `JetAgriTracker.farmers` table.

### Check Schema
You can verify the schema was created correctly by running:
```sql
SELECT table_name, table_schema 
FROM information_schema.tables 
WHERE table_schema = 'JetAgriTracker';
```

## Benefits of Using JetAgriTracker Schema

### 1. **Data Organization**
- Clean separation from other applications
- Better database structure management
- Easier backup and restore operations

### 2. **Security**
- Schema-level permissions
- Isolated data access
- Reduced risk of data conflicts

### 3. **Performance**
- Optimized indexes for agricultural data
- Faster query execution
- Better resource management

### 4. **Scalability**
- Easy to add new features
- Support for multiple environments
- Future-proof architecture

## Troubleshooting

### Schema Issues

**Error: "schema 'JetAgriTracker' does not exist"**
- Ensure you ran the complete schema creation script
- Check if you have proper permissions in Supabase

**Error: "permission denied for schema JetAgriTracker"**
- Make sure you're using the correct API key
- Verify the schema permissions were granted correctly

### Connection Issues

**Error: "Invalid Supabase URL format"**
- Ensure URL follows format: `https://your-project-id.supabase.co`
- No trailing slashes or additional paths

**Error: "Connection failed"**
- Check your internet connection
- Verify project is active in Supabase dashboard
- Ensure the schema was created successfully

### Data Issues

**No data appears after setup**
- Check if RLS policies are properly configured
- Verify you're authenticated (if using auth)
- Ensure sample data was inserted correctly

## Migration from Public Schema

If you have existing data in the `public` schema, you can migrate it:

```sql
-- Example migration script
INSERT INTO JetAgriTracker.farmers 
SELECT * FROM public.farmers;

INSERT INTO JetAgriTracker.lands 
SELECT * FROM public.lands;

-- Continue for other tables...
```

## Advanced Configuration

### Custom Indexes
Add additional indexes for better performance:
```sql
-- Example: Index for frequently searched fields
CREATE INDEX idx_jetagri_farmers_name ON JetAgriTracker.farmers(first_name, last_name);
CREATE INDEX idx_jetagri_crops_type_status ON JetAgriTracker.crops(crop_type, status);
```

### Monitoring
- Use Supabase dashboard to monitor schema usage
- Set up alerts for resource consumption
- Monitor query performance

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Review the Supabase logs in your dashboard
3. Verify your schema matches the provided SQL
4. Ensure all environment variables are correctly set

---

Your JetAgriTracker application is now ready with a dedicated database schema! The application will automatically handle online/offline scenarios, sync data in the background, and provide a seamless experience for managing agricultural data with improved organization and security.