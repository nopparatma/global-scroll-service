# Global Scroll Service - Testing Documentation

This directory contains comprehensive unit tests for the Global Scroll Service backend, following professional QA standards and best practices.

## 📊 Coverage Summary

**Overall Coverage: >98% (Exceeds 90% threshold)**

| Metric     | Coverage | Threshold |
|------------|----------|-----------|
| Statements | 98.61%   | 90%       |
| Branches   | 93.65%   | 90%       |
| Functions  | 95.55%   | 90%       |
| Lines      | 99.02%   | 90%       |

### Coverage by Module

| Module               | Statements | Branches | Functions | Lines |
|---------------------|------------|----------|-----------|-------|
| config/             | 100%       | 100%     | 100%      | 100%  |
| constants/          | 100%       | 100%     | 100%      | 100%  |
| services/           | 97.34%     | 90.32%   | 93.1%     | 98.13%|
| utils/              | 100%       | 96.42%   | 100%      | 100%  |

## 🎯 Test Statistics

- **Total Test Suites:** 6
- **Total Test Cases:** 257
- **All Tests Passing:** ✅

## 📁 Directory Structure

```
testing/
├── unit/                      # Unit test files
│   ├── config/               # Configuration tests
│   │   └── game.constants.test.ts (73 tests)
│   ├── constants/            # Validation constant tests
│   │   └── validation.test.ts (39 tests)
│   ├── services/             # Service layer tests
│   │   ├── game.service.test.ts (26 tests)
│   │   ├── redis.service.test.ts (49 tests)
│   │   └── user.service.test.ts (22 tests)
│   └── utils/                # Utility function tests
│       └── time.helpers.test.ts (48 tests)
├── mocks/                    # Mock implementations
│   ├── redis.mock.ts        # In-memory Redis mock
│   ├── prisma.mock.ts       # Prisma client mock
│   └── logger.mock.ts       # Logger mock
├── fixtures/                 # Test data fixtures
│   └── test-data.ts         # Common test constants
├── helpers/                  # Test utilities
│   └── test-utils.ts        # Helper functions
├── setup/                    # Test configuration
│   └── jest.setup.ts        # Global Jest setup
└── README.md                # This file
```

## 🧪 Test Methodologies

### AAA Pattern (Arrange-Act-Assert)
All tests follow the AAA pattern for clarity and maintainability:
```typescript
it('should process valid scroll batch', async () => {
  // Arrange
  const userId = 'test-user';
  const countryCode = 'TH';

  // Act
  const result = await gameService.processScrollBatch(userId, countryCode, 100, 1000);

  // Assert
  expect(result).toEqual({ success: true });
});
```

### Test Categories

1. **Happy Path Tests** - Valid inputs and expected behavior
2. **Error Handling** - Invalid inputs, edge cases, exceptions
3. **Boundary Value Analysis** - Min/max values, thresholds
4. **Equivalence Partitioning** - Representative test cases
5. **Integration Tests** - Multi-step workflows

## 🚀 Running Tests

### Basic Commands

```bash
# Run all tests with coverage
npm test

# Run tests in watch mode (for development)
npm run test:watch

# Run with verbose output
npm run test:verbose

# Run for CI/CD
npm run test:ci
```

### Run Specific Test Files

```bash
# Single file
npm test -- testing/unit/services/game.service.test.ts

# Multiple files by pattern
npm test -- testing/unit/services/*.test.ts

# By describe block name
npm test -- -t "GameService"
```

### Coverage Reports

After running tests, coverage reports are generated in:
- `coverage/` - HTML coverage report (open `coverage/index.html` in browser)
- `coverage/lcov.info` - LCOV format for CI/CD tools
- Console output - Summary table

## 📝 Test Coverage Details

### config/game.constants.test.ts (100% Coverage)
Tests for game configuration and unit conversion functions:
- ✅ CSS Reference Pixel constants validation
- ✅ Pixel to millimeter conversion (all edge cases)
- ✅ Unit conversion (mm → meters, cm, km)
- ✅ Height formatting (meters vs kilometers)
- ✅ Velocity formatting (m/s vs km/h)
- ✅ Anti-cheat constants validation
- ✅ Boundary value testing
- ✅ Negative value handling
- ✅ Rounding precision

### constants/validation.test.ts (100% Coverage)
Tests for validation constants and regex patterns:
- ✅ Time range validation (1h, 24h, 7d, 30d, 1y, 5y, all)
- ✅ Country code regex (ISO 3166-1 alpha-2)
- ✅ Invalid format rejection
- ✅ Case insensitivity
- ✅ Edge cases (unicode, special chars, spaces)
- ✅ 676 country code combinations (A-Z × A-Z)

### services/game.service.test.ts (100% Coverage)
Tests for core game logic:
- ✅ Scroll batch processing
- ✅ Anti-cheat velocity validation (< 2000 mm/s)
- ✅ Rate limiting logic
- ✅ Country-specific updates
- ✅ Game state retrieval
- ✅ Realistic usage scenarios
- ✅ Boundary conditions
- ✅ Multi-user operations

### services/redis.service.test.ts (96.38% Coverage)
Tests for Redis operations:
- ✅ Connection management
- ✅ Height increment/decrement operations
- ✅ Country-specific operations
- ✅ Global height calculations
- ✅ Last activity tracking
- ✅ Scan operations
- ✅ Atomic operations
- ✅ Concurrent operations
- ✅ Sorting and filtering

### services/user.service.test.ts (100% Coverage)
Tests for user management:
- ✅ Find or create by device ID
- ✅ Default country code handling
- ✅ Error handling and logging
- ✅ Edge cases (long IDs, special chars)
- ✅ User lifecycle workflows

### utils/time.helpers.test.ts (100% Coverage)
Tests for time utility functions:
- ✅ Time range conversion (all 7 ranges)
- ✅ Interval grouping logic
- ✅ Time truncation
- ✅ Next interval calculation
- ✅ Duration formatting (ms, s, m, h)
- ✅ Average calculations
- ✅ Weighted averages
- ✅ Edge cases (empty arrays, zero values)

## 🎨 Test Design Patterns

### 1. Given-When-Then Format
```typescript
describe('processScrollBatch', () => {
  it('should reject scroll with excessive velocity', async () => {
    // Given: A user with a very fast scroll attempt
    // When: Processing a 10000px scroll in 100ms
    const result = await gameService.processScrollBatch(userId, 'TH', 10000, 100);

    // Then: The batch should be rejected
    expect(result).toBeNull();
  });
});
```

### 2. Nested Describe Blocks
Organized by functionality for easy navigation:
```typescript
describe('GameService', () => {
  describe('processScrollBatch', () => {
    describe('Valid scroll batches', () => {
      // Happy path tests
    });

    describe('Anti-cheat validation', () => {
      // Security tests
    });

    describe('Edge cases', () => {
      // Boundary tests
    });
  });
});
```

### 3. Mock Isolation
Each test suite uses isolated mocks:
- Redis operations don't hit real database
- Prisma queries return controlled data
- Logger calls are silenced
- No external dependencies

## 🔍 Test Quality Metrics

### Code Quality
- ✅ All tests follow consistent naming conventions
- ✅ Descriptive test names explain what is being tested
- ✅ Each test focuses on a single concern
- ✅ No test interdependencies
- ✅ Proper setup and teardown

### Coverage Quality
- ✅ All critical paths tested
- ✅ Error conditions covered
- ✅ Edge cases validated
- ✅ Business logic verified
- ✅ Integration points tested

### Maintainability
- ✅ Fixtures for common test data
- ✅ Helper functions for repetitive tasks
- ✅ Clear comments for complex logic
- ✅ Modular test structure
- ✅ Easy to add new tests

## 🛠️ Mock Infrastructure

### Redis Mock
Provides in-memory Redis simulation with:
- `get`, `set`, `incrBy`, `decrBy`
- `mGet`, `scan` operations
- Pattern matching for keys
- No actual Redis instance required

### Prisma Mock
Mocks database operations for:
- User management
- Transaction history
- Country-specific queries
- Jest spy integration

### Logger Mock
Silent logger for tests:
- Captures log calls
- Doesn't pollute test output
- Verifiable in assertions

## 📊 Continuous Integration

### CI/CD Integration
```bash
npm run test:ci
```

Generates:
- JUnit XML reports for CI systems
- LCOV coverage for SonarQube/Codecov
- JSON summary for badges
- Optimized for parallel execution

### Pre-commit Hooks
Tests run automatically before commits via Husky (if configured).

## 🎯 Future Testing Roadmap

### Planned Additions
- [ ] Integration tests with real Redis (Docker)
- [ ] E2E tests with Socket.io client
- [ ] Performance/load testing
- [ ] Worker process tests
- [ ] API endpoint tests

### Coverage Goals
- Maintain >95% coverage across all metrics
- 100% coverage for critical business logic
- Full edge case coverage

## 📚 Best Practices

### Writing New Tests
1. **Start with test name**: Describe what you're testing
2. **Arrange**: Set up test data and mocks
3. **Act**: Execute the function under test
4. **Assert**: Verify expected behavior
5. **Clean up**: Reset mocks in `afterEach`

### Example Template
```typescript
describe('MyService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Setup common mocks
  });

  describe('myFunction', () => {
    describe('Happy path', () => {
      it('should return expected result for valid input', () => {
        // Arrange
        const input = 'valid';

        // Act
        const result = myService.myFunction(input);

        // Assert
        expect(result).toBe('expected');
      });
    });

    describe('Error handling', () => {
      it('should throw error for invalid input', () => {
        expect(() => myService.myFunction(null)).toThrow();
      });
    });
  });
});
```

## 🐛 Troubleshooting

### Common Issues

**Tests fail with "Cannot find module":**
```bash
npm install
```

**Coverage below threshold:**
```bash
npm test -- --coverage --verbose
# Check which lines are uncovered
```

**Mocks not working:**
- Ensure mocks are defined before imports
- Check `jest.setup.ts` is loaded
- Verify mock paths are correct

## 📖 Additional Resources

- [Jest Documentation](https://jestjs.io/)
- [Testing Best Practices](https://testingjavascript.com/)
- [AAA Pattern](https://medium.com/@pjbgf/title-testing-code-ocd-and-the-aaa-pattern-df453975ab80)

---

**Last Updated:** 2025-01-30
**Test Framework:** Jest 30.2.0
**Coverage Tool:** Istanbul
