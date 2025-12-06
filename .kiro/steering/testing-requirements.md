# Testing Requirements

## Overview

The Necronomicon of Knowledge uses a dual testing approach combining unit tests and property-based tests (PBT) to ensure correctness. This document outlines the requirements and best practices for both testing methodologies.

## Property-Based Testing (PBT)

### Framework Selection

**Python (Parser Service):**
- Use **Hypothesis** for property-based testing
- Install via: `pip install hypothesis`

**TypeScript/JavaScript (Backend & Frontend):**
- Use **fast-check** for property-based testing
- Install via: `npm install --save-dev fast-check`

### PBT Configuration

#### Minimum Iterations
- Each property-based test MUST run a minimum of **100 iterations**
- This ensures thorough coverage of the input space
- Configure in test setup:

```python
# Python/Hypothesis
from hypothesis import given, settings

@settings(max_examples=100)
@given(...)
def test_property():
    pass
```

```typescript
// TypeScript/fast-check
import fc from 'fast-check';

fc.assert(
  fc.property(..., (input) => {
    // test logic
  }),
  { numRuns: 100 }
);
```

### PBT Tagging Convention

Every property-based test MUST include a comment tag in this exact format:

```python
# Feature: necronomicon-knowledge-system, Property X: [property description]
```

```typescript
// Feature: necronomicon-knowledge-system, Property X: [property description]
```

**Example:**
```python
# Feature: necronomicon-knowledge-system, Property 4: Multi-language AST parsing extracts required metadata
@settings(max_examples=100)
@given(code_sample=valid_python_code())
def test_ast_parsing_extracts_metadata(code_sample):
    result = parse_file(code_sample)
    assert result.function_names is not None
    assert result.line_locations is not None
```

### Property Test Coverage

Each correctness property from the design document MUST be implemented by exactly ONE property-based test:

- **Property 1:** Repository cloning succeeds for valid URLs
- **Property 2:** Invalid repository URLs are rejected
- **Property 3:** File identification finds all target language files
- **Property 4:** Multi-language AST parsing extracts required metadata
- **Property 5:** Parsing errors don't halt processing
- **Property 6:** Parsed metadata is stored with required fields
- **Property 7:** Embedding generation and indexing round-trip
- **Property 8:** Repository re-ingestion maintains consistency
- **Property 9:** Query embedding uses consistent model
- **Property 10:** Similarity search returns correct number of results
- **Property 11:** LLM responses include structured citations
- **Property 12:** Citation links are rendered as clickable
- **Property 13:** Knowledge base updates trigger Socket events
- **Property 14:** Auto-regeneration updates embeddings
- **Property 15:** IPFS serialization round-trip preserves data
- **Property 16:** IPFS CID is stored and retrievable
- **Property 17:** IPFS failures trigger retry logic
- **Property 18:** ZIP export contains required structure
- **Property 19:** Export failures return diagnostic errors
- **Property 20:** Real-time progress events are emitted
- **Property 21:** Socket reconnection on connection loss

### Smart Generators

Property tests should use smart generators that constrain to valid input spaces:

```python
# Python/Hypothesis - Generate valid Python code
from hypothesis import strategies as st

@st.composite
def valid_python_function(draw):
    func_name = draw(st.text(alphabet=st.characters(whitelist_categories=('Lu', 'Ll')), min_size=1))
    params = draw(st.lists(st.text(min_size=1), max_size=5))
    return f"def {func_name}({', '.join(params)}):\n    pass"
```

```typescript
// TypeScript/fast-check - Generate valid GitHub URLs
import fc from 'fast-check';

const validGitHubUrl = fc.record({
  owner: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-'), { minLength: 1, maxLength: 39 }),
  repo: fc.stringOf(fc.constantFrom(...'abcdefghijklmnopqrstuvwxyz0123456789-_'), { minLength: 1, maxLength: 100 })
}).map(({ owner, repo }) => `https://github.com/${owner}/${repo}`);
```

### Avoiding Mocks in PBT

- Property tests should test real functionality when possible
- Avoid mocking core logic being tested
- Mock only external dependencies (network, filesystem, databases)
- Use in-memory alternatives when available (e.g., in-memory MongoDB)

### PBT Best Practices

1. **Focus on Universal Properties:**
   - Test properties that hold for ALL inputs, not specific examples
   - Example: "For any valid code chunk, embedding dimension is 384"

2. **Test Invariants:**
   - Properties that remain constant despite transformations
   - Example: "Repository re-ingestion doesn't create duplicates"

3. **Test Round-Trips:**
   - Operations that should return to original state
   - Example: "Serialize → Upload to IPFS → Retrieve → Deserialize = original"

4. **Test Error Conditions:**
   - Generate invalid inputs and verify proper error handling
   - Example: "For any malformed URL, system returns error"

5. **Test Idempotence:**
   - Operations where doing it twice = doing it once
   - Example: "Ingesting same repo twice produces same result"

## Unit Testing

### Framework Selection

**Python (Parser Service):**
- Use **pytest** for unit testing
- Install via: `pip install pytest pytest-asyncio`

**TypeScript/JavaScript (Backend):**
- Use **Jest** for unit testing
- Install via: `npm install --save-dev jest @types/jest ts-jest`

**TypeScript/JavaScript (Frontend):**
- Use **Jest** + **React Testing Library**
- Install via: `npm install --save-dev jest @testing-library/react @testing-library/jest-dom`

### Unit Test Coverage

Unit tests should cover:

1. **Specific Examples:**
   - Test concrete inputs with known outputs
   - Example: Parse a specific Python function and verify extracted metadata

2. **Edge Cases:**
   - Empty inputs, boundary values, special characters
   - Example: Empty repository, single-file repository, 10,000-file repository

3. **Error Conditions:**
   - Invalid inputs, network failures, timeout scenarios
   - Example: Invalid GitHub URL, unreachable repository, syntax errors

4. **Integration Points:**
   - Interactions between components
   - Example: Backend calling Parser Service, storing results in MongoDB

### Unit Test Structure

Follow the **Arrange-Act-Assert** pattern:

```python
# Python/pytest
def test_parse_python_function():
    # Arrange
    code = "def hello():\n    return 'world'"
    
    # Act
    result = parse_file(code, language="python")
    
    # Assert
    assert result.function_names == ["hello"]
    assert result.line_start == 1
    assert result.line_end == 2
```

```typescript
// TypeScript/Jest
describe('RepoInput', () => {
  it('should validate GitHub URL format', () => {
    // Arrange
    const { getByRole } = render(<RepoInput onSubmit={jest.fn()} />);
    const input = getByRole('textbox');
    
    // Act
    fireEvent.change(input, { target: { value: 'invalid-url' } });
    fireEvent.submit(input);
    
    // Assert
    expect(screen.getByText(/invalid url/i)).toBeInTheDocument();
  });
});
```

### Test Naming Conventions

Use descriptive test names that explain what is being tested:

```python
# Good
def test_parse_file_extracts_function_names_from_python_code():
    pass

def test_embed_chunks_returns_384_dimensional_vectors():
    pass

def test_faiss_search_returns_k_results():
    pass

# Bad
def test_parse():
    pass

def test_embeddings():
    pass
```

### Mocking Strategy

Mock external dependencies but not the code under test:

```python
# Python - Mock external API calls
from unittest.mock import patch, MagicMock

@patch('requests.get')
def test_clone_repo_handles_network_failure(mock_get):
    mock_get.side_effect = requests.exceptions.ConnectionError()
    
    with pytest.raises(NetworkError):
        clone_repo("https://github.com/user/repo")
```

```typescript
// TypeScript - Mock MongoDB
jest.mock('../db', () => ({
  Repository: {
    findOne: jest.fn().mockResolvedValue({ url: 'https://github.com/user/repo' })
  }
}));
```

## Integration Testing

### Scope

Integration tests verify interactions between services:

1. **Frontend → Backend → Parser Service**
2. **Backend → MongoDB**
3. **Backend → IPFS**
4. **Kiro Hook → Backend → Parser Service**

### Tools

- **Supertest** for API endpoint testing
- **Playwright** for end-to-end frontend testing
- **Docker Compose** for local service orchestration

### Example Integration Test

```typescript
import request from 'supertest';
import app from '../server';

describe('Ingestion Flow', () => {
  it('should ingest repository and store in MongoDB', async () => {
    const response = await request(app)
      .post('/api/ingest')
      .send({ url: 'https://github.com/user/test-repo' })
      .expect(200);
    
    expect(response.body).toHaveProperty('job_id');
    
    // Verify data in MongoDB
    const repo = await Repository.findOne({ url: 'https://github.com/user/test-repo' });
    expect(repo).toBeDefined();
  });
});
```

## Test Execution

### Running Tests

**Python:**
```bash
# Run all tests
pytest

# Run with coverage
pytest --cov=python_service --cov-report=html

# Run specific test file
pytest tests/test_parser_core.py

# Run property tests only
pytest -m property
```

**TypeScript/JavaScript:**
```bash
# Run all tests
npm test

# Run with coverage
npm test -- --coverage

# Run specific test file
npm test -- parser.test.ts

# Run in watch mode (development only)
npm test -- --watch
```

### Continuous Testing

- Kiro hooks trigger test runs on file save
- All tests must pass before considering a task complete
- Property tests catch edge cases that unit tests might miss

## Test Organization

### Directory Structure

```
python_service/
├── tests/
│   ├── unit/
│   │   ├── test_parser_core.py
│   │   └── test_vector_brain.py
│   ├── property/
│   │   ├── test_ast_parsing_properties.py
│   │   └── test_embedding_properties.py
│   └── integration/
│       └── test_ingestion_flow.py

backend/
├── tests/
│   ├── unit/
│   │   └── api.test.ts
│   ├── property/
│   │   └── validation.property.test.ts
│   └── integration/
│       └── ingestion.integration.test.ts

frontend/
├── src/
│   ├── components/
│   │   ├── RepoInput.tsx
│   │   └── RepoInput.test.tsx
│   └── hooks/
│       ├── useSocket.ts
│       └── useSocket.test.ts
```

## Coverage Requirements

### Minimum Coverage Targets

- **Unit Tests:** 70% code coverage
- **Property Tests:** All 21 correctness properties must have tests
- **Integration Tests:** All critical user flows must be tested

### Coverage Exclusions

- Configuration files
- Type definitions
- Mock data
- Development utilities

## Test Data Management

### Test Fixtures

Store reusable test data in fixture files:

```python
# tests/fixtures/sample_code.py
SAMPLE_PYTHON_FUNCTION = """
def calculate_sum(a: int, b: int) -> int:
    '''Calculate the sum of two numbers.'''
    return a + b
"""

SAMPLE_TYPESCRIPT_CLASS = """
class Calculator {
  add(a: number, b: number): number {
    return a + b;
  }
}
"""
```

### Test Databases

- Use separate test databases for integration tests
- Clean up test data after each test
- Use transactions for test isolation when possible

## Debugging Failed Tests

### Property Test Failures

When a property test fails:

1. **Examine the counterexample** provided by the PBT framework
2. **Reproduce the failure** with the specific input
3. **Determine the root cause:**
   - Is the test incorrect?
   - Is the code buggy?
   - Is the specification unclear?
4. **Fix the issue** and re-run the test
5. **Verify the fix** doesn't break other tests

### Unit Test Failures

When a unit test fails:

1. **Read the error message** carefully
2. **Check the assertion** that failed
3. **Verify the test setup** is correct
4. **Debug the code** under test
5. **Fix and re-run**

## Performance Testing

### Load Testing

- Test with large repositories (1,000+ files)
- Test with concurrent users (50+ simultaneous queries)
- Verify query latency <2 seconds for 95% of requests

### Tools

- **Apache JMeter** for load testing
- **k6** for API performance testing
- **Lighthouse** for frontend performance

## Security Testing

### Input Validation

- Test with malicious inputs (SQL injection, XSS, path traversal)
- Verify all inputs are sanitized
- Test rate limiting effectiveness

### Authentication

- Test API key validation
- Test unauthorized access attempts
- Verify secrets are not exposed

## Documentation

### Test Documentation

Each test file should include:

- Purpose of the test suite
- Setup requirements
- Expected behavior
- Known limitations

### Example:

```python
"""
Test suite for AST parsing functionality.

Purpose: Verify that the CodeNecromancer class correctly parses
Python, JavaScript, and TypeScript files and extracts metadata.

Setup: Requires tree-sitter parsers to be installed.

Expected Behavior:
- Valid code should be parsed successfully
- Syntax errors should be logged but not halt processing
- Extracted metadata should include function names, line numbers, docstrings

Known Limitations:
- Does not support Python 2.x syntax
- JSX parsing requires additional configuration
"""
```

## Continuous Integration

### CI Pipeline

1. **Lint:** Check code style
2. **Type Check:** Verify TypeScript types
3. **Unit Tests:** Run all unit tests
4. **Property Tests:** Run all property-based tests
5. **Integration Tests:** Run integration tests
6. **Coverage:** Generate coverage report
7. **Deploy:** Deploy if all tests pass

### CI Configuration

Use GitHub Actions or similar:

```yaml
name: Test Suite

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Install dependencies
        run: npm install && pip install -r requirements.txt
      - name: Run tests
        run: npm test && pytest
      - name: Upload coverage
        uses: codecov/codecov-action@v2
```

## Summary

- **Property-Based Testing:** Test universal properties across all inputs (100+ iterations)
- **Unit Testing:** Test specific examples and edge cases
- **Integration Testing:** Test service interactions and user flows
- **Both are essential:** PBT catches general bugs, unit tests catch specific bugs
- **Tag all PBT tests:** Use the required format for traceability
- **Avoid mocks in PBT:** Test real functionality when possible
- **Run tests continuously:** Use Kiro hooks for automatic test execution
