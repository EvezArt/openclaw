package main

// Example: Canonical JSON hashing in Go
// This demonstrates using the webpki/jcs library for RFC 8785 canonicalization
//
// To run:
//   go install github.com/cyberphone/json-canonicalization/go/src/webpki.org/jsoncanonicalizer@latest
//   go run ops-stack/examples/example.go

import (
	"crypto/sha256"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
)

// Note: In a real implementation, you would import:
// import "webpki.org/jsoncanonicalizer"

type TestData struct {
	TestID    string                 `json:"testId"`
	Timestamp string                 `json:"timestamp"`
	Data      map[string]interface{} `json:"data"`
}

func main() {
	// Sample data matching the golden fixture
	data := TestData{
		TestID:    "golden-hash-test-v1",
		Timestamp: "2024-01-01T00:00:00.000Z",
		Data: map[string]interface{}{
			"modules": []string{"market-intelligence", "notifications", "automation", "monetization", "ai-engine"},
			"config": map[string]interface{}{
				"environment": "test",
				"version":     "1.0.0",
			},
			"nested": map[string]interface{}{
				"array": []int{3, 1, 2},
				"object": map[string]string{
					"z": "last",
					"a": "first",
					"m": "middle",
				},
			},
		},
	}

	// Standard JSON marshaling (not canonical)
	standardJSON, err := json.Marshal(data)
	if err != nil {
		log.Fatal(err)
	}
	fmt.Println("Standard JSON:")
	fmt.Println(string(standardJSON))
	fmt.Println()

	// Canonical JSON (would use jsoncanonicalizer.Transform)
	// canonical, err := jsoncanonicalizer.Transform(data)
	// if err != nil {
	//     log.Fatal(err)
	// }
	// fmt.Println("Canonical JSON:")
	// fmt.Println(string(canonical))

	// For this example, we'll use standard JSON
	// In production, use the canonicalized form
	hash := sha256.Sum256(standardJSON)
	fmt.Println("SHA-256 Hash:")
	fmt.Println(hex.EncodeToString(hash[:]))
	fmt.Println()

	fmt.Println("To enable full canonical hashing:")
	fmt.Println("  go install github.com/cyberphone/json-canonicalization/go/src/webpki.org/jsoncanonicalizer@latest")
}
