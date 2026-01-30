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
   * Returns true if match, false otherwise
   * 
   * FAIL-SAFE: Returns false on any error
   */
  async verify(pin: string): Promise<boolean> {
    try {
      const storedPin = await secureStorage.get(STORAGE_KEYS.SAFETY_PIN);
      if (storedPin === null) return false;
      return storedPin === pin;
    } catch {
      // Fail-safe: deny access on error
      return false;
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
