import { useState, useRef, useEffect, KeyboardEvent } from 'react';
import { Shield, Lock, Check, AlertCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

interface PinSetupScreenProps {
    onComplete: (pin: string) => void;
}

type PinStep = 'create' | 'confirm';

/**
 * PinSetupScreen - Second onboarding screen
 * 
 * User creates a 4-digit Safety PIN.
 * Two-step process: create then confirm.
 */
export function PinSetupScreen({ onComplete }: PinSetupScreenProps) {
    const { t } = useApp();
    const [step, setStep] = useState<PinStep>('create');
    const [pin, setPin] = useState<string[]>(['', '', '', '']);
    const [firstPin, setFirstPin] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);
    const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

    // Focus first input on mount and step change
    useEffect(() => {
        setTimeout(() => {
            inputRefs.current[0]?.focus();
        }, 100);
    }, [step]);

    const handleInputChange = (index: number, value: string) => {
        // Only allow digits
        if (value && !/^\d$/.test(value)) return;

        const newPin = [...pin];
        newPin[index] = value;
        setPin(newPin);
        setError(null);

        // Auto-focus next input
        if (value && index < 3) {
            inputRefs.current[index + 1]?.focus();
        }

        // Check if PIN is complete
        if (value && index === 3) {
            const fullPin = newPin.join('');
            handlePinComplete(fullPin);
        }
    };

    const handleKeyDown = (index: number, e: KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Backspace' && !pin[index] && index > 0) {
            inputRefs.current[index - 1]?.focus();
        }
    };

    const handlePinComplete = (fullPin: string) => {
        if (step === 'create') {
            // Save first PIN and move to confirm
            setFirstPin(fullPin);
            setPin(['', '', '', '']);
            setStep('confirm');
        } else {
            // Confirm step - check if PINs match
            if (fullPin === firstPin) {
                setIsSuccess(true);
                setTimeout(() => {
                    onComplete(fullPin);
                }, 1000);
            } else {
                setError(t.safetyPin.mismatchError);
                setPin(['', '', '', '']);
                setTimeout(() => {
                    inputRefs.current[0]?.focus();
                }, 100);
            }
        }
    };

    const renderPinInputs = () => (
        <div className="flex gap-4 justify-center">
            {[0, 1, 2, 3].map((index) => (
                <div key={index} className="relative">
                    <input
                        ref={(el) => (inputRefs.current[index] = el)}
                        type="text"
                        inputMode="numeric"
                        maxLength={1}
                        value={pin[index]}
                        onChange={(e) => handleInputChange(index, e.target.value)}
                        onKeyDown={(e) => handleKeyDown(index, e)}
                        className={cn(
                            "w-14 h-16 text-center text-2xl font-bold rounded-xl border-2",
                            "bg-background transition-all duration-200",
                            "focus:outline-none focus:ring-2 focus:ring-primary/50",
                            pin[index]
                                ? "border-primary bg-primary/5"
                                : "border-muted-foreground/30",
                            error && "border-destructive animate-shake"
                        )}
                        aria-label={`PIN digit ${index + 1}`}
                    />
                    {/* Dot indicator when filled */}
                    {pin[index] && (
                        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                            <div className="w-3 h-3 rounded-full bg-foreground" />
                        </div>
                    )}
                </div>
            ))}
        </div>
    );

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center animate-fade-in">
                <div className="w-20 h-20 rounded-full bg-success/20 flex items-center justify-center mb-6 animate-scale-in">
                    <Check className="w-10 h-10 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                    {t.safetyPin.created}
                </h2>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
            {/* Header */}
            <div className="safe-area-top" />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                {/* Icon */}
                <div className={cn(
                    "w-20 h-20 rounded-full flex items-center justify-center mb-6",
                    step === 'create' ? "bg-primary/10" : "bg-success/10"
                )}>
                    {step === 'create' ? (
                        <Lock className="w-10 h-10 text-primary" />
                    ) : (
                        <Shield className="w-10 h-10 text-success" />
                    )}
                </div>

                {/* Title */}
                <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                    {step === 'create' ? t.safetyPin.createTitle : t.safetyPin.confirmTitle}
                </h1>
                <p className="text-muted-foreground text-center mb-8 max-w-xs">
                    {step === 'create' ? t.safetyPin.createSubtitle : t.safetyPin.confirmSubtitle}
                </p>

                {/* PIN Inputs */}
                {renderPinInputs()}

                {/* Error Message */}
                {error && (
                    <div className="flex items-center gap-2 mt-4 text-destructive animate-fade-in">
                        <AlertCircle className="w-4 h-4" />
                        <span className="text-sm">{error}</span>
                    </div>
                )}

                {/* Step indicator */}
                <div className="flex gap-2 mt-8">
                    <div className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        step === 'create' ? "bg-primary" : "bg-muted-foreground/30"
                    )} />
                    <div className={cn(
                        "w-2 h-2 rounded-full transition-colors",
                        step === 'confirm' ? "bg-primary" : "bg-muted-foreground/30"
                    )} />
                </div>
            </div>

            {/* Bottom Info */}
            <div className="p-6 safe-area-bottom">
                <p className="text-sm text-muted-foreground text-center">
                    {t.safetyPin.purpose}
                </p>
            </div>
        </div>
    );
}
