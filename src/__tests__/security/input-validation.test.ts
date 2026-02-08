import { describe, it, expect } from 'vitest';
import { performSafetyReview } from '@/lib/safetyReview';

describe('Input Validation Security Tests', () => {
    describe('Malicious File Detection', () => {
        it('should block APK files', () => {
            const result = performSafetyReview('http://evil.com/wedding.apk');
            expect(result.riskLevel).toBe('blocked');
            expect(result.checks.some(c => c.id === 'fake_invitation_file')).toBe(true);
        });

        it('should block APK files with query parameters', () => {
            const result = performSafetyReview('http://evil.com/file.apk?download=true');
            expect(result.riskLevel).toBe('blocked');
        });

        it('should block EXE files', () => {
            const result = performSafetyReview('http://evil.com/malware.exe');
            expect(result.riskLevel).toBe('blocked');
            expect(result.checks.some(c => c.id === 'suspicious_file')).toBe(true);
        });

        it('should block fake invitation APKs', () => {
            const result = performSafetyReview('http://scam.xyz/undangan-nikah.apk');
            expect(result.riskLevel).toBe('blocked');
            const check = result.checks.find(c => c.id === 'fake_invitation_file');
            expect(check?.description).toContain('dangerous file');
        });
    });

    describe('Typosquatting Detection', () => {
        it('should detect PayPal typosquatting', () => {
            const result = performSafetyReview('https://paypa1.com');
            const typoCheck = result.checks.find(c => c.id === 'typosquatting');
            expect(typoCheck?.passed).toBe(false);
        });

        it('should detect Facebook typosquatting', () => {
            const result = performSafetyReview('https://faceb00k.com');
            const typoCheck = result.checks.find(c => c.id === 'typosquatting');
            expect(typoCheck?.passed).toBe(false);
        });

        it('should detect Google typosquatting', () => {
            const result = performSafetyReview('https://google-login-secure.xyz');
            const typoCheck = result.checks.find(c => c.id === 'typosquatting');
            expect(typoCheck?.passed).toBe(false);
        });

        it('should not flag legitimate sites', () => {
            const result = performSafetyReview('https://google.com');
            const typoCheck = result.checks.find(c => c.id === 'typosquatting');
            expect(typoCheck?.passed).toBe(true);
        });
    });

    describe('Suspicious Pattern Detection', () => {
        it('should detect "free gift" scams', () => {
            const result = performSafetyReview('https://example.com/free-gift-claim');
            const patternCheck = result.checks.find(c => c.id === 'patterns');
            expect(patternCheck?.passed).toBe(false);
        });

        it('should detect "claim prize" scams', () => {
            const result = performSafetyReview('https://example.com/claim-prize-now');
            const patternCheck = result.checks.find(c => c.id === 'patterns');
            expect(patternCheck?.passed).toBe(false);
        });

        it('should detect "winner" scams', () => {
            const result = performSafetyReview('https://example.com/you-are-winner');
            const patternCheck = result.checks.find(c => c.id === 'patterns');
            expect(patternCheck?.passed).toBe(false);
        });

        it('should detect urgent/expire patterns', () => {
            const result = performSafetyReview('https://bank.com/urgent-expire-account');
            const patternCheck = result.checks.find(c => c.id === 'patterns');
            expect(patternCheck?.passed).toBe(false);
        });
    });

    describe('HTTPS Validation', () => {
        it('should pass HTTPS URLs', () => {
            const result = performSafetyReview('https://example.com');
            const httpsCheck = result.checks.find(c => c.id === 'https');
            expect(httpsCheck?.passed).toBe(true);
        });

        it('should flag HTTP URLs', () => {
            const result = performSafetyReview('http://example.com');
            const httpsCheck = result.checks.find(c => c.id === 'https');
            expect(httpsCheck?.passed).toBe(false);
            expect(httpsCheck?.severity).toBe('warning');
        });
    });

    describe('Suspicious TLD Detection', () => {
        it('should flag .xyz domains', () => {
            const result = performSafetyReview('https://scam.xyz');
            const tldCheck = result.checks.find(c => c.id === 'tld');
            expect(tldCheck?.passed).toBe(false);
        });

        it('should flag .top domains', () => {
            const result = performSafetyReview('https://fake.top');
            const tldCheck = result.checks.find(c => c.id === 'tld');
            expect(tldCheck?.passed).toBe(false);
        });

        it('should allow .com domains', () => {
            const result = performSafetyReview('https://example.com');
            const tldCheck = result.checks.find(c => c.id === 'tld');
            expect(tldCheck?.passed).toBe(true);
        });
    });

    describe('IP Address Detection', () => {
        it('should flag IP addresses', () => {
            const result = performSafetyReview('http://192.168.1.1/login');
            const ipCheck = result.checks.find(c => c.id === 'ip_address');
            expect(ipCheck?.passed).toBe(false);
            expect(ipCheck?.severity).toBe('danger');
        });

        it('should allow domain names', () => {
            const result = performSafetyReview('https://example.com');
            const ipCheck = result.checks.find(c => c.id === 'ip_address');
            expect(ipCheck?.passed).toBe(true);
        });
    });

    describe('Subdomain Detection', () => {
        it('should flag excessive subdomains', () => {
            const result = performSafetyReview('https://a.b.c.d.example.com');
            const subdomainCheck = result.checks.find(c => c.id === 'subdomains');
            expect(subdomainCheck?.passed).toBe(false);
        });

        it('should allow normal subdomains', () => {
            const result = performSafetyReview('https://www.example.com');
            const subdomainCheck = result.checks.find(c => c.id === 'subdomains');
            expect(subdomainCheck?.passed).toBe(true);
        });
    });

    describe('Risk Level Calculation', () => {
        it('should rate known scam as blocked', () => {
            const result = performSafetyReview('https://bri-undian.xyz');
            expect(result.riskLevel).toBe('blocked');
        });

        it('should rate malware as blocked', () => {
            const result = performSafetyReview('http://evil.com/undangan.apk');
            expect(result.riskLevel).toBe('blocked');
        });

        it('should rate multiple red flags as high', () => {
            const result = performSafetyReview('http://paypa1.xyz/urgent-verify-account');
            expect(result.riskLevel).toBe('high');
        });

        it('should rate trusted sites as low', () => {
            const result = performSafetyReview('https://google.com');
            expect(result.riskLevel).toBe('low');
        });
    });

    describe('Edge Cases', () => {
        it('should handle malformed URLs gracefully', () => {
            expect(() => performSafetyReview('not-a-url')).not.toThrow();
        });

        it('should handle empty strings', () => {
            expect(() => performSafetyReview('')).not.toThrow();
        });

        it('should handle URLs without protocol', () => {
            const result = performSafetyReview('example.com');
            expect(result).toBeDefined();
        });
    });
});
