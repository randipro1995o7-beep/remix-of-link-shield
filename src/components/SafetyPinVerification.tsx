
import { useState, useCallback } from 'react';
import { ArrowLeft, ShieldCheck, ShieldAlert } from 'lucide-react';
import { PinPad } from './PinPad';
import { useApp } from '@/contexts/AppContext';

interface SafetyPinVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const MAX_ATTEMPTS = 5;

export function SafetyPinVerification({ onSuccess, onCancel }: SafetyPinVerificationProps) {
  const [pin, setPin] = useState('');
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const { t } = useApp();

  const handleKeyPress = useCallback((key: string) => {
    setError('');
    if (key === 'backspace') {
      setPin(p => p.slice(0, -1));
      return;
    }

    if (pin.length < 4) {
      const newPin = pin + key;
      setPin(newPin);

      if (newPin.length === 4) {
        const storedPin = localStorage.getItem('user_pin');
        if (newPin === storedPin) {
          onSuccess();
        } else {
          const newAttempts = attempts + 1;
          setAttempts(newAttempts);
          if (newAttempts >= MAX_ATTEMPTS) {
            setError("PIN locked. Please reset.");
          } else {
            setError(t.safetyPin.incorrectError);
          }
          setPin('');
        }
      }
    }
  }, [pin, attempts, onSuccess, t.safetyPin.incorrectError]);

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
