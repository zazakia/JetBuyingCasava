import { getSupabaseClient } from './supabase';
import type { User, UserProfile } from '../types';

const client = getSupabaseClient();

// Transform database user profile to our User type
export const transformUserProfile = (profile: UserProfile, email: string): User => ({
  id: profile.user_id,
  email,
  firstName: profile.first_name || '',
  lastName: profile.last_name || '',
  role: profile.role,
  isActive: profile.is_active,
  profilePicture: profile.profile_picture,
  phone: profile.phone,
  organization: profile.organization,
  createdAt: profile.created_at,
  lastLoginAt: profile.last_login_at
});

// Get current user profile
export const getCurrentUserProfile = async (): Promise<User | null> => {
  if (!client) return null;

  try {
    const { data, error } = await client.rpc('get_user_profile');

    if (error) {
      console.error('Error fetching user profile:', error);
      return null;
    }

    if (!data || data.length === 0) {
      return null;
    }

    const profile = data[0];
    return {
      id: profile.user_id,
      email: profile.email,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      role: profile.role,
      isActive: profile.is_active,
      profilePicture: profile.profile_picture,
      phone: profile.phone,
      organization: profile.organization,
      createdAt: profile.created_at,
      lastLoginAt: profile.last_login_at
    };
  } catch (error) {
    console.error('Error in getCurrentUserProfile:', error);
    return null;
  }
};

// Update user profile
export const updateUserProfile = async (updates: Partial<UserProfile>): Promise<boolean> => {
  if (!client) return false;

  try {
    const { error } = await client
      .from('jetagritracker.user_profiles')
      .update(updates)
      .eq('user_id', updates.user_id);

    if (error) {
      console.error('Error updating user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in updateUserProfile:', error);
    return false;
  }
};

// Get all users (admin/manager only)
export const getAllUsers = async (): Promise<User[]> => {
  if (!client) return [];

  try {
    // This uses the database function that includes RLS checks
    const { data, error } = await client.rpc('get_user_profile');

    if (error) {
      console.error('Error fetching all users:', error);
      return [];
    }

    return data?.map((profile: any) => ({
      id: profile.user_id,
      email: profile.email,
      firstName: profile.first_name || '',
      lastName: profile.last_name || '',
      role: profile.role,
      isActive: profile.is_active,
      profilePicture: profile.profile_picture,
      phone: profile.phone,
      organization: profile.organization,
      createdAt: profile.created_at,
      lastLoginAt: profile.last_login_at
    })) || [];
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return [];
  }
};

// Create user profile (used by auth trigger)
export const createUserProfile = async (
  userId: string,
  userData: {
    firstName?: string;
    lastName?: string;
    role?: 'admin' | 'manager' | 'user';
    organization?: string;
    phone?: string;
  }
): Promise<boolean> => {
  if (!client) return false;

  try {
    const { error } = await client
      .from('jetagritracker.user_profiles')
      .insert({
        user_id: userId,
        first_name: userData.firstName || '',
        last_name: userData.lastName || '',
        role: userData.role || 'user',
        organization: userData.organization || '',
        phone: userData.phone || '',
        is_active: true
      });

    if (error) {
      console.error('Error creating user profile:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in createUserProfile:', error);
    return false;
  }
};

// Check if user has permission for a specific action
export const hasPermission = (
  user: User | null, 
  action: 'read' | 'write' | 'delete' | 'admin'
): boolean => {
  if (!user || !user.isActive) return false;

  switch (action) {
    case 'admin':
      return user.role === 'admin';
    case 'delete':
      return user.role === 'admin' || user.role === 'manager';
    case 'write':
      return user.role === 'admin' || user.role === 'manager' || user.role === 'user';
    case 'read':
      return true; // All authenticated users can read
    default:
      return false;
  }
};

// Check if user can access organization data
export const canAccessOrganizationData = (
  currentUser: User | null,
  targetUserOrganization?: string
): boolean => {
  if (!currentUser || !currentUser.isActive) return false;

  // Admins can access all data
  if (currentUser.role === 'admin') return true;

  // Managers can access data from their organization or users without organization
  if (currentUser.role === 'manager') {
    if (!targetUserOrganization) return true;
    return currentUser.organization === targetUserOrganization;
  }

  // Regular users can only access their own organization's data
  if (!targetUserOrganization) return true;
  return currentUser.organization === targetUserOrganization;
};

// Sync user's last login time
export const syncLastLogin = async (userId: string): Promise<void> => {
  if (!client) return;

  try {
    await client
      .from('jetagritracker.user_profiles')
      .update({ last_login_at: new Date().toISOString() })
      .eq('user_id', userId);
  } catch (error) {
    console.error('Error syncing last login:', error);
  }
};

// Get user statistics (admin only)
export const getUserStatistics = async (): Promise<{
  totalUsers: number;
  activeUsers: number;
  adminUsers: number;
  managerUsers: number;
  regularUsers: number;
  newUsersThisMonth: number;
} | null> => {
  if (!client) return null;

  try {
    const { data: users, error } = await client
      .from('jetagritracker.user_profiles')
      .select('role, is_active, created_at');

    if (error) {
      console.error('Error fetching user statistics:', error);
      return null;
    }

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    const stats = {
      totalUsers: users.length,
      activeUsers: users.filter(u => u.is_active).length,
      adminUsers: users.filter(u => u.role === 'admin').length,
      managerUsers: users.filter(u => u.role === 'manager').length,
      regularUsers: users.filter(u => u.role === 'user').length,
      newUsersThisMonth: users.filter(u => 
        new Date(u.created_at) >= startOfMonth
      ).length
    };

    return stats;
  } catch (error) {
    console.error('Error in getUserStatistics:', error);
    return null;
  }
};

// Promote user to admin (system function)
export const promoteToAdmin = async (): Promise<boolean> => {
  if (!client) return false;

  try {
    const { error } = await client.rpc('create_admin_user', {});

    if (error) {
      console.error('Error promoting user to admin:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Error in promoteToAdmin:', error);
    return false;
  }
};