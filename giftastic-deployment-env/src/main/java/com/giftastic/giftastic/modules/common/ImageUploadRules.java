package com.giftastic.giftastic.modules.common;

import java.util.Locale;
import java.util.Set;
import java.util.UUID;

import org.springframework.web.multipart.MultipartFile;
import org.springframework.web.server.ResponseStatusException;
import org.springframework.http.HttpStatus;

public final class ImageUploadRules {

    private static final Set<String> ALLOWED_MIME_TYPES = Set.of(
            "image/jpeg",
            "image/png",
            "image/webp"
    );

    private ImageUploadRules() {}

    public static void validateImageFile(MultipartFile file, ImageUploadProperties limits) {
        if (file == null || file.isEmpty()) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Image file is required.");
        }
        if (file.getSize() > limits.getMaxImageBytes()) {
            throw new ResponseStatusException(HttpStatus.PAYLOAD_TOO_LARGE,
                    "Image must be " + (limits.getMaxImageBytes() / 1024 / 1024) + " MB or smaller.");
        }
        String contentType = normalizeMimeType(file.getContentType());
        if (!ALLOWED_MIME_TYPES.contains(contentType)) {
            throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Only JPG, JPEG, PNG, and WebP images are allowed.");
        }
    }

    public static String extensionFor(String mimeType) {
        return switch (normalizeMimeType(mimeType)) {
            case "image/png" -> "png";
            case "image/webp" -> "webp";
            case "image/jpeg" -> "jpg";
            default -> throw new ResponseStatusException(HttpStatus.BAD_REQUEST, "Unsupported image type.");
        };
    }

    public static String safeObjectName(UUID imageId, String mimeType) {
        return imageId + "." + extensionFor(mimeType);
    }

    public static String normalizeFilename(String filename) {
        if (filename == null || filename.isBlank()) {
            return "uploaded-image";
        }
        String cleaned = filename.replaceAll("[\\\\/]+", "_").trim();
        return cleaned.length() > 160 ? cleaned.substring(cleaned.length() - 160) : cleaned;
    }

    public static String normalizeMimeType(String mimeType) {
        return mimeType == null ? "" : mimeType.toLowerCase(Locale.ROOT).trim();
    }
}
