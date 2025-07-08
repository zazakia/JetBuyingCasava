import { describe, it, expect } from 'vitest';
import { testConnection, getSupabaseConfig, getSupabaseClient } from '../supabase';

describe('Supabase Connection', () => {
  describe('getSupabaseConfig', () => {
    it('should return empty config when env variables are not set', () => {
      // Clear environment variables
      import.meta.env.VITE_SUPABASE_URL = '';
      import.meta.env.VITE_SUPABASE_ANON_KEY = '';

      const config = getSupabaseConfig();
      expect(config).toEqual({
        url: '',
        apiKey: '',
        isConfigured: false
      });
    });

    it('should return configured when env variables are set', () => {
      // Set environment variables
      import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-key';

      const config = getSupabaseConfig();
      expect(config).toEqual({
        url: 'https://test.supabase.co',
        apiKey: 'test-key',
        isConfigured: true
      });
    });
  });

  describe('getSupabaseClient', () => {
    it('should return null when not configured', () => {
      // Clear environment variables
      import.meta.env.VITE_SUPABASE_URL = '';
      import.meta.env.VITE_SUPABASE_ANON_KEY = '';

      const client = getSupabaseClient();
      expect(client).toBeNull();
    });

    it('should return client when configured', () => {
      // Set environment variables
      import.meta.env.VITE_SUPABASE_URL = 'https://test.supabase.co';
      import.meta.env.VITE_SUPABASE_ANON_KEY = 'test-key';

      const client = getSupabaseClient();
      expect(client).toBeTruthy();
    });
  });

  describe('testConnection', () => {
    it('should return failure when Supabase is not configured', async () => {
      // Clear environment variables
      import.meta.env.VITE_SUPABASE_URL = '';
      import.meta.env.VITE_SUPABASE_ANON_KEY = '';

      const result = await testConnection();
      expect(result).toEqual({
        success: false,
        message: 'Supabase not configured'
      });
    });

    it('should use correct schema name in table reference', async () => {
      // This test validates that the code references the correct schema name
      const fs = await import('fs');
      const path = await import('path');
      
      const supabaseFilePath = path.join(__dirname, '../supabase.ts');
      const supabaseContent = fs.readFileSync(supabaseFilePath, 'utf8');
      
      // Check that the file contains the correct schema name
      expect(supabaseContent).toContain('jetagritracker.farmers');
      expect(supabaseContent).not.toContain('JetAgriTracker.farmers');
    });

    it('should handle various error conditions gracefully', async () => {
      // Clear environment variables to trigger "not configured" path
      import.meta.env.VITE_SUPABASE_URL = '';
      import.meta.env.VITE_SUPABASE_ANON_KEY = '';

      const result = await testConnection();
      
      // Should be an object with success and message properties
      expect(result).toHaveProperty('success');
      expect(result).toHaveProperty('message');
      expect(typeof result.success).toBe('boolean');
      expect(typeof result.message).toBe('string');
    });
  });

  describe('Schema Name Validation', () => {
    it('should use lowercase schema name throughout codebase', async () => {
      const fs = await import('fs');
      const path = await import('path');
      
      const supabaseFilePath = path.join(__dirname, '../supabase.ts');
      const supabaseContent = fs.readFileSync(supabaseFilePath, 'utf8');
      
      // Count occurrences of schema references
      const lowercaseMatches = (supabaseContent.match(/jetagritracker\./g) || []).length;
      const uppercaseMatches = (supabaseContent.match(/JetAgriTracker\./g) || []).length;
      
      // All schema references should be lowercase
      expect(lowercaseMatches).toBeGreaterThan(0);
      expect(uppercaseMatches).toBe(0);
    });
  });
});