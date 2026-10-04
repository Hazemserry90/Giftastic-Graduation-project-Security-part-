package com.giftastic.giftastic.modules.identity.domain;

import java.util.Locale;
import java.util.Set;
import java.util.regex.Pattern;

public final class RegistrationPolicy {

    public static final int MIN_PASSWORD_LENGTH = 6;
    public static final Set<String> ALLOWED_EMAIL_DOMAINS = Set.of(
            "gmail.com", "outlook.com", "hotmail.com", "live.com", "icloud.com", "yahoo.com");

    private static final Pattern EMAIL_FORMAT = Pattern.compile("^[^\\s@]+@[^\\s@]+\\.[^\\s@]+$");
    private static final Pattern UPPERCASE = Pattern.compile("[A-Z]");
    private static final Pattern LOWERCASE = Pattern.compile("[a-z]");
    private static final Pattern NUMBER = Pattern.compile("\\d");
    private static final Pattern SPECIAL = Pattern.compile("[^A-Za-z0-9\\s]");

    private RegistrationPolicy() {
    }

    public static void validate(String email, String password) {
        validateEmail(email);
        validatePassword(password);
    }

    public static void validateEmail(String email) {
        if (email == null || !EMAIL_FORMAT.matcher(email.trim()).matches()) {
            throw new IllegalArgumentException("Enter a valid email address");
        }

        String normalizedEmail = email.trim().toLowerCase(Locale.ROOT);
        String domain = normalizedEmail.substring(normalizedEmail.lastIndexOf('@') + 1);
        if (!ALLOWED_EMAIL_DOMAINS.contains(domain)) {
            throw new IllegalArgumentException(
                    "Use an email from Gmail, Outlook, Hotmail, Live, iCloud, or Yahoo");
        }
    }

    public static void validatePassword(String password) {
        if (password == null || password.length() < MIN_PASSWORD_LENGTH
                || !UPPERCASE.matcher(password).find()
                || !LOWERCASE.matcher(password).find()
                || !NUMBER.matcher(password).find()
                || !SPECIAL.matcher(password).find()) {
            throw new IllegalArgumentException(
                    "Password must be at least 6 characters and include an uppercase letter, lowercase letter, number, and special character");
        }
    }
}
