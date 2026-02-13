import { describe, it, expect } from 'vitest';
import { SafeLinkHeuristic } from '@/lib/services/SafeLinkHeuristic';

describe('SafeLinkHeuristic', () => {
    describe('Should ALLOW (heuristically safe)', () => {
        it('should allow detik.com (trusted Indonesian news)', () => {
            const result = SafeLinkHeuristic.check('https://www.detik.com', 'detik.com');
            expect(result.isSafe).toBe(true);
            expect(result.signals.isTrustedDomain).toBe(true);
        });

        it('should allow kompas.com', () => {
            const result = SafeLinkHeuristic.check('https://kompas.com/article/123', 'kompas.com');
            expect(result.isSafe).toBe(true);
        });

        it('should allow tokopedia.com', () => {
            const result = SafeLinkHeuristic.check('https://www.tokopedia.com/product', 'tokopedia.com');
            expect(result.isSafe).toBe(true);
        });

        it('should allow bca.co.id (trusted bank)', () => {
            const result = SafeLinkHeuristic.check('https://www.bca.co.id', 'bca.co.id');
            expect(result.isSafe).toBe(true);
        });

        it('should allow google.com subdomains', () => {
            const result = SafeLinkHeuristic.check('https://mail.google.com', 'mail.google.com');
            expect(result.isSafe).toBe(true);
        });

        it('should allow government .go.id domains', () => {
            const result = SafeLinkHeuristic.check('https://kemkes.go.id', 'kemkes.go.id');
            expect(result.isSafe).toBe(true);
        });

        it('should allow academic .ac.id domains', () => {
            const result = SafeLinkHeuristic.check('https://ui.ac.id', 'ui.ac.id');
            expect(result.isSafe).toBe(true);
        });
    });

    describe('Should BLOCK (not safe, needs review)', () => {
        it('should NOT allow unknown domains', () => {
            const result = SafeLinkHeuristic.check('https://unknown-random-site.xyz', 'unknown-random-site.xyz');
            expect(result.isSafe).toBe(false);
            expect(result.signals.isTrustedDomain).toBe(false);
        });

        it('should NOT allow URL shorteners even if trusted TLD', () => {
            const result = SafeLinkHeuristic.check('https://bit.ly/abc123', 'bit.ly');
            expect(result.isSafe).toBe(false);
        });

        it('should NOT allow HTTP (non-HTTPS) trusted domains', () => {
            const result = SafeLinkHeuristic.check('http://detik.com', 'detik.com');
            expect(result.isSafe).toBe(false);
            expect(result.signals.isHttps).toBe(false);
        });

        it('should NOT allow APK downloads on trusted domains', () => {
            const result = SafeLinkHeuristic.check('https://detik.com/app.apk', 'detik.com');
            expect(result.isSafe).toBe(false);
            expect(result.signals.hasNoDangerousFile).toBe(false);
        });

        it('should NOT allow EXE downloads on trusted domains', () => {
            const result = SafeLinkHeuristic.check('https://google.com/app.exe', 'google.com');
            expect(result.isSafe).toBe(false);
        });

        it('should NOT allow untrusted domains even with HTTPS', () => {
            const result = SafeLinkHeuristic.check('https://evil-phishing.top', 'evil-phishing.top');
            expect(result.isSafe).toBe(false);
        });
    });

    describe('Signal details', () => {
        it('should return all signal details for a safe domain', () => {
            const result = SafeLinkHeuristic.check('https://google.com', 'google.com');
            expect(result.signals.isTrustedDomain).toBe(true);
            expect(result.signals.isHttps).toBe(true);
            expect(result.signals.hasNoDangerousFile).toBe(true);
            expect(result.signals.isNotShortener).toBe(true);
        });

        it('should early-exit with reason on first failed signal', () => {
            const result = SafeLinkHeuristic.check('https://unknown.xyz', 'unknown.xyz');
            expect(result.isSafe).toBe(false);
            expect(result.reason).toContain('not in trusted list');
        });
    });
});
