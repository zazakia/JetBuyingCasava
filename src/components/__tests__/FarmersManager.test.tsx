import { describe, it, expect, vi, beforeEach } from 'vitest'
import { screen, waitFor } from '@testing-library/react'
import { customRender, mockFarmers, userEvent } from '../../test/utils'
import { FarmersManager } from '../FarmersManager'

describe('FarmersManager', () => {
  const mockOnAddFarmer = vi.fn()
  const mockOnUpdateFarmer = vi.fn()
  const mockOnDeleteFarmer = vi.fn()

  const mockLands = [
    {
      id: 'land-1',
      farmerId: 'farmer-1',
      name: 'Land 1',
      area: 1.5,
      location: 'Location 1',
      barangay: 'Barangay 1',
      municipality: 'Municipality 1',
      province: 'Province 1',
      soilType: 'Loam',
      dateAcquired: '2022-01-01',
      coordinates: { lat: 10.0, lng: 123.0 },
    },
    {
      id: 'land-2',
      farmerId: 'farmer-2',
      name: 'Land 2',
      area: 2.0,
      location: 'Location 2',
      barangay: 'Barangay 2',
      municipality: 'Municipality 2',
      province: 'Province 2',
      soilType: 'Clay',
      dateAcquired: '2022-02-01',
      coordinates: { lat: 11.0, lng: 124.0 },
    },
  ];

  const defaultProps = {
    farmers: mockFarmers,
    lands: mockLands,
    onAddFarmer: mockOnAddFarmer,
    onUpdateFarmer: mockOnUpdateFarmer,
    onDeleteFarmer: mockOnDeleteFarmer,
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('renders farmers list correctly', () => {
      customRender(<FarmersManager {...defaultProps} />)
      
      expect(screen.getByText('Farmers Management')).toBeInTheDocument()
      expect(screen.getByText('Juan dela Cruz')).toBeInTheDocument()
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add farmer/i })).toBeInTheDocument()
    })

    it('displays farmer information correctly', () => {
      customRender(<FarmersManager {...defaultProps} />)
      
      // Check if farmer details are displayed
      expect(screen.getByText('+63 912 345 6789')).toBeInTheDocument()
      expect(screen.getByText('San Isidro, Cabanatuan')).toBeInTheDocument()
      expect(screen.getByText('4.3 hectares')).toBeInTheDocument()
    })

    it('shows active status correctly', () => {
      customRender(<FarmersManager {...defaultProps} />)
      
      const activeStatuses = screen.getAllByText('Active')
      expect(activeStatuses).toHaveLength(2) // Both farmers are active
    })
  })

  describe('Search and Filter', () => {
    it('filters farmers by name', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/search farmers/i)
      await user.type(searchInput, 'Juan')
      
      expect(screen.getByText('Juan dela Cruz')).toBeInTheDocument()
      expect(screen.queryByText('Maria Santos')).not.toBeInTheDocument()
    })

    it('filters farmers by phone number', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      const searchInput = screen.getByPlaceholderText(/search farmers/i)
      await user.type(searchInput, '923')
      
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
      expect(screen.queryByText('Juan dela Cruz')).not.toBeInTheDocument()
    })

    it('filters farmers by barangay', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      const barangaySelect = screen.getByDisplayValue('All Barangays')
      await user.selectOptions(barangaySelect, 'San Jose')
      
      expect(screen.getByText('Maria Santos')).toBeInTheDocument()
      expect(screen.queryByText('Juan dela Cruz')).not.toBeInTheDocument()
    })
  })

  describe('Add Farmer Form', () => {
    it('opens add farmer form when button is clicked', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /add farmer/i }))
      
      expect(screen.getByText('Add New Farmer')).toBeInTheDocument()
      expect(screen.getByLabelText(/first name/i)).toBeInTheDocument()
      expect(screen.getByLabelText(/last name/i)).toBeInTheDocument()
    })

    it('validates required fields', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /add farmer/i }))
      await user.click(screen.getByRole('button', { name: /add farmer$/i }))
      
      // Form should not submit without required fields
      expect(mockOnAddFarmer).not.toHaveBeenCalled()
    })

    it('successfully adds a new farmer', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      // Open form
      await user.click(screen.getByRole('button', { name: /add farmer/i }))
      
      // Fill out form
      await user.type(screen.getByLabelText(/first name/i), 'Pedro')
      await user.type(screen.getByLabelText(/last name/i), 'Reyes')
      await user.type(screen.getByLabelText(/phone/i), '+63 934 567 8901')
      await user.type(screen.getByLabelText(/address/i), '789 Farm Lane')
      await user.type(screen.getByLabelText(/barangay/i), 'Santo Tomas')
      await user.type(screen.getByLabelText(/municipality/i), 'Cabanatuan')
      await user.type(screen.getByLabelText(/province/i), 'Nueva Ecija')
      await user.type(screen.getByLabelText(/total hectares/i), '2.5')
      
      // Submit form
      await user.click(screen.getByRole('button', { name: /add farmer$/i }))
      
      await waitFor(() => {
        expect(mockOnAddFarmer).toHaveBeenCalledWith(
          expect.objectContaining({
            firstName: 'Pedro',
            lastName: 'Reyes',
            phone: '+63 934 567 8901',
            address: '789 Farm Lane',
            barangay: 'Santo Tomas',
            municipality: 'Cabanatuan',
            province: 'Nueva Ecija',
            totalHectares: 2.5,
            isActive: true,
          })
        )
      })
    })

    it('closes form when cancel is clicked', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /add farmer/i }))
      expect(screen.getByText('Add New Farmer')).toBeInTheDocument()
      
      await user.click(screen.getByRole('button', { name: /cancel/i }))
      expect(screen.queryByText('Add New Farmer')).not.toBeInTheDocument()
    })
  })

  describe('Edit Farmer', () => {
    it('opens edit form with pre-filled data', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      const editButtons = screen.getAllByRole('button', { name: '' }) // Edit buttons with only icon
      await user.click(editButtons[0]) // Click first edit button
      
      expect(screen.getByText('Edit Farmer')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Juan')).toBeInTheDocument()
      expect(screen.getByDisplayValue('dela Cruz')).toBeInTheDocument()
      expect(screen.getByDisplayValue('+63 912 345 6789')).toBeInTheDocument()
    })

    it('successfully updates farmer data', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      const editButtons = screen.getAllByRole('button', { name: '' })
      await user.click(editButtons[0])
      
      // Update phone number
      const phoneInput = screen.getByDisplayValue('+63 912 345 6789')
      await user.clear(phoneInput)
      await user.type(phoneInput, '+63 912 999 9999')
      
      await user.click(screen.getByRole('button', { name: /update farmer/i }))
      
      await waitFor(() => {
        expect(mockOnUpdateFarmer).toHaveBeenCalledWith(
          expect.objectContaining({
            id: '1',
            phone: '+63 912 999 9999',
          })
        )
      })
    })
  })

  describe('Responsive Design', () => {
    it('renders correctly on mobile view', () => {
      // Mock mobile viewport
      Object.defineProperty(window, 'innerWidth', {
        writable: true,
        configurable: true,
        value: 375,
      })
      
      customRender(<FarmersManager {...defaultProps} />)
      
      expect(screen.getByText('Farmers Management')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add farmer/i })).toBeInTheDocument()
    })
  })

  describe('Empty State', () => {
    it('handles empty farmers list', () => {
      customRender(<FarmersManager {...{ ...defaultProps, farmers: [], lands: mockLands, onDeleteFarmer: mockOnDeleteFarmer }} />)
      
      expect(screen.getByText('Farmers Management')).toBeInTheDocument()
      expect(screen.getByRole('button', { name: /add farmer/i })).toBeInTheDocument()
      // Should show empty grid
      expect(screen.queryByText('Juan dela Cruz')).not.toBeInTheDocument()
    })
  })

  describe('Form Validation', () => {
    it('validates hectares input as number', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /add farmer/i }))
      
      const hectaresInput = screen.getByLabelText(/total hectares/i)
      await user.type(hectaresInput, 'abc')
      
      // Input should only accept numbers
      expect(hectaresInput).toHaveValue(0)
    })

    it('handles optional date fields', async () => {
      const user = userEvent.setup()
      customRender(<FarmersManager {...defaultProps} />)
      
      await user.click(screen.getByRole('button', { name: /add farmer/i }))
      
      // Fill required fields
      await user.type(screen.getByLabelText(/first name/i), 'Test')
      await user.type(screen.getByLabelText(/last name/i), 'User')
      await user.type(screen.getByLabelText(/phone/i), '+63 999 999 9999')
      await user.type(screen.getByLabelText(/address/i), 'Test Address')
      await user.type(screen.getByLabelText(/barangay/i), 'Test Barangay')
      await user.type(screen.getByLabelText(/municipality/i), 'Test Municipality')
      await user.type(screen.getByLabelText(/province/i), 'Test Province')
      
      // Optional date fields should be empty by default
      const plantedDate = screen.getByLabelText(/date planted/i)
      const harvestedDate = screen.getByLabelText(/date harvested/i)
      
      expect(plantedDate).toHaveValue('')
      expect(harvestedDate).toHaveValue('')
      
      await user.click(screen.getByRole('button', { name: /add farmer$/i }))
      
      await waitFor(() => {
        expect(mockOnAddFarmer).toHaveBeenCalled()
      })
    })
  })
}) 