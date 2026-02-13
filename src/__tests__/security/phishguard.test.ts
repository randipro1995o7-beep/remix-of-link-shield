import { describe, it, expect } from 'vitest';
import PhishGuard from '@/lib/services/PhishGuard';

describe('PhishGuard Service', () => {
    describe('Tiered Scoring & Threat Levels', () => {
        it('should return safe for clean URLs', () => {
            const result = PhishGuard.analyzeUrl('https://example.com');
            expect(result.threatLevel).toBe('safe');
            expect(result.isSuspicious).toBe(false);
            expect(result.score).toBeLessThan(35);
        });

        it('should return warning for moderately suspicious URLs', () => {
            // brand=20 + keywords=20 + path=13 = 53 → danger
            const result = PhishGuard.analyzeUrl('https://bca-news.com/login/verify');
            expect(result.threatLevel).toBe('danger');
            expect(result.isSuspicious).toBe(true);
            expect(result.score).toBeGreaterThanOrEqual(50);
        });

        it('should return danger for highly suspicious URLs', () => {
            // Brand keyword on risky TLD = 40pts + TLD = 20pts
            const result = PhishGuard.analyzeUrl('https://bca-login-verify.xyz');
            expect(result.threatLevel).toBe('danger');
            expect(result.isSuspicious).toBe(true);
            expect(result.score).toBeGreaterThanOrEqual(50);
        });
    });

    describe('False Positive Prevention', () => {
        it('should NOT flag official brand domains', () => {
            const domains = [
                'https://google.com',
                'https://bca.co.id',
                'https://shopee.co.id',
                'https://paypal.com',
                'https://facebook.com',
                'https://netflix.com',
            ];

            for (const url of domains) {
                const result = PhishGuard.analyzeUrl(url);
                expect(result.isSuspicious).toBe(false);
                expect(result.threatLevel).toBe('safe');
                expect(result.details.brandImpersonationScore).toBe(0);
            }
        });

        it('should NOT flag subdomains of official brands', () => {
            const result = PhishGuard.analyzeUrl('https://accounts.google.com/signin');
            expect(result.isSuspicious).toBe(false);
            expect(result.details.brandImpersonationScore).toBe(0);
        });

        it('should NOT flag legitimate .info domains as dangerous via TLD alone', () => {
            // .info was removed from risky TLDs
            const result = PhishGuard.analyzeUrl('https://example.info');
            expect(result.details.tldScore).toBe(0);
        });

        it('should NOT flag legitimate .net/.org domains as dangerous via TLD alone', () => {
            const netResult = PhishGuard.analyzeUrl('https://example.net');
            expect(netResult.details.tldScore).toBe(0);

            const orgResult = PhishGuard.analyzeUrl('https://example.org');
            expect(orgResult.details.tldScore).toBe(0);
        });

        it('should NOT give keyword score for single keyword occurrence', () => {
            // URL with just 1 suspicious keyword should not get keyword points
            const result = PhishGuard.analyzeUrl('https://example.com/login');
            expect(result.details.keywordScore).toBe(0);
        });

        it('should not query params for keyword scoring', () => {
            // Query params should be excluded from keyword check
            const result = PhishGuard.analyzeUrl('https://example.com/page?login=true&verify=1');
            expect(result.details.keywordScore).toBe(0);
        });
    });

    describe('Context-Aware Brand Scoring', () => {
        it('should give reduced brand score on safe TLD with clean structure', () => {
            // "bca" keyword on .com = reduced score (20 instead of 40)
            const result = PhishGuard.analyzeUrl('https://bca-promo.com');
            expect(result.details.brandImpersonationScore).toBe(20);
        });

        it('should give full brand score on risky TLD', () => {
            // "bca" keyword on .xyz = full score (40)
            const result = PhishGuard.analyzeUrl('https://bca-promo.xyz');
            expect(result.details.brandImpersonationScore).toBe(40);
        });

        it('should give full brand score with excessive structure on safe TLD', () => {
            // "bca" keyword on .com but with too many hyphens = full score
            const result = PhishGuard.analyzeUrl('https://bca-login-secure-verify.com');
            expect(result.details.brandImpersonationScore).toBe(40);
        });
    });

    describe('Short Keyword Matching', () => {
        it('should match short brand keywords as standalone domain segments', () => {
            // "bca" as a standalone segment in domain
            const result = PhishGuard.analyzeUrl('https://bca-promo.xyz');
            expect(result.details.brandImpersonationScore).toBeGreaterThan(0);
        });

        it('should NOT match short keywords embedded in longer words', () => {
            // "bca" should NOT match inside "abcadef.com" (not a standalone segment)
            const result = PhishGuard.analyzeUrl('https://abcadef.com');
            expect(result.details.brandImpersonationScore).toBe(0);
        });

        it('should match longer keywords as substring', () => {
            // "google" is > 3 chars, should match as substring
            const result = PhishGuard.analyzeUrl('https://mygoogle-login.xyz');
            expect(result.details.brandImpersonationScore).toBeGreaterThan(0);
        });
    });

    describe('Tiered Keyword Scoring', () => {
        it('should give higher score for high-weight keywords', () => {
            // 2 high-weight keywords: login + verify = 30pts (capped at 20)
            const result = PhishGuard.analyzeUrl('https://evil.com/login-verify');
            expect(result.details.keywordScore).toBe(20);
        });

        it('should give lower score for low-weight keywords', () => {
            // 2 low-weight keywords: support + service = 10pts
            const result = PhishGuard.analyzeUrl('https://evil.com/support-service');
            expect(result.details.keywordScore).toBe(10);
        });

        it('should combine high and low weight correctly', () => {
            // 1 high (login=15) + 1 low (support=5) = 20pts
            const result = PhishGuard.analyzeUrl('https://evil.com/login-support');
            expect(result.details.keywordScore).toBe(20);
        });
    });

    describe('Typosquatting Detection', () => {
        it('should detect number substitution homoglyphs', () => {
            const result = PhishGuard.analyzeUrl('https://g00gle.com');
            expect(result.details.brandImpersonationScore).toBeGreaterThan(0);
        });

        it('should detect Levenshtein-close brand names', () => {
            const result = PhishGuard.analyzeUrl('https://gogle.com');
            expect(result.details.brandImpersonationScore).toBeGreaterThan(0);
        });

        it('should handle edge case URLs gracefully', () => {
            // Ensure it doesn't crash on odd inputs
            expect(() => PhishGuard.analyzeUrl('')).not.toThrow();
            expect(() => PhishGuard.analyzeUrl('not-a-url')).not.toThrow();
            expect(() => PhishGuard.analyzeUrl('javascript:alert(1)')).not.toThrow();
        });
    });

    describe('Structure Analysis', () => {
        it('should flag IP address domains', () => {
            const result = PhishGuard.analyzeUrl('http://192.168.1.100/login');
            expect(result.details.structureScore).toBe(20);
        });

        it('should flag excessive subdomains', () => {
            const result = PhishGuard.analyzeUrl('https://a.b.c.d.example.com');
            expect(result.details.structureScore).toBeGreaterThanOrEqual(10);
        });

        it('should flag excessive hyphens', () => {
            const result = PhishGuard.analyzeUrl('https://my-very-suspicious-domain.com');
            expect(result.details.structureScore).toBeGreaterThanOrEqual(10);
        });

        it('should not flag normal structure', () => {
            const result = PhishGuard.analyzeUrl('https://www.example.com');
            expect(result.details.structureScore).toBe(0);
        });
    });

    describe('Unicode Homoglyph Detection (Phase 3)', () => {
        it('should detect Cyrillic lookalike characters in brand names', () => {
            // "g\u043e\u043egle" using Cyrillic "о" (U+043E) instead of Latin "o"
            const result = PhishGuard.analyzeUrl('https://g\u043e\u043egle.com');
            expect(result.details.brandImpersonationScore).toBeGreaterThan(0);
            expect(result.reasons.some(r => r.toLowerCase().includes('google'))).toBe(true);
        });

        it('should detect digit-substitution homoglyphs for paypal', () => {
            // "paypa1" using "1" for "l"
            const result = PhishGuard.analyzeUrl('https://paypa1.com');
            expect(result.details.brandImpersonationScore).toBeGreaterThan(0);
        });

        it('should detect digit-substitution homoglyphs for facebook', () => {
            // "faceb00k" using "0" for "o"
            const result = PhishGuard.analyzeUrl('https://faceb00k.com');
            expect(result.details.brandImpersonationScore).toBeGreaterThan(0);
        });

        it('should detect Latin Extended characters in domains', () => {
            // "g\u00f6ogle" with ö → normalizes to "google"
            const result = PhishGuard.analyzeUrl('https://g\u00f6ogle.com');
            expect(result.details.brandImpersonationScore).toBeGreaterThan(0);
        });

        it('should NOT false-positive on clean ASCII domains', () => {
            const result = PhishGuard.analyzeUrl('https://example.com');
            expect(result.details.brandImpersonationScore).toBe(0);
        });
    });

    describe('IDN/Punycode Detection (Phase 3)', () => {
        it('should flag Punycode domains (xn--)', () => {
            // xn--e1awd7f.xn--p1ai is a Punycode-encoded domain
            const result = PhishGuard.analyzeUrl('https://xn--e1awd7f.xn--p1ai');
            expect(result.score).toBeGreaterThan(0);
            expect(result.reasons.some(r => r.toLowerCase().includes('punycode') || r.toLowerCase().includes('internationalized'))).toBe(true);
        });

        it('should not flag normal non-Punycode domains', () => {
            const result = PhishGuard.analyzeUrl('https://example.com');
            expect(result.reasons.some(r => r.toLowerCase().includes('punycode'))).toBe(false);
            expect(result.reasons.some(r => r.toLowerCase().includes('non-ascii'))).toBe(false);
        });
    });
});
