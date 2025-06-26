import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { customRender, userEvent } from '../test/utils'
import App from '../App'

describe('App Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  describe('Initial App State', () => {
    it('renders with default dashboard view', () => {
      customRender(<App />)
      
      expect(screen.getByText('AgriTracker Pro')).toBeInTheDocument()
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Overview of your farming operations')).toBeInTheDocument()
    })

    it('initializes with empty data', () => {
      customRender(<App />)
      
      // Should show zero counts initially
      expect(screen.getByText('₱0')).toBeInTheDocument() // Revenue
      expect(screen.getAllByText('0')).toHaveLength(3) // Farmers, Lands, Crops counts
    })
  })

  describe('Navigation', () => {
    it('navigates between all modules', async () => {
      const user = userEvent.setup()
      customRender(<App />)
      
      // Test navigation to each module
      const modules = [
        { name: 'Farmers', text: 'Farmers Management' },
        { name: 'Lands', text: 'Land Management' },
        { name: 'Crops', text: 'Crop Management' },
        { name: 'Transactions', text: 'Transaction Management' },
        { name: 'Reports', text: 'Reports & Analytics' },
        { name: 'Analytics', text: 'Analytics Dashboard' },
        { name: 'Settings', text: 'Settings' }
      ]
      
      for (const module of modules) {
        await user.click(screen.getByRole('button', { name: module.name }))
        expect(screen.getByText(module.text)).toBeInTheDocument()
      }
      
      // Navigate back to Dashboard
      await user.click(screen.getByRole('button', { name: 'Dashboard' }))
      expect(screen.getByText('Overview of your farming operations')).toBeInTheDocument()
    })
  })

  describe('Complete CRUD Workflow', () => {
    it('performs complete farmer-land-crop-transaction workflow', async () => {
      const user = userEvent.setup()
      customRender(<App />)
      
      // 1. Add a farmer
      await user.click(screen.getByRole('button', { name: 'Farmers' }))
      await user.click(screen.getByRole('button', { name: /add farmer/i }))
      
      // Fill farmer form
      await user.type(screen.getByLabelText(/first name/i), 'Juan')
      await user.type(screen.getByLabelText(/last name/i), 'dela Cruz')
      await user.type(screen.getByLabelText(/phone/i), '+63 912 345 6789')
      await user.type(screen.getByLabelText(/address/i), '123 Farm Street')
      await user.type(screen.getByLabelText(/barangay/i), 'San Isidro')
      await user.type(screen.getByLabelText(/municipality/i), 'Cabanatuan')
      await user.type(screen.getByLabelText(/province/i), 'Nueva Ecija')
      await user.type(screen.getByLabelText(/total hectares/i), '5.0')
      
      await user.click(screen.getByRole('button', { name: /add farmer$/i }))
      
      // Verify farmer was added
      await waitFor(() => {
        expect(screen.getByText('Juan dela Cruz')).toBeInTheDocument()
      })
      
      // 2. Add a land for the farmer
      await user.click(screen.getByRole('button', { name: 'Lands' }))
      await user.click(screen.getByRole('button', { name: /add land/i }))
      
      // Fill land form
      await user.type(screen.getByLabelText(/land name/i), 'Main Field')
      await user.type(screen.getByLabelText(/area/i), '3.0')
      await user.type(screen.getByLabelText(/location/i), 'North sector')
      await user.type(screen.getByLabelText(/barangay/i), 'San Isidro')
      await user.type(screen.getByLabelText(/municipality/i), 'Cabanatuan')
      await user.type(screen.getByLabelText(/province/i), 'Nueva Ecija')
      await user.type(screen.getByLabelText(/soil type/i), 'Clay loam')
      
      await user.click(screen.getByRole('button', { name: /add land$/i }))
      
      // Verify land was added
      await waitFor(() => {
        expect(screen.getByText('Main Field')).toBeInTheDocument()
      })
      
      // 3. Add a crop
      await user.click(screen.getByRole('button', { name: 'Crops' }))
      await user.click(screen.getByRole('button', { name: /add crop/i }))
      
      // Fill crop form
      await user.type(screen.getByLabelText(/crop type/i), 'Cassava')
      await user.type(screen.getByLabelText(/variety/i), 'Golden Yellow')
      await user.type(screen.getByLabelText(/area planted/i), '2.5')
      await user.type(screen.getByLabelText(/expected yield/i), '5000')
      
      const plantingDate = screen.getByLabelText(/planting date/i)
      await user.type(plantingDate, '2024-01-15')
      
      const expectedHarvestDate = screen.getByLabelText(/expected harvest date/i)
      await user.type(expectedHarvestDate, '2024-10-15')
      
      await user.click(screen.getByRole('button', { name: /add crop$/i }))
      
      // Verify crop was added
      await waitFor(() => {
        expect(screen.getByText('Cassava')).toBeInTheDocument()
        expect(screen.getByText('Golden Yellow')).toBeInTheDocument()
      })
      
      // 4. Add a transaction
      await user.click(screen.getByRole('button', { name: 'Transactions' }))
      await user.click(screen.getByRole('button', { name: /add transaction/i }))
      
      // Fill transaction form
      await user.selectOptions(screen.getByLabelText(/transaction type/i), 'sale')
      await user.type(screen.getByLabelText(/buyer\/seller/i), 'Local Market')
      await user.type(screen.getByLabelText(/produce/i), 'Cassava')
      await user.type(screen.getByLabelText(/quantity/i), '1000')
      await user.type(screen.getByLabelText(/price per kg/i), '15')
      
      const transactionDate = screen.getByLabelText(/transaction date/i)
      await user.type(transactionDate, '2024-10-20')
      
      await user.click(screen.getByRole('button', { name: /add transaction$/i }))
      
      // Verify transaction was added
      await waitFor(() => {
        expect(screen.getByText('Local Market')).toBeInTheDocument()
        expect(screen.getByText('₱15,000')).toBeInTheDocument() // 1000 * 15
      })
      
      // 5. Verify dashboard updates
      await user.click(screen.getByRole('button', { name: 'Dashboard' }))
      
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument() // Farmer count
        expect(screen.getByText('₱15,000')).toBeInTheDocument() // Revenue
      })
    })
  })

  describe('Data Persistence', () => {
    it('persists data in localStorage', async () => {
      const user = userEvent.setup()
      customRender(<App />)
      
      // Add a farmer
      await user.click(screen.getByRole('button', { name: 'Farmers' }))
      await user.click(screen.getByRole('button', { name: /add farmer/i }))
      
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'Farmer')
      await user.type(screen.getByLabelText(/phone/i), '+63 999 999 9999')
      await user.type(screen.getByLabelText(/address/i), 'Test Address')
      await user.type(screen.getByLabelText(/barangay/i), 'Test Barangay')
      await user.type(screen.getByLabelText(/municipality/i), 'Test Municipality')
      await user.type(screen.getByLabelText(/province/i), 'Test Province')
      
      await user.click(screen.getByRole('button', { name: /add farmer$/i }))
      
      await waitFor(() => {
        expect(screen.getByText('Test Farmer')).toBeInTheDocument()
      })
      
      // Check localStorage
      const farmers = JSON.parse(localStorage.getItem('agritracker_farmers') || '[]')
      expect(farmers).toHaveLength(1)
      expect(farmers[0].firstName).toBe('Test')
      expect(farmers[0].lastName).toBe('Farmer')
    })

    it('loads data from localStorage on app start', () => {
      // Pre-populate localStorage
      const testFarmer = {
        id: 'test-id',
        firstName: 'Stored',
        lastName: 'Farmer',
        phone: '+63 888 888 8888',
        address: 'Stored Address',
        barangay: 'Stored Barangay',
        municipality: 'Stored Municipality',
        province: 'Stored Province',
        totalHectares: 2.0,
        dateRegistered: '2024-01-01',
        isActive: true
      }
      
      localStorage.setItem('agritracker_farmers', JSON.stringify([testFarmer]))
      
      // Render app
      customRender(<App />)
      
      // Navigate to farmers
      const user = userEvent.setup()
      user.click(screen.getByRole('button', { name: 'Farmers' }))
      
      // Should show the stored farmer
      waitFor(() => {
        expect(screen.getByText('Stored Farmer')).toBeInTheDocument()
      })
    })
  })

  describe('Error Handling', () => {
    it('handles localStorage errors gracefully', () => {
      // Mock localStorage to throw errors
      const originalSetItem = localStorage.setItem
      localStorage.setItem = vi.fn(() => {
        throw new Error('localStorage full')
      })
      
      expect(() => {
        customRender(<App />)
      }).not.toThrow()
      
      localStorage.setItem = originalSetItem
    })

    it('handles corrupted localStorage data', () => {
      localStorage.setItem('agritracker_farmers', 'invalid-json')
      localStorage.setItem('agritracker_lands', 'invalid-json')
      localStorage.setItem('agritracker_crops', 'invalid-json')
      localStorage.setItem('agritracker_transactions', 'invalid-json')
      
      expect(() => {
        customRender(<App />)
      }).not.toThrow()
      
      // Should show empty state
      expect(screen.getByText('₱0')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('works on mobile devices', async () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      const user = userEvent.setup()
      customRender(<App />)
      
      // Navigation should work on mobile
      await user.click(screen.getByRole('button', { name: 'Farmers' }))
      expect(screen.getByText('Farmers Management')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles large datasets efficiently', async () => {
      // Pre-populate with large dataset
      const largeFarmerData = Array.from({ length: 1000 }, (_, i) => ({
        id: i.toString(),
        firstName: `Farmer${i}`,
        lastName: `LastName${i}`,
        phone: `+63 900 000 ${i.toString().padStart(4, '0')}`,
        address: `Address ${i}`,
        barangay: `Barangay${i % 10}`,
        municipality: 'Test Municipality',
        province: 'Test Province',
        totalHectares: Math.random() * 10,
        dateRegistered: '2024-01-01',
        isActive: true
      }))
      
      localStorage.setItem('agritracker_farmers', JSON.stringify(largeFarmerData))
      
      const user = userEvent.setup()
      customRender(<App />)
      
      // Should load without performance issues
      await user.click(screen.getByRole('button', { name: 'Farmers' }))
      
      await waitFor(() => {
        expect(screen.getByText('Farmer0')).toBeInTheDocument()
      }, { timeout: 5000 })
    })
  })

  describe('Analytics Integration', () => {
    it('updates analytics after data changes', async () => {
      const user = userEvent.setup()
      customRender(<App />)
      
      // Check initial dashboard
      expect(screen.getAllByText('0')).toHaveLength(3)
      
      // Add farmer
      await user.click(screen.getByRole('button', { name: 'Farmers' }))
      await user.click(screen.getByRole('button', { name: /add farmer/i }))
      
      await user.type(screen.getByLabelText(/first name/i), 'Analytics')
      await user.type(screen.getByLabelText(/last name/i), 'Test')
      await user.type(screen.getByLabelText(/phone/i), '+63 111 111 1111')
      await user.type(screen.getByLabelText(/address/i), 'Test')
      await user.type(screen.getByLabelText(/barangay/i), 'Test')
      await user.type(screen.getByLabelText(/municipality/i), 'Test')
      await user.type(screen.getByLabelText(/province/i), 'Test')
      
      await user.click(screen.getByRole('button', { name: /add farmer$/i }))
      
      // Go back to dashboard
      await user.click(screen.getByRole('button', { name: 'Dashboard' }))
      
      // Analytics should update
      await waitFor(() => {
        expect(screen.getByText('1')).toBeInTheDocument() // Farmer count updated
      })
    })
  })
}) 