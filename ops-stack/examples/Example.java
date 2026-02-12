import org.webpki.json.JSONObjectReader;
import org.webpki.json.JSONParser;
import org.webpki.json.JSONObjectWriter;

import java.nio.charset.StandardCharsets;
import java.security.MessageDigest;
import java.util.HexFormat;

/**
 * Example: Canonical JSON hashing in Java
 * This demonstrates using the WebPKI/JCS library for RFC 8785 canonicalization
 * 
 * To use, add to pom.xml:
 *   <dependency>
 *     <groupId>org.webpki</groupId>
 *     <artifactId>json-canonicalization</artifactId>
 *     <version>1.0</version>
 *   </dependency>
 * 
 * Or to build.gradle:
 *   implementation 'org.webpki:json-canonicalization:1.0'
 * 
 * To compile and run:
 *   javac Example.java
 *   java Example
 */
public class Example {
    public static void main(String[] args) {
        try {
            // Sample data matching the golden fixture
            JSONObjectWriter writer = new JSONObjectWriter();
            writer.setString("testId", "golden-hash-test-v1");
            writer.setString("timestamp", "2024-01-01T00:00:00.000Z");
            
            JSONObjectWriter data = writer.setObject("data");
            
            // Add modules array
            String[] modules = {
                "market-intelligence",
                "notifications",
                "automation",
                "monetization",
                "ai-engine"
            };
            data.setStringArray("modules", modules);
            
            // Add config
            JSONObjectWriter config = data.setObject("config");
            config.setString("environment", "test");
            config.setString("version", "1.0.0");
            
            // Add nested
            JSONObjectWriter nested = data.setObject("nested");
            nested.setIntArray("array", new int[]{3, 1, 2});
            
            JSONObjectWriter object = nested.setObject("object");
            object.setString("z", "last");
            object.setString("a", "first");
            object.setString("m", "middle");
            
            // Get canonical JSON
            String canonicalJson = writer.toString();
            System.out.println("Canonical JSON (RFC 8785):");
            System.out.println(canonicalJson);
            System.out.println();
            
            // Compute SHA-256 hash
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(canonicalJson.getBytes(StandardCharsets.UTF_8));
            String hexHash = HexFormat.of().formatHex(hash);
            
            System.out.println("SHA-256 Hash:");
            System.out.println(hexHash);
            System.out.println();
            
            // Verify deterministic behavior
            String canonicalJson2 = writer.toString();
            if (canonicalJson.equals(canonicalJson2)) {
                System.out.println("✓ Deterministic: Same input produces same output");
            } else {
                System.out.println("✗ Non-deterministic: Different outputs!");
            }
            
        } catch (Exception e) {
            System.err.println("Error: " + e.getMessage());
            System.err.println();
            System.err.println("To enable full canonical hashing:");
            System.err.println("  Add to pom.xml:");
            System.err.println("    <dependency>");
            System.err.println("      <groupId>org.webpki</groupId>");
            System.err.println("      <artifactId>json-canonicalization</artifactId>");
            System.err.println("      <version>1.0</version>");
            System.err.println("    </dependency>");
        }
    }
}
