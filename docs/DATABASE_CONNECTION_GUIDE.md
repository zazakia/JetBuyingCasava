# Database Connection Guide

## Schema Name Important Note

**Critical**: The database schema name is case-sensitive in PostgreSQL/Supabase.

### Current Configuration
- **Schema Name**: `jetagritracker` (all lowercase)
- **Tables**: `farmers`, `lands`, `crops`, `transactions`

### Common Issues
1. **Schema Case Mismatch**: If you created the schema as `JetAgriTracker` (with capitals), PostgreSQL will create it as `jetagritracker` (lowercase) by default.
2. **Application Code**: The application code uses `jetagritracker` (lowercase) to match the actual database schema.

### Testing Database Connection

#### Using the Application
1. Set environment variables:
   ```bash
   VITE_SUPABASE_URL=https://your-project.supabase.co
   VITE_SUPABASE_ANON_KEY=your-anon-key
   ```

2. Use the built-in test function:
   ```typescript
   import { testConnection } from './src/utils/supabase';
   
   const result = await testConnection();
   console.log(result); // { success: boolean, message: string }
   ```

#### Using Unit Tests
```bash
# Run database connection tests
pnpm test src/utils/__tests__/supabase.connection.test.ts

# Run all supabase tests
pnpm test supabase
```

### Expected Responses

#### Success
```json
{
  "success": true,
  "message": "Connection successful"
}
```

#### Configuration Missing
```json
{
  "success": false,
  "message": "Supabase not configured"
}
```

#### Schema/Table Not Found
```json
{
  "success": false,
  "message": "relation \"jetagritracker.farmers\" does not exist"
}
```

### Troubleshooting

1. **Check Schema Exists**:
   ```sql
   SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'jetagritracker';
   ```

2. **Check Tables Exist**:
   ```sql
   SELECT table_name FROM information_schema.tables WHERE table_schema = 'jetagritracker';
   ```

3. **Verify RLS Policies**:
   ```sql
   SELECT * FROM pg_policies WHERE schemaname = 'jetagritracker';
   ```

### Manual Testing in Supabase

1. Go to SQL Editor in Supabase Dashboard
2. Run test query:
   ```sql
   SELECT COUNT(*) FROM jetagritracker.farmers;
   ```
3. Should return `0` or actual count if successful

### Environment Setup

#### Development
```bash
# Copy environment template
cp .env.example .env.local

# Set your Supabase credentials
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

#### Production
Set environment variables in your deployment platform:
- Vercel: Project Settings → Environment Variables
- Netlify: Site Settings → Environment Variables
- Other platforms: Follow their documentation

### Security Notes

1. **Never commit environment variables** to version control
2. **Use environment variables only** - no hardcoded credentials
3. **Anon key is safe for client-side** use (with RLS enabled)
4. **Service key should never be used** in frontend code