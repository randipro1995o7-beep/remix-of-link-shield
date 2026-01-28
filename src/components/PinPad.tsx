import { useState, useCallback, useEffect } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinPadProps {
  onComplete: (pin: string) => void;
  onCancel?: () => void;
  title: string;
  subtitle?: string;
  error?: string;
  showCancel?: boolean;
}

export function PinPad({
  onComplete,
  onCancel,
  title,
  subtitle,
  error,
  showCancel = true,
}: PinPadProps) {
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
    <div className="flex flex-col items-center px-6 py-8">
      {/* Title */}
      <h1 className="text-display text-foreground mb-2 text-center">
        {title}
      </h1>
      
      {subtitle && (
        <p className="text-body-lg text-muted-foreground mb-8 text-center max-w-xs">
          {subtitle}
        </p>
      )}

      {/* PIN dots */}
      <div
        className={cn(
          "flex gap-4 mb-4 transition-transform",
          shake && "animate-shake"
        )}
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
          />
        ))}
      </div>

      {/* Error message */}
      {error && (
        <p className="text-destructive text-sm mb-4 animate-fade-in">
          {error}
        </p>
      )}

      {/* Spacer */}
      <div className="h-8" />

      {/* Number pad */}
      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {digits.map((digit, index) => {
          if (digit === '') {
            return <div key={index} />;
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
                  "disabled:opacity-30 disabled:cursor-not-allowed"
                )}
                aria-label="Delete"
              >
                <Delete className="w-7 h-7" />
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
                "disabled:opacity-50 disabled:cursor-not-allowed"
              )}
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
          className="mt-8 text-muted-foreground hover:text-foreground transition-colors py-2 px-4"
        >
          Cancel
        </button>
      )}
    </div>
  );
}
