import { describe, it, expect, vi } from 'vitest';
import { performSafetyReview } from '@/lib/safetyReview';
import type { DomainAgeResult } from '@/lib/services/DomainAgeChecker';

describe('Domain Age Check in Safety Review', () => {
    // === New domain detection ===

    it('should flag domain registered < 30 days ago as danger', () => {
        const domainAge: DomainAgeResult = {
            ageInDays: 5,
            registrationDate: new Date(Date.now() - 5 * 86400000).toISOString(),
            isNewDomain: true,
            isYoungDomain: true,
            isLookupAvailable: true,
        };

        const result = performSafetyReview('https://new-scam-site.xyz', undefined, domainAge);
        const ageCheck = result.checks.find(c => c.id === 'domain_age');
        expect(ageCheck).toBeDefined();
        expect(ageCheck!.passed).toBe(false);
        expect(ageCheck!.severity).toBe('danger');
        expect(ageCheck!.description).toContain('5 days ago');
    });

    it('should flag domain registered < 180 days ago as warning', () => {
        const domainAge: DomainAgeResult = {
            ageInDays: 90,
            registrationDate: new Date(Date.now() - 90 * 86400000).toISOString(),
            isNewDomain: false,
            isYoungDomain: true,
            isLookupAvailable: true,
        };

        const result = performSafetyReview('https://somewhat-new.site', undefined, domainAge);
        const ageCheck = result.checks.find(c => c.id === 'domain_age');
        expect(ageCheck).toBeDefined();
        expect(ageCheck!.passed).toBe(false);
        expect(ageCheck!.severity).toBe('warning');
    });

    it('should show established domain as passed/info', () => {
        const domainAge: DomainAgeResult = {
            ageInDays: 730, // 2 years
            registrationDate: new Date(Date.now() - 730 * 86400000).toISOString(),
            isNewDomain: false,
            isYoungDomain: false,
            isLookupAvailable: true,
        };

        const result = performSafetyReview('https://old-established.com', undefined, domainAge);
        const ageCheck = result.checks.find(c => c.id === 'domain_age');
        expect(ageCheck).toBeDefined();
        expect(ageCheck!.passed).toBe(true);
        expect(ageCheck!.severity).toBe('info');
        expect(ageCheck!.description).toContain('2+ years');
    });

    // === Graceful degradation ===

    it('should skip domain age check when lookup is unavailable', () => {
        const domainAge: DomainAgeResult = {
            ageInDays: null,
            registrationDate: null,
            isNewDomain: false,
            isYoungDomain: false,
            isLookupAvailable: false,
        };

        const result = performSafetyReview('https://unknown.example', undefined, domainAge);
        const ageCheck = result.checks.find(c => c.id === 'domain_age');
        expect(ageCheck).toBeUndefined(); // Should not appear in checks
    });

    it('should skip domain age check when no result provided', () => {
        const result = performSafetyReview('https://example.com');
        const ageCheck = result.checks.find(c => c.id === 'domain_age');
        expect(ageCheck).toBeUndefined();
    });

    // === Placement ===

    it('should place domain age check after trusted domain check', () => {
        const domainAge: DomainAgeResult = {
            ageInDays: 10,
            registrationDate: new Date(Date.now() - 10 * 86400000).toISOString(),
            isNewDomain: true,
            isYoungDomain: true,
            isLookupAvailable: true,
        };

        const result = performSafetyReview('https://new-site.xyz', undefined, domainAge);
        const trustedIdx = result.checks.findIndex(c => c.id === 'trusted');
        const ageIdx = result.checks.findIndex(c => c.id === 'domain_age');
        expect(ageIdx).toBe(trustedIdx + 1);
    });

    // === Edge case: 1-day-old domain ===

    it('should correctly handle 1-day-old domain (singular)', () => {
        const domainAge: DomainAgeResult = {
            ageInDays: 1,
            registrationDate: new Date(Date.now() - 86400000).toISOString(),
            isNewDomain: true,
            isYoungDomain: true,
            isLookupAvailable: true,
        };

        const result = performSafetyReview('https://brand-new.xyz', undefined, domainAge);
        const ageCheck = result.checks.find(c => c.id === 'domain_age');
        expect(ageCheck!.description).toContain('1 day ago');
    });
});
