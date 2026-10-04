package com.giftastic.giftastic.modules.identity.domain;

import static org.junit.jupiter.api.Assertions.assertDoesNotThrow;
import static org.junit.jupiter.api.Assertions.assertThrows;

import org.junit.jupiter.api.Test;

class RegistrationPolicyTests {

    @Test
    void acceptsStrongPasswordAndAllowedProvider() {
        assertDoesNotThrow(() -> RegistrationPolicy.validate("user@gmail.com", "Test@1234"));
        assertDoesNotThrow(() -> RegistrationPolicy.validate("user@OUTLOOK.COM", "Test@1234"));
    }

    @Test
    void rejectsPasswordsMissingARequiredCharacterClass() {
        for (String password : new String[] { "test1234", "TEST@1234", "Testtest@", "Test1234", "Test 1234" }) {
            assertThrows(IllegalArgumentException.class,
                    () -> RegistrationPolicy.validate("user@gmail.com", password));
        }
    }

    @Test
    void rejectsDisposableAndUnsupportedProviders() {
        for (String domain : new String[] { "tempmail.com", "mailinator.com", "10minutemail.com", "random-domain.xyz" }) {
            assertThrows(IllegalArgumentException.class,
                    () -> RegistrationPolicy.validate("user@" + domain, "Test@1234"));
        }
    }

    @Test
    void rejectsMalformedEmail() {
        assertThrows(IllegalArgumentException.class,
                () -> RegistrationPolicy.validate("not-an-email", "Test@1234"));
    }
}
