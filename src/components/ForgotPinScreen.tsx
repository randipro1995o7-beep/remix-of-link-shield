import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Phone, Mail, CheckCircle, AlertCircle, Lock, Send, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { RecoveryService, SafetyPinService } from '@/lib/storage';
import { RecoveryOptionsScreen } from './RecoveryOptionsScreen';
import { AuthService } from '@/lib/services/AuthService';
import { toast } from 'sonner';

interface ForgotPinScreenProps {
    onBack: () => void;
    onSuccess: () => void;
}

type Step = 'choose-method' | 'send-link' | 'link-sent' | 'new-pin' | 'confirm-pin' | 'success';

/**
 * Forgot PIN Screen
 * 
 * Allows user to reset their PIN via Email Magic Link.
 */
export function ForgotPinScreen({ onBack, onSuccess }: ForgotPinScreenProps) {
    const { state } = useApp();
    const [step, setStep] = useState<Step>('choose-method');
    const [method, setMethod] = useState<'email' | null>('email'); // Only email supported for now with Firebase
    const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
    const [fullEmail, setFullEmail] = useState<string | null>(null);

    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const [showRecoverySetup, setShowRecoverySetup] = useState(false);

    const isIndonesian = state.language === 'id';

    const t = {
        title: isIndonesian ? 'Lupa PIN' : 'Forgot PIN',
        chooseMethod: isIndonesian ? 'Metode Pemulihan' : 'Recovery Method',
        chooseMethodDesc: isIndonesian
            ? 'Kami akan mengirimkan link reset ke email Anda'
            : 'We will send a reset link to your email',
        viaEmail: isIndonesian ? 'Via Email' : 'Via Email',
        sendLink: isIndonesian ? 'Kirim Link Reset' : 'Send Reset Link',
        sendingTo: isIndonesian ? 'Link akan dikirim ke:' : 'Link will be sent to:',
        linkSentTitle: isIndonesian ? 'Link Terkirim!' : 'Link Sent!',
        linkSentDesc: isIndonesian
            ? 'Cek email Anda dan klik link untuk mereset PIN. Jangan tutup aplikasi ini.'
            : 'Check your email and click the link to reset PIN. Do not close this app.',
        waitingForVerify: isIndonesian ? 'Menunggu verifikasi...' : 'Waiting for verification...',
        resendIn: isIndonesian ? 'Kirim ulang dalam' : 'Resend in',
        resend: isIndonesian ? 'Kirim Ulang Link' : 'Resend Link',
        newPinTitle: isIndonesian ? 'Buat PIN Baru' : 'Create New PIN',
        newPinDesc: isIndonesian ? 'Masukkan PIN 4 digit yang baru' : 'Enter a new 4-digit PIN',
        confirmPinTitle: isIndonesian ? 'Konfirmasi PIN Baru' : 'Confirm New PIN',
        confirmPinDesc: isIndonesian ? 'Masukkan kembali PIN baru' : 'Re-enter your new PIN',
        successTitle: isIndonesian ? 'PIN Berhasil Direset!' : 'PIN Reset Successful!',
        successDesc: isIndonesian ? 'Anda sekarang bisa menggunakan PIN baru' : 'You can now use your new PIN',
        done: isIndonesian ? 'Selesai' : 'Done',
        pinMismatch: isIndonesian ? 'PIN tidak cocok' : 'PINs do not match',
        noRecovery: isIndonesian
            ? 'Belum ada email pemulihan yang diatur. Silakan atur sekarang.'
            : 'No recovery email set. Please set it up now.',
        setupRecovery: isIndonesian ? 'Atur Email Pemulihan' : 'Setup Recovery Email',
    };

    useEffect(() => {
        const loadRecoveryOptions = async () => {
            const email = await RecoveryService.getMaskedEmail();
            const rawEmail = await RecoveryService.getRecoveryEmail();
            setMaskedEmail(email);
            setFullEmail(rawEmail);
            setIsLoading(false);
        };
        loadRecoveryOptions();
    }, []);

    // Countdown timer for resend
    useEffect(() => {
        if (countdown > 0) {
            const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
            return () => clearTimeout(timer);
        }
    }, [countdown]);

    // Listen for Auth State Changes (Verification Success)
    useEffect(() => {
        const unsubscribe = AuthService.onAuthStateChanged((user) => {
            if (user && step === 'link-sent') {
                toast.success(isIndonesian ? 'Verifikasi Berhasil!' : 'Verification Successful!');
                setStep('new-pin');
            }
        });
        return () => unsubscribe();
    }, [step, isIndonesian]);

    const handleSendLink = async () => {
        setIsLoading(true);
        try {
            if (fullEmail) {
                const result = await AuthService.sendVerificationLink(fullEmail);
                if (result.success) {
                    setCountdown(60);
                    setStep('link-sent');
                    toast.success(isIndonesian ? 'Link verifikasi terkirim' : 'Verification link sent');
                } else {
                    toast.error(isIndonesian ? 'Gagal mengirim link: ' + result.error : 'Failed to send link: ' + result.error);
                }
            } else {
                toast.error('Email not found');
            }
        } catch (e) {
            console.error(e);
            toast.error('Error sending link');
        }
        setIsLoading(false);
    };

    const handleKeyPress = useCallback((key: string) => {
        setError('');

        if (step === 'new-pin') {
            if (key === 'backspace') {
                setNewPin(p => p.slice(0, -1));
            } else if (newPin.length < 4) {
                const pin = newPin + key;
                setNewPin(pin);
                if (pin.length === 4) {
                    setStep('confirm-pin');
                }
            }
        } else if (step === 'confirm-pin') {
            if (key === 'backspace') {
                setConfirmPin(p => p.slice(0, -1));
            } else if (confirmPin.length < 4) {
                const pin = confirmPin + key;
                setConfirmPin(pin);
                if (pin.length === 4) {
                    if (pin === newPin) {
                        // Save new PIN
                        SafetyPinService.save(pin).then(() => {
                            setStep('success');
                            toast.success(t.successTitle);
                        }).catch(() => {
                            setError('Failed to save PIN');
                        });
                    } else {
                        setError(t.pinMismatch);
                        setConfirmPin('');
                    }
                }
            }
        }
    }, [newPin, confirmPin, step, t.pinMismatch, t.successTitle]);

    if (isLoading) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 animate-pulse" />
            </div>
        );
    }

    // Redirect to Recovery Setup
    if (showRecoverySetup) {
        return (
            <RecoveryOptionsScreen
                onBack={() => setShowRecoverySetup(false)}
                onComplete={async () => {
                    setIsLoading(true);
                    setShowRecoverySetup(false);
                    await new Promise(resolve => setTimeout(resolve, 500));
                    const email = await RecoveryService.getMaskedEmail();
                    const rawEmail = await RecoveryService.getRecoveryEmail();
                    setMaskedEmail(email);
                    setFullEmail(rawEmail);
                    setIsLoading(false);
                }}
            />
        );
    }

    // No email set
    if (!maskedEmail && step === 'choose-method') {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
                <div className="flex items-center p-4 safe-area-top border-b border-border">
                    <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="flex-1 text-center font-semibold">{t.title}</h1>
                    <div className="w-12" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <AlertCircle className="w-10 h-10 text-primary" />
                    </div>
                    <p className="text-muted-foreground mb-6">{t.noRecovery}</p>
                    <Button onClick={() => setShowRecoverySetup(true)} className="w-full max-w-xs mb-3">
                        {t.setupRecovery}
                    </Button>
                    <Button onClick={onBack} variant="ghost" className="w-full max-w-xs">
                        {isIndonesian ? 'Kembali' : 'Go Back'}
                    </Button>
                </div>
            </div>
        );
    }

    // Success screen
    if (step === 'success') {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
                <div className="flex-1 flex flex-col items-center justify-center px-6 text-center">
                    <div className="w-24 h-24 rounded-full bg-success/10 flex items-center justify-center mb-6">
                        <CheckCircle className="w-12 h-12 text-success" />
                    </div>
                    <h1 className="text-2xl font-bold text-foreground mb-2">{t.successTitle}</h1>
                    <p className="text-muted-foreground mb-8">{t.successDesc}</p>
                    <Button onClick={onSuccess} size="lg" className="w-full max-w-xs">
                        {t.done}
                    </Button>
                </div>
            </div>
        );
    }

    // PIN entry screens
    if (step === 'new-pin' || step === 'confirm-pin') {
        const currentPin = step === 'new-pin' ? newPin : confirmPin;
        const title = step === 'new-pin' ? t.newPinTitle : t.confirmPinTitle;
        const desc = step === 'new-pin' ? t.newPinDesc : t.confirmPinDesc;

        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
                <div className="flex items-center p-4 safe-area-top border-b border-border">
                    <button
                        onClick={() => step === 'confirm-pin' ? setStep('new-pin') : onBack}
                        className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="flex-1 text-center font-semibold">{t.title}</h1>
                    <div className="w-12" />
                </div>

                <div className="flex-1 flex flex-col items-center justify-center px-6 pb-8">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <Lock className="w-10 h-10 text-primary" />
                    </div>

                    <h2 className="text-xl font-bold text-foreground mb-2">{title}</h2>
                    <p className="text-muted-foreground text-center mb-8">{desc}</p>

                    {/* PIN Dots */}
                    <div className="flex gap-4 mb-4">
                        {[0, 1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className={`w-4 h-4 rounded-full transition-all duration-200 ${i < currentPin.length ? 'bg-primary scale-110' : 'bg-muted'
                                    }`}
                            />
                        ))}
                    </div>

                    {error && <p className="text-destructive text-sm mb-4 animate-shake">{error}</p>}

                    {/* Keypad */}
                    <div className="grid grid-cols-3 gap-4 w-full max-w-xs mt-4">
                        {[1, 2, 3, 4, 5, 6, 7, 8, 9, null, 0, 'backspace'].map((key, i) => (
                            <button
                                key={i}
                                onClick={() => key !== null && handleKeyPress(String(key))}
                                disabled={key === null}
                                className={`h-16 rounded-2xl text-2xl font-semibold transition-all duration-150 ${key === null
                                    ? 'invisible'
                                    : key === 'backspace'
                                        ? 'bg-muted/50 hover:bg-muted active:scale-95 text-foreground text-lg'
                                        : 'bg-muted hover:bg-muted/80 active:scale-95 text-foreground'
                                    }`}
                            >
                                {key === 'backspace' ? '⌫' : key}
                            </button>
                        ))}
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex items-center p-4 safe-area-top border-b border-border">
                <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted">
                    <ArrowLeft className="w-6 h-6" />
                </button>
                <h1 className="flex-1 text-center font-semibold">{t.title}</h1>
                <div className="w-12" />
            </div>

            <div className="flex-1 overflow-y-auto p-4">
                {/* Choose Method / Initial State */}
                {step === 'choose-method' && (
                    <div className="space-y-6">
                        <div className="text-center py-4">
                            <h2 className="text-xl font-bold text-foreground mb-2">{t.chooseMethod}</h2>
                            <p className="text-muted-foreground">{t.chooseMethodDesc}</p>
                        </div>

                        <div className="space-y-3">
                            <Card className="p-4 cursor-pointer ring-2 ring-primary">
                                <div className="flex items-center gap-4">
                                    <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                        <Mail className="w-6 h-6 text-primary" />
                                    </div>
                                    <div className="flex-1">
                                        <p className="font-medium">{t.viaEmail}</p>
                                        <p className="text-sm text-muted-foreground">{maskedEmail}</p>
                                    </div>
                                    <CheckCircle className="w-5 h-5 text-primary" />
                                </div>
                            </Card>
                        </div>

                        <Button
                            onClick={handleSendLink}
                            size="lg"
                            className="w-full"
                        >
                            {t.sendLink}
                        </Button>
                    </div>
                )}

                {/* Link Sent State */}
                {step === 'link-sent' && (
                    <div className="space-y-6 text-center py-8">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto animate-pulse">
                            <Mail className="w-10 h-10 text-primary" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-2">{t.linkSentTitle}</h2>
                            <p className="text-muted-foreground max-w-xs mx-auto">{t.linkSentDesc}</p>
                        </div>

                        <div className="p-4 bg-muted/50 rounded-xl">
                            <div className="flex items-center justify-center gap-2 text-primary font-medium">
                                <RefreshCw className="w-4 h-4 animate-spin" />
                                <span>{t.waitingForVerify}</span>
                            </div>
                        </div>

                        {/* Resend */}
                        <div>
                            {countdown > 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t.resendIn} {countdown}s
                                </p>
                            ) : (
                                <Button
                                    onClick={handleSendLink}
                                    variant="outline"
                                    className="w-full"
                                >
                                    {t.resend}
                                </Button>
                            )}
                        </div>
                    </div>
                )}
            </div>
        </div>
    );
}
