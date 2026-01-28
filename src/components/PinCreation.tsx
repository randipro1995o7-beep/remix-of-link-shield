import { useState } from 'react';
import { Shield, ArrowLeft } from 'lucide-react';
import { PinPad } from './PinPad';
import { usePin } from '@/contexts/PinContext';

interface PinCreationProps {
  onComplete: () => void;
  onCancel: () => void;
}

type Step = 'intro' | 'create' | 'confirm';

export function PinCreation({ onComplete, onCancel }: PinCreationProps) {
  const [step, setStep] = useState<Step>('intro');
  const [firstPin, setFirstPin] = useState('');
  const [error, setError] = useState('');
  const { createPin } = usePin();

  const handleFirstPin = (pin: string) => {
    setFirstPin(pin);
    setStep('confirm');
    setError('');
  };

  const handleConfirmPin = (pin: string) => {
    if (pin === firstPin) {
      createPin(pin);
      onComplete();
    } else {
      setError("PINs don't match. Try again.");
      setStep('create');
      setFirstPin('');
    }
  };

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setFirstPin('');
    } else if (step === 'create') {
      setStep('intro');
    } else {
      onCancel();
    }
  };

  if (step === 'intro') {
    return (
      <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
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
        <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
          <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8">
            <Shield className="w-12 h-12 text-primary" />
          </div>

          <h1 className="text-display text-foreground mb-4">
            Create your safety PIN
          </h1>

          <p className="text-body-lg text-muted-foreground mb-8 max-w-sm">
            This PIN helps you pause and think before opening links. 
            It's stored only on your device.
          </p>

          <div className="space-y-3 text-left w-full max-w-sm mb-8">
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-semibold text-primary">1</span>
              </div>
              <p className="text-sm text-foreground">
                Choose a 4-digit PIN you'll remember
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-semibold text-primary">2</span>
              </div>
              <p className="text-sm text-foreground">
                You'll enter this PIN before opening external links
              </p>
            </div>
            <div className="flex items-start gap-3 p-3 rounded-xl bg-muted/50">
              <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0 mt-0.5">
                <span className="text-sm font-semibold text-primary">3</span>
              </div>
              <p className="text-sm text-foreground">
                This extra step helps prevent impulsive clicks
              </p>
            </div>
          </div>

          <button
            onClick={() => setStep('create')}
            className="w-full max-w-sm h-14 rounded-xl bg-primary text-primary-foreground text-lg font-medium transition-all active:scale-[0.98]"
          >
            Create PIN
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header */}
      <div className="flex items-center p-4 safe-area-top">
        <button
          onClick={handleBack}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Go back"
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      {/* PIN Pad */}
      <div className="flex-1 flex items-center justify-center">
        {step === 'create' ? (
          <PinPad
            onComplete={handleFirstPin}
            onCancel={onCancel}
            title="Create your PIN"
            subtitle="Choose 4 digits you'll remember"
            showCancel={false}
          />
        ) : (
          <PinPad
            onComplete={handleConfirmPin}
            onCancel={handleBack}
            title="Confirm your PIN"
            subtitle="Enter the same 4 digits again"
            error={error}
            showCancel={false}
          />
        )}
      </div>
    </div>
  );
}
