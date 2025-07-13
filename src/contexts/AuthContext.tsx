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

  // Transform Supabase user to our User type (with fallback to user_metadata)
  const transformUser = (supabaseUser: SupabaseUser, profile?: UserProfile): User => ({
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    firstName: profile?.first_name || supabaseUser.user_metadata?.first_name || '',
    lastName: profile?.last_name || supabaseUser.user_metadata?.last_name || '',
    role: profile?.role || supabaseUser.user_metadata?.role || 'user',
    isActive: profile?.is_active ?? true,
    profilePicture: profile?.profile_picture || supabaseUser.user_metadata?.profile_picture,
    phone: profile?.phone || supabaseUser.user_metadata?.phone,
    organization: profile?.organization || supabaseUser.user_metadata?.organization,
    createdAt: profile?.created_at || supabaseUser.created_at,
    lastLoginAt: profile?.last_login_at || supabaseUser.last_sign_in_at
  });

  // Fetch user profile from members table
  const fetchUserProfile = async (userId: string): Promise<UserProfile | null> => {
    if (!client) return null;

    try {
      const { data, error } = await client
        .from('members')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error) {
        console.error('Error fetching user profile:', error);
        return null;
      }

      // Transform members table data to UserProfile format
      const profile: UserProfile = {
        id: data.id,
        user_id: data.user_id,
        first_name: data.name?.split(' ')[0] || '',
        last_name: data.name?.split(' ')[1] || '',
        role: data.role === 'admin' ? 'admin' : data.role === 'manager' ? 'manager' : 'user',
        is_active: data.status === 'active' || data.status === 'pending',
        profile_picture: undefined,
        phone: undefined,
        organization: undefined,
        created_at: data.created_at,
        updated_at: data.updated_at,
        last_login_at: undefined
      };

      return profile;
    } catch (error) {
      console.error('Error in fetchUserProfile:', error);
      return null;
    }
  };

  // Initialize auth state
  useEffect(() => {
    if (!client) {
      console.log('No Supabase client available - running in offline mode');
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
          try {
            const profile = await fetchUserProfile(session.user.id);
            setUser(transformUser(session.user, profile || undefined));
          } catch (error) {
            console.warn('Profile fetch failed, using user metadata:', error);
            setUser(transformUser(session.user));
          }
        }
      } catch (error) {
        console.error('Error in getInitialSession:', error);
        setError(error instanceof Error ? error.message : 'Unknown error');
      } finally {
        setIsLoading(false);
      }
    };

    // Add timeout to prevent hanging
    const timeoutId = setTimeout(() => {
      console.warn('Auth initialization timed out - proceeding without auth');
      setIsLoading(false);
    }, 10000);

    getInitialSession().finally(() => {
      clearTimeout(timeoutId);
    });

    // Listen for auth changes
    const { data: { subscription } } = client.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event);
        
        if (session?.user && event !== 'TOKEN_REFRESHED') {
          try {
            const profile = await fetchUserProfile(session.user.id);
            setUser(transformUser(session.user, profile || undefined));
          } catch (error) {
            console.warn('Profile fetch failed, using user metadata:', error);
            setUser(transformUser(session.user));
          }
        } else if (!session?.user) {
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
      const { error } = await client.auth.signInWithPassword({
        email: credentials.email,
        password: credentials.password
      });

      if (error) {
        throw error;
      }

      // User will be set by auth state change listener
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Login failed';
      setError(errorMessage);
      throw new Error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (data: RegisterData): Promise<void> => {
    console.log('Register function called with data:', data);
    
    if (!client) {
      console.error('No Supabase client available');
      throw new Error('Supabase not configured');
    }

    setIsLoading(true);
    setError(null);

    try {
      console.log('Attempting to sign up user...');
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

      console.log('Sign up response:', { authData, authError });

      if (authError) {
        console.error('Auth error:', authError);
        throw authError;
      }

      // Profile will be created automatically by database trigger
      if (authData.user) {
        console.log('User created successfully:', authData.user.id);
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
      console.error('Registration error:', error);
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
      const { error } = await client
        .from('members')
        .update({
          name: `${profileData.firstName || ''} ${profileData.lastName || ''}`.trim(),
          email: user.email,
          role: profileData.role,
          status: profileData.isActive ? 'active' : 'inactive'
        })
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