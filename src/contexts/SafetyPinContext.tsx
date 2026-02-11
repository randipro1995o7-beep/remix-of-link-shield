import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { GuardianPinService, SafetyPinService } from '../lib/storage/SafetyPinService';
import { PinRateLimiter } from '../lib/storage/PinRateLimiter';
import { logger } from '@/lib/utils/logger';
import { BiometricService } from '@/lib/utils/biometric';
import { Preferences } from '@capacitor/preferences';

interface SafetyPinContextType {
  hasSafetyPin: boolean;
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  biometricAvailable: boolean;
  biometricEnabled: boolean;
  biometricType: string;
  verifySafetyPin: (pin: string) => Promise<boolean>;
  verifyWithBiometric: () => Promise<boolean>;
  createSafetyPin: (pin: string) => Promise<void>;
  resetVerification: () => void;
  clearSafetyPin: () => Promise<void>;
  setBiometricEnabled: (enabled: boolean) => Promise<void>;
}

const SafetyPinContext = createContext<SafetyPinContextType | undefined>(undefined);

interface SafetyPinProviderProps {
  children: ReactNode;
}

const BIOMETRIC_ENABLED_KEY = 'lg_biometric_enabled';

export function SafetyPinProvider({ children }: SafetyPinProviderProps) {
  const [hasSafetyPin, setHasSafetyPin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricEnabled, setBiometricEnabledState] = useState(false);
  const [biometricType, setBiometricType] = useState('Biometric');

  // Load Safety PIN status and biometric availability on mount
  useEffect(() => {
    const initialize = async () => {
      try {
        // Check PIN exists
        const exists = await SafetyPinService.exists();
        setHasSafetyPin(exists);

        // Check biometric availability
        const capability = await BiometricService.checkAvailability();
        setBiometricAvailable(capability.isAvailable);
        if (capability.biometryType) {
          setBiometricType(capability.biometryType);
        }

        // Load biometric preference
        if (capability.isAvailable) {
          const { value } = await Preferences.get({ key: BIOMETRIC_ENABLED_KEY });
          setBiometricEnabledState(value === 'true');
        }
      } catch (err) {
        logger.error('Failed to initialize SafetyPinContext', err);
        setHasSafetyPin(false);
        setError('Unable to verify Safety PIN status');
      } finally {
        setIsLoading(false);
      }
    };

    initialize();
  }, []);

  const createSafetyPin = async (pin: string): Promise<void> => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      throw new Error('Safety PIN must be exactly 4 digits');
    }

    // Check rate limit (3 changes per 24h)
    const { allowed, waitTimeMs } = await SafetyPinService.canChangePin();
    if (!allowed && waitTimeMs) {
      const waitTime = PinRateLimiter.formatLockoutTime(waitTimeMs);
      throw new Error(`Limit reached. Please wait ${waitTime} before changing PIN again.`);
    }

    try {
      await SafetyPinService.save(pin);
      setHasSafetyPin(true);
      setIsVerified(true); // Automatically verified after creation
    } catch (err) {
      logger.error('Failed to create Safety PIN', err);
      throw new Error('Failed to save Safety PIN');
    }
  };

  const verifyWithBiometric = async (): Promise<boolean> => {
    if (!biometricAvailable || !biometricEnabled) {
      setError('Biometric authentication not available or not enabled');
      return false;
    }

    try {
      const result = await BiometricService.authenticate('Unlock Link Shield');

      if (result.success) {
        setIsVerified(true);
        setError(null);
        return true;
      } else {
        if (result.error && result.error !== 'Authentication cancelled') {
          setError(result.error);
        }
        return false;
      }
    } catch (err) {
      logger.error('Biometric verification failed', err);
      setError('Biometric verification failed');
      return false;
    }
  };

  const verifySafetyPin = async (pin: string): Promise<boolean> => {
    try {
      const result = await SafetyPinService.verify(pin);

      if (result.success) {
        setIsVerified(true);
        setError(null);
        return true;
      } else {
        setError('Incorrect PIN');
        return false;
      }
    } catch (err) {
      logger.error('Failed to verify Safety PIN', err);
      setError('Verification failed');
      return false;
    }
  };

  const resetVerification = () => {
    setIsVerified(false);
    setError(null);
  };

  const clearSafetyPin = async (): Promise<void> => {
    await SafetyPinService.clear();
    setHasSafetyPin(false);
    setIsVerified(false);
    // Also disable biometric when PIN is cleared
    await setBiometricEnabled(false);
  };

  const setBiometricEnabled = async (enabled: boolean): Promise<void> => {
    try {
      await Preferences.set({
        key: BIOMETRIC_ENABLED_KEY,
        value: enabled.toString(),
      });
      setBiometricEnabledState(enabled);
      logger.info(`Biometric authentication ${enabled ? 'enabled' : 'disabled'}`);
    } catch (err) {
      logger.error('Failed to update biometric preference', err);
      throw new Error('Failed to update biometric setting');
    }
  };

  const value: SafetyPinContextType = {
    hasSafetyPin,
    isVerified,
    isLoading,
    error,
    biometricAvailable,
    biometricEnabled,
    biometricType,
    verifySafetyPin,
    verifyWithBiometric,
    createSafetyPin,
    resetVerification,
    clearSafetyPin,
    setBiometricEnabled,
  };

  return (
    <SafetyPinContext.Provider value={value}>
      {children}
    </SafetyPinContext.Provider>
  );
}

export function useSafetyPin() {
  const context = useContext(SafetyPinContext);
  if (context === undefined) {
    throw new Error('useSafetyPin must be used within a SafetyPinProvider');
  }
  return context;
}
