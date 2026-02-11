import { useState, useCallback } from 'react';
import { ArrowLeft, Lock, CheckCircle } from 'lucide-react';
import { useSafetyPin } from '@/contexts/SafetyPinContext';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { ForgotPinScreen } from './ForgotPinScreen';

interface ChangePinScreenProps {
    onBack: () => void;
}

type Step = 'verify-current' | 'enter-new' | 'confirm-new' | 'success';

/**
 * Change PIN Screen
 * 
 * Allows user to change their Safety PIN.
 * Uses the same SafetyPinContext as onboarding for consistency.
 */
export function ChangePinScreen({ onBack }: ChangePinScreenProps) {
    const { verifySafetyPin, createSafetyPin, hasSafetyPin } = useSafetyPin();
    const { state } = useApp();
    const [step, setStep] = useState<Step>(hasSafetyPin ? 'verify-current' : 'enter-new');
    const [currentPin, setCurrentPin] = useState('');
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isProcessing, setIsProcessing] = useState(false);
    const [showForgotPin, setShowForgotPin] = useState(false);

    const t = {
        id: {
            title: 'Ubah PIN',
            verifyCurrentTitle: 'Masukkan PIN Lama',
            verifyCurrentDesc: 'Masukkan PIN Anda saat ini untuk melanjutkan',
            enterNewTitle: 'Buat PIN Baru',
            enterNewDesc: 'Masukkan PIN 4 digit yang baru',
            confirmNewTitle: 'Konfirmasi PIN Baru',
            confirmNewDesc: 'Masukkan kembali PIN baru Anda',
            successTitle: 'PIN Berhasil Diubah',
            successDesc: 'PIN Anda telah berhasil diperbarui',
            incorrectPin: 'PIN salah, silakan coba lagi',
            pinMismatch: 'PIN tidak cocok, silakan coba lagi',
            done: 'Selesai',
            back: 'Kembali',
            forgotPin: 'Lupa PIN?',
        },
        en: {
            title: 'Change PIN',
            verifyCurrentTitle: 'Enter Current PIN',
            verifyCurrentDesc: 'Enter your current PIN to continue',
            enterNewTitle: 'Create New PIN',
            enterNewDesc: 'Enter a new 4-digit PIN',
            confirmNewTitle: 'Confirm New PIN',
            confirmNewDesc: 'Re-enter your new PIN',
            successTitle: 'PIN Changed Successfully',
            successDesc: 'Your PIN has been updated',
            incorrectPin: 'Incorrect PIN, please try again',
            pinMismatch: 'PINs do not match, please try again',
            done: 'Done',
            back: 'Back',
            forgotPin: 'Forgot PIN?',
        },
    };

    const lang = state.language === 'id' ? t.id : t.en;

    const handleKeyPress = useCallback(async (key: string) => {
        if (isProcessing) return;
        setError('');

        if (key === 'backspace') {
            if (step === 'verify-current') setCurrentPin(p => p.slice(0, -1));
            else if (step === 'enter-new') setNewPin(p => p.slice(0, -1));
            else if (step === 'confirm-new') setConfirmPin(p => p.slice(0, -1));
            return;
        }

        if (step === 'verify-current') {
            if (currentPin.length < 4) {
                const pin = currentPin + key;
                setCurrentPin(pin);
                if (pin.length === 4) {
                    setIsProcessing(true);
                    const isCorrect = await verifySafetyPin(pin);
                    if (isCorrect) {
                        setStep('enter-new');
                    } else {
                        setError(lang.incorrectPin);
                        setCurrentPin('');
                    }
                    setIsProcessing(false);
                }
            }
        } else if (step === 'enter-new') {
            if (newPin.length < 4) {
                const pin = newPin + key;
                setNewPin(pin);
                if (pin.length === 4) {
                    setStep('confirm-new');
                }
            }
        } else if (step === 'confirm-new') {
            if (confirmPin.length < 4) {
                const pin = confirmPin + key;
                setConfirmPin(pin);
                if (pin.length === 4) {
                    if (pin === newPin) {
                        setIsProcessing(true);
                        try {
                            await createSafetyPin(pin);
                            setStep('success');
                            toast.success(lang.successTitle);
                        } catch (e: any) {
                            setError(e.message || 'Failed to save PIN');
                        }
                        setIsProcessing(false);
                    } else {
                        setError(lang.pinMismatch);
                        setConfirmPin('');
                    }
                }
            }
        }
    }, [currentPin, newPin, confirmPin, step, verifySafetyPin, createSafetyPin, lang, isProcessing]);

    const getTitle = () => {
        switch (step) {
            case 'verify-current': return lang.verifyCurrentTitle;
            case 'enter-new': return lang.enterNewTitle;
            case 'confirm-new': return lang.confirmNewTitle;
            case 'success': return lang.successTitle;
        }
    };

    const getDescription = () => {
        switch (step) {
            case 'verify-current': return lang.verifyCurrentDesc;
            case 'enter-new': return lang.enterNewDesc;
            case 'confirm-new': return lang.confirmNewDesc;
            case 'success': return lang.successDesc;
        }
    };

    const getCurrentPinValue = () => {
        switch (step) {
            case 'verify-current': return currentPin;
            case 'enter-new': return newPin;
            case 'confirm-new': return confirmPin;
            default: return '';
        }
    };

    if (showForgotPin) {
        return (
            <ForgotPinScreen
                onBack={() => setShowForgotPin(false)}
                onSuccess={() => {
                    setShowForgotPin(false);
                    onBack(); // Close ChangePinScreen on success
                }}
            />
        )
    }

    if (step === 'success') {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
                        <CheckCircle className="w-12 h-12 text-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">{lang.successTitle}</h1>
                    <p className="text-muted-foreground mb-8">{lang.successDesc}</p>
                    <Button onClick={onBack} size="lg" className="w-full max-w-xs">
                        {lang.done}
                    </Button>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center justify-between p-4 safe-area-top border-b border-border">
                <button
                    onClick={onBack}
                    className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                >
                    <ArrowLeft className="w-6 h-6 text-foreground" />
                </button>
                <h1 className="font-semibold text-foreground">{lang.title}</h1>
                <div className="w-12" />
            </div>

            {/* Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
                {/* Icon */}
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Lock className="w-10 h-10 text-primary" />
                </div>

                {/* Title & Description */}
                <h2 className="text-xl font-bold text-foreground mb-2">{getTitle()}</h2>
                <p className="text-muted-foreground text-center mb-8">{getDescription()}</p>

                {/* PIN Dots */}
                <div className="flex gap-4 mb-4">
                    {[0, 1, 2, 3].map((i) => (
                        <div
                            key={i}
                            className={`w-4 h-4 rounded-full transition-all duration-200 ${i < getCurrentPinValue().length
                                ? 'bg-primary scale-110'
                                : 'bg-muted'
                                }`}
                        />
                    ))}
                </div>

                {/* Error */}
                {error && (
                    <p className="text-destructive text-sm mb-4 animate-shake">{error}</p>
                )}

                {/* Forgot PIN Link - Only shown on verify-current step */}
                {step === 'verify-current' && (
                    <button
                        onClick={() => setShowForgotPin(true)}
                        className="text-sm text-primary font-medium hover:underline mb-4"
                    >
                        {lang.forgotPin}
                    </button>
                )}

                {/* Keypad */}
                <div className="grid grid-cols-3 gap-4 w-full max-w-xs mt-4">
                    {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'backspace'].map((key, i) => (
                        <button
                            key={i}
                            onClick={() => key !== null && handleKeyPress(String(key))}
                            disabled={key === null || isProcessing}
                            className={`h-16 rounded-2xl text-2xl font-semibold transition-all duration-150 ${key === null
                                ? 'invisible'
                                : key === 'backspace'
                                    ? 'bg-muted/50 hover:bg-muted active:scale-95 text-foreground text-lg'
                                    : 'bg-muted hover:bg-muted/80 active:scale-95 text-foreground'
                                } ${isProcessing ? 'opacity-50' : ''}`}
                        >
                            {key === 'backspace' ? '⌫' : key}
                        </button>
                    ))}
                </div>
            </div>
        </div>
    );
}
