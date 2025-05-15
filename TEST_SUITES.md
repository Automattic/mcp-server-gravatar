# Test Suites in MCP Server Gravatar

This project organizes tests into three distinct suites to ensure comprehensive testing coverage:

## Test Suites Overview

1. **Unit Tests** - Test individual components in isolation

   - Location: `test/unit/`
   - Focus: Testing individual functions, classes, and modules
   - Mocks: Heavy use of mocks to isolate components
   - Speed: Fast execution

2. **Integration Tests** - Test interactions between components

   - Location: `test/integration/`
   - Focus: Testing how components work together
   - Mocks: Partial mocking (e.g., external APIs)
   - Speed: Medium execution time

3. **End-to-End Tests** - Test the complete system
   - Location: `test/e2e/`
   - Focus: Testing the entire application flow
   - Mocks: Minimal mocking
   - Speed: Slower execution time

## Running Test Suites

You can run specific test suites using the following npm scripts:

```bash
# Run all tests
npm test

# Run only unit tests
npm run test:unit

# Run only integration tests
npm run test:integration

# Run only end-to-end tests
npm run test:e2e

# Run tests in watch mode (for development)
npm run test:watch

# Generate test coverage report
npm run test:coverage
```

## Test Suite Implementation

The test suites are implemented using Vitest. Each suite is defined by its directory structure:

- Unit tests are located in `test/unit/`
- Integration tests are located in `test/integration/`
- End-to-end tests are located in `test/e2e/`

The npm scripts specify the test directory to run:

```json
"test:unit": "vitest run test/unit",
"test:integration": "vitest run test/integration",
"test:e2e": "vitest run test/e2e",
```

## CI Integration

The BuildKite CI pipeline runs all tests together. The test suites are not run separately.

## Best Practices

When adding new tests:

1. **Choose the right suite**: Place tests in the appropriate suite based on what they're testing
2. **Follow naming conventions**: Name test files with `.test.ts` suffix
3. **Use describe blocks**: Organize tests within files using `describe` blocks
4. **Write focused tests**: Each test should test one specific behavior
5. **Keep tests independent**: Tests should not depend on the state from other tests
