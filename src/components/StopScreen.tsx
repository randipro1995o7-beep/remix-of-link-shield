import { useState, useEffect, useCallback } from 'react';
import { Hand, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLinkInterception } from '@/contexts/LinkInterceptionContext';
import { cn } from '@/lib/utils';

interface StopScreenProps {
  onContinue: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

const COUNTDOWN_SECONDS = 5;

export function StopScreen({ onContinue, onSkip, onCancel }: StopScreenProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canContinue, setCanContinue] = useState(false);
  const { currentLink } = useLinkInterception();

  useEffect(() => {
    if (countdown <= 0) {
      setCanContinue(true);
      return;
    }

    const timer = setTimeout(() => {
      setCountdown((prev) => prev - 1);
    }, 1000);

    return () => clearTimeout(timer);
  }, [countdown]);

  // Extract domain from URL for display
  const getDomain = useCallback((url: string): string => {
    try {
      const urlObj = new URL(url);
      return urlObj.hostname;
    } catch {
      return url;
    }
  }, []);

  if (!currentLink) return null;

  return (
    <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
      {/* Header with cancel */}
      <div className="flex justify-end p-4 safe-area-top">
        <button
          onClick={onCancel}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
          aria-label="Cancel"
        >
          <X className="w-6 h-6 text-muted-foreground" />
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
        {/* Stop hand icon */}
        <div
          className={cn(
            "w-28 h-28 rounded-full flex items-center justify-center mb-8",
            "bg-warning/10 transition-transform duration-500",
            !canContinue && "animate-gentle-pulse"
          )}
        >
          <Hand className="w-14 h-14 text-warning" />
        </div>

        {/* Main message */}
        <h1 className="text-display text-foreground mb-4">
          Let's pause for a moment
        </h1>

        <p className="text-body-lg text-muted-foreground mb-6 max-w-sm">
          You're about to open an external link. Take a moment to make sure it's safe.
        </p>

        {/* Link preview */}
        <div className="w-full max-w-sm bg-muted/50 rounded-xl p-4 mb-8">
          <p className="text-sm text-muted-foreground mb-1">Link destination:</p>
          <p className="text-foreground font-medium break-all">
            {getDomain(currentLink.url)}
          </p>
          {currentLink.source && (
            <p className="text-xs text-muted-foreground mt-2">
              Shared from {currentLink.source}
            </p>
          )}
        </div>

        {/* Countdown or Continue button */}
        {!canContinue ? (
          <div className="space-y-4">
            <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center mx-auto">
              <span className="text-3xl font-bold text-primary">{countdown}</span>
            </div>
            <p className="text-muted-foreground">
              Please wait {countdown} second{countdown !== 1 ? 's' : ''}
            </p>
          </div>
        ) : (
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full max-w-sm h-14 text-lg gap-2"
          >
            Continue to inspection
            <ChevronRight className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Skip option - small and de-emphasized */}
      <div className="p-6 safe-area-bottom">
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors py-2"
        >
          Skip verification (not recommended)
        </button>
      </div>
    </div>
  );
}
