import { useState, useEffect } from 'react';
import { Shield, Lock, Check, AlertCircle, Delete } from 'lucide-react';
import { cn } from '@/lib/utils';
import { useApp } from '@/contexts/AppContext';

interface PinSetupScreenProps {
    onComplete: (pin: string) => void;
}

type PinStep = 'create' | 'confirm';

export function PinSetupScreen({ onComplete }: PinSetupScreenProps) {
    const { t } = useApp();
    const [step, setStep] = useState<PinStep>('create');
    const [pin, setPin] = useState<string>('');
    const [firstPin, setFirstPin] = useState<string>('');
    const [error, setError] = useState<string | null>(null);
    const [isSuccess, setIsSuccess] = useState(false);

    // Haptic feedback helper
    const vibrate = () => {
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    };

    const handleNumberClick = (num: number) => {
        if (pin.length < 4) {
            vibrate();
            const newPin = pin + num;
            setPin(newPin);
            setError(null);

            if (newPin.length === 4) {
                handlePinComplete(newPin);
            }
        }
    };

    const handleDelete = () => {
        if (pin.length > 0) {
            vibrate();
            setPin(pin.slice(0, -1));
            setError(null);
        }
    };

    const handlePinComplete = (fullPin: string) => {
        if (step === 'create') {
            setTimeout(() => {
                setFirstPin(fullPin);
                setPin('');
                setStep('confirm');
            }, 300);
        } else {
            if (fullPin === firstPin) {
                setIsSuccess(true);
                setTimeout(() => {
                    onComplete(fullPin);
                }, 1000);
            } else {
                vibrate();
                // Long vibration for error
                if (navigator.vibrate) navigator.vibrate([50, 50, 50]);

                setError(t.safetyPin.mismatchError);
                setTimeout(() => {
                    setPin('');
                }, 400);
            }
        }
    };

    if (isSuccess) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col items-center justify-center animate-in zoom-in-95 duration-300">
                <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6 animate-[bounce_1s_infinite]">
                    <Check className="w-12 h-12 text-success" />
                </div>
                <h2 className="text-xl font-bold text-foreground mb-2">
                    {t.safetyPin.created}
                </h2>
                <p className="text-muted-foreground">PIN Setup Complete</p>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-right duration-500">
            {/* Header Area */}
            <div className="flex-1 flex flex-col items-center justify-center min-h-[40vh] relative">
                <div className="absolute inset-0 bg-gradient-to-b from-primary/5 to-transparent -z-10" />

                <div className={cn(
                    "w-20 h-20 rounded-3xl flex items-center justify-center mb-6 shadow-lg transition-all duration-500",
                    step === 'create' ? "bg-primary text-primary-foreground" : "bg-success text-success-foreground"
                )}>
                    {step === 'create' ? (
                        <Lock className="w-10 h-10" />
                    ) : (
                        <Shield className="w-10 h-10" />
                    )}
                </div>

                <h1 className="text-2xl font-bold text-foreground text-center mb-2 px-6">
                    {step === 'create' ? t.safetyPin.createTitle : t.safetyPin.confirmTitle}
                </h1>
                <p className="text-muted-foreground text-center mb-8 max-w-xs text-sm">
                    {step === 'create' ? t.safetyPin.createSubtitle : t.safetyPin.confirmSubtitle}
                </p>

                {/* Dots Display */}
                <div className="flex gap-6 mb-8">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={cn(
                                "w-4 h-4 rounded-full transition-all duration-300 transform",
                                i < pin.length
                                    ? "bg-primary scale-110 shadow-lg shadow-primary/50"
                                    : "bg-muted border border-foreground/10",
                                error && "bg-destructive animate-shake"
                            )}
                        />
                    ))}
                </div>

                {/* Error Message */}
                <div className="h-6">
                    {error && (
                        <div className="flex items-center gap-2 text-destructive animate-in fade-in slide-in-from-top-1">
                            <AlertCircle className="w-4 h-4" />
                            <span className="text-sm font-medium">{error}</span>
                        </div>
                    )}
                </div>
            </div>

            {/* Custom Keypad */}
            <div className="bg-muted/30 pb- safe-area-bottom rounded-t-[2.5rem] shadow-inner">
                <div className="grid grid-cols-3 gap-x-8 gap-y-6 p-8 max-w-sm mx-auto">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                        <button
                            key={num}
                            onClick={() => handleNumberClick(num)}
                            className="w-16 h-16 rounded-full text-2xl font-semibold bg-background shadow-sm border border-border/50 active:bg-primary/10 active:scale-95 transition-all flex items-center justify-center select-none touch-manipulation"
                        >
                            {num}
                        </button>
                    ))}

                    {/* Empty placeholder to align 0 */}
                    <div />

                    <button
                        onClick={() => handleNumberClick(0)}
                        className="w-16 h-16 rounded-full text-2xl font-semibold bg-background shadow-sm border border-border/50 active:bg-primary/10 active:scale-95 transition-all flex items-center justify-center select-none touch-manipulation"
                    >
                        0
                    </button>

                    <button
                        onClick={handleDelete}
                        className="w-16 h-16 rounded-full flex items-center justify-center text-muted-foreground active:text-foreground active:scale-95 transition-all"
                    >
                        <Delete className="w-7 h-7" />
                    </button>
                </div>
            </div>
        </div>
    );
}
