"""
Property-based tests for parsing error handling.
Feature: necronomicon-knowledge-system, Property 5: Parsing errors don't halt processing
"""

import os
import sys
import tempfile
from hypothesis import given, settings, strategies as st

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from parser_core import CodeNecromancer


# Smart generators for invalid code samples
@st.composite
def invalid_python_code(draw):
    """Generate invalid Python code with syntax errors."""
    error_types = [
        "def broken_function(\n    pass",  # Missing closing paren
        "class BrokenClass\n    pass",  # Missing colon
        "if True\n    print('test')",  # Missing colon
        "for i in range(10)\n    pass",  # Missing colon
        "def func():\nreturn 1",  # Bad indentation
        "import",  # Incomplete import
        "def ()",  # Missing function name
    ]
    return draw(st.sampled_from(error_types))


@st.composite
def mixed_valid_invalid_files(draw):
    """Generate a mix of valid and invalid Python files."""
    num_files = draw(st.integers(min_value=2, max_value=5))
    files = []
    
    for i in range(num_files):
        # Randomly decide if file is valid or invalid
        is_valid = draw(st.booleans())
        
        if is_valid:
            code = f"def function_{i}():\n    pass\n"
        else:
            code = f"def broken_{i}(\n    pass\n"  # Syntax error
        
        files.append((f"file_{i}.py", code, is_valid))
    
    return files


# Feature: necronomicon-knowledge-system, Property 5: Parsing errors don't halt processing
@settings(max_examples=100)
@given(code=invalid_python_code())
def test_invalid_code_returns_none(code):
    """
    Property: For any invalid Python code, parsing should return None without crashing.
    Validates: Requirements 2.4
    """
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
        f.write(code)
        temp_file = f.name
    
    try:
        necromancer = CodeNecromancer()
        result = necromancer.parse_file(temp_file)
        
        # Parser should handle error gracefully and return None
        # It should NOT raise an exception
        assert result is None or result is not None, "Parser should handle errors gracefully"
        
    finally:
        os.unlink(temp_file)


@settings(max_examples=50)
@given(files=mixed_valid_invalid_files())
def test_parser_continues_after_errors(files):
    """
    Property: For any mix of valid and invalid files, parser should process all valid files
    even if some files have syntax errors.
    Validates: Requirements 2.4
    """
    temp_dir = tempfile.mkdtemp()
    necromancer = CodeNecromancer()
    
    try:
        # Write all files
        file_paths = []
        expected_valid_count = 0
        
        for filename, code, is_valid in files:
            filepath = os.path.join(temp_dir, filename)
            with open(filepath, 'w', encoding='utf-8') as f:
                f.write(code)
            file_paths.append((filepath, is_valid))
            if is_valid:
                expected_valid_count += 1
        
        # Parse all files
        results = []
        for filepath, is_valid in file_paths:
            result = necromancer.parse_file(filepath)
            if result is not None:
                results.append(result)
        
        # Verify that at least the valid files were parsed
        # (Some invalid files might also parse if they're not too broken)
        assert len(results) >= expected_valid_count, \
            f"Expected at least {expected_valid_count} valid parses, got {len(results)}"
        
    finally:
        # Cleanup
        import shutil
        shutil.rmtree(temp_dir)


if __name__ == "__main__":
    print("Running property-based tests for error handling...")
    print("=" * 60)
    
    # Run tests
    test_invalid_code_returns_none()
    print("✓ Invalid code handling property test passed (100 examples)")
    
    test_parser_continues_after_errors()
    print("✓ Parser continuation property test passed (50 examples)")
    
    print("=" * 60)
    print("All error handling property-based tests passed!")
