import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { SafetyPinStorage } from '@/lib/secureStorage';

interface SafetyPinContextType {
  hasSafetyPin: boolean;
  isVerified: boolean;
  isLoading: boolean;
  error: string | null;
  verifySafetyPin: (pin: string) => Promise<boolean>;
  createSafetyPin: (pin: string) => Promise<void>;
  resetVerification: () => void;
  clearSafetyPin: () => Promise<void>;
}

const SafetyPinContext = createContext<SafetyPinContextType | undefined>(undefined);

interface SafetyPinProviderProps {
  children: ReactNode;
}

export function SafetyPinProvider({ children }: SafetyPinProviderProps) {
  const [hasSafetyPin, setHasSafetyPin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Load Safety PIN status on mount
  useEffect(() => {
    const checkSafetyPin = async () => {
      try {
        const exists = await SafetyPinStorage.exists();
        setHasSafetyPin(exists);
      } catch (err) {
        console.error('Failed to check Safety PIN:', err);
        // Fail-safe: assume PIN exists to prevent bypassing
        setHasSafetyPin(true);
        setError('Unable to verify Safety PIN status');
      } finally {
        setIsLoading(false);
      }
    };

    checkSafetyPin();
  }, []);

  const createSafetyPin = async (pin: string): Promise<void> => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      throw new Error('Safety PIN must be exactly 4 digits');
    }
    
    try {
      await SafetyPinStorage.save(pin);
      setHasSafetyPin(true);
      setIsVerified(true);
      setError(null);
    } catch (err) {
      console.error('Failed to create Safety PIN:', err);
      setError('Unable to save Safety PIN securely');
      throw err;
    }
  };

  const verifySafetyPin = async (pin: string): Promise<boolean> => {
    try {
      const storedPin = await SafetyPinStorage.get();
      
      // Fail-safe: if we can't retrieve the PIN, block access
      if (storedPin === null) {
        setError('Unable to verify Safety PIN');
        return false;
      }
      
      const isCorrect = storedPin === pin;
      if (isCorrect) {
        setIsVerified(true);
        setError(null);
      }
      return isCorrect;
    } catch (err) {
      console.error('Failed to verify Safety PIN:', err);
      setError('Security check failed');
      // Fail-safe: return false on error
      return false;
    }
  };

  const resetVerification = () => {
    setIsVerified(false);
    setError(null);
  };

  const clearSafetyPin = async () => {
    try {
      await SafetyPinStorage.clear();
      setHasSafetyPin(false);
      setIsVerified(false);
      setError(null);
    } catch (err) {
      console.error('Failed to clear Safety PIN:', err);
      setError('Unable to remove Safety PIN');
      throw err;
    }
  };

  return (
    <SafetyPinContext.Provider
      value={{
        hasSafetyPin,
        isVerified,
        isLoading,
        error,
        verifySafetyPin,
        createSafetyPin,
        resetVerification,
        clearSafetyPin,
      }}
    >
      {children}
    </SafetyPinContext.Provider>
  );
}

export function useSafetyPin(): SafetyPinContextType {
  const context = useContext(SafetyPinContext);
  if (context === undefined) {
    throw new Error('useSafetyPin must be used within a SafetyPinProvider');
  }
  return context;
}
