# Authentication & User Management Guide

## Overview

AgriTracker Pro now includes a comprehensive authentication system built on Supabase Auth with custom user management and Row Level Security (RLS).

## Architecture

### Authentication Flow
1. **Supabase Auth**: Handles user registration, login, password reset
2. **User Profiles**: Custom table synced with `auth.users` for additional user data
3. **Row Level Security**: Ensures users only access their organization's data
4. **Role-Based Access**: Admin, Manager, and User roles with different permissions

### Database Schema
- **auth.users**: Supabase's built-in user table
- **jetagritracker.user_profiles**: Custom user profiles with roles and organization data
- **Automatic Sync**: Database triggers keep profile data in sync with auth changes

## Setup Instructions

### 1. Database Setup

**⚠️ If you get ANY database errors, use the step-by-step approach:**

See `docs/DATABASE_SETUP_GUIDE.md` for the **recommended step-by-step setup**.

**Alternative options:**

**Fresh installation:**
```sql
-- File: database/AUTH_USER_MANAGEMENT_SCHEMA.sql
```

**Existing installation with conflicts:**
```sql
-- File: database/AUTH_USER_MANAGEMENT_MIGRATION_SAFE.sql
```

### 2. Environment Variables
```bash
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 3. Create Admin User
After first user registers, promote them to admin:
```sql
SELECT jetagritracker.create_admin_user('admin@example.com');
```

## User Roles & Permissions

### Admin
- **Full access** to all data across organizations
- **User management** - create, edit, deactivate users
- **Role management** - promote/demote users
- **System settings** access

### Manager
- **Organization-wide access** to data within their organization
- **User viewing** - can see other users in system
- **Data management** for their organization

### User
- **Organization data access** - can view/edit data for their organization
- **Personal profile** management
- **Standard CRUD operations** within permissions

## Authentication Components

### Login/Register Forms
- **LoginForm**: Email/password authentication
- **RegisterForm**: New user registration with role selection
- **ForgotPasswordForm**: Password reset functionality
- **AuthPage**: Container component managing auth flow

### User Management
- **UserManager**: Admin interface for managing users
- **Navigation**: Includes user profile and logout
- **AuthContext**: React context providing auth state and methods

## Security Features

### Row Level Security (RLS)
All data tables have RLS policies that automatically filter data based on:
- User's organization
- User's role (admin sees all, manager sees organization, user sees organization)
- User's active status

### Data Access Patterns
```typescript
// Automatically filtered by RLS policies
const farmers = await supabase.from('jetagritracker.farmers').select('*');

// Only returns data user has permission to see
```

### Password Security
- Minimum 6 characters required
- Supabase handles password hashing and validation
- Password reset via email with secure tokens

## API Integration

### AuthContext Methods
```typescript
const { 
  user,              // Current user object
  isAuthenticated,   // Boolean auth status
  isLoading,        // Loading state
  error,            // Error messages
  login,            // Login function
  register,         // Registration function
  logout,           // Logout function
  updateProfile,    // Update user profile
  resetPassword,    // Password reset
  clearError        // Clear error state
} = useAuth();
```

### User Profile Operations
```typescript
import { 
  getCurrentUserProfile,
  updateUserProfile,
  getAllUsers,
  hasPermission,
  canAccessOrganizationData
} from '../utils/userProfile';

// Check permissions
if (hasPermission(user, 'admin')) {
  // Admin-only functionality
}

// Update profile
await updateUserProfile({
  user_id: user.id,
  first_name: 'John',
  last_name: 'Doe'
});
```

## Offline Support

### Authentication Caching
- User session persisted locally
- Automatic token refresh
- Graceful offline handling

### Data Synchronization
- User profile changes sync when online
- Role changes reflected immediately
- Organization data filtered consistently

## Testing

### Authentication Tests
```bash
# Run auth-specific tests
pnpm test src/contexts/__tests__/AuthContext.test.tsx

# Run user management tests
pnpm test src/utils/__tests__/userProfile.test.ts
```

### Manual Testing Checklist
- [ ] User registration works
- [ ] Email verification (if enabled)
- [ ] Login with correct credentials
- [ ] Login fails with wrong credentials
- [ ] Password reset email sent
- [ ] User profile updates
- [ ] Role-based access works
- [ ] Logout clears session
- [ ] RLS policies enforce data isolation

## Troubleshooting

### Common Issues

#### "User not found" after registration
- Check database triggers are working
- Verify user_profiles table has RLS policies
- Ensure `get_user_profile` function exists

#### RLS policies blocking data access
- Verify user has correct role assigned
- Check organization assignment matches
- Ensure user is marked as active

#### Authentication state not persisting
- Check Supabase client configuration
- Verify environment variables
- Clear browser storage and retry

### Debug Commands
```sql
-- Check user profile exists
SELECT * FROM jetagritracker.user_profiles WHERE user_id = 'user-uuid';

-- Check RLS policies
SELECT * FROM pg_policies WHERE schemaname = 'jetagritracker';

-- Test user promotion
SELECT jetagritracker.create_admin_user('user@example.com');
```

## Security Best Practices

### Database Security
- Never expose service key in frontend
- Use anon key with RLS policies
- Regularly audit user permissions
- Monitor authentication logs

### Frontend Security
- Never store sensitive data in localStorage
- Validate user permissions before UI actions
- Clear sensitive data on logout
- Use HTTPS in production

### User Management
- Require strong passwords
- Implement account lockout for failed attempts
- Regular user access reviews
- Deactivate rather than delete users

## Migration from Previous Version

If upgrading from a version without authentication:

1. **Backup existing data**
2. **Run auth schema setup**
3. **Create admin user**
4. **Assign organizations to existing data**
5. **Test data access with different user roles**

## Advanced Configuration

### Custom User Fields
Add fields to user_profiles table and update types:
```sql
ALTER TABLE jetagritracker.user_profiles ADD COLUMN department VARCHAR(50);
```

### Organization Management
Implement organization CRUD if needed:
```sql
CREATE TABLE jetagritracker.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
```

### Email Templates
Customize Supabase auth email templates in dashboard:
- Confirmation emails
- Password reset emails
- Magic link emails

## Performance Considerations

### Database Optimization
- Index user_id columns in all tables
- Index organization fields for filtering
- Use partial indexes for active users only

### Frontend Optimization
- Lazy load user management components
- Cache user permissions
- Minimize auth state changes

This authentication system provides enterprise-grade security while maintaining the offline-first approach of AgriTracker Pro.