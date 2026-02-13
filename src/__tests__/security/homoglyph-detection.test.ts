import { describe, it, expect } from 'vitest';
import { performSafetyReview } from '@/lib/safetyReview';

describe('Homoglyph / Lookalike Domain Detection', () => {

    it('should flag Punycode (IDN) domains as warning', () => {
        // xn--80ak6aa92e.com (apple.com in Cyrillic)
        const result = performSafetyReview('https://xn--80ak6aa92e.com');
        const check = result.checks.find(c => c.id === 'homoglyph');
        expect(check).toBeDefined();
        expect(check!.passed).toBe(false);
        expect(check!.severity).toBe('warning');
        expect(check!.description).toContain('Punycode');
    });

    it('should flag mixed script domains (Latin + Cyrillic) as warning (Punycode)', () => {
        // "googIe.com" where 'I' is actually Cyrillic 'Ӏ' (Palochka).
        // Standard URL parsers convert this to Punycode (xn--...), so it triggers the Punycode check.
        const mixedDomain = 'test\u0430.com';
        const result = performSafetyReview(`https://${mixedDomain}`);
        const check = result.checks.find(c => c.id === 'homoglyph');
        expect(check).toBeDefined();
        expect(check!.passed).toBe(false);
        expect(check!.severity).toBe('warning');
        expect(check!.description).toContain('Punycode');
    });

    /**
     * Note: Invisible characters (e.g., zero-width space) are typically stripped 
     * by the standard URL parser (new URL()), making the domain safe/valid.
     * Therefore, we don't test for them here as performSafetyReview uses the sanitized domain.
     */

    it('should pass normal domains', () => {
        const result = performSafetyReview('https://google.com');
        const check = result.checks.find(c => c.id === 'homoglyph');
        expect(check).toBeDefined();
        expect(check!.passed).toBe(true);
        expect(check!.severity).toBe('info');
    });

    it('should pass normal domains with hyphens', () => {
        const result = performSafetyReview('https://my-bank.com');
        const check = result.checks.find(c => c.id === 'homoglyph');
        expect(check!.passed).toBe(true);
    });

    it('should pass normal domains with numbers', () => {
        const result = performSafetyReview('https://store24.com');
        const check = result.checks.find(c => c.id === 'homoglyph');
        expect(check!.passed).toBe(true);
    });
});
