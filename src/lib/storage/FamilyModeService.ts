/**
 * Family Mode Service
 * 
 * Manages family safety features for:
 * - Parents protecting children
 * - Caregivers protecting elderly relatives
 * - Shared device scenarios
 * 
 * Features:
 * - Guardian PIN for high-risk link approval
 * - Local-only configuration
 * - Optional and clearly explained
 */

import { generalStorage } from './CapacitorStorageProvider';
import { GuardianPinService } from './SafetyPinService';
import { STORAGE_KEYS, FamilyModeConfig } from './types';

const defaultConfig: FamilyModeConfig = {
  enabled: false,
  guardianPinSet: false,
  requireGuardianForHighRisk: true,
  createdAt: '',
};

export const FamilyModeService = {
  /**
   * Get current family mode configuration
   */
  async getConfig(): Promise<FamilyModeConfig> {
    try {
      const data = await generalStorage.get(STORAGE_KEYS.FAMILY_MODE);
      if (!data) return defaultConfig;
      return JSON.parse(data) as FamilyModeConfig;
    } catch {
      return defaultConfig;
    }
  },

  /**
   * Enable family mode with guardian PIN
   */
  async enable(guardianPin: string): Promise<void> {
    // Save guardian PIN
    await GuardianPinService.save(guardianPin);
    
    // Update config
    const config: FamilyModeConfig = {
      enabled: true,
      guardianPinSet: true,
      requireGuardianForHighRisk: true,
      createdAt: new Date().toISOString(),
    };
    
    await generalStorage.save(STORAGE_KEYS.FAMILY_MODE, JSON.stringify(config));
  },

  /**
   * Disable family mode
   * Requires guardian PIN verification
   */
  async disable(guardianPin: string): Promise<boolean> {
    const isValid = await GuardianPinService.verify(guardianPin);
    if (!isValid) return false;
    
    // Clear guardian PIN
    await GuardianPinService.clear();
    
    // Update config
    const config: FamilyModeConfig = {
      ...defaultConfig,
    };
    
    await generalStorage.save(STORAGE_KEYS.FAMILY_MODE, JSON.stringify(config));
    return true;
  },

  /**
   * Check if family mode is enabled
   */
  async isEnabled(): Promise<boolean> {
    const config = await this.getConfig();
    return config.enabled;
  },

  /**
   * Check if guardian approval is required for high-risk links
   */
  async requiresGuardianForHighRisk(): Promise<boolean> {
    const config = await this.getConfig();
    return config.enabled && config.requireGuardianForHighRisk;
  },

  /**
   * Verify guardian PIN for high-risk link approval
   */
  async verifyGuardian(pin: string): Promise<boolean> {
    return GuardianPinService.verify(pin);
  },

  /**
   * Update guardian PIN
   * Requires current guardian PIN for verification
   */
  async updateGuardianPin(currentPin: string, newPin: string): Promise<boolean> {
    const isValid = await GuardianPinService.verify(currentPin);
    if (!isValid) return false;
    
    await GuardianPinService.save(newPin);
    return true;
  },
};
