# Supabase Database Integration Setup Guide

This guide will help you set up Supabase database integration for the AgriTracker Pro application.

## Prerequisites

1. A Supabase account (sign up at [supabase.com](https://supabase.com))
2. Basic understanding of SQL and database concepts

## Step 1: Create a New Supabase Project

1. Log in to your Supabase dashboard
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `agritracker-pro` (or your preferred name)
   - **Database Password**: Create a strong password and save it
   - **Region**: Choose the region closest to your users
5. Click "Create new project"
6. Wait for the project to be created (this may take a few minutes)

## Step 2: Set Up Database Schema

1. In your Supabase dashboard, navigate to the **SQL Editor**
2. Copy the entire content from `DATABASE_SCHEMA.sql` file in your project
3. Paste it into the SQL Editor
4. Click **Run** to execute the schema creation

This will create:
- All necessary tables (`farmers`, `lands`, `crops`, `transactions`, `sync_log`)
- Proper relationships and foreign keys
- Indexes for better performance
- Row Level Security (RLS) policies
- Triggers for automatic timestamp updates
- Sample data (optional)

## Step 3: Configure Authentication (Optional)

If you want to add user authentication:

1. Go to **Authentication** > **Settings**
2. Configure your preferred authentication providers
3. Update the RLS policies if needed for multi-user scenarios

For single-user applications, you can disable RLS temporarily:
```sql
-- Disable RLS for single-user setup (not recommended for production)
ALTER TABLE farmers DISABLE ROW LEVEL SECURITY;
ALTER TABLE lands DISABLE ROW LEVEL SECURITY;
ALTER TABLE crops DISABLE ROW LEVEL SECURITY;
ALTER TABLE transactions DISABLE ROW LEVEL SECURITY;
ALTER TABLE sync_log DISABLE ROW LEVEL SECURITY;
```

## Step 4: Get Your Project Credentials

1. Go to **Settings** > **API**
2. Copy the following values:
   - **Project URL**: `https://your-project-id.supabase.co`
   - **API Key**: Copy the `anon public` key

## Step 5: Configure the Application

1. Start your AgriTracker Pro application
2. Navigate to **Settings** > **Supabase Configuration**
3. Enter your Project URL and API Key
4. Click **Test Connection** to verify the setup
5. If successful, click **Save Configuration**

## Step 6: Data Migration (Optional)

If you have existing data in localStorage, the application will automatically:
- Continue using local data when offline
- Sync data to Supabase when online
- Handle conflicts using last-write-wins strategy

To manually migrate existing data:
1. Export your current data from the application
2. Use the SQL Editor to insert data into the appropriate tables
3. Restart the application to sync

## Features Included

### Database Operations
- ✅ Create, Read, Update, Delete operations for all entities
- ✅ Real-time data synchronization
- ✅ Offline support with automatic sync when online
- ✅ Conflict resolution
- ✅ Data validation and error handling

### Security
- ✅ Row Level Security (RLS) policies
- ✅ User-based data isolation
- ✅ API key validation
- ✅ Connection testing

### Performance
- ✅ Database indexes for fast queries
- ✅ Optimized data fetching
- ✅ Local caching for offline access
- ✅ Background synchronization

## Troubleshooting

### Connection Issues

**Error: "Invalid Supabase URL format"**
- Ensure URL follows format: `https://your-project-id.supabase.co`
- No trailing slashes or additional paths

**Error: "Invalid API key format"**
- Use the `anon public` key from API settings
- Key should start with `eyJ` and be ~100+ characters long

**Error: "Connection failed"**
- Check your internet connection
- Verify project is active in Supabase dashboard
- Ensure API key has correct permissions

### Data Issues

**No data appears after setup**
- Check if RLS policies are properly configured
- Verify you're authenticated (if using auth)
- Check browser console for error messages

**Sync not working**
- Ensure you're online
- Check sync status in the navigation sidebar
- Look for pending changes indicator

**Data conflicts**
- The app uses last-write-wins for conflict resolution
- Manual conflict resolution can be implemented if needed

### Performance Issues

**Slow data loading**
- Check your internet connection
- Consider adding more database indexes
- Verify you're not fetching unnecessary data

## Advanced Configuration

### Custom Indexes
Add additional indexes for better performance:
```sql
-- Example: Index for frequently searched fields
CREATE INDEX idx_farmers_name ON farmers(first_name, last_name);
CREATE INDEX idx_crops_type_status ON crops(crop_type, status);
```

### Backup Strategy
Set up automated backups in Supabase dashboard:
1. Go to **Settings** > **Database**
2. Configure backup schedule
3. Set retention period

### Monitoring
Monitor your database usage:
1. **Dashboard** shows real-time metrics
2. **Logs** section for debugging
3. Set up alerts for resource usage

## Support

If you encounter issues:
1. Check the browser console for error messages
2. Review the Supabase logs in your dashboard
3. Verify your schema matches the provided SQL
4. Ensure all environment variables are correctly set

## Security Best Practices

1. **Never expose your service role key** - only use the anon public key in the frontend
2. **Use RLS policies** to secure your data
3. **Regularly rotate API keys** if needed
4. **Monitor database access** through Supabase dashboard
5. **Keep your schema up to date** with application changes

## Data Backup

Regular backups are automatically handled by Supabase, but you can also:
1. Export data periodically using the SQL Editor
2. Use the built-in export functionality in the application
3. Set up automated backup scripts if needed

---

Your AgriTracker Pro application is now fully integrated with Supabase! The app will automatically handle online/offline scenarios, sync data in the background, and provide a seamless experience for managing agricultural data. 