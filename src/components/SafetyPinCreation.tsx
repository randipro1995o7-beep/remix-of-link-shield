import { useState } from 'react';
import { ArrowLeft, KeyRound } from 'lucide-react';
import { PinPad } from './PinPad';
import { useSafetyPin } from '@/contexts/SafetyPinContext';
import { useApp } from '@/contexts/AppContext';

interface SafetyPinCreationProps {
  onComplete: () => void;
  onCancel: () => void;
}

type CreationStep = 'create' | 'confirm';

/**
 * Safety PIN Creation Component
 * 
 * Creates a 4-digit behavioral PIN.
 * Includes accessible labels and purpose explanation.
 */
export function SafetyPinCreation({ onComplete, onCancel }: SafetyPinCreationProps) {
  const [step, setStep] = useState<CreationStep>('create');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const { createSafetyPin } = useSafetyPin();
  const { t } = useApp();

  const handleFirstPinComplete = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    setError('');
  };

  const handleConfirmPinComplete = async (pin: string) => {
    if (pin !== firstPin) {
      setError(t.safetyPin.mismatchError);
      setStep('create');
      setFirstPin('');
      return;
    }

    try {
      await createSafetyPin(pin);
      onComplete();
    } catch {
      setError(t.errors.securityError);
      setStep('create');
      setFirstPin('');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setFirstPin('');
      setError('');
    } else {
      onCancel();
    }
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="pin-creation-title"
    >
      {/* Header */}
      <div className="flex items-center p-4 safe-area-top">
        <button
          onClick={handleBack}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t.common.back}
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* Icon */}
      <div className="flex justify-center pt-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true">
          <KeyRound className="w-10 h-10 text-primary" />
        </div>
      </div>

      {/* PIN Pad */}
      <div className="flex-1 flex items-center justify-center">
        {step === 'create' ? (
          <PinPad
            onComplete={handleFirstPinComplete}
            onCancel={onCancel}
            title={t.safetyPin.createTitle}
            subtitle={t.safetyPin.createSubtitle}
            purposeText={t.safetyPin.purpose}
            error={error}
            showCancel={false}
          />
        ) : (
          <PinPad
            onComplete={handleConfirmPinComplete}
            onCancel={handleBack}
            title={t.safetyPin.confirmTitle}
            subtitle={t.safetyPin.confirmSubtitle}
            error={error}
            showCancel={false}
          />
        )}
      </div>
    </div>
  );
}
