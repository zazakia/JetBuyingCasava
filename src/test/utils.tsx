import React from 'react'
import { render, RenderOptions } from '@testing-library/react'
import type { Farmer, Land, Crop, Transaction } from '../types'

// Mock data for testing
export const mockFarmers: Farmer[] = [
  {
    id: '1',
    firstName: 'Juan',
    lastName: 'dela Cruz',
    phone: '+63 912 345 6789',
    address: '123 Barangay Street',
    barangay: 'San Isidro',
    municipality: 'Cabanatuan',
    province: 'Nueva Ecija',
    totalHectares: 4.3,
    datePlanted: '2024-03-15',
    dateHarvested: '2024-08-05',
    dateRegistered: '2024-01-15',
    isActive: true
  },
  {
    id: '2',
    firstName: 'Maria',
    lastName: 'Santos',
    phone: '+63 923 456 7890',
    address: '456 Rural Road',
    barangay: 'San Jose',
    municipality: 'Cabanatuan',
    province: 'Nueva Ecija',
    totalHectares: 3.2,
    datePlanted: '2024-02-20',
    dateRegistered: '2024-02-20',
    isActive: true
  }
]

export const mockLands: Land[] = [
  {
    id: '1',
    farmerId: '1',
    name: 'East Field',
    area: 2.5,
    location: 'East side of barangay',
    barangay: 'San Isidro',
    municipality: 'Cabanatuan',
    province: 'Nueva Ecija',
    soilType: 'Clay loam',
    dateAcquired: '2020-01-01'
  },
  {
    id: '2',
    farmerId: '1',
    name: 'West Field',
    area: 1.8,
    location: 'West side near river',
    barangay: 'San Isidro',
    municipality: 'Cabanatuan',
    province: 'Nueva Ecija',
    soilType: 'Sandy loam',
    dateAcquired: '2021-06-15'
  }
]

export const mockCrops: Crop[] = [
  {
    id: '1',
    landId: '1',
    farmerId: '1',
    cropType: 'Cassava',
    variety: 'Golden Yellow',
    plantingDate: '2024-03-15',
    expectedHarvestDate: '2024-12-15',
    areaPlanted: 2.0,
    expectedYield: 4000,
    status: 'growing',
    notes: 'Good growing conditions'
  },
  {
    id: '2',
    landId: '2',
    farmerId: '1',
    cropType: 'Sweet Potato',
    variety: 'Purple',
    plantingDate: '2024-04-01',
    expectedHarvestDate: '2024-08-01',
    actualHarvestDate: '2024-08-05',
    areaPlanted: 1.5,
    expectedYield: 2250,
    actualYield: 2400,
    status: 'harvested'
  }
]

export const mockTransactions: Transaction[] = [
  {
    id: '1',
    farmerId: '1',
    cropId: '2',
    type: 'sale',
    buyerSeller: 'AgriCorp Processing Plant',
    produce: 'Sweet Potato',
    quantity: 2400,
    pricePerKg: 25,
    totalAmount: 60000,
    transactionDate: '2024-08-10',
    paymentStatus: 'paid',
    deliveryStatus: 'delivered'
  },
  {
    id: '2',
    farmerId: '2',
    type: 'purchase',
    buyerSeller: 'Local Seed Supplier',
    produce: 'Cassava Stems',
    quantity: 500,
    pricePerKg: 5,
    totalAmount: 2500,
    transactionDate: '2024-02-15',
    paymentStatus: 'paid',
    deliveryStatus: 'delivered',
    notes: 'Quality planting materials'
  }
]

// Custom render function with providers
interface CustomRenderOptions extends Omit<RenderOptions, 'wrapper'> {
  // Add custom options here if needed
}

export const customRender = (
  ui: React.ReactElement,
  options: CustomRenderOptions = {}
) => {
  return render(ui, {
    ...options,
  })
}

// Test helpers
export const fillFormField = async (
  getByLabelText: any,
  labelText: string,
  value: string
) => {
  const field = getByLabelText(labelText)
  await userEvent.clear(field)
  await userEvent.type(field, value)
  return field
}

export const selectOption = async (
  getByLabelText: any,
  labelText: string,
  value: string
) => {
  const select = getByLabelText(labelText)
  await userEvent.selectOptions(select, value)
  return select
}

export const clickButton = async (getByRole: any, buttonName: string) => {
  const button = getByRole('button', { name: buttonName })
  await userEvent.click(button)
  return button
}

// Re-export everything from testing library
export * from '@testing-library/react'
export { default as userEvent } from '@testing-library/user-event' 