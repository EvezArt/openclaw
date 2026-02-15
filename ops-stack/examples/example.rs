// Example: Canonical JSON hashing in Rust
// This demonstrates using the serde_jcs library for RFC 8785 canonicalization
//
// To use, add to Cargo.toml:
//   [dependencies]
//   serde = { version = "1.0", features = ["derive"] }
//   serde_json = "1.0"
//   serde_jcs = "0.1"
//   sha2 = "0.10"
//   hex = "0.4"

use serde::{Deserialize, Serialize};
use std::collections::HashMap;

#[derive(Debug, Serialize, Deserialize)]
struct TestData {
    #[serde(rename = "testId")]
    test_id: String,
    timestamp: String,
    data: DataContent,
}

#[derive(Debug, Serialize, Deserialize)]
struct DataContent {
    modules: Vec<String>,
    config: Config,
    nested: Nested,
}

#[derive(Debug, Serialize, Deserialize)]
struct Config {
    environment: String,
    version: String,
}

#[derive(Debug, Serialize, Deserialize)]
struct Nested {
    array: Vec<i32>,
    object: HashMap<String, String>,
}

fn main() {
    // Sample data matching the golden fixture
    let mut object = HashMap::new();
    object.insert("z".to_string(), "last".to_string());
    object.insert("a".to_string(), "first".to_string());
    object.insert("m".to_string(), "middle".to_string());

    let data = TestData {
        test_id: "golden-hash-test-v1".to_string(),
        timestamp: "2024-01-01T00:00:00.000Z".to_string(),
        data: DataContent {
            modules: vec![
                "market-intelligence".to_string(),
                "notifications".to_string(),
                "automation".to_string(),
                "monetization".to_string(),
                "ai-engine".to_string(),
            ],
            config: Config {
                environment: "test".to_string(),
                version: "1.0.0".to_string(),
            },
            nested: Nested {
                array: vec![3, 1, 2],
                object,
            },
        },
    };

    // Standard JSON serialization (not canonical)
    let standard_json = serde_json::to_string(&data).unwrap();
    println!("Standard JSON:");
    println!("{}", standard_json);
    println!();

    // Canonical JSON using serde_jcs (uncomment when dependency is added)
    // let canonical_json = serde_jcs::to_string(&data).unwrap();
    // println!("Canonical JSON (RFC 8785):");
    // println!("{}", canonical_json);
    // println!();
    
    // Compute hash (uncomment when sha2 dependency is added)
    // use sha2::{Sha256, Digest};
    // let mut hasher = Sha256::new();
    // hasher.update(canonical_json.as_bytes());
    // let hash = hasher.finalize();
    // println!("SHA-256 Hash:");
    // println!("{}", hex::encode(hash));

    println!("To enable full canonical hashing:");
    println!("  Add to Cargo.toml:");
    println!("    serde_jcs = \"0.1\"");
    println!("    sha2 = \"0.10\"");
    println!("    hex = \"0.4\"");
}
