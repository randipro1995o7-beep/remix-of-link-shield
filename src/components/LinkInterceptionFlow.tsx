import { useState, useEffect } from 'react';
import { StopScreen } from './StopScreen';
import { PinCreation } from './PinCreation';
import { PinVerification } from './PinVerification';
import { useLinkInterception } from '@/contexts/LinkInterceptionContext';
import { usePin } from '@/contexts/PinContext';
import { toast } from 'sonner';

type FlowStep = 'stop' | 'pin-create' | 'pin-verify' | 'allowed' | 'blocked';

export function LinkInterceptionFlow() {
  const { currentLink, allowLink, blockLink } = useLinkInterception();
  const { hasPin, resetVerification } = usePin();
  const [step, setStep] = useState<FlowStep>('stop');

  // Reset flow when a new link comes in
  useEffect(() => {
    if (currentLink) {
      setStep('stop');
      resetVerification();
    }
  }, [currentLink, resetVerification]);

  if (!currentLink) return null;

  const handleContinue = () => {
    if (hasPin) {
      setStep('pin-verify');
    } else {
      setStep('pin-create');
    }
  };

  const handleSkip = () => {
    // User chose to skip - allow the link but show a gentle reminder
    toast.info("Stay safe! Consider using verification next time.", {
      duration: 3000,
    });
    allowLink();
  };

  const handleCancel = () => {
    blockLink();
  };

  const handlePinCreated = () => {
    // PIN just created, user verified themselves in the process
    toast.success("PIN created! Link opening...", {
      duration: 2000,
    });
    allowLink();
  };

  const handlePinVerified = () => {
    toast.success("Verified! Opening link...", {
      duration: 2000,
    });
    allowLink();
  };

  const handlePinFailed = () => {
    toast.error("Link blocked for your safety", {
      duration: 3000,
    });
    blockLink();
  };

  switch (step) {
    case 'stop':
      return (
        <StopScreen
          onContinue={handleContinue}
          onSkip={handleSkip}
          onCancel={handleCancel}
        />
      );

    case 'pin-create':
      return (
        <PinCreation
          onComplete={handlePinCreated}
          onCancel={handleCancel}
        />
      );

    case 'pin-verify':
      return (
        <PinVerification
          onSuccess={handlePinVerified}
          onCancel={handleCancel}
          onFail={handlePinFailed}
        />
      );

    default:
      return null;
  }
}
