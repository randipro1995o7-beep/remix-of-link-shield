/**
 * Premium Service
 * 
 * MONETIZATION PHILOSOPHY:
 * ========================
 * - Core safety flow is FREE forever
 * - Premium features enhance awareness, not create fear
 * - No ads, no dark patterns
 * - No blocking basic safety behind paywalls
 * 
 * FREE Features:
 * - Link interception and safety review
 * - Basic Safety PIN
 * - Stop screen with countdown
 * - Basic history (limited entries)
 * 
 * PREMIUM Features:
 * - Extended safety history (500 vs 100 entries)
 * - Family Mode (Guardian PIN)
 * - Auto-Guard time windows (schedule protection)
 * - Biometric unlock for Safety PIN
 * - Advanced risk explanations
 */

import { generalStorage } from './CapacitorStorageProvider';
import { STORAGE_KEYS, PremiumStatus } from './types';

const defaultStatus: PremiumStatus = {
  isPremium: false,
  features: {
    extendedHistory: false,
    familyMode: false,
    autoGuardWindows: false,
    biometricUnlock: false,
    advancedExplanations: false,
  },
};

export const PremiumService = {
  /**
   * Get current premium status
   */
  async getStatus(): Promise<PremiumStatus> {
    try {
      const data = await generalStorage.get(STORAGE_KEYS.PREMIUM_STATUS);
      if (!data) return defaultStatus;
      return JSON.parse(data) as PremiumStatus;
    } catch {
      return defaultStatus;
    }
  },

  /**
   * Check if user has premium access
   */
  async isPremium(): Promise<boolean> {
    const status = await this.getStatus();
    return status.isPremium;
  },

  /**
   * Check if a specific feature is unlocked
   */
  async hasFeature(feature: keyof PremiumStatus['features']): Promise<boolean> {
    const status = await this.getStatus();
    return status.features[feature];
  },

  /**
   * Activate premium (called after purchase verification)
   * In production, this would verify with a backend
   */
  async activatePremium(): Promise<void> {
    const status: PremiumStatus = {
      isPremium: true,
      features: {
        extendedHistory: true,
        familyMode: true,
        autoGuardWindows: true,
        biometricUnlock: true,
        advancedExplanations: true,
      },
      purchasedAt: new Date().toISOString(),
    };
    
    await generalStorage.save(STORAGE_KEYS.PREMIUM_STATUS, JSON.stringify(status));
  },

  /**
   * Deactivate premium (for subscription expiry, etc.)
   */
  async deactivatePremium(): Promise<void> {
    await generalStorage.save(STORAGE_KEYS.PREMIUM_STATUS, JSON.stringify(defaultStatus));
  },

  /**
   * Get premium feature descriptions for UI
   */
  getFeatureDescriptions(): Array<{
    key: keyof PremiumStatus['features'];
    title: string;
    description: string;
    icon: string;
  }> {
    return [
      {
        key: 'extendedHistory',
        title: 'Extended History',
        description: 'Keep up to 500 link checks instead of 100',
        icon: 'history',
      },
      {
        key: 'familyMode',
        title: 'Family Mode',
        description: 'Guardian PIN for protecting loved ones',
        icon: 'users',
      },
      {
        key: 'autoGuardWindows',
        title: 'Auto-Guard Windows',
        description: 'Schedule extra protection during risky hours',
        icon: 'clock',
      },
      {
        key: 'biometricUnlock',
        title: 'Biometric Unlock',
        description: 'Use fingerprint instead of Safety PIN',
        icon: 'fingerprint',
      },
      {
        key: 'advancedExplanations',
        title: 'Advanced Insights',
        description: 'Detailed explanations of why links are risky',
        icon: 'info',
      },
    ];
  },
};
