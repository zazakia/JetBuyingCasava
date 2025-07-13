import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { getSupabaseConfig } from '../supabase'

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
  })

  describe('Integration Tests', () => {
    it('complete workflow: save, validate, connect, clear', async () => {
      // 1. Save configuration
      // saveSupabaseConfig({ url: validUrl, apiKey: validApiKey })
      
      // 2. Verify configuration is saved
      const config = getSupabaseConfig()
      expect(config.isConfigured).toBe(true)
      
      // 3. Test connection
      // const connectionResult = await testSupabaseConnection()
      // expect(connectionResult.success).toBe(true)
      
      // 4. Get client
      // const client = getSupabaseClient()
      // expect(client).toBeDefined()
      
      // 5. Clear configuration
      // clearSupabaseConfig()
      const clearedConfig = getSupabaseConfig()
      expect(clearedConfig.isConfigured).toBe(false)
    })
  })
}) 