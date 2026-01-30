/**
 * Capacitor Preferences Storage Provider
 * 
 * Implements secure storage using @capacitor/preferences.
 * On Android, this uses encrypted SharedPreferences.
 * 
 * MIGRATION NOTE:
 * To upgrade to Android Keystore:
 * 1. Create KeystoreStorageProvider implementing StorageProvider
 * 2. Use Android's KeyStore API for key generation
 * 3. Encrypt values before storing, decrypt on retrieval
 * 4. Replace this provider in secureStorage.ts exports
 * 5. No UI changes required - the interface remains the same
 */

import { Preferences } from '@capacitor/preferences';
import { StorageProvider } from './types';

// Simple obfuscation layer (not cryptographic)
// Adds minimal protection against casual inspection
// Real security comes from Android's encrypted preferences
const obfuscate = (value: string): string => {
  return btoa(value.split('').reverse().join('') + '_lg_sec');
};

const deobfuscate = (stored: string): string => {
  try {
    const decoded = atob(stored);
    return decoded.replace('_lg_sec', '').split('').reverse().join('');
  } catch {
    return '';
  }
};

export class CapacitorStorageProvider implements StorageProvider {
  private useObfuscation: boolean;

  constructor(options: { useObfuscation?: boolean } = {}) {
    this.useObfuscation = options.useObfuscation ?? false;
  }

  async save(key: string, value: string): Promise<void> {
    const storedValue = this.useObfuscation ? obfuscate(value) : value;
    await Preferences.set({ key, value: storedValue });
  }

  async get(key: string): Promise<string | null> {
    const result = await Preferences.get({ key });
    if (!result.value) return null;
    return this.useObfuscation ? deobfuscate(result.value) : result.value;
  }

  async remove(key: string): Promise<void> {
    await Preferences.remove({ key });
  }

  async exists(key: string): Promise<boolean> {
    const result = await Preferences.get({ key });
    return result.value !== null && result.value !== '';
  }
}

// Singleton instances for different storage needs
export const secureStorage = new CapacitorStorageProvider({ useObfuscation: true });
export const generalStorage = new CapacitorStorageProvider({ useObfuscation: false });
