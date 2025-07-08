import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { getSupabaseClient } from '../utils/supabase';
import type { 
  AuthContextType, 
  User, 
  LoginCredentials, 
  RegisterData,
  UserProfile 
} from '../types';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const client = getSupabaseClient();

  // Transform Supabase user + profile to our User type
  const transformUser = (supabaseUser: SupabaseUser, profile: UserProfile): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
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

  // Fetch user profile from our custom table
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('jetagritracker.user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      return data as UserProfile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (!client) {
      setIsLoading(false);
      return;
    }

    // Get initial session
    const getInitialSession = async () => {
      try {
        const { data: { session }, error } = await client.auth.getSession();
        
        if (error) {
          console.error('Error getting session:', error);
          setError(error.message);
          setIsLoading(false);
          return;
        }

        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            setUser(transformUser(session.user, profile));
          } else {
            console.warn('No user profile found for user:', session.user.id);
            setUser(null);
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user) {
          const profile = await fetchUserProfile(session.user.id);
          if (profile) {
            setUser(transformUser(session.user, profile));
          } else {
            console.warn('No user profile found for user:', session.user.id);
            setUser(null);
          }
        } else {
          setUser(null);
        }
        
        setIsLoading(false);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [client]);

  const login = async (credentials: LoginCredentials): Promise<void> => {
    if (!client) {
      throw new Error('Supabase not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data, error } = await client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        throw error;
      }

      if (data.user) {
        const profile = await fetchUserProfile(data.user.id);
        if (profile) {
          setUser(transformUser(data.user, profile));
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    if (!client) {
      throw new Error('Supabase not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { data: authData, error: authError } = await client.auth.signUp({
        email: data.email,
        password: data.password,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/verify`,
          data: {
            first_name: data.firstName || '',
            last_name: data.lastName || '',
            role: data.role || 'user',
            organization: data.organization || '',
            phone: data.phone || ''
          }
        }
      });

      if (authError) {
        throw authError;
      }

      // Profile will be created automatically by database trigger
      if (authData.user) {
        // Mark that user just registered for auto-verification
        localStorage.setItem(`just_registered_${authData.user.id}`, 'true');
        
        // Wait a moment for the trigger to complete
        setTimeout(async () => {
          const profile = await fetchUserProfile(authData.user!.id);
          if (profile) {
            setUser(transformUser(authData.user!, profile));
          }
        }, 1000);
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Registration failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async (): Promise<void> => {
    if (!client) {
      throw new Error('Supabase not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      const { error } = await client.auth.signOut();
      
      if (error) {
        throw error;
      }

      setUser(null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Logout failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfile = async (profileData: Partial<User>): Promise<void> => {
    if (!client || !user) {
      throw new Error('Not authenticated');
    }

    setError(null);

    try {
      const updateData = {
        first_name: profileData.firstName,
        last_name: profileData.lastName,
        phone: profileData.phone,
        organization: profileData.organization,
        profile_picture: profileData.profilePicture,
        role: profileData.role,
        is_active: profileData.isActive
      };

      // Remove undefined values
      const cleanData = Object.fromEntries(
        Object.entries(updateData).filter(([, value]) => value !== undefined)
      );

      const { data, error } = await client
        .from('jetagritracker.user_profiles')
        .update(cleanData)
        .eq('user_id', user.id)
        .select()
        .single();

      if (error) {
        throw error;
      }

      // Update local user state
      setUser(prev => prev ? { ...prev, ...profileData } : null);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Profile update failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const resetPassword = async (email: string): Promise<void> => {
    if (!client) {
      throw new Error('Supabase not configured');
    }

    setError(null);

    try {
      const { error } = await client.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`
      });

      if (error) {
        throw error;
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Password reset failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    }
  };

  const clearError = () => {
    setError(null);
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isLoading,
    error,
    login,
    register,
    logout,
    updateProfile,
    resetPassword,
    clearError
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};