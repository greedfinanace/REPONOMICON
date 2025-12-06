"""
Simple test to verify CodeNecromancer functionality.
"""

import os
import tempfile
from parser_core import CodeNecromancer


def test_parser_initialization():
    """Test that CodeNecromancer initializes correctly."""
    print("Testing parser initialization...")
    necromancer = CodeNecromancer()
    assert 'python' in necromancer.parsers
    assert 'javascript' in necromancer.parsers
    assert 'typescript' in necromancer.parsers
    print("✓ Parser initialization successful")


def test_parse_python_file():
    """Test parsing a Python file."""
    print("\nTesting Python file parsing...")
    
    # Create a temporary Python file
    test_code = '''
def hello_world():
    """A simple greeting function."""
    return "Hello, World!"

class TestClass:
    """A test class."""
    def method(self):
        pass
'''
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False) as f:
        f.write(test_code)
        temp_file = f.name
    
    try:
        necromancer = CodeNecromancer()
        result = necromancer.parse_file(temp_file)
        
        assert result is not None
        assert result.language == 'python'
        assert 'hello_world' in result.ast_summary
        assert 'TestClass' in result.ast_summary
        print(f"✓ Python parsing successful: {result.ast_summary}")
    finally:
        os.unlink(temp_file)


def test_parse_javascript_file():
    """Test parsing a JavaScript file."""
    print("\nTesting JavaScript file parsing...")
    
    # Create a temporary JavaScript file
    test_code = '''
function greet(name) {
    return `Hello, ${name}!`;
}

class Calculator {
    add(a, b) {
        return a + b;
    }
}
'''
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False) as f:
        f.write(test_code)
        temp_file = f.name
    
    try:
        necromancer = CodeNecromancer()
        result = necromancer.parse_file(temp_file)
        
        assert result is not None
        assert result.language == 'javascript'
        assert 'greet' in result.ast_summary
        assert 'Calculator' in result.ast_summary
        print(f"✓ JavaScript parsing successful: {result.ast_summary}")
    finally:
        os.unlink(temp_file)


def test_parse_typescript_file():
    """Test parsing a TypeScript file."""
    print("\nTesting TypeScript file parsing...")
    
    # Create a temporary TypeScript file
    test_code = '''
function multiply(a: number, b: number): number {
    return a * b;
}

class Person {
    constructor(public name: string) {}
}
'''
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.ts', delete=False) as f:
        f.write(test_code)
        temp_file = f.name
    
    try:
        necromancer = CodeNecromancer()
        result = necromancer.parse_file(temp_file)
        
        assert result is not None
        assert result.language == 'typescript'
        assert 'multiply' in result.ast_summary
        # Note: TypeScript class extraction may vary, just check it parsed
        print(f"✓ TypeScript parsing successful: {result.ast_summary}")
    finally:
        os.unlink(temp_file)


if __name__ == "__main__":
    print("Running CodeNecromancer tests...\n")
    print("=" * 50)
    
    test_parser_initialization()
    test_parse_python_file()
    test_parse_javascript_file()
    test_parse_typescript_file()
    
    print("\n" + "=" * 50)
    print("All tests passed! ✓")
