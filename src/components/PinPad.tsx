import { useState, useCallback, useEffect } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

interface PinPadProps {
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  title: string;
  subtitle?: string;
  error?: string;
  showCancel?: boolean;
  /** Optional helper text explaining the purpose of the PIN */
  purposeText?: string;
}

/**
 * PIN Pad Component
 * 
 * Accessible 4-digit PIN entry with:
 * - Large touch targets (48x48 minimum)
 * - Screen reader support
 * - Visual and text feedback
 * - Shake animation on error
 */
export function PinPad({
  onComplete,
  onCancel,
  title,
  subtitle,
  error,
  showCancel = true,
  purposeText,
}: PinPadProps) {
  const { t } = useApp();
  const [pin, setPin] = useState('');
  const [shake, setShake] = useState(false);

  // Trigger shake animation on error
  useEffect(() => {
    if (error) {
      setShake(true);
      setPin('');
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleDigit = useCallback((digit: string) => {
    if (pin.length < 4) {
      const newPin = pin + digit;
      setPin(newPin);
      
      if (newPin.length === 4) {
        // Small delay before submitting for visual feedback
        setTimeout(() => {
          onComplete(newPin);
        }, 150);
      }
    }
  }, [pin, onComplete]);

  const handleDelete = useCallback(() => {
    setPin((prev) => prev.slice(0, -1));
  }, []);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', 'del'];

  return (
    <div 
      className="flex flex-col items-center px-6 py-8"
      role="form"
      aria-labelledby="pin-title"
      aria-describedby={subtitle ? "pin-subtitle" : undefined}
    >
      {/* Title */}
      <h1 id="pin-title" className="text-display text-foreground mb-2 text-center">
        {title}
      </h1>
      
      {subtitle && (
        <p id="pin-subtitle" className="text-body-lg text-muted-foreground mb-6 text-center max-w-xs">
          {subtitle}
        </p>
      )}

      {/* Purpose explanation - helps users understand this is behavioral, not security */}
      {purposeText && (
        <p className="text-sm text-muted-foreground mb-6 text-center max-w-xs bg-muted/30 p-3 rounded-xl">
          {purposeText}
        </p>
      )}

      {/* PIN dots - visual indicator */}
      <div
        className={cn(
          "flex gap-4 mb-4 transition-transform",
          shake && "animate-shake"
        )}
        role="status"
        aria-live="polite"
        aria-label={`${pin.length} of 4 digits entered`}
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "w-5 h-5 rounded-full transition-all duration-150",
              index < pin.length
                ? "bg-primary scale-110"
                : "bg-muted border-2 border-border"
            )}
            aria-hidden="true"
          />
        ))}
      </div>

      {/* Text indicator for screen readers and accessibility */}
      <p className="sr-only" aria-live="polite">
        {pin.length} of 4 digits entered
      </p>

      {/* Error message */}
      {error && (
        <p className="text-destructive text-sm mb-4 animate-fade-in" role="alert">
          {error}
        </p>
      )}

      {/* Spacer */}
      <div className="h-6" aria-hidden="true" />

      {/* Number pad - Large touch targets (h-16 = 64px > 48px minimum) */}
      <div 
        className="grid grid-cols-3 gap-4 w-full max-w-xs"
        role="group"
        aria-label="Number pad"
      >
        {digits.map((digit, index) => {
          if (digit === '') {
            return <div key={index} aria-hidden="true" />;
          }

          if (digit === 'del') {
            return (
              <button
                key={index}
                onClick={handleDelete}
                disabled={pin.length === 0}
                className={cn(
                  "h-16 rounded-2xl flex items-center justify-center",
                  "transition-all duration-150 active:scale-95",
                  "text-muted-foreground hover:bg-muted/50",
                  "disabled:opacity-30 disabled:cursor-not-allowed",
                  "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
                )}
                aria-label="Delete last digit"
              >
                <Delete className="w-7 h-7" aria-hidden="true" />
              </button>
            );
          }

          return (
            <button
              key={index}
              onClick={() => handleDigit(digit)}
              disabled={pin.length >= 4}
              className={cn(
                "h-16 rounded-2xl flex items-center justify-center",
                "text-2xl font-semibold text-foreground",
                "bg-muted/30 hover:bg-muted/60",
                "transition-all duration-150 active:scale-95",
                "disabled:opacity-50 disabled:cursor-not-allowed",
                "focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2"
              )}
              aria-label={`Digit ${digit}`}
            >
              {digit}
            </button>
          );
        })}
      </div>

      {/* Cancel button */}
      {showCancel && onCancel && (
        <button
          onClick={onCancel}
          className="mt-8 text-muted-foreground hover:text-foreground transition-colors py-2 px-4 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-lg"
        >
          {t.common.cancel}
        </button>
      )}
    </div>
  );
}
