/**
 * Storage Types for Link Guardian
 * 
 * IMPORTANT DEVELOPER NOTE:
 * ==========================
 * The Safety PIN is a BEHAVIORAL SAFEGUARD, not cryptographic authentication.
 * 
 * Its purpose is to create a conscious pause before potentially harmful actions,
 * similar to a cooling-off period. It is NOT designed to provide cryptographic
 * security or prevent determined attackers.
 * 
 * Current implementation uses @capacitor/preferences with basic obfuscation.
 * This can be upgraded to Android Keystore for enhanced security without
 * changing the UI or business logic - just implement the StorageProvider interface.
 * 
 * FUTURE ANDROID KEYSTORE MIGRATION:
 * - Implement a new KeystoreStorageProvider class
 * - Implement the StorageProvider interface below
 * - Replace the provider in secureStorage.ts
 * - No changes needed to SafetyPinContext or UI components
 */

// Generic storage provider interface for platform abstraction
export interface StorageProvider {
  save(key: string, value: string): Promise<void>;
  get(key: string): Promise<string | null>;
  remove(key: string): Promise<void>;
  exists(key: string): Promise<boolean>;
}

// Storage keys used across the app
export const STORAGE_KEYS = {
  SAFETY_PIN: 'lg_safety_pin_v1',
  APP_STATE: 'lg_app_state_v1',
  LINK_HISTORY: 'lg_link_history_v1',
  SAFETY_HISTORY: 'lg_safety_history_v1',
  FAMILY_MODE: 'lg_family_mode_v1',
  GUARDIAN_PIN: 'lg_guardian_pin_v1',
  PREMIUM_STATUS: 'lg_premium_status_v1',
} as const;

// Safety history entry for tracking user patterns
export interface SafetyHistoryEntry {
  id: string;
  url: string;
  domain: string;
  riskLevel: 'low' | 'medium' | 'high';
  action: 'cancelled' | 'opened' | 'blocked';
  timestamp: string; // ISO string for serialization
  source?: string; // WhatsApp, SMS, etc.
  hourOfDay: number; // 0-23 for pattern analysis
}

// Aggregated safety insights
export interface SafetyInsights {
  totalLinksChecked: number;
  linksCancelled: number;
  linksOpened: number;
  linksBlocked: number;
  highRiskEncounters: number;
  riskByTimeOfDay: Record<string, number>; // "morning" | "afternoon" | "evening" | "night"
  lastUpdated: string;
}

// Family mode configuration
export interface FamilyModeConfig {
  enabled: boolean;
  guardianPinSet: boolean;
  requireGuardianForHighRisk: boolean;
  createdAt: string;
}

// Premium feature flags
export interface PremiumStatus {
  isPremium: boolean;
  features: {
    extendedHistory: boolean;
    familyMode: boolean;
    autoGuardWindows: boolean;
    biometricUnlock: boolean;
    advancedExplanations: boolean;
  };
  purchasedAt?: string;
}
