"""
Vulnerability Tests for Necronomicon Parser Service
"""
import requests
import time

BASE_URL = "http://localhost:8000"

def test_overwrite_check():
    """Test 1: Check if ingesting a new repo overwrites the previous one."""
    print("\n" + "="*60)
    print("TEST 1: OVERWRITE CHECK")
    print("="*60)
    
    vulnerabilities = []
    
    # Ingest first repo (has JS files)
    print("\n[1.1] Ingesting jonschlinkert/is-odd...")
    resp = requests.post(f"{BASE_URL}/ingest", json={"url": "https://github.com/jonschlinkert/is-odd"}, timeout=60)
    if resp.status_code != 200:
        print(f"  ⚠️ Ingest failed: {resp.text}")
        return ["is-odd ingest failed"]
    print(f"  ✅ Ingested: {resp.json()}")
    
    # Query for 'odd'
    print("\n[1.2] Querying for 'odd'...")
    resp = requests.post(f"{BASE_URL}/query", json={"query": "odd number", "k": 3}, timeout=30)
    odd_results = resp.json().get("results", [])
    print(f"  Found {len(odd_results)} results")
    
    if not odd_results:
        vulnerabilities.append("No results for 'odd' after is-odd ingest")
        return vulnerabilities
    
    # Ingest a different repo
    print("\n[1.3] Ingesting jonschlinkert/is-even...")
    resp = requests.post(f"{BASE_URL}/ingest", json={"url": "https://github.com/jonschlinkert/is-even"}, timeout=60)
    print(f"  Status: {resp.status_code}")
    
    # Query first repo again
    print("\n[1.4] Querying for 'odd' again (checking if data persists)...")
    resp = requests.post(f"{BASE_URL}/query", json={"query": "odd number", "k": 3}, timeout=30)
    odd_results_after = resp.json().get("results", [])
    
    # Check if is-odd data is still there
    is_odd_found = any("is-odd" in str(r.get("source", "")) for r in odd_results_after)
    
    if not is_odd_found:
        print("  🚨 VULNERABILITY: Previous repo data was OVERWRITTEN!")
        vulnerabilities.append("DATA OVERWRITE: Ingesting new repo erases previous repo's embeddings")
    else:
        print("  ✅ Previous repo data persists")
    
    return vulnerabilities


def test_payload_size():
    """Test 2: Check if returned snippets are too large for LLM context."""
    print("\n" + "="*60)
    print("TEST 2: PAYLOAD SIZE CHECK")
    print("="*60)
    
    vulnerabilities = []
    MAX_SNIPPET_SIZE = 3000
    
    # Query for common terms
    print("\n[2.1] Querying for 'function'...")
    resp = requests.post(f"{BASE_URL}/query", json={"query": "function", "k": 5})
    results = resp.json().get("results", [])
    
    oversized = []
    for i, r in enumerate(results):
        content = r.get("content", "")
        size = len(content)
        print(f"  Result {i+1}: {size} chars")
        if size > MAX_SNIPPET_SIZE:
            oversized.append((r.get("source", "unknown"), size))
    
    if oversized:
        print(f"\n  🚨 VULNERABILITY: {len(oversized)} snippets exceed {MAX_SNIPPET_SIZE} chars!")
        for source, size in oversized:
            print(f"    - {source}: {size} chars")
        vulnerabilities.append(f"OVERSIZED SNIPPETS: {len(oversized)} results > {MAX_SNIPPET_SIZE} chars (will blow LLM context)")
    else:
        print(f"\n  ✅ All snippets under {MAX_SNIPPET_SIZE} chars")
    
    return vulnerabilities


def test_resilience():
    """Test 3: Check if server survives bad input."""
    print("\n" + "="*60)
    print("TEST 3: RESILIENCE CHECK")
    print("="*60)
    
    vulnerabilities = []
    
    # Send garbage URL
    print("\n[3.1] Sending garbage URL...")
    try:
        resp = requests.post(f"{BASE_URL}/ingest", json={"url": "https://github.com/void/does-not-exist"}, timeout=30)
        print(f"  Response: {resp.status_code}")
        if resp.status_code in [400, 500]:
            print("  ✅ Server returned error (expected)")
        else:
            print(f"  ⚠️ Unexpected status: {resp.status_code}")
    except Exception as e:
        print(f"  ⚠️ Request failed: {e}")
    
    # Check if server is still alive
    print("\n[3.2] Checking if server survived (pinging /health)...")
    try:
        resp = requests.get(f"{BASE_URL}/health", timeout=5)
        if resp.status_code == 200:
            print("  ✅ Server is still alive!")
        else:
            print("  🚨 Server returned non-200 on health check")
            vulnerabilities.append("SERVER UNSTABLE: Health check failed after bad input")
    except Exception as e:
        print(f"  🚨 VULNERABILITY: Server crashed! {e}")
        vulnerabilities.append("SERVER CRASH: Bad input caused server to become unresponsive")
    
    return vulnerabilities


def main():
    print("\n" + "#"*60)
    print("# NECRONOMICON VULNERABILITY SCANNER")
    print("#"*60)
    
    all_vulnerabilities = []
    
    # Run tests
    all_vulnerabilities.extend(test_overwrite_check())
    all_vulnerabilities.extend(test_payload_size())
    all_vulnerabilities.extend(test_resilience())
    
    # Print report
    print("\n" + "#"*60)
    print("# VULNERABILITY REPORT")
    print("#"*60)
    
    if all_vulnerabilities:
        print(f"\n🚨 FOUND {len(all_vulnerabilities)} VULNERABILITIES:\n")
        for i, v in enumerate(all_vulnerabilities, 1):
            print(f"  {i}. {v}")
        print("\n⚠️  ACTION REQUIRED: Fix these issues before production!")
    else:
        print("\n✅ NO VULNERABILITIES FOUND")
        print("   All tests passed!")
    
    print("\n" + "#"*60)


if __name__ == "__main__":
    main()
