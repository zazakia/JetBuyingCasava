# Testing Guide for AgriTracker Pro

## Overview

This document outlines the comprehensive testing strategy for AgriTracker Pro, a farmers management system. The testing suite covers unit tests, integration tests, and end-to-end workflows to ensure the application is robust and reliable.

## Test Structure

```
src/
├── test/
│   ├── setup.ts           # Test configuration and global mocks
│   └── utils.tsx          # Test utilities and mock data
├── components/
│   └── __tests__/         # Component unit tests
│       ├── FarmersManager.test.tsx
│       ├── Dashboard.test.tsx
│       └── ...
├── utils/
│   └── __tests__/         # Utility function tests
│       ├── supabase.test.ts
│       └── ...
└── __tests__/             # Integration tests
    └── App.integration.test.tsx
```

## Testing Technology Stack

- **Vitest**: Modern test runner and assertion library
- **React Testing Library**: Component testing utilities
- **jsdom**: DOM simulation for testing
- **@testing-library/user-event**: User interaction simulation

## Test Categories

### 1. Unit Tests

#### Component Tests
- **FarmersManager**: CRUD operations, form validation, search/filtering
- **Dashboard**: Data visualization, statistics calculation, chart rendering
- **LandsManager**: Land management, farmer associations
- **CropsManager**: Crop lifecycle management, harvest tracking
- **TransactionsManager**: Financial transaction handling
- **SettingsManager**: Configuration management, Supabase integration

#### Utility Tests
- **Supabase Utils**: Configuration, validation, connection testing
- **Sync Utils**: Data synchronization, conflict resolution
- **Data Utils**: Validation, formatting, calculation functions

### 2. Integration Tests

#### Complete CRUD Workflows
- Farmer → Land → Crop → Transaction flow
- Data persistence across modules
- Real-time analytics updates
- Navigation between modules

#### Data Relationships
- Farmer-Land associations
- Land-Crop associations
- Crop-Transaction associations
- Cross-module data consistency

### 3. End-to-End Tests

#### User Workflows
- Complete farming season management
- Financial transaction tracking
- Report generation and analytics
- Settings configuration

#### Responsive Design
- Mobile device compatibility
- Touch interactions
- Viewport adaptations

## What Should Be Tested

### ✅ Currently Tested

1. **Component Rendering**
   - Proper component mount and unmount
   - Correct data display
   - UI element presence and visibility

2. **User Interactions**
   - Form submissions
   - Button clicks
   - Input field interactions
   - Navigation between views

3. **CRUD Operations**
   - Create: Adding new records
   - Read: Data retrieval and display
   - Update: Editing existing records
   - Delete: Record removal (implicit through status changes)

4. **Data Validation**
   - Required field validation
   - Data type validation
   - Format validation (phone, dates, etc.)

5. **Search and Filtering**
   - Text-based search
   - Filter by categories
   - Multiple filter combinations

6. **Data Persistence**
   - localStorage save/load
   - Configuration persistence
   - Data integrity across sessions

7. **Error Handling**
   - Corrupted data recovery
   - Network error handling
   - Validation error display

8. **Responsive Design**
   - Mobile viewport testing
   - Touch interaction testing

### 🔍 Additional Testing Recommendations

#### Performance Testing
```typescript
// Add performance benchmarks
describe('Performance', () => {
  it('renders large datasets efficiently', async () => {
    const startTime = performance.now()
    render(<FarmersManager farmers={largeFarmerList} />)
    const endTime = performance.now()
    expect(endTime - startTime).toBeLessThan(100) // 100ms threshold
  })
})
```

#### Accessibility Testing
```typescript
// Add accessibility tests
import { axe, toHaveNoViolations } from 'jest-axe'

describe('Accessibility', () => {
  it('has no accessibility violations', async () => {
    const { container } = render(<FarmersManager />)
    const results = await axe(container)
    expect(results).toHaveNoViolations()
  })
})
```

#### Security Testing
```typescript
// Add XSS protection tests
describe('Security', () => {
  it('prevents XSS in user input', () => {
    const maliciousInput = '<script>alert("xss")</script>'
    // Test that malicious input is properly escaped
  })
})
```

#### Offline Functionality
```typescript
// Test offline capabilities
describe('Offline Support', () => {
  it('works when offline', async () => {
    // Mock offline state
    Object.defineProperty(navigator, 'onLine', { value: false })
    // Test offline functionality
  })
})
```

#### Data Migration Testing
```typescript
// Test data migration scenarios
describe('Data Migration', () => {
  it('migrates data from old format', () => {
    const oldFormatData = { /* old schema */ }
    const migratedData = migrateData(oldFormatData)
    expect(migratedData).toMatchSchema(newSchema)
  })
})
```

## Running Tests

### Basic Commands

```bash
# Run all tests
pnpm test

# Run tests in watch mode
pnpm test:watch

# Run tests once (CI mode)
pnpm test:run

# Run with coverage report
pnpm test:coverage

# Run with UI interface
pnpm test:ui
```

### Test Filtering

```bash
# Run specific test file
pnpm test FarmersManager

# Run tests matching pattern
pnpm test --grep "CRUD"

# Run integration tests only
pnpm test integration

# Run unit tests only
pnpm test --grep "unit"
```

### Coverage Reports

Coverage reports are generated in the `coverage/` directory:
- `coverage/index.html` - Visual coverage report
- `coverage/lcov.info` - LCOV format for CI/CD
- `coverage/coverage-summary.json` - JSON summary

## Test Data Management

### Mock Data
- Realistic farmer profiles with Philippine addresses
- Diverse crop types and varieties
- Comprehensive transaction records
- Various land configurations

### Data Generators
```typescript
// Generate test data programmatically
const generateFarmer = (overrides = {}) => ({
  id: faker.string.uuid(),
  firstName: faker.person.firstName(),
  lastName: faker.person.lastName(),
  phone: faker.phone.number(),
  // ... other fields
  ...overrides
})
```

## Continuous Integration

### GitHub Actions Example
```yaml
name: Test Suite
on: [push, pull_request]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3
      - uses: actions/setup-node@v3
        with:
          node-version: '18'
      - run: pnpm install
      - run: pnpm test:run
      - run: pnpm test:coverage
```

## Best Practices

### Test Organization
1. **Describe blocks**: Group related tests logically
2. **Meaningful names**: Use descriptive test names
3. **Setup/teardown**: Use beforeEach/afterEach for common setup
4. **Mock management**: Clear mocks between tests

### Test Quality
1. **Arrange-Act-Assert**: Follow AAA pattern
2. **Single responsibility**: One assertion per test
3. **Edge cases**: Test boundary conditions
4. **Error scenarios**: Test failure paths

### Performance
1. **Mock heavy operations**: Mock API calls and expensive calculations
2. **Optimize renders**: Use minimal test renders
3. **Parallel execution**: Run tests in parallel when possible

## Debugging Tests

### Common Issues
1. **Async operations**: Use `waitFor` for async updates
2. **Component state**: Allow time for state updates
3. **Mock timing**: Ensure mocks are set up before tests run
4. **Cleanup**: Clear mocks and localStorage between tests

### Debug Tools
```typescript
// Debug test output
screen.debug() // Shows current DOM state
screen.logTestingPlaygroundURL() // Interactive debugging
```

## Future Enhancements

1. **Visual Regression Testing**: Screenshot comparisons
2. **API Testing**: Mock server integration
3. **Load Testing**: Stress testing with large datasets
4. **Cross-browser Testing**: Multiple browser support
5. **Automation**: Automated test generation
6. **Mutation Testing**: Code quality assessment

## Conclusion

This comprehensive testing strategy ensures AgriTracker Pro is reliable, maintainable, and user-friendly. Regular testing helps catch issues early and provides confidence in new features and bug fixes.

For questions or contributions to the testing suite, please refer to the development team guidelines. 