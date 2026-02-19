package com.safeguard.app;

import java.util.regex.Matcher;
import java.util.regex.Pattern;

public class ScamDetector {

    // Regex to find URLs
    private static final Pattern URL_PATTERN = Pattern.compile(
            "https?://(www\\.)?[-a-zA-Z0-9@:%._\\+~#=]{1,256}\\.[a-zA-Z0-9()]{1,6}\\b([-a-zA-Z0-9()@:%_\\+.~#?&//=]*)",
            Pattern.CASE_INSENSITIVE);

    // Common scam keywords (Indonesian context)
    private static final String[] SCAM_KEYWORDS = {
            "menang", "undian", "hadiah", "pemenang", // Lottery
            "transfer", "brimo", "bca mobile", "kenaikan tarif", // Bank
            "blokir", "tutup rekening", // Urgency
            "paket", "tertahan", "bea cukai", // Courier
            "kerja", "paruh waktu", "freelance", "gaji harian", // Job
            "apk", "undangan", "tilang", "foto" // APK/File
    };

    /**
     * Analyze text for suspicious content.
     * Returns true if text contains a URL AND (scam keywords OR is a shortener).
     */
    public static boolean isSuspicious(String text) {
        if (text == null || text.isEmpty())
            return false;
        String lowerText = text.toLowerCase();

        // 1. Must contain a URL to be actionable for us (usually)
        // Or if it's just very scammy text, we might want to warn too, but let's focus
        // on links first.
        boolean hasUrl = URL_PATTERN.matcher(text).find();

        if (!hasUrl) {
            // If no URL but has "APK" or "Install", might be dangerous too (file scam)
            if (lowerText.contains(".apk"))
                return true;
            return false;
        }

        // 2. Check for keywords
        for (String keyword : SCAM_KEYWORDS) {
            if (lowerText.contains(keyword)) {
                return true;
            }
        }

        // 3. Check for specific dangerous patterns
        if (lowerText.contains("bit.ly") || lowerText.contains("tinyurl") || lowerText.contains("is.gd")) {
            // Setup strict policy for shorteners in SMS involving urgency
            if (lowerText.contains("segera") || lowerText.contains("cek"))
                return true;
        }

        return false;
    }
}
