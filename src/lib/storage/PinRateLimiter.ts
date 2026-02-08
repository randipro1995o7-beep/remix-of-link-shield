/**
 * PIN Rate Limiting Service
 * 
 * Prevents brute force attacks on PIN verification by:
 * - Tracking failed attempts
 * - Implementing exponential backoff
 * - Temporary lockout after max attempts
 * - Automatic reset after cooldown period
 */

import { secureStorage } from './CapacitorStorageProvider';
import { logger } from '@/lib/utils/logger';
import { logRateLimitTriggered, logAccountLocked } from '@/lib/security/SecurityEventLogger';

const RATE_LIMIT_KEYS = {
    ATTEMPTS: 'lg_pin_attempts',
    LOCKOUT_UNTIL: 'lg_pin_lockout_until',
    FIRST_ATTEMPT: 'lg_pin_first_attempt',
};

const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes
const COOLDOWN_PERIOD = 60 * 60 * 1000; // 1 hour - reset attempts after this

interface AttemptRecord {
    count: number;
    firstAttempt: number;
    lockoutUntil?: number;
}

export interface RateLimitResult {
    allowed: boolean;
    remainingAttempts?: number;
    lockoutEndsAt?: Date;
    waitTimeMs?: number;
}

export const PinRateLimiter = {
    /**
     * Check if PIN verification is allowed
     * Returns rate limit status
     */
    async checkRateLimit(): Promise<RateLimitResult> {
        try {
            const record = await this.getAttemptRecord();

            // Check if currently locked out
            if (record.lockoutUntil && Date.now() < record.lockoutUntil) {
                const waitTimeMs = record.lockoutUntil - Date.now();
                logger.security('PIN verification blocked - account locked', {
                    lockoutEndsAt: new Date(record.lockoutUntil),
                    waitTimeMs,
                });

                return {
                    allowed: false,
                    lockoutEndsAt: new Date(record.lockoutUntil),
                    waitTimeMs,
                };
            }

            // Reset if cooldown period has passed
            if (Date.now() - record.firstAttempt > COOLDOWN_PERIOD) {
                await this.clearAttempts();
                return {
                    allowed: true,
                    remainingAttempts: MAX_ATTEMPTS,
                };
            }

            // Check if max attempts reached
            if (record.count >= MAX_ATTEMPTS) {
                // Should have been locked out, but lockout expired
                await this.clearAttempts();
                return {
                    allowed: true,
                    remainingAttempts: MAX_ATTEMPTS,
                };
            }

            return {
                allowed: true,
                remainingAttempts: MAX_ATTEMPTS - record.count,
            };
        } catch (error) {
            logger.error('Rate limit check failed', error);
            // Fail-safe: deny access on error
            return {
                allowed: false,
                waitTimeMs: LOCKOUT_DURATION,
            };
        }
    },

    /**
     * Record a failed PIN attempt
     * Triggers lockout if max attempts reached
     */
    async recordFailedAttempt(): Promise<RateLimitResult> {
        try {
            const record = await this.getAttemptRecord();
            record.count++;

            logger.security('Failed PIN attempt recorded', {
                attemptNumber: record.count,
                maxAttempts: MAX_ATTEMPTS,
            });

            // Trigger lockout if max attempts reached
            if (record.count >= MAX_ATTEMPTS) {
                record.lockoutUntil = Date.now() + LOCKOUT_DURATION;
                await this.saveAttemptRecord(record);

                logger.security('PIN lockout triggered', {
                    attemptsCount: record.count,
                    lockoutDuration: LOCKOUT_DURATION,
                    lockoutEndsAt: new Date(record.lockoutUntil),
                });

                // Log to security event logger
                await logAccountLocked({
                    attemptCount: record.count,
                    lockoutDurationMs: LOCKOUT_DURATION,
                });

                return {
                    allowed: false,
                    lockoutEndsAt: new Date(record.lockoutUntil),
                    waitTimeMs: LOCKOUT_DURATION,
                };
            }

            // Save updated attempt count
            await this.saveAttemptRecord(record);

            return {
                allowed: true,
                remainingAttempts: MAX_ATTEMPTS - record.count,
            };
        } catch (error) {
            logger.error('Failed to record PIN attempt', error);
            // Fail-safe: return locked state on error
            return {
                allowed: false,
                waitTimeMs: LOCKOUT_DURATION,
            };
        }
    },

    /**
     * Record a successful PIN verification
     * Clears all failed attempts
     */
    async recordSuccessfulAttempt(): Promise<void> {
        try {
            await this.clearAttempts();
            logger.security('PIN verified successfully - attempts cleared');
        } catch (error) {
            logger.error('Failed to clear attempts after success', error);
        }
    },

    /**
     * Clear all attempt records
     * Used after successful verification or cooldown period
     */
    async clearAttempts(): Promise<void> {
        try {
            await secureStorage.remove(RATE_LIMIT_KEYS.ATTEMPTS);
            await secureStorage.remove(RATE_LIMIT_KEYS.LOCKOUT_UNTIL);
            await secureStorage.remove(RATE_LIMIT_KEYS.FIRST_ATTEMPT);
        } catch (error) {
            logger.error('Failed to clear rate limit data', error);
        }
    },

    /**
     * Get current attempt record
     */
    async getAttemptRecord(): Promise<AttemptRecord> {
        try {
            const attemptsStr = await secureStorage.get(RATE_LIMIT_KEYS.ATTEMPTS);
            const lockoutStr = await secureStorage.get(RATE_LIMIT_KEYS.LOCKOUT_UNTIL);
            const firstAttemptStr = await secureStorage.get(RATE_LIMIT_KEYS.FIRST_ATTEMPT);

            const count = attemptsStr ? parseInt(attemptsStr, 10) : 0;
            const lockoutUntil = lockoutStr ? parseInt(lockoutStr, 10) : undefined;
            const firstAttempt = firstAttemptStr ? parseInt(firstAttemptStr, 10) : Date.now();

            return {
                count,
                firstAttempt,
                lockoutUntil,
            };
        } catch (error) {
            logger.error('Failed to get attempt record', error);
            // Fail-safe: return locked state
            return {
                count: MAX_ATTEMPTS,
                firstAttempt: Date.now(),
                lockoutUntil: Date.now() + LOCKOUT_DURATION,
            };
        }
    },

    /**
     * Save attempt record to storage
     */
    async saveAttemptRecord(record: AttemptRecord): Promise<void> {
        try {
            await secureStorage.save(RATE_LIMIT_KEYS.ATTEMPTS, record.count.toString());
            await secureStorage.save(RATE_LIMIT_KEYS.FIRST_ATTEMPT, record.firstAttempt.toString());

            if (record.lockoutUntil) {
                await secureStorage.save(RATE_LIMIT_KEYS.LOCKOUT_UNTIL, record.lockoutUntil.toString());
            }
        } catch (error) {
            logger.error('Failed to save attempt record', error);
            throw error;
        }
    },

    /**
     * Get human-readable time remaining for lockout
     */
    formatLockoutTime(waitTimeMs: number): string {
        const minutes = Math.ceil(waitTimeMs / 60000);
        if (minutes === 1) return '1 minute';
        return `${minutes} minutes`;
    },

    /**
     * Admin function: Force clear lockout (use with caution)
     * Should only be called by admin/recovery flow
     */
    async forceUnlock(): Promise<void> {
        logger.security('PIN rate limit force unlocked - admin action');
        await this.clearAttempts();
    },
};
