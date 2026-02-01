
import { useEffect, useState } from 'react';
import { Delete } from 'lucide-react';
import { cn } from '@/lib/utils';

interface PinPadProps {
  onKeyPress: (key: string) => void;
  pinLength: number;
  title: string;
  subtitle?: string;
  error?: string;
}

export function PinPad({
  onKeyPress,
  pinLength,
  title,
  subtitle,
  error,
}: PinPadProps) {
  const [shake, setShake] = useState(false);

  useEffect(() => {
    if (error) {
      setShake(true);
      const timer = setTimeout(() => setShake(false), 500);
      return () => clearTimeout(timer);
    }
  }, [error]);

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
              index < pinLength ? "bg-teal-500 scale-110" : "bg-muted border-2 border-border"
            )}
             style={{ backgroundColor: index < pinLength ? '#26A69A' : undefined }}
          />
        ))}
      </div>

      {error && <p className="text-destructive text-sm mb-4 animate-fade-in" role="alert">{error}</p>}
      <div className="h-6" />

      <div className="grid grid-cols-3 gap-4 w-full max-w-xs">
        {digits.map((key) => (
            <button
              key={key}
              onClick={() => onKeyPress(key)}
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
    </div>
  );
}
