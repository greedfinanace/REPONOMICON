"""
Property-based tests for AST parsing functionality.
Feature: necronomicon-knowledge-system, Property 4: Multi-language AST parsing extracts required metadata
"""

import os
import sys
import tempfile
from hypothesis import given, settings, strategies as st

# Add parent directory to path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))
from parser_core import CodeNecromancer


# Smart generators for valid code samples
@st.composite
def valid_python_function(draw):
    """Generate valid Python function code."""
    func_name = draw(st.text(alphabet=st.characters(whitelist_categories=('Lu', 'Ll')), min_size=1, max_size=20))
    # Sanitize function name to be valid Python identifier
    func_name = ''.join(c if c.isalnum() or c == '_' else '_' for c in func_name)
    if not func_name[0].isalpha() and func_name[0] != '_':
        func_name = 'f_' + func_name
    
    params = draw(st.lists(st.text(alphabet=st.characters(whitelist_categories=('Lu', 'Ll')), min_size=1, max_size=10), max_size=3))
    params = [''.join(c if c.isalnum() or c == '_' else '_' for c in p) for p in params]
    params = [p if p and (p[0].isalpha() or p[0] == '_') else 'p_' + p for p in params]
    params = [p for p in params if p]  # Remove empty
    
    docstring = draw(st.text(alphabet=st.characters(min_codepoint=32, max_codepoint=126), min_size=0, max_size=50))
    
    code = f'def {func_name}({", ".join(params)}):\n'
    if docstring:
        code += f'    """{docstring}"""\n'
    code += '    pass\n'
    
    return code, func_name


@st.composite
def valid_python_class(draw):
    """Generate valid Python class code."""
    class_name = draw(st.text(alphabet=st.characters(whitelist_categories=('Lu',)), min_size=1, max_size=20))
    class_name = ''.join(c if c.isalnum() or c == '_' else '_' for c in class_name)
    if not class_name[0].isalpha() and class_name[0] != '_':
        class_name = 'C_' + class_name
    
    docstring = draw(st.text(alphabet=st.characters(min_codepoint=32, max_codepoint=126), min_size=0, max_size=50))
    
    code = f'class {class_name}:\n'
    if docstring:
        code += f'    """{docstring}"""\n'
    code += '    pass\n'
    
    return code, class_name


@st.composite
def valid_javascript_function(draw):
    """Generate valid JavaScript function code."""
    func_name = draw(st.text(alphabet=st.characters(whitelist_categories=('Lu', 'Ll')), min_size=1, max_size=20))
    func_name = ''.join(c if c.isalnum() or c == '_' else '_' for c in func_name)
    if not func_name[0].isalpha() and func_name[0] != '_':
        func_name = 'f_' + func_name
    
    params = draw(st.lists(st.text(alphabet=st.characters(whitelist_categories=('Lu', 'Ll')), min_size=1, max_size=10), max_size=3))
    params = [''.join(c if c.isalnum() or c == '_' else '_' for c in p) for p in params]
    params = [p if p and (p[0].isalpha() or p[0] == '_') else 'p_' + p for p in params]
    params = [p for p in params if p]
    
    code = f'function {func_name}({", ".join(params)}) {{\n'
    code += '    return null;\n'
    code += '}\n'
    
    return code, func_name


@st.composite
def valid_typescript_function(draw):
    """Generate valid TypeScript function code."""
    func_name = draw(st.text(alphabet=st.characters(whitelist_categories=('Lu', 'Ll')), min_size=1, max_size=20))
    func_name = ''.join(c if c.isalnum() or c == '_' else '_' for c in func_name)
    if not func_name[0].isalpha() and func_name[0] != '_':
        func_name = 'f_' + func_name
    
    params = draw(st.lists(st.text(alphabet=st.characters(whitelist_categories=('Lu', 'Ll')), min_size=1, max_size=10), max_size=3))
    params = [''.join(c if c.isalnum() or c == '_' else '_' for c in p) for p in params]
    params = [p if p and (p[0].isalpha() or p[0] == '_') else 'p_' + p for p in params]
    params = [p for p in params if p]
    
    typed_params = [f'{p}: any' for p in params]
    
    code = f'function {func_name}({", ".join(typed_params)}): any {{\n'
    code += '    return null;\n'
    code += '}\n'
    
    return code, func_name


# Feature: necronomicon-knowledge-system, Property 4: Multi-language AST parsing extracts required metadata
@settings(max_examples=100)
@given(code_and_name=valid_python_function())
def test_python_function_parsing_extracts_metadata(code_and_name):
    """
    Property: For any valid Python function, parsing should extract function name and line locations.
    Validates: Requirements 2.1, 2.2
    """
    code, expected_name = code_and_name
    
    # Create temporary file
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
        f.write(code)
        temp_file = f.name
    
    try:
        necromancer = CodeNecromancer()
        result = necromancer.parse_file(temp_file)
        
        # Verify required metadata is present
        assert result is not None, "Parsing should not return None for valid code"
        assert result.language == 'python', "Language should be detected as Python"
        assert expected_name in result.ast_summary, f"Function name {expected_name} should be in AST summary"
        assert result.line_start >= 1, "Line start should be at least 1"
        assert result.line_end >= result.line_start, "Line end should be >= line start"
        assert result.file_path == temp_file, "File path should match"
        
    finally:
        os.unlink(temp_file)


@settings(max_examples=100)
@given(code_and_name=valid_python_class())
def test_python_class_parsing_extracts_metadata(code_and_name):
    """
    Property: For any valid Python class, parsing should extract class name and line locations.
    Validates: Requirements 2.1, 2.2
    """
    code, expected_name = code_and_name
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.py', delete=False, encoding='utf-8') as f:
        f.write(code)
        temp_file = f.name
    
    try:
        necromancer = CodeNecromancer()
        result = necromancer.parse_file(temp_file)
        
        assert result is not None
        assert result.language == 'python'
        assert expected_name in result.ast_summary, f"Class name {expected_name} should be in AST summary"
        assert result.line_start >= 1
        assert result.line_end >= result.line_start
        
    finally:
        os.unlink(temp_file)


@settings(max_examples=100)
@given(code_and_name=valid_javascript_function())
def test_javascript_function_parsing_extracts_metadata(code_and_name):
    """
    Property: For any valid JavaScript function, parsing should extract function name and line locations.
    Validates: Requirements 2.1, 2.2
    """
    code, expected_name = code_and_name
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.js', delete=False, encoding='utf-8') as f:
        f.write(code)
        temp_file = f.name
    
    try:
        necromancer = CodeNecromancer()
        result = necromancer.parse_file(temp_file)
        
        assert result is not None
        assert result.language == 'javascript'
        assert expected_name in result.ast_summary, f"Function name {expected_name} should be in AST summary"
        assert result.line_start >= 1
        assert result.line_end >= result.line_start
        
    finally:
        os.unlink(temp_file)


@settings(max_examples=100)
@given(code_and_name=valid_typescript_function())
def test_typescript_function_parsing_extracts_metadata(code_and_name):
    """
    Property: For any valid TypeScript function, parsing should extract function name and line locations.
    Validates: Requirements 2.1, 2.2
    """
    code, expected_name = code_and_name
    
    with tempfile.NamedTemporaryFile(mode='w', suffix='.ts', delete=False, encoding='utf-8') as f:
        f.write(code)
        temp_file = f.name
    
    try:
        necromancer = CodeNecromancer()
        result = necromancer.parse_file(temp_file)
        
        assert result is not None
        assert result.language == 'typescript'
        assert expected_name in result.ast_summary, f"Function name {expected_name} should be in AST summary"
        assert result.line_start >= 1
        assert result.line_end >= result.line_start
        
    finally:
        os.unlink(temp_file)


if __name__ == "__main__":
    print("Running property-based tests for AST parsing...")
    print("=" * 60)
    
    # Run tests
    test_python_function_parsing_extracts_metadata()
    print("✓ Python function parsing property test passed (100 examples)")
    
    test_python_class_parsing_extracts_metadata()
    print("✓ Python class parsing property test passed (100 examples)")
    
    test_javascript_function_parsing_extracts_metadata()
    print("✓ JavaScript function parsing property test passed (100 examples)")
    
    test_typescript_function_parsing_extracts_metadata()
    print("✓ TypeScript function parsing property test passed (100 examples)")
    
    print("=" * 60)
    print("All property-based tests passed!")
