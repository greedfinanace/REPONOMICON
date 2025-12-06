"""
Test VectorBrain functionality.
"""

import os
import tempfile
from vector_brain import VectorBrain


def test_vector_brain_initialization():
    """Test VectorBrain initialization."""
    print("Testing VectorBrain initialization...")
    brain = VectorBrain()
    assert brain.dimension == 384
    print("✓ VectorBrain initialized successfully")


def test_embed_chunks():
    """Test embedding generation."""
    print("\nTesting embedding generation...")
    brain = VectorBrain()
    
    chunks = [
        "def hello(): return 'world'",
        "class Calculator: pass",
        "function add(a, b) { return a + b; }"
    ]
    
    embeddings = brain.embed_chunks(chunks)
    
    assert embeddings.shape == (3, 384)
    assert embeddings.dtype == 'float32'
    print(f"✓ Generated embeddings with shape: {embeddings.shape}")


def test_create_index():
    """Test FAISS index creation."""
    print("\nTesting FAISS index creation...")
    brain = VectorBrain()
    
    chunks = [
        "def hello(): return 'world'",
        "class Calculator: pass",
        "function add(a, b) { return a + b; }"
    ]
    
    index = brain.create_index(chunks)
    
    assert index.ntotal == 3
    print(f"✓ Created FAISS index with {index.ntotal} vectors")


def test_save_and_load_index():
    """Test saving and loading FAISS index."""
    print("\nTesting index save/load...")
    brain = VectorBrain()
    
    chunks = [
        "def hello(): return 'world'",
        "class Calculator: pass"
    ]
    
    # Create and save index
    index = brain.create_index(chunks)
    
    with tempfile.TemporaryDirectory() as tmpdir:
        index_path = os.path.join(tmpdir, "test.index")
        brain.save_index(index, index_path)
        
        # Load index
        loaded_index = brain.load_index(index_path)
        
        assert loaded_index.ntotal == index.ntotal
        print(f"✓ Saved and loaded index with {loaded_index.ntotal} vectors")


def test_search():
    """Test similarity search."""
    print("\nTesting similarity search...")
    brain = VectorBrain()
    
    chunks = [
        "def calculate_sum(a, b): return a + b",
        "def calculate_product(a, b): return a * b",
        "class Calculator: pass",
        "function greet(name) { return 'Hello ' + name; }"
    ]
    
    index = brain.create_index(chunks)
    
    # Search for addition-related code
    results = brain.search("add two numbers", index, chunks, k=2)
    
    assert len(results) == 2
    assert 'chunk' in results[0]
    assert 'distance' in results[0]
    assert 'similarity' in results[0]
    
    print(f"✓ Search returned {len(results)} results")
    print(f"  Top result: {results[0]['chunk'][:50]}...")
    print(f"  Similarity: {results[0]['similarity']:.4f}")


def test_empty_chunks():
    """Test handling of empty chunks."""
    print("\nTesting empty chunks handling...")
    brain = VectorBrain()
    
    embeddings = brain.embed_chunks([])
    assert embeddings.shape == (0, 384)
    
    index = brain.create_index([])
    assert index.ntotal == 0
    
    results = brain.search("test", index, [], k=5)
    assert len(results) == 0
    
    print("✓ Empty chunks handled correctly")


if __name__ == "__main__":
    print("Running VectorBrain tests...\n")
    print("=" * 60)
    
    test_vector_brain_initialization()
    test_embed_chunks()
    test_create_index()
    test_save_and_load_index()
    test_search()
    test_empty_chunks()
    
    print("\n" + "=" * 60)
    print("All VectorBrain tests passed! ✓")
