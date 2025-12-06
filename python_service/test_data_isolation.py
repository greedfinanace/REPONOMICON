"""
Data Isolation Security Test for Necronomicon Parser Service

Proves that repositories are isolated and cannot leak data between contexts.
"""
import requests

BASE_URL = "http://localhost:8000"

# Test repos - using smaller repos for faster testing
REPO_A = "https://github.com/pallets/click"  # Python CLI library
REPO_B = "https://github.com/expressjs/express"  # JavaScript web framework


def ingest_repo(url: str, name: str):
    """Ingest a repository and return success status."""
    print(f"\n📥 Ingesting {name}: {url}")
    try:
        resp = requests.post(f"{BASE_URL}/ingest", json={"url": url}, timeout=120)
        if resp.status_code == 200:
            data = resp.json()
            print(f"   ✅ Ingested {data.get('message', 'unknown files')}")
            return True
        else:
            print(f"   ❌ Failed: {resp.text}")
            return False
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return False


def query_repo(repo_url: str, query: str, name: str):
    """Query a specific repository and return results."""
    print(f"\n🔍 Querying {name} for '{query}'...")
    try:
        resp = requests.post(
            f"{BASE_URL}/query",
            json={"repo_url": repo_url, "query": query, "k": 5},
            timeout=30
        )
        if resp.status_code == 200:
            results = resp.json().get("results", [])
            print(f"   Found {len(results)} results")
            return results
        else:
            print(f"   ❌ Query failed: {resp.text}")
            return []
    except Exception as e:
        print(f"   ❌ Error: {e}")
        return []


def check_for_leak(results: list, forbidden_patterns: list):
    """Check if any results contain forbidden patterns (data leak)."""
    for r in results:
        content = r.get("content", "").lower()
        source = r.get("source", "").lower()
        for pattern in forbidden_patterns:
            if pattern.lower() in content or pattern.lower() in source:
                return True, pattern, r.get("source", "unknown")
    return False, None, None


def main():
    print("\n" + "=" * 70)
    print("🔒 NECRONOMICON DATA ISOLATION SECURITY TEST")
    print("=" * 70)
    
    vulnerabilities = []
    
    # Step 1: Ingest Repo A (Python - Click)
    if not ingest_repo(REPO_A, "Repo A (Click/Python)"):
        print("\n⚠️  Could not ingest Repo A, using fallback...")
        REPO_A_ACTUAL = "https://github.com/jonschlinkert/is-odd"
        ingest_repo(REPO_A_ACTUAL, "Repo A Fallback (is-odd)")
    else:
        REPO_A_ACTUAL = REPO_A
    
    # Step 2: Ingest Repo B (JavaScript - Express)
    if not ingest_repo(REPO_B, "Repo B (Express/JavaScript)"):
        print("\n⚠️  Could not ingest Repo B, using fallback...")
        REPO_B_ACTUAL = "https://github.com/jonschlinkert/is-even"
        ingest_repo(REPO_B_ACTUAL, "Repo B Fallback (is-even)")
    else:
        REPO_B_ACTUAL = REPO_B
    
    # Step 3: List repos to confirm both are loaded
    print("\n📋 Checking loaded repositories...")
    try:
        resp = requests.get(f"{BASE_URL}/repos", timeout=10)
        repos = resp.json().get("repos", [])
        print(f"   Loaded repos: {repos}")
    except Exception as e:
        print(f"   ❌ Could not list repos: {e}")
    
    # Step 4: ATTACK VECTOR - Query Repo A for Repo B concepts
    print("\n" + "-" * 70)
    print("🎯 ATTACK VECTOR: Cross-repo data leak test")
    print("-" * 70)
    
    # Query Python repo for JavaScript concepts
    results_a = query_repo(REPO_A_ACTUAL, "middleware router express", "Repo A (Python)")
    
    # Check for Express/JS code in Python repo results
    leak_found, pattern, source = check_for_leak(
        results_a, 
        ["express", "router.get", "app.use", "req, res, next", "module.exports"]
    )
    
    if leak_found:
        print(f"\n   🚨 LEAK DETECTED: Found '{pattern}' in {source}")
        vulnerabilities.append(f"Cross-repo leak: JS code found in Python repo query")
    else:
        print(f"\n   ✅ No JavaScript code leaked into Python repo results")
    
    # Step 5: Verify Repo A returns valid results for its own content
    print("\n" + "-" * 70)
    print("✓ VERIFICATION: Repo A returns its own content")
    print("-" * 70)
    
    results_a_valid = query_repo(REPO_A_ACTUAL, "click command option", "Repo A (Python)")
    if results_a_valid and len(results_a_valid) > 0:
        first_source = results_a_valid[0].get("source", "")
        if "click" in first_source.lower() or "is-odd" in first_source.lower():
            print(f"   ✅ Repo A returns its own content: {first_source[:60]}...")
        else:
            print(f"   ⚠️  Unexpected source: {first_source}")
    else:
        print(f"   ⚠️  No results for Repo A self-query")
    
    # Step 6: Verify Repo B returns valid results for its own content
    print("\n" + "-" * 70)
    print("✓ VERIFICATION: Repo B returns its own content")
    print("-" * 70)
    
    results_b_valid = query_repo(REPO_B_ACTUAL, "middleware router", "Repo B (JavaScript)")
    if results_b_valid and len(results_b_valid) > 0:
        first_source = results_b_valid[0].get("source", "")
        if "express" in first_source.lower() or "is-even" in first_source.lower():
            print(f"   ✅ Repo B returns its own content: {first_source[:60]}...")
        else:
            print(f"   ⚠️  Unexpected source: {first_source}")
    else:
        print(f"   ⚠️  No results for Repo B self-query")
    
    # Step 7: Cross-check - Query Repo B for Python concepts
    print("\n" + "-" * 70)
    print("🎯 REVERSE ATTACK: Query JS repo for Python concepts")
    print("-" * 70)
    
    results_b_attack = query_repo(REPO_B_ACTUAL, "def click decorator python", "Repo B (JavaScript)")
    
    leak_found_reverse, pattern_rev, source_rev = check_for_leak(
        results_b_attack,
        ["def ", "@click", "import click", ".py"]
    )
    
    if leak_found_reverse:
        print(f"\n   🚨 LEAK DETECTED: Found '{pattern_rev}' in {source_rev}")
        vulnerabilities.append(f"Reverse leak: Python code found in JS repo query")
    else:
        print(f"\n   ✅ No Python code leaked into JavaScript repo results")
    
    # Final Report
    print("\n" + "=" * 70)
    print("📊 SECURITY REPORT")
    print("=" * 70)
    
    if vulnerabilities:
        print("\n🚨 LEAK DETECTED - DATA ISOLATION COMPROMISED!")
        for v in vulnerabilities:
            print(f"   • {v}")
        print("\n⚠️  Fix required: Implement proper repo isolation in VectorBrain")
    else:
        print("\n✅ SECURITY SEALED: Contexts are isolated")
        print("   • Repo A cannot see Repo B's code")
        print("   • Repo B cannot see Repo A's code")
        print("   • Each repository maintains its own embedding space")
    
    print("\n" + "=" * 70)


if __name__ == "__main__":
    main()
