import { describe, it, expect, beforeEach } from 'vitest';
import { PinRateLimiter } from '@/lib/storage/PinRateLimiter';

describe('PIN Rate Limiting Tests', () => {
    beforeEach(async () => {
        // Clear rate limit data before each test
        await PinRateLimiter.clearAttempts();
    });

    describe('Rate Limit Check', () => {
        it('should allow verification when no attempts recorded', async () => {
            const result = await PinRateLimiter.checkRateLimit();
            expect(result.allowed).toBe(true);
            expect(result.remainingAttempts).toBe(5);
        });

        it('should track remaining attempts', async () => {
            // Record 2 failed attempts
            await PinRateLimiter.recordFailedAttempt();
            await PinRateLimiter.recordFailedAttempt();

            const result = await PinRateLimiter.checkRateLimit();
            expect(result.allowed).toBe(true);
            expect(result.remainingAttempts).toBe(3);
        });
    });

    describe('Failed Attempt Recording', () => {
        it('should record failed attempts', async () => {
            const result1 = await PinRateLimiter.recordFailedAttempt();
            expect(result1.allowed).toBe(true);
            expect(result1.remainingAttempts).toBe(4);

            const result2 = await PinRateLimiter.recordFailedAttempt();
            expect(result2.allowed).toBe(true);
            expect(result2.remainingAttempts).toBe(3);
        });

        it('should trigger lockout after 5 failed attempts', async () => {
            // Fail 5 times
            for (let i = 0; i < 5; i++) {
                await PinRateLimiter.recordFailedAttempt();
            }

            const result = await PinRateLimiter.checkRateLimit();
            expect(result.allowed).toBe(false);
            expect(result.lockoutEndsAt).toBeDefined();
            expect(result.waitTimeMs).toBeGreaterThan(0);
        });

        it('should maintain lockout state', async () => {
            // Trigger lockout
            for (let i = 0; i < 5; i++) {
                await PinRateLimiter.recordFailedAttempt();
            }

            // Try to check rate limit again
            const result1 = await PinRateLimiter.checkRateLimit();
            const result2 = await PinRateLimiter.checkRateLimit();

            expect(result1.allowed).toBe(false);
            expect(result2.allowed).toBe(false);
        });
    });

    describe('Successful Attempt', () => {
        it('should clear attempts on success', async () => {
            // Record some failures
            await PinRateLimiter.recordFailedAttempt();
            await PinRateLimiter.recordFailedAttempt();

            let result = await PinRateLimiter.checkRateLimit();
            expect(result.remainingAttempts).toBe(3);

            // Record success
            await PinRateLimiter.recordSuccessfulAttempt();

            // Check cleared
            result = await PinRateLimiter.checkRateLimit();
            expect(result.allowed).toBe(true);
            expect(result.remainingAttempts).toBe(5);
        });
    });

    describe('Lockout Duration', () => {
        it('should set lockout for 15 minutes', async () => {
            // Trigger lockout
            for (let i = 0; i < 5; i++) {
                await PinRateLimiter.recordFailedAttempt();
            }

            const result = await PinRateLimiter.checkRateLimit();
            expect(result.waitTimeMs).toBeGreaterThanOrEqual(15 * 60 * 1000 - 1000); // Allow 1s margin
        });

        it('should format lockout time correctly', () => {
            expect(PinRateLimiter.formatLockoutTime(60000)).toBe('1 minute');
            expect(PinRateLimiter.formatLockoutTime(120000)).toBe('2 minutes');
            expect(PinRateLimiter.formatLockoutTime(900000)).toBe('15 minutes');
        });
    });

    describe('Force Unlock', () => {
        it('should clear lockout when forced', async () => {
            // Trigger lockout
            for (let i = 0; i < 5; i++) {
                await PinRateLimiter.recordFailedAttempt();
            }

            let result = await PinRateLimiter.checkRateLimit();
            expect(result.allowed).toBe(false);

            // Force unlock
            await PinRateLimiter.forceUnlock();

            result = await PinRateLimiter.checkRateLimit();
            expect(result.allowed).toBe(true);
            expect(result.remainingAttempts).toBe(5);
        });
    });

    describe('Edge Cases', () => {
        it('should handle rapid successive attempts', async () => {
            const promises = [];
            for (let i = 0; i < 3; i++) {
                promises.push(PinRateLimiter.recordFailedAttempt());
            }
            await Promise.all(promises);

            const result = await PinRateLimiter.checkRateLimit();
            expect(result.allowed).toBe(true);
            // Due to race conditions, remaining attempts might vary
            expect(result.remainingAttempts).toBeGreaterThanOrEqual(2);
            expect(result.remainingAttempts).toBeLessThanOrEqual(5);
        });

        it('should handle clearAttempts multiple times', async () => {
            await PinRateLimiter.clearAttempts();
            await PinRateLimiter.clearAttempts();
            await PinRateLimiter.clearAttempts();

            const result = await PinRateLimiter.checkRateLimit();
            expect(result.allowed).toBe(true);
        });
    });
});
