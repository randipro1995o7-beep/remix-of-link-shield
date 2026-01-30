import { useState, useRef, useEffect } from 'react';
import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

interface HighRiskConfirmationProps {
  onConfirm: () => void;
  onCancel: () => void;
}

/**
 * Additional friction for HIGH risk links
 * 
 * User must acknowledge understanding before proceeding.
 * No fear-based language - just calm, clear communication.
 */
export function HighRiskConfirmation({ onConfirm, onCancel }: HighRiskConfirmationProps) {
  const { t } = useApp();
  const [acknowledged, setAcknowledged] = useState(false);
  const [holdProgress, setHoldProgress] = useState(0);
  const holdTimerRef = useRef<NodeJS.Timeout | null>(null);
  const holdStartRef = useRef<number>(0);
  
  const HOLD_DURATION = 1500; // 1.5 seconds

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (holdTimerRef.current) {
        clearInterval(holdTimerRef.current);
      }
    };
  }, []);

  const handleHoldStart = () => {
    if (!acknowledged) return;
    
    holdStartRef.current = Date.now();
    holdTimerRef.current = setInterval(() => {
      const elapsed = Date.now() - holdStartRef.current;
      const progress = Math.min((elapsed / HOLD_DURATION) * 100, 100);
      setHoldProgress(progress);
      
      if (progress >= 100) {
        if (holdTimerRef.current) {
          clearInterval(holdTimerRef.current);
        }
        onConfirm();
      }
    }, 50);
  };

  const handleHoldEnd = () => {
    if (holdTimerRef.current) {
      clearInterval(holdTimerRef.current);
    }
    setHoldProgress(0);
  };

  return (
    <div className="fixed inset-0 z-[60] bg-background/95 flex flex-col items-center justify-center p-6 animate-fade-in">
      {/* Warning Icon */}
      <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
        <AlertTriangle className="w-10 h-10 text-destructive" />
      </div>

      {/* Title */}
      <h2 className="text-title text-foreground text-center mb-3">
        {t.highRisk.title}
      </h2>

      {/* Description */}
      <p className="text-center text-muted-foreground mb-8 max-w-sm leading-relaxed">
        {t.highRisk.description}
      </p>

      {/* Acknowledgment Checkbox */}
      <label className="flex items-start gap-3 p-4 rounded-xl bg-muted/50 mb-8 max-w-sm cursor-pointer">
        <Checkbox
          id="acknowledge"
          checked={acknowledged}
          onCheckedChange={(checked) => setAcknowledged(checked === true)}
          className="mt-0.5"
        />
        <span className="text-sm text-foreground leading-relaxed">
          {t.highRisk.acknowledgment}
        </span>
      </label>

      {/* Actions */}
      <div className="w-full max-w-sm space-y-3">
        {/* Cancel - Primary Action */}
        <Button
          onClick={onCancel}
          size="lg"
          className="w-full h-14 text-lg"
        >
          {t.highRisk.cancel}
        </Button>

        {/* Hold to Open - Secondary, requires acknowledgment */}
        <button
          onMouseDown={handleHoldStart}
          onMouseUp={handleHoldEnd}
          onMouseLeave={handleHoldEnd}
          onTouchStart={handleHoldStart}
          onTouchEnd={handleHoldEnd}
          disabled={!acknowledged}
          className={cn(
            "w-full relative py-4 rounded-xl border-2 overflow-hidden transition-all",
            acknowledged
              ? "border-destructive/30 text-destructive hover:bg-destructive/5"
              : "border-muted text-muted-foreground cursor-not-allowed",
          )}
        >
          {/* Progress fill */}
          <div 
            className="absolute inset-0 bg-destructive/10 transition-all duration-75"
            style={{ width: `${holdProgress}%` }}
          />
          
          <span className="relative z-10 font-medium">
            {acknowledged ? t.highRisk.holdToOpen : t.highRisk.acknowledgeFirst}
          </span>
        </button>

        {/* Helper text */}
        {acknowledged && (
          <p className="text-xs text-center text-muted-foreground animate-fade-in">
            {t.highRisk.holdInstruction}
          </p>
        )}
      </div>
    </div>
  );
}
