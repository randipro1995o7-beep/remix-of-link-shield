import { useState } from 'react';
import { ArrowLeft, Users } from 'lucide-react';
import { PinPad } from '@/components/PinPad';
import { useApp } from '@/contexts/AppContext';
import { FamilyModeService } from '@/lib/storage';
import { cn } from '@/lib/utils';

interface GuardianPinVerificationProps {
  onSuccess: () => void;
  onCancel: () => void;
}

const MAX_ATTEMPTS = 3;

export function GuardianPinVerification({ onSuccess, onCancel }: GuardianPinVerificationProps) {
  const { t } = useApp();
  const [attempts, setAttempts] = useState(0);
  const [showError, setShowError] = useState(false);
  const [isBlocked, setIsBlocked] = useState(false);

  const handlePinEntry = async (pin: string) => {
    if (isBlocked) return;

    const isValid = await FamilyModeService.verifyGuardian(pin);
    
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
  };

  const remainingAttempts = MAX_ATTEMPTS - attempts;

  if (isBlocked) {
    return (
      <div className="fixed inset-0 z-[60] bg-background flex flex-col items-center justify-center p-6 animate-fade-in">
        <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
          <Users className="w-10 h-10 text-destructive" />
        </div>
        <h2 className="text-title text-foreground text-center mb-2">
          {t.familyMode.blocked}
        </h2>
        <p className="text-center text-muted-foreground mb-8">
          {t.familyMode.blockedDesc}
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
          title={t.familyMode.guardianPinTitle}
          subtitle={t.familyMode.guardianPinDesc}
          onPinComplete={handlePinEntry}
          error={showError ? `${t.safetyPin.incorrectError} ${remainingAttempts} ${t.safetyPin.attemptsRemaining}` : undefined}
          showCancel={false}
        />
      </div>
    </div>
  );
}
