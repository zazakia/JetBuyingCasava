import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import {
  getSupabaseConfig,
  saveSupabaseConfig,
  clearSupabaseConfig,
  testSupabaseConnection,
  validateSupabaseUrl,
  validateApiKey,
  initializeSupabaseClient,
  getSupabaseClient
} from '../supabase'

// Mock @supabase/supabase-js
const mockCreateClient = vi.fn()
const mockGetSession = vi.fn()

vi.mock('@supabase/supabase-js', () => ({
  createClient: mockCreateClient
}))

describe('Supabase Utility Functions', () => {
  const validUrl = 'https://test-project.supabase.co'
  const validApiKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InRlc3QtcHJvamVjdCIsInJvbGUiOiJhbm9uIiwiaWF0IjoxNjQwOTk1MjAwLCJleHAiOjE5NTY1NzEyMDB9.test'

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
    
    // Mock successful Supabase client
    mockCreateClient.mockReturnValue({
      auth: {
        getSession: mockGetSession
      }
    })
    
    mockGetSession.mockResolvedValue({
      data: null,
      error: null
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  describe('Configuration Management', () => {
    describe('getSupabaseConfig', () => {
      it('returns default config when no data in localStorage', () => {
        const config = getSupabaseConfig()
        
        expect(config).toEqual({
          url: '',
          apiKey: '',
          isConfigured: false
        })
      })

      it('returns stored config from localStorage', () => {
        const storedConfig = {
          url: validUrl,
          apiKey: validApiKey,
          timestamp: new Date().toISOString()
        }
        
        localStorage.setItem('agritracker_supabase_config', JSON.stringify(storedConfig))
        
        const config = getSupabaseConfig()
        
        expect(config).toEqual({
          url: validUrl,
          apiKey: validApiKey,
          isConfigured: true
        })
      })

      it('handles corrupted localStorage data gracefully', () => {
        localStorage.setItem('agritracker_supabase_config', 'invalid-json')
        
        const config = getSupabaseConfig()
        
        expect(config).toEqual({
          url: '',
          apiKey: '',
          isConfigured: false
        })
      })

      it('handles missing fields in stored config', () => {
        const incompleteConfig = { url: validUrl }
        localStorage.setItem('agritracker_supabase_config', JSON.stringify(incompleteConfig))
        
        const config = getSupabaseConfig()
        
        expect(config).toEqual({
          url: validUrl,
          apiKey: '',
          isConfigured: false
        })
      })
    })

    describe('saveSupabaseConfig', () => {
      it('saves config to localStorage', () => {
        const config = {
          url: validUrl,
          apiKey: validApiKey
        }
        
        saveSupabaseConfig(config)
        
        const stored = localStorage.getItem('agritracker_supabase_config')
        const parsedStored = JSON.parse(stored!)
        
        expect(parsedStored.url).toBe(validUrl)
        expect(parsedStored.apiKey).toBe(validApiKey)
        expect(parsedStored.timestamp).toBeDefined()
      })

      it('trims whitespace from inputs', () => {
        const config = {
          url: `  ${validUrl}  `,
          apiKey: `  ${validApiKey}  `
        }
        
        saveSupabaseConfig(config)
        
        const stored = localStorage.getItem('agritracker_supabase_config')
        const parsedStored = JSON.parse(stored!)
        
        expect(parsedStored.url).toBe(validUrl)
        expect(parsedStored.apiKey).toBe(validApiKey)
      })

      it('throws error when localStorage fails', () => {
        // Mock localStorage.setItem to throw
        const originalSetItem = localStorage.setItem
        localStorage.setItem = vi.fn(() => {
          throw new Error('localStorage full')
        })
        
        expect(() => {
          saveSupabaseConfig({ url: validUrl, apiKey: validApiKey })
        }).toThrow('Failed to save Supabase configuration')
        
        localStorage.setItem = originalSetItem
      })
    })

    describe('clearSupabaseConfig', () => {
      it('removes config from localStorage', () => {
        localStorage.setItem('agritracker_supabase_config', JSON.stringify({ url: validUrl }))
        
        clearSupabaseConfig()
        
        expect(localStorage.getItem('agritracker_supabase_config')).toBeNull()
      })

      it('handles errors gracefully', () => {
        const originalRemoveItem = localStorage.removeItem
        localStorage.removeItem = vi.fn(() => {
          throw new Error('localStorage error')
        })
        
        expect(() => clearSupabaseConfig()).not.toThrow()
        
        localStorage.removeItem = originalRemoveItem
      })
    })
  })

  describe('Validation Functions', () => {
    describe('validateSupabaseUrl', () => {
      it('accepts valid Supabase URLs', () => {
        const validUrls = [
          'https://test-project.supabase.co',
          'https://my-app.supabase.co',
          'https://localhost:54321',
          'http://localhost:54321'
        ]
        
        validUrls.forEach(url => {
          expect(validateSupabaseUrl(url)).toBe(true)
        })
      })

      it('rejects invalid URLs', () => {
        const invalidUrls = [
          'not-a-url',
          'ftp://invalid.com',
          '',
          'https://google.com', // Valid URL but not Supabase
          'invalid-format'
        ]
        
        invalidUrls.forEach(url => {
          expect(validateSupabaseUrl(url)).toBe(false)
        })
      })
    })

    describe('validateApiKey', () => {
      it('accepts valid API key format', () => {
        const validKeys = [
          validApiKey,
          'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSJ9.signature',
          'abcdefghijklmnopqrstuvwxyz.1234567890-_'
        ]
        
        validKeys.forEach(key => {
          expect(validateApiKey(key)).toBe(true)
        })
      })

      it('rejects invalid API key format', () => {
        const invalidKeys = [
          '',
          'short',
          'contains spaces and invalid chars!',
          'has@invalid#characters',
          'toolongbuthasinvalidcharacters'
        ]
        
        invalidKeys.forEach(key => {
          expect(validateApiKey(key)).toBe(false)
        })
      })
    })
  })

  describe('Client Management', () => {
    describe('initializeSupabaseClient', () => {
      it('returns null when not configured', () => {
        const client = initializeSupabaseClient()
        expect(client).toBeNull()
      })

      it('creates client when properly configured', () => {
        saveSupabaseConfig({ url: validUrl, apiKey: validApiKey })
        
        const client = initializeSupabaseClient()
        
        expect(mockCreateClient).toHaveBeenCalledWith(validUrl, validApiKey, {
          auth: {
            persistSession: true,
            autoRefreshToken: true,
          },
        })
        expect(client).toBeDefined()
      })

      it('handles invalid URL gracefully', () => {
        saveSupabaseConfig({ url: 'invalid-url', apiKey: validApiKey })
        
        const client = initializeSupabaseClient()
        
        expect(client).toBeNull()
      })
    })

    describe('getSupabaseClient', () => {
      it('returns existing client instance', () => {
        saveSupabaseConfig({ url: validUrl, apiKey: validApiKey })
        
        const client1 = getSupabaseClient()
        const client2 = getSupabaseClient()
        
        expect(client1).toBe(client2) // Same instance
      })

      it('initializes client if not exists', () => {
        saveSupabaseConfig({ url: validUrl, apiKey: validApiKey })
        
        const client = getSupabaseClient()
        
        expect(mockCreateClient).toHaveBeenCalled()
        expect(client).toBeDefined()
      })
    })
  })

  describe('Connection Testing', () => {
    describe('testSupabaseConnection', () => {
      it('returns success for valid connection', async () => {
        saveSupabaseConfig({ url: validUrl, apiKey: validApiKey })
        mockGetSession.mockResolvedValue({ data: null, error: null })
        
        const result = await testSupabaseConnection()
        
        expect(result).toEqual({
          success: true,
          message: 'Connection successful'
        })
      })

      it('returns error when client not initialized', async () => {
        const result = await testSupabaseConnection()
        
        expect(result).toEqual({
          success: false,
          message: 'Supabase client not initialized'
        })
      })

      it('handles Supabase auth errors', async () => {
        saveSupabaseConfig({ url: validUrl, apiKey: validApiKey })
        mockGetSession.mockResolvedValue({
          data: null,
          error: { message: 'Invalid API key' }
        })
        
        const result = await testSupabaseConnection()
        
        expect(result).toEqual({
          success: false,
          message: 'Connection failed: Invalid API key'
        })
      })

      it('handles network errors', async () => {
        saveSupabaseConfig({ url: validUrl, apiKey: validApiKey })
        mockGetSession.mockRejectedValue(new Error('Network error'))
        
        const result = await testSupabaseConnection()
        
        expect(result).toEqual({
          success: false,
          message: 'Connection error: Network error'
        })
      })

      it('handles unknown errors', async () => {
        saveSupabaseConfig({ url: validUrl, apiKey: validApiKey })
        mockGetSession.mockRejectedValue('Unknown error')
        
        const result = await testSupabaseConnection()
        
        expect(result).toEqual({
          success: false,
          message: 'Connection error: Unknown error'
        })
      })
    })
  })

  describe('Integration Tests', () => {
    it('complete workflow: save, validate, connect, clear', async () => {
      // 1. Save configuration
      saveSupabaseConfig({ url: validUrl, apiKey: validApiKey })
      
      // 2. Verify configuration is saved
      const config = getSupabaseConfig()
      expect(config.isConfigured).toBe(true)
      
      // 3. Test connection
      const connectionResult = await testSupabaseConnection()
      expect(connectionResult.success).toBe(true)
      
      // 4. Get client
      const client = getSupabaseClient()
      expect(client).toBeDefined()
      
      // 5. Clear configuration
      clearSupabaseConfig()
      const clearedConfig = getSupabaseConfig()
      expect(clearedConfig.isConfigured).toBe(false)
    })
  })
}) 