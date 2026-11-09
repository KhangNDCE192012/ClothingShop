package vn.edu.fpt.sba301_clothing_shop.security;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class LegacyCompatiblePasswordEncoderTest {

    private LegacyCompatiblePasswordEncoder encoder;

    @BeforeEach
    void setUp() {
        encoder = new LegacyCompatiblePasswordEncoder();
    }

    @Test
    void testEncodeProducesBcryptHash() {
        String raw = "123456";
        String encoded = encoder.encode(raw);
        assertNotNull(encoded);
        assertTrue(encoded.startsWith("$2a$") || encoded.startsWith("$2b$"));
        assertTrue(encoder.matches(raw, encoded));
    }

    @Test
    void testMatchesLegacyPlainTextPassword() {
        String plain = "admin123";
        assertTrue(encoder.matches(plain, "admin123"));
        assertFalse(encoder.matches("wrongpass", "admin123"));
    }

    @Test
    void testUpgradeEncodingIdentifiesPlainText() {
        assertTrue(encoder.upgradeEncoding("123456"));
        assertTrue(encoder.upgradeEncoding("plaintext_password"));
        assertTrue(encoder.upgradeEncoding(null));
        assertFalse(encoder.upgradeEncoding("$2a$10$abcdefghijklmnopqrstuvwxyz1234567890"));
        assertFalse(encoder.upgradeEncoding("$2b$10$abcdefghijklmnopqrstuvwxyz1234567890"));
    }
}
