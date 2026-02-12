#!/usr/bin/env python3
"""
Example: Canonical JSON hashing in Python
This demonstrates using the rfc8785 library for RFC 8785 canonicalization

To run:
    pip install rfc8785
    python ops-stack/examples/example.py
"""

import hashlib
import json
import sys

try:
    import rfc8785
    HAS_RFC8785 = True
except ImportError:
    HAS_RFC8785 = False
    print("Warning: rfc8785 not installed. Install with: pip install rfc8785")
    print()

def main():
    # Sample data matching the golden fixture
    data = {
        "testId": "golden-hash-test-v1",
        "timestamp": "2024-01-01T00:00:00.000Z",
        "data": {
            "modules": ["market-intelligence", "notifications", "automation", "monetization", "ai-engine"],
            "config": {
                "environment": "test",
                "version": "1.0.0",
            },
            "nested": {
                "array": [3, 1, 2],
                "object": {
                    "z": "last",
                    "a": "first",
                    "m": "middle",
                },
            },
        },
    }

    # Standard JSON (not canonical)
    standard_json = json.dumps(data, separators=(',', ':'))
    print("Standard JSON:")
    print(standard_json)
    print()

    # Canonical JSON using rfc8785
    if HAS_RFC8785:
        canonical_json = rfc8785.dumps(data)
        print("Canonical JSON (RFC 8785):")
        print(canonical_json)
        print()
        
        # Compute hash
        hash_digest = hashlib.sha256(canonical_json.encode('utf-8')).hexdigest()
        print("SHA-256 Hash:")
        print(hash_digest)
        print()
        
        # Verify deterministic behavior
        canonical_json2 = rfc8785.dumps(data)
        if canonical_json == canonical_json2:
            print("✓ Deterministic: Same input produces same output")
        else:
            print("✗ Non-deterministic: Different outputs!")
    else:
        print("Install rfc8785 to see canonical JSON output:")
        print("  pip install rfc8785")
        sys.exit(1)

if __name__ == "__main__":
    main()
