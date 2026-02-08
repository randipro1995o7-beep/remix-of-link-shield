import { useState, useEffect, useCallback } from 'react';
import { Hand, ChevronRight, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLinkInterception } from '@/contexts/LinkInterceptionContext';
import { useApp } from '@/contexts/AppContext';
import { cn } from '@/lib/utils';

interface StopScreenProps {
  url: string;
  finalUrl?: string;
  onContinue: () => void;
  onSkip: () => void;
  onCancel: () => void;
}

const COUNTDOWN_SECONDS = 5;

/**
 * Stop Screen - First screen in the link interception flow
 * 
 * Uses calm, non-threatening language.
 * Provides a behavioral pause before proceeding.
 */
export function StopScreen({ url, finalUrl, onContinue, onSkip, onCancel }: StopScreenProps) {
  const [countdown, setCountdown] = useState(COUNTDOWN_SECONDS);
  const [canContinue, setCanContinue] = useState(false);
  const { currentLink } = useLinkInterception();
  const { t } = useApp();

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
    <div
      className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="stop-title"
      aria-describedby="stop-subtitle"
    >
      {/* Header with cancel */}
      <div className="flex justify-end p-4 safe-area-top">
        <button
          onClick={onCancel}
          className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors focus:outline-none focus:ring-2 focus:ring-primary"
          aria-label={t.common.cancel}
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
          aria-hidden="true"
        >
          <Hand className="w-14 h-14 text-warning" />
        </div>

        {/* Main message - calm, not threatening */}
        <h1 id="stop-title" className="text-display text-foreground mb-4">
          {t.stopScreen.title}
        </h1>

        <p id="stop-subtitle" className="text-body-lg text-muted-foreground mb-6 max-w-sm">
          {t.stopScreen.subtitle}
        </p>

        {/* Link preview */}
        <div className="w-full max-w-sm bg-muted/50 rounded-xl p-4 mb-4">
          <p className="text-sm text-muted-foreground mb-1">{t.stopScreen.linkDestination}</p>
          <p className="text-foreground font-medium break-all mb-2">
            {getDomain(currentLink.url)}
          </p>

          {/* Show resolved URL if different */}
          {finalUrl && finalUrl !== currentLink.url && (
            <div className="mt-3 pt-3 border-t border-border">
              <p className="text-xs text-warning font-medium mb-1">⚠️ Redirects to:</p>
              <p className="text-sm text-foreground break-all font-mono bg-background/50 p-1 rounded">
                {getDomain(finalUrl)}
              </p>
            </div>
          )}

          {currentLink.source && (
            <p className="text-xs text-muted-foreground mt-2">
              {t.stopScreen.sharedFrom} {currentLink.source}
            </p>
          )}
        </div>

        {/* Countdown or Continue button */}
        {!canContinue ? (
          <div className="space-y-4" role="timer" aria-live="polite">
            <div className="w-20 h-20 rounded-full border-4 border-primary flex items-center justify-center mx-auto">
              <span className="text-3xl font-bold text-primary" aria-label={`${countdown} seconds remaining`}>
                {countdown}
              </span>
            </div>
            <p className="text-muted-foreground">
              {t.stopScreen.pleaseWait} {countdown} {countdown !== 1 ? t.stopScreen.seconds : t.stopScreen.second}
            </p>
          </div>
        ) : (
          <Button
            onClick={onContinue}
            size="lg"
            className="w-full max-w-sm h-14 text-lg gap-2"
          >
            {t.stopScreen.continueToReview}
            <ChevronRight className="w-5 h-5" aria-hidden="true" />
          </Button>
        )}
      </div>

      {/* Skip option - small and de-emphasized */}
      <div className="p-6 safe-area-bottom">
        <button
          onClick={onSkip}
          className="w-full text-center text-sm text-muted-foreground/60 hover:text-muted-foreground transition-colors py-2 focus:outline-none focus:underline"
          aria-label={t.stopScreen.skipNotRecommended}
        >
          {t.stopScreen.skipNotRecommended}
        </button>
      </div>
    </div>
  );
}
