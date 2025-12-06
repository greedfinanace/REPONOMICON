"""
Test repository cloning functionality.
"""

import os
from parser_core import CodeNecromancer


def test_clone_repo():
    """Test cloning a small public repository."""
    print("Testing repository cloning...")
    
    necromancer = CodeNecromancer()
    
    # Clone a small test repository
    url = "https://github.com/octocat/Hello-World"
    
    try:
        repo_path = necromancer.clone_repo(url)
        
        assert os.path.exists(repo_path)
        assert os.path.isdir(repo_path)
        
        print(f"✓ Repository cloned successfully to: {repo_path}")
        
        # List files in the repo
        files = []
        for root, dirs, filenames in os.walk(repo_path):
            for filename in filenames:
                files.append(os.path.join(root, filename))
        
        print(f"✓ Found {len(files)} files in repository")
        
        return repo_path
        
    except Exception as e:
        print(f"✗ Clone failed: {e}")
        raise


if __name__ == "__main__":
    print("Running repository clone test...\n")
    print("=" * 50)
    
    test_clone_repo()
    
    print("=" * 50)
    print("Clone test passed! ✓")
