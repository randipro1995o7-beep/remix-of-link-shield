import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, Fingerprint } from 'lucide-react';
import { PinPad } from '@/components/PinPad';
import { useApp } from '@/contexts/AppContext';
import { useSafetyPin } from '@/contexts/SafetyPinContext';

interface SafetyPinVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const MAX_ATTEMPTS = 3;

export function SafetyPinVerification({ onSuccess, onCancel }: SafetyPinVerificationProps) {
  const { t } = useApp();
  const { verifyWithBiometric, verifySafetyPin, biometricAvailable, biometricEnabled, biometricType } = useSafetyPin();
  const [attempts, setAttempts] = useState(0);
  const [showError, setShowError] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  // Auto-trigger biometric if enabled
  useEffect(() => {
    if (biometricAvailable && biometricEnabled && !isBlocked) {
      handleBiometricAuth();
    }
  }, []);

  const handleBiometricAuth = async () => {
    const success = await verifyWithBiometric();
    if (success) {
      onSuccess();
    }
  };

  const handlePinEntry = async (pin: string) => {
    if (isBlocked) return;

    try {
      const isValid = await verifySafetyPin(pin);

      if (isValid) {
        onSuccess();
        return;
      }

      // Failed attempt
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      setShowError(true);

      setTimeout(() => setShowError(false), 500);

      if (newAttempts >= MAX_ATTEMPTS) {
        setIsBlocked(true);
      }
    } catch (err) {
      console.error('PIN verification error', err);
      setShowError(true);
    }
  };

  const remainingAttempts = MAX_ATTEMPTS - attempts;

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <Lock className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-title text-foreground text-center mb-2">
          {t.familyMode.blocked || 'Access Locked'}
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          Too many incorrect PIN attempts. Please try again later.
        </p>
        <button
          onClick={onCancel}
          className="px-8 py-3 rounded-xl border border-border hover:bg-muted transition-colors"
        >
          {t.common.back}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center p-4 safe-area-top">
        <button
          onClick={onCancel}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Content */}
      <div className="flex-1 flex flex-col items-center justify-center px-4 pb-8">
        <PinPad
          title={t.safetyPin.verifyTitle || "Enter Safety PIN"}
          subtitle="Enter your PIN to verify it's you and proceed."
          onPinComplete={handlePinEntry}
          error={showError ? `${t.safetyPin.incorrectError} ${remainingAttempts} attempts remaining` : undefined}
          showCancel={false}
        />

        {biometricAvailable && biometricEnabled && !isBlocked && (
          <button
            onClick={handleBiometricAuth}
            className="mt-8 flex flex-col items-center gap-2 text-primary hover:text-primary/80 transition-colors animate-fade-in"
          >
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
              <Fingerprint className="w-6 h-6" />
            </div>
            <span className="text-sm font-medium">
              Use {biometricType}
            </span>
          </button>
        )}
      </div>
    </div>
  );
}
