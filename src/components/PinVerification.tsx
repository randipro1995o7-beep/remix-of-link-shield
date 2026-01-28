import { useState } from 'react';
import { ArrowLeft, ShieldCheck } from 'lucide-react';
import { PinPad } from './PinPad';
import { usePin } from '@/contexts/PinContext';

interface PinVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
  onFail: () => void;
}

const MAX_ATTEMPTS = 3;

export function PinVerification({ onSuccess, onCancel, onFail }: PinVerificationProps) {
  const [error, setError] = useState('');
  const [attempts, setAttempts] = useState(0);
  const { verifyPin } = usePin();

  const handlePinComplete = (pin: string) => {
    if (verifyPin(pin)) {
      onSuccess();
    } else {
      const newAttempts = attempts + 1;
      setAttempts(newAttempts);
      
      if (newAttempts >= MAX_ATTEMPTS) {
        setError('Too many incorrect attempts');
        // Delay before blocking
        setTimeout(() => {
          onFail();
        }, 1500);
      } else {
        const remaining = MAX_ATTEMPTS - newAttempts;
        setError(`Incorrect PIN. ${remaining} attempt${remaining !== 1 ? 's' : ''} remaining.`);
      }
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center p-4 safe-area-top">
        <button
          onClick={onCancel}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Cancel"
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
          title="Enter your PIN"
          subtitle="Confirm it's really you"
          error={error}
          showCancel={false}
        />
      </div>
    </div>
  );
}
