# VibeCoder Test Suite

This test suite validates the configuration and structure of the VibeCoder application using Bun's built-in test runner. The tests focus on agent setup, prompt validation, and basic integration patterns.

## Test Structure

```
test/
├── setup.ts                 # Global test setup and utilities
├── config.test.ts          # Test configuration and shared utilities
├── index.test.ts           # Main test runner and meta-tests
├── agents/                 # Agent-specific tests
│   ├── create-app-agent.test.ts
│   └── refine-app-agent.test.ts
├── integration/            # Integration tests
│   ├── app-generation.test.ts
│   └── sandbox-integration.test.ts
├── ai/                     # AI and prompt tests
│   └── prompts.test.ts
└── error-handling.test.ts  # Comprehensive error handling tests
```

## Running Tests

### All Tests
```bash
bun test
```

### Watch Mode (re-run on file changes)
```bash
bun test --watch
```

### Coverage Report
```bash
bun test --coverage
```

### Specific Test Suites
```bash
# Agent tests only
bun test:agents

# Integration tests only
bun test:integration

# AI tests only
bun test:ai

# Error handling tests only
bun test:errors
```

### Run Specific Test Files
```bash
# Run a specific test file
bun test test/agents/create-app-agent.test.ts

# Run tests matching a pattern
bun test --test-name-pattern "should handle"
```

## Test Coverage Areas

### 🤖 Agent Tests
- **Create App Agent**: Configuration validation
  - Agent name and voice settings verification
  - Tool structure and naming validation
  - Parameter schema validation
  - Agent handoff configuration

- **Refine App Agent**: Configuration validation
  - Agent configuration consistency checks
  - Tool parameter validation
  - Agent voice and personality settings

### 🔗 Integration Tests
- **Agent Integration**: Basic agent setup validation
  - Agent tool configuration
  - Parameter validation schemas
  - Agent handoff descriptions

- **Sandbox Integration**: Mock-based sandbox operations
  - Sandbox creation with file validation
  - Sandbox updates and file structure preservation
  - URL management and cache busting
  - File validation and size limits
  - Streaming operation simulation
  - Resource cleanup patterns

### 🧠 AI Tests
- **Prompt Templates**: Comprehensive prompt validation
  - Personality consistency across agents
  - Tool usage guidelines and patterns
  - Operational notes and constraints
  - Response formatting requirements
  - Content validation and best practices
  - JSON output format specifications

### ⚠️ Error Handling Tests
- **Parameter Validation**: Input validation
  - Required parameter checking
  - Parameter type validation
  - Schema consistency verification
  - Tool parameter structure validation

### 📋 Configuration Tests
- **Test Setup**: Global test utilities
  - Mock function creation and management
  - Window function mocking
  - App file structure generation
  - Test configuration validation

## Test Utilities

### Mock Functions
The test suite provides basic mocking utilities for configuration testing:

```typescript
import { mockWindowFunctions, createMockAppFiles } from "./config.test";

// Mock window functions for agent testing
const mockUtils = mockWindowFunctions();

// Create mock app files for sandbox testing
const files = createMockAppFiles();
```

### Test Structure Validation
The tests validate configuration and structure using standard assertions:

```typescript
// Basic configuration validation
expect(agent.name).toBe("createApp");
expect(tool.parameters.required).toContain("description");

// Structure validation
expect(files).toHaveLength(3);
expect(prompt).toContain("Personality and Tone");
```

### Test Configuration
```typescript
const testConfig = {
  timeout: 30000,    // 30 seconds for integration tests
  retries: 2,        // Retry failed tests
};
```

## Writing New Tests

### Test File Structure
```typescript
import { expect, test, describe, beforeEach, afterEach, mock } from "bun:test";

describe("Feature Name", () => {
  beforeEach(() => {
    // Setup code
  });

  afterEach(() => {
    // Cleanup code
  });

  test("should do something", () => {
    // Test implementation
  });
});
```

### Mocking Strategy
- Use `mock()` for configuration testing
- Mock window functions for agent validation
- Mock sandbox operations for structure testing
- Focus on validating configuration and structure

### Test Naming Convention
- Use descriptive test names starting with "should"
- Group related tests in `describe` blocks
- Focus on configuration and structure validation
- Use consistent naming patterns

## Best Practices

### Test Isolation
- Each test should be independent
- Use `beforeEach`/`afterEach` for setup/cleanup
- Avoid shared state between tests
- Mock configuration properly

### Test Performance
- Keep configuration tests fast (< 100ms)
- Focus on validation rather than integration
- Avoid complex async operations
- Mock expensive configuration checks

### Test Coverage
- Validate agent configurations thoroughly
- Test prompt structure and content
- Verify parameter schemas and validation
- Test sandbox operation patterns

### Test Maintenance
- Keep tests simple and focused
- Use descriptive names and comments
- Update tests when configurations change
- Maintain test structure consistency

## Continuous Integration

### GitHub Actions Example
```yaml
- name: Run Tests
  run: |
    bun install
    bun test --coverage

- name: Upload Coverage
  uses: codecov/codecov-action@v3
  with:
    file: ./coverage/lcov.info
```

### Pre-commit Hooks
```bash
# Run tests before committing
bun test
```

## Troubleshooting

### Common Issues

**Tests failing due to missing dependencies**
```bash
bun install
```

**Tests timing out**
- Increase timeout in test config
- Check for infinite loops in test code
- Mock slow operations properly

**Mock functions not working**
- Ensure mocks are set up in `beforeEach`
- Check mock function signatures
- Verify mock cleanup in `afterEach`

**Coverage reports not generating**
```bash
bun test --coverage --reporter=json
```

### Debug Mode
```bash
# Run tests with verbose output
bun test --verbose

# Run specific failing test
bun test --test-name-pattern "failing test name"
```

## Contributing

When adding new features:

1. Create corresponding test files
2. Follow existing naming conventions
3. Include both success and failure scenarios
4. Add appropriate mocks and utilities
5. Update this README if needed

When modifying existing code:

1. Update affected tests
2. Add new test cases for new functionality
3. Ensure all tests still pass
4. Review test coverage

## Performance Benchmarks

- Configuration tests: < 50ms each
- Structure validation tests: < 100ms each
- Full test suite: < 30 seconds
- Memory usage: < 200MB during test runs

## Environment Requirements

- Bun >= 1.0.0
- Node.js >= 18.0.0 (for compatibility)
- All project dependencies installed

---

## Test Philosophy

The current test suite focuses on **configuration validation** and **structure verification** rather than comprehensive functional testing. The tests ensure that:

- Agent configurations are properly structured
- Tool parameters are correctly defined
- Prompt templates follow consistent patterns
- Sandbox operations follow expected patterns
- Basic validation logic works as expected

For end-to-end functional testing, integration tests, and performance validation, consider adding additional test suites that actually execute the application logic rather than just validating its configuration.

For questions about the test suite or to report issues, please check the main project documentation or create an issue in the repository.
