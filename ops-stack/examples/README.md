# Canonical Hashing Examples

This directory contains example implementations of RFC 8785 canonical JSON hashing across multiple programming languages.

## Examples

### Node.js / TypeScript
See the main ops-stack modules:
- `ops-stack/ops-stack.ts` - Main test suite
- `ops-stack/market-intelligence/index.ts` - Example module

### Go
`example.go` - Demonstrates using webpki/jcs library

**Run:**
```bash
go install github.com/cyberphone/json-canonicalization/go/src/webpki.org/jsoncanonicalizer@latest
go run ops-stack/examples/example.go
```

### Python
`example.py` - Demonstrates using rfc8785 library

**Run:**
```bash
pip install rfc8785
python ops-stack/examples/example.py
```

### Rust
`example.rs` - Demonstrates using serde_jcs library

**Setup:**
Add to `Cargo.toml`:
```toml
[dependencies]
serde = { version = "1.0", features = ["derive"] }
serde_json = "1.0"
serde_jcs = "0.1"
sha2 = "0.10"
hex = "0.4"
```

**Run:**
```bash
rustc ops-stack/examples/example.rs
./example
```

### Java
`Example.java` - Demonstrates using WebPKI/JCS library

**Setup:**
Maven `pom.xml`:
```xml
<dependency>
  <groupId>org.webpki</groupId>
  <artifactId>json-canonicalization</artifactId>
  <version>1.0</version>
</dependency>
```

Gradle `build.gradle`:
```groovy
implementation 'org.webpki:json-canonicalization:1.0'
```

**Run:**
```bash
javac ops-stack/examples/Example.java
java -cp ops-stack/examples Example
```

## Why Canonical JSON?

Canonical JSON (RFC 8785) ensures:

1. **Deterministic serialization**: Same data always produces the same JSON string
2. **Key ordering**: Object keys are sorted lexicographically
3. **Number formatting**: Consistent number representation
4. **Whitespace**: No unnecessary whitespace
5. **Unicode**: Proper Unicode escaping

This enables:
- Reliable content hashing and signatures
- Data deduplication
- Consistent cryptographic operations
- Cross-platform data verification

## Golden Test Fixture

All examples use the same test data:

```json
{
  "testId": "golden-hash-test-v1",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "data": {
    "modules": ["market-intelligence", "notifications", "automation", "monetization", "ai-engine"],
    "config": {
      "environment": "test",
      "version": "1.0.0"
    },
    "nested": {
      "array": [3, 1, 2],
      "object": {
        "z": "last",
        "a": "first",
        "m": "middle"
      }
    }
  }
}
```

Expected canonical form (keys sorted):
```json
{"data":{"config":{"environment":"test","version":"1.0.0"},"modules":["market-intelligence","notifications","automation","monetization","ai-engine"],"nested":{"array":[3,1,2],"object":{"a":"first","m":"middle","z":"last"}}},"testId":"golden-hash-test-v1","timestamp":"2024-01-01T00:00:00.000Z"}
```

Expected SHA-256 hash:
```
34923a5bcb0ad9963ba545bf4b0b3dea84a338b2a43f85bc475f71dbf01e1395
```

## References

- [RFC 8785: JSON Canonicalization Scheme (JCS)](https://www.rfc-editor.org/rfc/rfc8785)
- [cyberphone/json-canonicalization](https://github.com/cyberphone/json-canonicalization)
- [json-canonicalize (npm)](https://www.npmjs.com/package/json-canonicalize)
- [rfc8785 (Python)](https://pypi.org/project/rfc8785/)
- [serde_jcs (Rust)](https://crates.io/crates/serde_jcs)
