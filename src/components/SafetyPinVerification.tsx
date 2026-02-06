
import { useState, useCallback } from 'react';
import { ArrowLeft, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PinPad } from './PinPad';
import { useApp } from '@/contexts/AppContext';
import { useSafetyPin } from '@/contexts/SafetyPinContext';

interface SafetyPinVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
  onFail?: () => void;
}

const MAX_ATTEMPTS = 5;

export function SafetyPinVerification({ onSuccess, onCancel, onFail }: SafetyPinVerificationProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const [isVerifying, setIsVerifying] = useState(false);
  const { t } = useApp();
  const { verifySafetyPin } = useSafetyPin();

  const handleKeyPress = useCallback(async (key: string) => {
    if (isVerifying) return; // Prevent double submission

    setError('');
    if (key === 'backspace') {
      setPin(p => p.slice(0, -1));
      return;
    }

    if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);

      if (newPin.length === 4) {
        setIsVerifying(true);
        try {
          const isCorrect = await verifySafetyPin(newPin);
          if (isCorrect) {
            onSuccess();
          } else {
            const newAttempts = attempts + 1;
            setAttempts(newAttempts);
            if (newAttempts >= MAX_ATTEMPTS) {
              setError("PIN locked. Please reset.");
              onFail?.();
            } else {
              setError(t.safetyPin.incorrectError);
            }
            setPin('');
          }
        } catch (err) {
          console.error('PIN verification error:', err);
          setError(t.safetyPin.incorrectError);
          setPin('');
        } finally {
          setIsVerifying(false);
        }
      }
    }
  }, [pin, attempts, onSuccess, onFail, t.safetyPin.incorrectError, verifySafetyPin, isVerifying]);

  const isLocked = attempts >= MAX_ATTEMPTS;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      <div className="flex items-center p-4 safe-area-top">
        <button
          onClick={onCancel}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label={t.common.cancel}
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      <div className="flex justify-center pt-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
          {isLocked ? (
            <ShieldAlert className="w-10 h-10 text-destructive" />
          ) : (
            <ShieldCheck className="w-10 h-10 text-primary" style={{ color: '#26A69A' }} />
          )}
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {isLocked ? (
          <div className='text-center'>
            <h1 className='text-2xl font-bold'>Too many attempts</h1>
            <p>Please reset your PIN</p>
          </div>
        ) : (
          <PinPad
            onKeyPress={handleKeyPress}
            pinLength={pin.length}
            title={t.safetyPin.verifyTitle}
            subtitle={"Enter your PIN to proceed"}
            error={error}
          />
        )}
      </div>
    </div>
  );
}
