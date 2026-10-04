package com.giftastic.giftastic.modules.review.service;

import java.util.Arrays;
import java.util.HashSet;
import java.util.Set;
import java.util.regex.Pattern;

import org.springframework.stereotype.Service;

import lombok.extern.slf4j.Slf4j;

@Slf4j
@Service
public class ContentModerationService {
    
    // English forbidden words
    private static final Set<String> ENGLISH_FORBIDDEN_WORDS = new HashSet<>(Arrays.asList(
        "spam", "scam", "fake", "fraud", "cheat", "steal", "terrible", "worst", "horrible",
        "hate", "stupid", "idiot", "damn", "hell", "crap", "shit", "fuck", "ass", "bitch"
    ));
    
    // Arabic forbidden words (transliterated and Arabic script)
    private static final Set<String> ARABIC_FORBIDDEN_WORDS = new HashSet<>(Arrays.asList(
        "نصب", "احتيال", "سرقة", "غش", "كذب", "فاشل", "سيء", "قذر", "حقير",
        "khara", "kalb", "hmar", "ghabi", "7mar", "wa7esh"
    ));
    
    // Patterns for detecting spam
    private static final Pattern URL_PATTERN = Pattern.compile(
        "(?i)\\b(https?://|www\\.)\\S+\\b"
    );
    
    private static final Pattern EMAIL_PATTERN = Pattern.compile(
        "(?i)\\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\\.[A-Z]{2,}\\b"
    );
    
    private static final Pattern PHONE_PATTERN = Pattern.compile(
        "(?i)\\b(\\+?\\d{1,3}[-.\\s]?)?\\(?\\d{3}\\)?[-.\\s]?\\d{3}[-.\\s]?\\d{4}\\b"
    );
    
    private static final Pattern REPEATED_CHARS = Pattern.compile(
        "(.)\\1{4,}"
    );
    
    /**
     * Analyzes content and returns a score between 0 and 1.
     * Higher score means cleaner content.
     * Score < 0.7 triggers manual review.
     */
    public double analyzeContent(String content) {
        if (content == null || content.isBlank()) {
            return 1.0; // Empty content is acceptable
        }
        
        double score = 1.0;
        String lowerContent = content.toLowerCase();
        
        // Check for forbidden words
        int forbiddenWordCount = 0;
        for (String word : ENGLISH_FORBIDDEN_WORDS) {
            if (lowerContent.contains(word)) {
                forbiddenWordCount++;
            }
        }
        for (String word : ARABIC_FORBIDDEN_WORDS) {
            if (content.contains(word) || lowerContent.contains(word)) {
                forbiddenWordCount++;
            }
        }
        
        // Deduct points for forbidden words
        if (forbiddenWordCount > 0) {
            score -= Math.min(0.5, forbiddenWordCount * 0.15);
        }
        
        // Check for URLs (potential spam)
        if (URL_PATTERN.matcher(content).find()) {
            score -= 0.3;
        }
        
        // Check for emails (potential spam)
        if (EMAIL_PATTERN.matcher(content).find()) {
            score -= 0.2;
        }
        
        // Check for phone numbers (potential spam)
        if (PHONE_PATTERN.matcher(content).find()) {
            score -= 0.2;
        }
        
        // Check for excessive repeated characters (spam indicator)
        if (REPEATED_CHARS.matcher(content).find()) {
            score -= 0.15;
        }
        
        // Check for excessive caps (shouting)
        long capsCount = content.chars().filter(Character::isUpperCase).count();
        long letterCount = content.chars().filter(Character::isLetter).count();
        if (letterCount > 0 && (double) capsCount / letterCount > 0.5) {
            score -= 0.1;
        }
        
        // Ensure score is between 0 and 1
        score = Math.max(0.0, Math.min(1.0, score));
        
        log.debug("Content moderation score: {} for content length: {}", score, content.length());
        
        return score;
    }
    
    /**
     * Quick check if content needs manual review
     */
    public boolean needsManualReview(String content) {
        return analyzeContent(content) < 0.7;
    }
}
