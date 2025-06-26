import '@testing-library/jest-dom'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}
global.localStorage = localStorageMock as any

// Mock navigator.onLine
Object.defineProperty(navigator, 'onLine', {
  writable: true,
  value: true,
})

// Mock window.alert and window.confirm
global.alert = vi.fn()
global.confirm = vi.fn(() => true)

// Mock Chart.js
vi.mock('chart.js', () => ({
  Chart: {
    register: vi.fn(),
  },
  CategoryScale: {},
  LinearScale: {},
  PointElement: {},
  LineElement: {},
  Title: {},
  Tooltip: {},
  Legend: {},
  BarElement: {},
  ArcElement: {},
}))

// Mock react-chartjs-2
vi.mock('react-chartjs-2', () => ({
  Bar: 'MockBarChart',
  Line: 'MockLineChart', 
  Doughnut: 'MockDoughnutChart',
}))

// Mock Supabase
vi.mock('@supabase/supabase-js', () => ({
  createClient: vi.fn(() => ({
    auth: {
      getSession: vi.fn(() => Promise.resolve({ data: null, error: null })),
    },
  })),
}))

// Clean up after each test
afterEach(() => {
  vi.clearAllMocks()
  localStorageMock.clear.mockClear()
  localStorageMock.getItem.mockClear()
  localStorageMock.setItem.mockClear()
  localStorageMock.removeItem.mockClear()
}) 