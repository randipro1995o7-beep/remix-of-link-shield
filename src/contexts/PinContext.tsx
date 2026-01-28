import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';

interface PinContextType {
  hasPin: boolean;
  isVerified: boolean;
  verifyPin: (pin: string) => boolean;
  createPin: (pin: string) => void;
  resetVerification: () => void;
  clearPin: () => void;
}

const PinContext = createContext<PinContextType | undefined>(undefined);

// Simple obfuscation for behavioral PIN (not cryptographic security)
// In production Android app, use Capacitor Secure Storage
const obfuscate = (pin: string): string => {
  return btoa(pin.split('').reverse().join('') + '_lg_v1');
};

const deobfuscate = (stored: string): string => {
  try {
    const decoded = atob(stored);
    return decoded.replace('_lg_v1', '').split('').reverse().join('');
  } catch {
    return '';
  }
};

const STORAGE_KEY = 'lg_behavioral_key';

interface PinProviderProps {
  children: ReactNode;
}

export function PinProvider({ children }: PinProviderProps) {
  const [hasPin, setHasPin] = useState(false);
  const [isVerified, setIsVerified] = useState(false);
  const [storedPin, setStoredPin] = useState<string | null>(null);

  // Load PIN status on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (saved) {
      setStoredPin(saved);
      setHasPin(true);
    }
  }, []);

  const createPin = (pin: string) => {
    if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
      throw new Error('PIN must be exactly 4 digits');
    }
    const obfuscated = obfuscate(pin);
    localStorage.setItem(STORAGE_KEY, obfuscated);
    setStoredPin(obfuscated);
    setHasPin(true);
    setIsVerified(true);
  };

  const verifyPin = (pin: string): boolean => {
    if (!storedPin) return false;
    const isCorrect = deobfuscate(storedPin) === pin;
    if (isCorrect) {
      setIsVerified(true);
    }
    return isCorrect;
  };

  const resetVerification = () => {
    setIsVerified(false);
  };

  const clearPin = () => {
    localStorage.removeItem(STORAGE_KEY);
    setStoredPin(null);
    setHasPin(false);
    setIsVerified(false);
  };

  return (
    <PinContext.Provider
      value={{
        hasPin,
        isVerified,
        verifyPin,
        createPin,
        resetVerification,
        clearPin,
      }}
    >
      {children}
    </PinContext.Provider>
  );
}

export function usePin(): PinContextType {
  const context = useContext(PinContext);
  if (context === undefined) {
    throw new Error('usePin must be used within a PinProvider');
  }
  return context;
}
