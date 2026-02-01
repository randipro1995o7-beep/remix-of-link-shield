
import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, KeyRound, CheckCircle } from 'lucide-react';
import { PinPad } from './PinPad';
import { useSafetyPin } from '@/contexts/SafetyPinContext';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface SafetyPinCreationProps {
  onComplete: () => void;
  onCancel: () => void;
}

type CreationStep = 'create' | 'confirm' | 'success';

export function SafetyPinCreation({ onComplete, onCancel }: SafetyPinCreationProps) {
  const [step, setStep] = useState<CreationStep>('create');
  const [pin, setPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [error, setError] = useState('');
  const [isContinueEnabled, setContinueEnabled] = useState(false);
  const { createSafetyPin } = useSafetyPin();
  const { t } = useApp();

  // 5-second countdown for the "Lanjutkan" button
  useEffect(() => {
    if (step === 'success') {
      const timer = setTimeout(() => {
        setContinueEnabled(true);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [step]);

  const handleKeyPress = useCallback((key: string) => {
    setError('');
    if (key === 'backspace') {
      if (step === 'create') {
        setPin(p => p.slice(0, -1));
      } else if (step === 'confirm') {
        setConfirmPin(p => p.slice(0, -1));
      }
      return;
    }

    if (step === 'create') {
      if (pin.length < 4) {
        const newPin = pin + key;
        setPin(newPin);
        if (newPin.length === 4) {
          setTimeout(() => setStep('confirm'), 200);
        }
      }
    } else if (step === 'confirm') {
      if (confirmPin.length < 4) {
        const newConfirmPin = confirmPin + key;
        setConfirmPin(newConfirmPin);

        if (newConfirmPin.length === 4) {
          if (pin === newConfirmPin) {
            localStorage.setItem('user_pin', pin);
            createSafetyPin(pin);
            setStep('success');
          } else {
            setError(t.safetyPin.mismatchError);
            setPin('');
            setConfirmPin('');
            setStep('create');
          }
        }
      }
    }
  }, [step, pin, confirmPin, createSafetyPin, t.safetyPin.mismatchError]);

  const handleBack = () => {
    if (step === 'confirm') {
      setStep('create');
      setPin('');
      setConfirmPin('');
      setError('');
    } else {
      onCancel();
    }
  };

  const getSubtitle = () => {
    if (step === 'create') return t.safetyPin.createSubtitle;
    if (step === 'confirm') return t.safetyPin.confirmSubtitle;
    if (step === 'success') return "PIN Anda telah berhasil dibuat.";
    return '';
  }

  const renderContent = () => {
    if (step === 'success') {
      return (
        <div className="flex flex-col items-center text-center px-6">
          <CheckCircle className="w-16 h-16 text-teal-500 mb-6" />
          <h1 className="text-display text-foreground mb-2">Berhasil!</h1>
          <p className="text-body-lg text-muted-foreground mb-8 max-w-xs">
            {getSubtitle()}
          </p>
          <button
            onClick={onComplete}
            disabled={!isContinueEnabled}
            className={cn(
                "w-full h-12 rounded-full text-white font-semibold transition-all duration-300",
                isContinueEnabled ? 'bg-teal-500 hover:bg-teal-600' : 'bg-gray-400 cursor-not-allowed'
            )}
            style={{ backgroundColor: isContinueEnabled ? '#26A69A' : undefined }}
            >
            Lanjutkan
          </button>
        </div>
      );
    }

    return (
      <PinPad
        onKeyPress={handleKeyPress}
        pinLength={step === 'create' ? pin.length : confirmPin.length}
        title={step === 'create' ? t.safetyPin.createTitle : t.safetyPin.confirmTitle}
        subtitle={getSubtitle()}
        error={error}
      />
    );
  };

  return (
    <div 
      className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in"
      role="dialog"
      aria-modal="true"
    >
      <div className="flex items-center p-4 safe-area-top">
        <button
          onClick={handleBack}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t.common.back}
        >
          <ArrowLeft className="w-6 h-6 text-foreground" />
        </button>
      </div>

      <div className="flex justify-center pt-8">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center" aria-hidden="true" style={{ backgroundColor: '#E0F2F1' }}>
          <KeyRound className="w-10 h-10 text-primary" style={{ color: '#26A69A' }} />
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center">
        {renderContent()}
      </div>
    </div>
  );
}
