import { createClient, SupabaseClient } from '@supabase/supabase-js';

// Supabase configuration interface
export interface SupabaseConfig {
  url: string;
  apiKey: string;
  isConfigured: boolean;
}

// Local storage keys
const SUPABASE_CONFIG_KEY = 'agritracker_supabase_config';

// Supabase client instance
let supabaseClient: SupabaseClient | null = null;

// Get Supabase configuration from localStorage
export function getSupabaseConfig(): SupabaseConfig {
  try {
    const stored = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (stored) {
      const config = JSON.parse(stored);
      return {
        url: config.url || '',
        apiKey: config.apiKey || '',
        isConfigured: !!(config.url && config.apiKey)
      };
    }
  } catch (error) {
    console.error('Error reading Supabase config:', error);
  }
  
  return {
    url: '',
    apiKey: '',
    isConfigured: false
  };
}

// Save Supabase configuration to localStorage
export function saveSupabaseConfig(config: Omit<SupabaseConfig, 'isConfigured'>): void {
  try {
    const configToSave = {
      url: config.url.trim(),
      apiKey: config.apiKey.trim(),
      timestamp: new Date().toISOString()
    };
    
    localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(configToSave));
    
    // Reinitialize client with new config
    initializeSupabaseClient();
  } catch (error) {
    console.error('Error saving Supabase config:', error);
    throw new Error('Failed to save Supabase configuration');
  }
}

// Clear Supabase configuration
export function clearSupabaseConfig(): void {
  try {
    localStorage.removeItem(SUPABASE_CONFIG_KEY);
    supabaseClient = null;
  } catch (error) {
    console.error('Error clearing Supabase config:', error);
  }
}

// Initialize Supabase client
export function initializeSupabaseClient(): SupabaseClient | null {
  const config = getSupabaseConfig();
  
  if (!config.isConfigured) {
    console.warn('Supabase not configured');
    return null;
  }
  
  try {
    // Validate URL format
    new URL(config.url);
    
    supabaseClient = createClient(config.url, config.apiKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
      },
    });
    
    return supabaseClient;
  } catch (error) {
    console.error('Error initializing Supabase client:', error);
    return null;
  }
}

// Get current Supabase client instance
export function getSupabaseClient(): SupabaseClient | null {
  if (!supabaseClient) {
    return initializeSupabaseClient();
  }
  return supabaseClient;
}

// Test Supabase connection
export async function testSupabaseConnection(): Promise<{ success: boolean; message: string }> {
  try {
    const client = getSupabaseClient();
    if (!client) {
      return { success: false, message: 'Supabase client not initialized' };
    }
    
    // Test connection by fetching user session
    const { data, error } = await client.auth.getSession();
    
    if (error) {
      return { success: false, message: `Connection failed: ${error.message}` };
    }
    
    return { success: true, message: 'Connection successful' };
  } catch (error) {
    return { 
      success: false, 
      message: `Connection error: ${error instanceof Error ? error.message : 'Unknown error'}` 
    };
  }
}

// Validate Supabase URL format
export function validateSupabaseUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return parsed.hostname.includes('supabase') || parsed.hostname.includes('localhost');
  } catch {
    return false;
  }
}

// Validate API key format (basic validation)
export function validateApiKey(apiKey: string): boolean {
  return apiKey.length > 20 && /^[a-zA-Z0-9._-]+$/.test(apiKey);
}

// Initialize on module load
initializeSupabaseClient(); 