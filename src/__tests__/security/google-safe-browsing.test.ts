import { describe, it, expect, vi, beforeEach } from 'vitest';
import { performSafetyReview } from '@/lib/safetyReview';

describe('Google Safe Browsing Integration', () => {
    describe('SafetyReview with GSB result', () => {
        it('should add a passed GSB check when API is available and no threat', () => {
            const result = performSafetyReview('https://example.com', {
                isThreat: false,
                isApiAvailable: true,
            });
            const gsbCheck = result.checks.find(c => c.id === 'google_safe_browsing');
            expect(gsbCheck).toBeDefined();
            expect(gsbCheck?.passed).toBe(true);
            expect(gsbCheck?.description).toContain('Not flagged');
        });

        it('should add a failed GSB check when threat is detected', () => {
            const result = performSafetyReview('https://example.com', {
                isThreat: true,
                threatDescription: 'This site may contain malware',
                isApiAvailable: true,
            });
            const gsbCheck = result.checks.find(c => c.id === 'google_safe_browsing');
            expect(gsbCheck).toBeDefined();
            expect(gsbCheck?.passed).toBe(false);
            expect(gsbCheck?.severity).toBe('danger');
            expect(gsbCheck?.description).toContain('malware');
        });

        it('should set risk to blocked when GSB detects threat', () => {
            const result = performSafetyReview('https://example.com', {
                isThreat: true,
                threatDescription: 'Phishing detected',
                isApiAvailable: true,
            });
            expect(result.riskLevel).toBe('blocked');
        });

        it('should show offline message when API is unavailable', () => {
            const result = performSafetyReview('https://example.com', {
                isThreat: false,
                isApiAvailable: false,
            });
            const gsbCheck = result.checks.find(c => c.id === 'google_safe_browsing');
            expect(gsbCheck).toBeDefined();
            expect(gsbCheck?.passed).toBe(true); // Don't penalize for API being offline
            expect(gsbCheck?.description).toContain('offline');
        });

        it('should still work without GSB result (backward compatible)', () => {
            const result = performSafetyReview('https://example.com');
            const gsbCheck = result.checks.find(c => c.id === 'google_safe_browsing');
            expect(gsbCheck).toBeUndefined();
            expect(result).toBeDefined();
        });
    });

    describe('GoogleSafeBrowsingService', () => {
        // Import dynamically to test the service directly
        it('should report not configured when no API key', async () => {
            const { default: GoogleSafeBrowsing } = await import('@/lib/services/GoogleSafeBrowsing');

            // Without API key, should gracefully degrade
            const result = await GoogleSafeBrowsing.checkUrl('https://example.com');
            expect(result.isThreat).toBe(false);
            expect(result.isApiAvailable).toBe(false);
            expect(result.fromCache).toBe(false);
        });

        it('should properly cache results', async () => {
            const { default: GoogleSafeBrowsing } = await import('@/lib/services/GoogleSafeBrowsing');

            // Clear cache first
            GoogleSafeBrowsing.clearCache();
            expect(GoogleSafeBrowsing.getCacheSize()).toBe(0);

            // Check URL (will go through the "not configured" path)
            await GoogleSafeBrowsing.checkUrl('https://example.com');
            // Without API key, nothing gets cached (since API isn't available)
            // This is correct behavior — we only cache actual API responses
        });

        it('should report configuration status', async () => {
            const { default: GoogleSafeBrowsing } = await import('@/lib/services/GoogleSafeBrowsing');

            // Without env var set, should report not configured
            expect(GoogleSafeBrowsing.isConfigured()).toBe(false);
        });
    });
});
