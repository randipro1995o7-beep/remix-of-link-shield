import { useState, useEffect, useRef } from 'react';
import { StopScreen } from './StopScreen';
import { SafetyPinCreation } from './SafetyPinCreation';
import { SafetyPinVerification } from './SafetyPinVerification';
import { SafetyReviewScreen } from './SafetyReviewScreen';
import { SkipConfirmationDialog } from './SkipConfirmationDialog';
import { useLinkInterception } from '@/contexts/LinkInterceptionContext';
import { useSafetyPin } from '@/contexts/SafetyPinContext';
import { useApp } from '@/contexts/AppContext';
import { toast } from 'sonner';

type FlowStep = 'stop' | 'pin-create' | 'pin-verify' | 'safety-review' | 'allowed' | 'blocked';

export function LinkInterceptionFlow() {
  const { currentLink, allowLink, blockLink } = useLinkInterception();
  const { hasSafetyPin, resetVerification, isLoading: pinLoading, error: pinError } = useSafetyPin();
  const { t } = useApp();
  const [step, setStep] = useState<FlowStep>('stop');
  const [showSkipConfirmation, setShowSkipConfirmation] = useState(false);

  // Track the previous link URL to prevent unnecessary resets
  const previousLinkUrl = useRef<string | null>(null);

  // Reset flow when a NEW link comes in (not on every render)
  useEffect(() => {
    if (currentLink && currentLink.url !== previousLinkUrl.current) {
      previousLinkUrl.current = currentLink.url;
      setStep('stop');
      resetVerification();
    } else if (!currentLink) {
      previousLinkUrl.current = null;
    }
  }, [currentLink?.url]); // Only depend on the URL, not the whole object or resetVerification

  // Fail-safe: if there's a PIN error, block the link
  useEffect(() => {
    if (pinError && currentLink) {
      toast.error(t.errors.securityError);
      blockLink();
    }
  }, [pinError, currentLink, blockLink, t]);

  if (!currentLink || pinLoading) return null;

  const handleContinue = () => {
    if (hasSafetyPin) {
      setStep('pin-verify');
    } else {
      setStep('pin-create');
    }
  };

  const handleSkipRequest = () => {
    // Show confirmation dialog instead of immediately skipping
    setShowSkipConfirmation(true);
  };

  const handleSkipConfirmed = () => {
    setShowSkipConfirmation(false);
    // User confirmed skip - show safety review without PIN
    setStep('safety-review');
  };

  const handleCancel = () => {
    blockLink();
  };

  const handlePinCreated = () => {
    // PIN just created, proceed to safety review
    toast.success(t.safetyPin.created, { duration: 2000 });
    setStep('safety-review');
  };

  const handlePinVerified = () => {
    toast.success(t.safetyPin.verified, { duration: 2000 });
    setStep('safety-review');
  };

  const handlePinFailed = () => {
    toast.error(t.safetyPin.blocked, { duration: 3000 });
    blockLink();
  };

  const handleReviewCancel = () => {
    blockLink();
  };

  const handleReviewProceed = () => {
    allowLink();
  };

  switch (step) {
    case 'stop':
      return (
        <>
          <StopScreen
            onContinue={handleContinue}
            onSkip={handleSkipRequest}
            onCancel={handleCancel}
          />
          <SkipConfirmationDialog
            open={showSkipConfirmation}
            onOpenChange={setShowSkipConfirmation}
            onConfirmSkip={handleSkipConfirmed}
          />
        </>
      );

    case 'pin-create':
      return (
        <SafetyPinCreation
          onComplete={handlePinCreated}
          onCancel={handleCancel}
        />
      );

    case 'pin-verify':
      return (
        <SafetyPinVerification
          onSuccess={handlePinVerified}
          onCancel={handleCancel}
          onFail={handlePinFailed}
        />
      );

    case 'safety-review':
      return (
        <SafetyReviewScreen
          url={currentLink.url}
          source={currentLink.source}
          onCancel={handleReviewCancel}
          onProceed={handleReviewProceed}
        />
      );

    default:
      return null;
  }
}
