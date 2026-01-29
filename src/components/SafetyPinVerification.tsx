import { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { PinPad } from './PinPad';
import { useSafetyPin } from '@/contexts/SafetyPinContext';
import { useApp } from '@/contexts/AppContext';

interface SafetyPinVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
  onFail: () => void;
}

const MAX_ATTEMPTS = 3;

export function SafetyPinVerification({ onSuccess, onCancel, onFail }: SafetyPinVerificationProps) {
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const { verifySafetyPin } = useSafetyPin();
  const { t } = useApp();

  const handlePinComplete = async (pin: string) => {
    try {
      const isCorrect = await verifySafetyPin(pin);
      
      if (isCorrect) {
        onSuccess();
      } else {
        const newAttempts = attempts + 1;
        setAttempts(newAttempts);
        
        if (newAttempts >= MAX_ATTEMPTS) {
          setError(t.safetyPin.tooManyAttempts);
          // Delay before blocking
          setTimeout(() => {
            onFail();
          }, 1500);
        } else {
          const remaining = MAX_ATTEMPTS - newAttempts;
          setError(`${t.safetyPin.incorrectError} ${remaining} ${t.safetyPin.attemptsRemaining}.`);
        }
      }
    } catch {
      // Fail-safe: block on error
      setError(t.errors.securityError);
      setTimeout(() => {
        onFail();
      }, 1500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center p-4 safe-area-top">
        <button
          onClick={onCancel}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label={t.common.cancel}
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Icon */}
      <div className="flex justify-center pt-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          <ShieldCheck className="w-10 h-10 text-primary" />
        </div>
      </div>

      {/* PIN Pad */}
      <div className="flex-1 flex items-center justify-center">
        <PinPad
          onComplete={handlePinComplete}
          onCancel={onCancel}
          title={t.safetyPin.verifyTitle}
          subtitle={t.safetyPin.verifySubtitle}
          error={error}
          showCancel={false}
        />
      </div>
    </div>
  );
}
