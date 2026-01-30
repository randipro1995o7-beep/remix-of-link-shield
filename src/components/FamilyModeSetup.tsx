import { useState } from 'react';
import { ArrowLeft, Users, Shield, CheckCircle, Info } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { PinPad } from '@/components/PinPad';
import { useApp } from '@/contexts/AppContext';
import { FamilyModeService } from '@/lib/storage';
import { toast } from 'sonner';

type SetupStep = 'intro' | 'create-pin' | 'confirm-pin' | 'success';

interface FamilyModeSetupProps {
  onComplete: () => void;
  onCancel: () => void;
}

export function FamilyModeSetup({ onComplete, onCancel }: FamilyModeSetupProps) {
  const { t } = useApp();
  const [step, setStep] = useState<SetupStep>('intro');
  const [guardianPin, setGuardianPin] = useState('');
  const [confirmError, setConfirmError] = useState(false);

  const handleCreatePin = (pin: string) => {
    setGuardianPin(pin);
    setStep('confirm-pin');
  };

  const handleConfirmPin = async (pin: string) => {
    if (pin !== guardianPin) {
      setConfirmError(true);
      setTimeout(() => setConfirmError(false), 500);
      return;
    }

    try {
      await FamilyModeService.enable(guardianPin);
      setStep('success');
      toast.success(t.familyMode.enabled);
    } catch (error) {
      console.error('Failed to enable family mode:', error);
      toast.error(t.errors.generic);
    }
  };

  const handleComplete = () => {
    onComplete();
  };

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
      <div className="flex-1 overflow-y-auto px-4 pb-8">
        {step === 'intro' && (
          <div className="pt-8 animate-fade-in">
            {/* Icon */}
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                <Users className="w-10 h-10 text-primary" />
              </div>
            </div>

            {/* Title */}
            <h1 className="text-display text-foreground text-center mb-3">
              {t.familyMode.title}
            </h1>
            <p className="text-center text-muted-foreground mb-8 max-w-sm mx-auto">
              {t.familyMode.subtitle}
            </p>

            {/* Features */}
            <div className="space-y-3 mb-8">
              <Card className="p-4 flex items-start gap-3">
                <Shield className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{t.familyMode.feature1Title}</p>
                  <p className="text-sm text-muted-foreground">{t.familyMode.feature1Desc}</p>
                </div>
              </Card>
              
              <Card className="p-4 flex items-start gap-3">
                <Users className="w-6 h-6 text-primary flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-medium text-foreground">{t.familyMode.feature2Title}</p>
                  <p className="text-sm text-muted-foreground">{t.familyMode.feature2Desc}</p>
                </div>
              </Card>
            </div>

            {/* Info notice */}
            <div className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 mb-8">
              <Info className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
              <p className="text-sm text-muted-foreground">
                {t.familyMode.infoNotice}
              </p>
            </div>

            {/* Actions */}
            <div className="space-y-3">
              <Button onClick={() => setStep('create-pin')} size="lg" className="w-full h-14 text-lg">
                {t.familyMode.setupButton}
              </Button>
              <button
                onClick={onCancel}
                className="w-full py-3 text-muted-foreground hover:text-foreground transition-colors"
              >
                {t.common.cancel}
              </button>
            </div>
          </div>
        )}

        {step === 'create-pin' && (
          <div className="pt-8 animate-fade-in">
            <PinPad 
              title={t.familyMode.createPinTitle}
              subtitle={t.familyMode.createPinDesc}
              onComplete={handleCreatePin} 
              showCancel={false}
            />
          </div>
        )}

        {step === 'confirm-pin' && (
          <div className="pt-8 animate-fade-in">
            <PinPad 
              title={t.familyMode.confirmPinTitle}
              subtitle={t.familyMode.confirmPinDesc}
              onComplete={handleConfirmPin}
              error={confirmError ? t.safetyPin.mismatchError : undefined}
              showCancel={false}
            />
          </div>
        )}

        {step === 'success' && (
          <div className="pt-16 text-center animate-fade-in">
            <div className="flex justify-center mb-6">
              <div className="w-20 h-20 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle className="w-10 h-10 text-success" />
              </div>
            </div>
            <h1 className="text-title text-foreground mb-2">
              {t.familyMode.successTitle}
            </h1>
            <p className="text-muted-foreground mb-8 max-w-sm mx-auto">
              {t.familyMode.successDesc}
            </p>
            <Button onClick={handleComplete} size="lg" className="h-14 text-lg px-8">
              {t.common.done}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
