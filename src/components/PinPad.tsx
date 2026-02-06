
import { useEffect, useState, useCallback } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface PinPadProps {
  onKeyPress?: (key: string) => void;
  onPinComplete?: (pin: string) => void;
  pinLength?: number;
  title: string;
  subtitle?: string;
  error?: string;
  showCancel?: boolean;
  onCancel?: () => void;
}

export function PinPad({
  onKeyPress,
  onPinComplete,
  pinLength: externalPinLength,
  title,
  subtitle,
  error,
  showCancel,
  onCancel,
}: PinPadProps) {
  const [internalPin, setInternalPin] = useState('');
  const [shake, setShake] = useState(false);

  // Use external pinLength if provided, otherwise use internal state
  const displayPinLength = externalPinLength !== undefined ? externalPinLength : internalPin.length;

  useEffect(() => {
    if (error) {
      setShake(true);
      setInternalPin(''); // Reset internal pin on error
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

  const handleKeyPress = useCallback((key: string) => {
    // Call external onKeyPress if provided
    if (onKeyPress) {
      onKeyPress(key);
    }

    // Handle internal state for onPinComplete mode
    if (onPinComplete) {
      if (key === 'backspace') {
        setInternalPin(p => p.slice(0, -1));
      } else if (internalPin.length < 4) {
        const newPin = internalPin + key;
        setInternalPin(newPin);
        if (newPin.length === 4) {
          onPinComplete(newPin);
          // Reset for next use
          setTimeout(() => setInternalPin(''), 100);
        }
      }
    }
  }, [onKeyPress, onPinComplete, internalPin]);

  const digits = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '0', 'backspace'];

  return (
    <div className="flex flex-col items-center px-6 py-8">
      <h1 className="text-display text-foreground mb-2 text-center">{title}</h1>
      {subtitle && <p className="text-body-lg text-muted-foreground mb-6 text-center max-w-xs">{subtitle}</p>}

      <div
        className={cn("flex gap-4 mb-4 transition-transform", shake && "animate-shake")}
        role="status"
      >
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className={cn(
              "w-5 h-5 rounded-full transition-all duration-150",
              index < displayPinLength ? "bg-teal-500 scale-110" : "bg-muted border-2 border-border"
            )}
            style={{ backgroundColor: index < displayPinLength ? '#26A69A' : undefined }}
          />
        ))}
      </div>

      {error && <p className="text-destructive text-sm mb-4 animate-fade-in" role="alert">{error}</p>}
      <div className="h-6" />

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {digits.map((key) => (
          <button
            key={key}
            onClick={() => handleKeyPress(key)}
            className={cn(
              "h-16 rounded-2xl flex items-center justify-center text-2xl font-semibold text-foreground bg-muted/30 hover:bg-muted/60 transition-all duration-150 active:scale-95 focus:outline-none focus:ring-2 focus:ring-teal-500",
              key === 'backspace' && "col-start-3"
            )}
            style={{ gridColumn: key === '0' ? '2' : undefined }}
          >
            {key === 'backspace' ? <Delete className="w-7 h-7" /> : key}
          </button>
        ))}
      </div>

      {showCancel && onCancel && (
        <button
          onClick={onCancel}
          className="mt-6 text-muted-foreground hover:text-foreground transition-colors"
        >
          Cancel
        </button>
      )}
    </div>
  );
}

