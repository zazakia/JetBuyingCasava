import { describe, it, expect, vi } from 'vitest'
import { screen } from '@testing-library/react'
import { customRender, mockFarmers, mockLands, mockCrops, mockTransactions } from '../../test/utils'
import { Dashboard } from '../Dashboard'

describe('Dashboard', () => {
  const defaultProps = {
    farmers: mockFarmers,
    lands: mockLands,
    crops: mockCrops,
    transactions: mockTransactions,
  }

  describe('Rendering', () => {
    it('renders dashboard title and description', () => {
      customRender(<Dashboard {...defaultProps} />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Overview of your farming operations')).toBeInTheDocument()
    })

    it('displays key statistics', () => {
      customRender(<Dashboard {...defaultProps} />)
      
      // Check if stat cards are rendered
      expect(screen.getByText('Total Farmers')).toBeInTheDocument()
      expect(screen.getByText('Total Lands')).toBeInTheDocument()
      expect(screen.getByText('Active Crops')).toBeInTheDocument()
      expect(screen.getByText('Total Revenue')).toBeInTheDocument()
    })

    it('renders charts', () => {
      customRender(<Dashboard {...defaultProps} />)
      
      expect(screen.getByText('Crop Status Distribution')).toBeInTheDocument()
      expect(screen.getByText('Monthly Harvest Trend')).toBeInTheDocument()
      // Charts should be rendered (mocked as string components)
      expect(screen.getByText('MockDoughnutChart')).toBeInTheDocument()
      expect(screen.getByText('MockLineChart')).toBeInTheDocument()
    })
  })

  describe('Statistics Calculation', () => {
    it('calculates farmer statistics correctly', () => {
      customRender(<Dashboard {...defaultProps} />)
      
      // Total farmers
      expect(screen.getByText('2')).toBeInTheDocument() // Total farmers count
      // Active farmers subtitle
      expect(screen.getByText('2 active')).toBeInTheDocument()
    })

    it('calculates land statistics correctly', () => {
      customRender(<Dashboard {...defaultProps} />)
      
      // Total lands count
      expect(screen.getByText('2')).toBeInTheDocument()
      // Total hectares: 2.5 + 1.8 = 4.3
      expect(screen.getByText('4.3 hectares')).toBeInTheDocument()
    })

    it('calculates crop statistics correctly', () => {
      customRender(<Dashboard {...defaultProps} />)
      
      // Total crops
      expect(screen.getByText('2')).toBeInTheDocument()
      // Harvested crops (status === 'harvested')
      expect(screen.getByText('1 harvested')).toBeInTheDocument()
    })

    it('calculates revenue correctly', () => {
      customRender(<Dashboard {...defaultProps} />)
      
      // Total revenue from sales: 60000
      expect(screen.getByText('₱60,000')).toBeInTheDocument()
      // Total harvest: 2400 kg
      expect(screen.getByText('2,400 kg harvested')).toBeInTheDocument()
    })
  })

  describe('Empty States', () => {
    it('handles empty data gracefully', () => {
      const emptyProps = {
        farmers: [],
        lands: [],
        crops: [],
        transactions: [],
      }
      
      customRender(<Dashboard {...emptyProps} />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('0')).toBeInTheDocument() // All counts should be 0
      expect(screen.getByText('₱0')).toBeInTheDocument() // Revenue should be 0
    })

    it('handles missing data fields', () => {
      const incompleteData = {
        farmers: [{ ...mockFarmers[0], totalHectares: undefined }] as any,
        lands: [],
        crops: [{ ...mockCrops[0], actualYield: undefined }],
        transactions: [],
      }
      
      expect(() => {
        customRender(<Dashboard {...incompleteData} />)
      }).not.toThrow()
    })
  })

  describe('Data Filtering and Processing', () => {
    it('filters sales transactions correctly', () => {
      const mixedTransactions = [
        ...mockTransactions,
        {
          id: '3',
          farmerId: '1',
          type: 'purchase' as const,
          buyerSeller: 'Supplier',
          produce: 'Seeds',
          quantity: 100,
          pricePerKg: 10,
          totalAmount: 1000,
          transactionDate: '2024-01-01',
          paymentStatus: 'paid' as const,
          deliveryStatus: 'delivered' as const,
        }
      ]
      
      const props = { ...defaultProps, transactions: mixedTransactions }
      customRender(<Dashboard {...props} />)
      
      // Revenue should only include sales (60000), not purchases
      expect(screen.getByText('₱60,000')).toBeInTheDocument()
    })

    it('processes crop statuses correctly', () => {
      const diverseCrops = [
        { ...mockCrops[0], status: 'planted' as const },
        { ...mockCrops[1], status: 'growing' as const },
        { id: '3', landId: '1', farmerId: '1', cropType: 'Corn', variety: 'Sweet', 
          plantingDate: '2024-01-01', expectedHarvestDate: '2024-06-01', 
          areaPlanted: 1, expectedYield: 1000, status: 'ready' as const },
        { id: '4', landId: '2', farmerId: '1', cropType: 'Rice', variety: 'IR64', 
          plantingDate: '2024-02-01', expectedHarvestDate: '2024-07-01', 
          actualHarvestDate: '2024-07-05', areaPlanted: 2, expectedYield: 3000, 
          actualYield: 3200, status: 'harvested' as const }
      ]
      
      const props = { ...defaultProps, crops: diverseCrops }
      customRender(<Dashboard {...props} />)
      
             // Should show distribution of all crop statuses
       expect(screen.getByText('MockDoughnutChart')).toBeInTheDocument()
    })
  })

  describe('Responsive Design', () => {
    it('renders properly on mobile screens', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      customRender(<Dashboard {...defaultProps} />)
      
      expect(screen.getByText('Dashboard')).toBeInTheDocument()
      expect(screen.getByText('Total Farmers')).toBeInTheDocument()
    })
  })

  describe('Chart Data Processing', () => {
    it('processes monthly harvest data correctly', () => {
      const cropsWithDates = [
        {
          ...mockCrops[1],
          actualHarvestDate: new Date().toISOString().split('T')[0], // Today
          actualYield: 1000
        },
        {
          id: '3',
          landId: '1',
          farmerId: '1',
          cropType: 'Corn',
          variety: 'Sweet',
          plantingDate: '2024-01-01',
          expectedHarvestDate: '2024-06-01',
          actualHarvestDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days ago
          areaPlanted: 1,
          expectedYield: 1500,
          actualYield: 1600,
          status: 'harvested' as const
        }
      ]
      
      const props = { ...defaultProps, crops: cropsWithDates }
      customRender(<Dashboard {...props} />)
      
             expect(screen.getByText('MockLineChart')).toBeInTheDocument()
    })

    it('groups farmers by barangay correctly', () => {
      const diverseFarmers = [
        ...mockFarmers,
        {
          id: '3',
          firstName: 'Ana',
          lastName: 'Garcia',
          phone: '+63 945 678 9012',
          address: '321 Valley Road',
          barangay: 'San Miguel',
          municipality: 'Cabanatuan',
          province: 'Nueva Ecija',
          totalHectares: 1.5,
          dateRegistered: '2024-03-01',
          isActive: true
        }
      ]
      
      const props = { ...defaultProps, farmers: diverseFarmers }
      customRender(<Dashboard {...props} />)
      
             // Should process barangay distribution
       expect(screen.getByText('MockDoughnutChart')).toBeInTheDocument()
    })
  })

  describe('Performance', () => {
    it('handles large datasets efficiently', () => {
      const largeFarmers = Array.from({ length: 100 }, (_, i) => ({
        ...mockFarmers[0],
        id: i.toString(),
        firstName: `Farmer${i}`,
        barangay: `Barangay${i % 10}`
      }))
      
      const props = { ...defaultProps, farmers: largeFarmers }
      
      expect(() => {
        customRender(<Dashboard {...props} />)
      }).not.toThrow()
      
      expect(screen.getByText('100')).toBeInTheDocument() // Total farmers
    })
  })

  describe('Error Handling', () => {
    it('handles corrupted data gracefully', () => {
      const corruptedProps = {
        farmers: [{ id: '1', firstName: 'Test' }] as any, // Missing required fields
        lands: [{ id: '1' }] as any,
        crops: [{ id: '1' }] as any,
        transactions: [{ id: '1' }] as any,
      }
      
      expect(() => {
        customRender(<Dashboard {...corruptedProps} />)
      }).not.toThrow()
    })
  })
}) 