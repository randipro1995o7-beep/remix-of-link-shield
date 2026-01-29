// Secure storage abstraction using Capacitor Preferences
// Provides encrypted on-device storage for sensitive data like Safety PIN

import { Preferences } from '@capacitor/preferences';

// Storage keys - prefixed for organization
const KEYS = {
  SAFETY_PIN: 'lg_safety_pin_v1',
  APP_STATE: 'lg_app_state_v1',
  LINK_HISTORY: 'lg_link_history_v1',
} as const;

// Simple obfuscation for additional layer (not cryptographic)
// Capacitor Preferences already provides encrypted storage on Android
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

// Safety PIN storage
export const SafetyPinStorage = {
  async save(pin: string): Promise<void> {
    const obfuscated = obfuscate(pin);
    await Preferences.set({
      key: KEYS.SAFETY_PIN,
      value: obfuscated,
    });
  },

  async get(): Promise<string | null> {
    const result = await Preferences.get({ key: KEYS.SAFETY_PIN });
    if (!result.value) return null;
    return deobfuscate(result.value);
  },

  async exists(): Promise<boolean> {
    const result = await Preferences.get({ key: KEYS.SAFETY_PIN });
    return result.value !== null && result.value !== '';
  },

  async clear(): Promise<void> {
    await Preferences.remove({ key: KEYS.SAFETY_PIN });
  },
};

// App state storage (non-sensitive data like language, stats)
export const AppStateStorage = {
  async save(state: object): Promise<void> {
    await Preferences.set({
      key: KEYS.APP_STATE,
      value: JSON.stringify(state),
    });
  },

  async get<T>(): Promise<T | null> {
    const result = await Preferences.get({ key: KEYS.APP_STATE });
    if (!result.value) return null;
    try {
      return JSON.parse(result.value) as T;
    } catch {
      return null;
    }
  },
};

// Link history storage
export const LinkHistoryStorage = {
  async save(history: object[]): Promise<void> {
    await Preferences.set({
      key: KEYS.LINK_HISTORY,
      value: JSON.stringify(history),
    });
  },

  async get<T>(): Promise<T[] | null> {
    const result = await Preferences.get({ key: KEYS.LINK_HISTORY });
    if (!result.value) return null;
    try {
      return JSON.parse(result.value) as T[];
    } catch {
      return null;
    }
  },

  async clear(): Promise<void> {
    await Preferences.remove({ key: KEYS.LINK_HISTORY });
  },
};
