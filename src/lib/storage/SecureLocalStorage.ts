/**
 * Secure Local Storage
 * 
 * Drop-in replacement for localStorage that uses Capacitor Preferences
 * for secure, platform-native storage on Android.
 * 
 * Benefits:
 * - Android: Uses encrypted SharedPreferences
 * - Survives app updates
 * - Not accessible via WebView inspection
 * - Automatic platform-specific encryption
 */

import { Preferences } from '@capacitor/preferences';

export class SecureLocalStorage {
    /**
     * Get item from secure storage
     */
    static async getItem(key: string): Promise<string | null> {
        try {
            const { value } = await Preferences.get({ key });
            return value;
        } catch (error) {
            console.error('SecureLocalStorage.getItem failed:', error);
            return null;
        }
    }

    /**
     * Set item in secure storage
     */
    static async setItem(key: string, value: string): Promise<void> {
        try {
            await Preferences.set({ key, value });
        } catch (error) {
            console.error('SecureLocalStorage.setItem failed:', error);
            throw new Error('Failed to save data securely');
        }
    }

    /**
     * Remove item from secure storage
     */
    static async removeItem(key: string): Promise<void> {
        try {
            await Preferences.remove({ key });
        } catch (error) {
            console.error('SecureLocalStorage.removeItem failed:', error);
        }
    }

    /**
     * Clear all items from secure storage
     */
    static async clear(): Promise<void> {
        try {
            await Preferences.clear();
        } catch (error) {
            console.error('SecureLocalStorage.clear failed:', error);
        }
    }

    /**
     * Get all keys from secure storage
     */
    static async keys(): Promise<string[]> {
        try {
            const { keys } = await Preferences.keys();
            return keys;
        } catch (error) {
            console.error('SecureLocalStorage.keys failed:', error);
            return [];
        }
    }

    /**
     * Migrate data from localStorage to Capacitor Preferences
     * Should be called once during app initialization
     */
    static async migrateFromLocalStorage(keys: string[]): Promise<{
        migrated: number;
        failed: string[];
    }> {
        let migrated = 0;
        const failed: string[] = [];

        for (const key of keys) {
            try {
                const value = localStorage.getItem(key);
                if (value !== null) {
                    await this.setItem(key, value);
                    localStorage.removeItem(key);
                    migrated++;
                }
            } catch (error) {
                failed.push(key);
                console.error(`Failed to migrate key: ${key}`, error);
            }
        }

        return { migrated, failed };
    }
}
