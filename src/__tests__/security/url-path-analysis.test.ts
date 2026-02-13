import { describe, it, expect } from 'vitest';
import PhishGuard from '@/lib/services/PhishGuard';

describe('URL Path Analysis', () => {
    // === Login/Payment patterns on non-official domains ===

    it('should flag login page on unknown domain', () => {
        const result = PhishGuard.analyzeUrl('https://secure-bca-update.xyz/login');
        expect(result.details.pathAnalysisScore).toBeGreaterThan(0);
        expect(result.reasons.some(r => r.includes('login/payment page pattern'))).toBe(true);
    });

    it('should flag payment page on unknown domain', () => {
        const result = PhishGuard.analyzeUrl('https://tokped-promo.site/checkout');
        expect(result.details.pathAnalysisScore).toBeGreaterThan(0);
        expect(result.reasons.some(r => r.includes('login/payment page pattern'))).toBe(true);
    });

    it('should flag verify page on unknown domain', () => {
        const result = PhishGuard.analyzeUrl('https://some-random.xyz/verify/account');
        expect(result.details.pathAnalysisScore).toBeGreaterThan(0);
    });

    it('should flag Indonesian login keyword (masuk)', () => {
        const result = PhishGuard.analyzeUrl('https://secure-bank.site/masuk');
        expect(result.details.pathAnalysisScore).toBeGreaterThan(0);
    });

    it('should NOT flag login page on official brand domain', () => {
        // google.com is a known brand — login there is legitimate
        const result = PhishGuard.analyzeUrl('https://accounts.google.com/login');
        expect(result.details.pathAnalysisScore).toBe(0);
    });

    it('should NOT flag payment page on official domain', () => {
        const result = PhishGuard.analyzeUrl('https://www.tokopedia.com/checkout');
        expect(result.details.pathAnalysisScore).toBe(0);
    });

    // === Base64 payloads ===

    it('should flag URL with Base64-like payload', () => {
        const result = PhishGuard.analyzeUrl('https://some.site/redir?data=aHR0cHM6Ly9leGFtcGxlLmNvbS9tYWx3YXJl');
        expect(result.details.pathAnalysisScore).toBeGreaterThan(0);
        expect(result.reasons.some(r => r.includes('encoded data'))).toBe(true);
    });

    it('should NOT flag short query params', () => {
        const result = PhishGuard.analyzeUrl('https://some.site/page?ref=abc123');
        expect(result.reasons.some(r => r.includes('encoded data'))).toBe(false);
    });

    // === Email/Phone in URL ===

    it('should flag URL with email address in query params', () => {
        const result = PhishGuard.analyzeUrl('https://some-phishing.site/verify?email=victim@gmail.com');
        expect(result.details.pathAnalysisScore).toBeGreaterThan(0);
        expect(result.reasons.some(r => r.includes('email address'))).toBe(true);
    });

    it('should flag URL with phone number in query params', () => {
        const result = PhishGuard.analyzeUrl('https://some-phishing.site/otp?phone=+6281234567890');
        expect(result.details.pathAnalysisScore).toBeGreaterThan(0);
    });

    // === Deep path nesting ===

    it('should flag deeply nested URL path', () => {
        const result = PhishGuard.analyzeUrl('https://some.site/a/b/c/d/e/f/verify');
        expect(result.reasons.some(r => r.includes('Deeply nested'))).toBe(true);
    });

    it('should NOT flag normal depth path', () => {
        const result = PhishGuard.analyzeUrl('https://some.site/products/shoes/nike');
        expect(result.reasons.some(r => r.includes('Deeply nested'))).toBe(false);
    });

    // === Brand path mimicry ===

    it('should flag banking path pattern on non-official domain', () => {
        const result = PhishGuard.analyzeUrl('https://scam-xyz.site/internet-banking/login');
        expect(result.reasons.some(r => r.includes('banking/financial'))).toBe(true);
    });

    it('should flag wallet path pattern on non-official domain', () => {
        const result = PhishGuard.analyzeUrl('https://fake-payment.xyz/e-wallet/topup');
        expect(result.reasons.some(r => r.includes('banking/financial'))).toBe(true);
    });

    // === Score cap ===

    it('should cap path analysis score at 15', () => {
        // Combine all signals: login + base64 + email + deep path + bank mimic
        const result = PhishGuard.analyzeUrl('https://bad.xyz/internet-banking/login/verify/otp/reset-password/a/b?data=aHR0cHM6Ly9leGFtcGxlLmNvbS9tYWx3YXJl&email=test@test.com');
        expect(result.details.pathAnalysisScore).toBeLessThanOrEqual(15);
    });

    // === Integration: cumulative scoring ===

    it('should increase total score when path analysis adds to other signals', () => {
        const withoutPath = PhishGuard.analyzeUrl('https://scam-bank.xyz/');
        const withPath = PhishGuard.analyzeUrl('https://scam-bank.xyz/login');
        expect(withPath.score).toBeGreaterThan(withoutPath.score);
    });
});
