/**
 * Safety PIN Service
 * 
 * BEHAVIORAL SAFEGUARD - NOT AUTHENTICATION
 * ==========================================
 * This service manages the Safety PIN which serves as a behavioral 
 * interruption mechanism, not cryptographic authentication.
 * 
 * Purpose:
 * - Create a conscious pause before opening potentially harmful links
 * - Provide a moment of reflection (similar to cooling-off period)
 * - Help users build safer habits around link clicking
 * 
 * Security Model:
 * - PIN is stored using platform-specific secure storage
 * - Basic obfuscation adds layer against casual inspection
 * - NOT designed to prevent determined attackers
 * - Security comes from behavioral interruption, not cryptography
 * 
 * Future Enhancement:
 * - Can be upgraded to Android Keystore for enhanced protection
 * - Biometric unlock can be added as premium feature
 * - No UI changes required for storage provider upgrades
 */

import { secureStorage } from './CapacitorStorageProvider';
import { STORAGE_KEYS } from './types';
import { PinRateLimiter, RateLimitResult } from './PinRateLimiter';
import { logger } from '@/lib/utils/logger';
import { logAuthSuccess, logAuthFailure, SecurityEventLogger } from '@/lib/security/SecurityEventLogger';

export const SafetyPinService = {
  /**
   * Save the Safety PIN
   * PIN must be exactly 4 digits
   */
  async save(pin: string): Promise<void> {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('Safety PIN must be exactly 4 digits');
    }
    await secureStorage.save(STORAGE_KEYS.SAFETY_PIN, pin);

    // Log PIN creation
    await SecurityEventLogger.logEvent('pin_created', 'Safety PIN created');
  },

  /**
   * Retrieve the stored Safety PIN
   * Returns null if not set
   */
  async get(): Promise<string | null> {
    return secureStorage.get(STORAGE_KEYS.SAFETY_PIN);
  },

  /**
   * Check if a Safety PIN has been created
   */
  async exists(): Promise<boolean> {
    return secureStorage.exists(STORAGE_KEYS.SAFETY_PIN);
  },

  /**
   * Remove the Safety PIN
   * Used for reset functionality
   */
  async clear(): Promise<void> {
    await secureStorage.remove(STORAGE_KEYS.SAFETY_PIN);
  },

  /**
   * Verify a PIN against the stored value
   * Returns verification result with rate limit info
   * 
   * FAIL-SAFE: Returns failure on any error
   * RATE-LIMITED: Prevents brute force attacks
   */
  async verify(pin: string): Promise<{ success: boolean; error?: string; rateLimitInfo?: RateLimitResult }> {
    try {
      // Check rate limit first
      const rateLimitCheck = await PinRateLimiter.checkRateLimit();

      if (!rateLimitCheck.allowed) {
        const waitTime = PinRateLimiter.formatLockoutTime(rateLimitCheck.waitTimeMs!);
        return {
          success: false,
          error: `Too many attempts. Please wait ${waitTime}.`,
          rateLimitInfo: rateLimitCheck,
        };
      }

      // Verify PIN
      const storedPin = await secureStorage.get(STORAGE_KEYS.SAFETY_PIN);
      if (storedPin === null) {
        return { success: false, error: 'PIN not set' };
      }

      const isMatch = storedPin === pin;

      if (isMatch) {
        // Success: clear failed attempts
        await PinRateLimiter.recordSuccessfulAttempt();
        logger.security('PIN verified successfully');

        // Log authentication success
        await logAuthSuccess();

        return { success: true };
      } else {
        // Failure: record attempt
        const result = await PinRateLimiter.recordFailedAttempt();

        // Log authentication failure
        await logAuthFailure({
          remainingAttempts: result.remainingAttempts,
        });

        if (!result.allowed) {
          const waitTime = PinRateLimiter.formatLockoutTime(result.waitTimeMs!);
          return {
            success: false,
            error: `Too many attempts. Account locked for ${waitTime}.`,
            rateLimitInfo: result,
          };
        }

        return {
          success: false,
          error: `Incorrect PIN. ${result.remainingAttempts} attempts remaining.`,
          rateLimitInfo: result,
        };
      }
    } catch (error) {
      logger.error('PIN verification failed', error);
      // Fail-safe: deny access on error
      return { success: false, error: 'Verification failed' };
    }
  },
};

/**
 * Guardian PIN Service (for Family Mode)
 * Separate PIN that controls high-risk link access
 */
export const GuardianPinService = {
  async save(pin: string): Promise<void> {
    if (!/^\d{4}$/.test(pin)) {
      throw new Error('Guardian PIN must be exactly 4 digits');
    }
    await secureStorage.save(STORAGE_KEYS.GUARDIAN_PIN, pin);
  },

  async get(): Promise<string | null> {
    return secureStorage.get(STORAGE_KEYS.GUARDIAN_PIN);
  },

  async exists(): Promise<boolean> {
    return secureStorage.exists(STORAGE_KEYS.GUARDIAN_PIN);
  },

  async clear(): Promise<void> {
    await secureStorage.remove(STORAGE_KEYS.GUARDIAN_PIN);
  },

  async verify(pin: string): Promise<boolean> {
    try {
      const storedPin = await secureStorage.get(STORAGE_KEYS.GUARDIAN_PIN);
      if (storedPin === null) return false;
      return storedPin === pin;
    } catch {
      return false;
    }
  },
};
