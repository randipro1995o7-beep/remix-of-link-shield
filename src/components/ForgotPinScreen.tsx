import { useState, useEffect, useCallback } from 'react';
import { ArrowLeft, Phone, Mail, CheckCircle, AlertCircle, Lock, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { RecoveryService, SafetyPinService } from '@/lib/storage';
import { RecoveryOptionsScreen } from './RecoveryOptionsScreen';
import { EmailService } from '@/lib/email/EmailService';
import { toast } from 'sonner';

interface ForgotPinScreenProps {
    onBack: () => void;
    onSuccess: () => void;
}

type Step = 'choose-method' | 'send-otp' | 'verify-otp' | 'new-pin' | 'confirm-pin' | 'success';

/**
 * Forgot PIN Screen
 * 
 * Allows user to reset their PIN via SMS or Email OTP.
 */
export function ForgotPinScreen({ onBack, onSuccess }: ForgotPinScreenProps) {
    const { state } = useApp();
    const [step, setStep] = useState<Step>('choose-method');
    const [method, setMethod] = useState<'phone' | 'email' | null>(null);
    const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
    const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(true);
    const [countdown, setCountdown] = useState(0);
    const [showRecoverySetup, setShowRecoverySetup] = useState(false);

    const isIndonesian = state.language === 'id';

    const t = {
        title: isIndonesian ? 'Lupa PIN' : 'Forgot PIN',
        chooseMethod: isIndonesian ? 'Pilih Metode Pemulihan' : 'Choose Recovery Method',
        chooseMethodDesc: isIndonesian
            ? 'Pilih cara untuk menerima kode verifikasi'
            : 'Choose how to receive verification code',
        viaSms: isIndonesian ? 'Via SMS' : 'Via SMS',
        viaEmail: isIndonesian ? 'Via Email' : 'Via Email',
        sendCode: isIndonesian ? 'Kirim Kode' : 'Send Code',
        sendingTo: isIndonesian ? 'Kode akan dikirim ke:' : 'Code will be sent to:',
        enterOtp: isIndonesian ? 'Masukkan Kode OTP' : 'Enter OTP Code',
        enterOtpDesc: isIndonesian
            ? 'Masukkan 6 digit kode yang dikirim'
            : 'Enter the 6-digit code sent',
        verify: isIndonesian ? 'Verifikasi' : 'Verify',
        resendIn: isIndonesian ? 'Kirim ulang dalam' : 'Resend in',
        resend: isIndonesian ? 'Kirim Ulang Kode' : 'Resend Code',
        newPinTitle: isIndonesian ? 'Buat PIN Baru' : 'Create New PIN',
        newPinDesc: isIndonesian ? 'Masukkan PIN 4 digit yang baru' : 'Enter a new 4-digit PIN',
        confirmPinTitle: isIndonesian ? 'Konfirmasi PIN Baru' : 'Confirm New PIN',
        confirmPinDesc: isIndonesian ? 'Masukkan kembali PIN baru' : 'Re-enter your new PIN',
        successTitle: isIndonesian ? 'PIN Berhasil Direset!' : 'PIN Reset Successful!',
        successDesc: isIndonesian ? 'Anda sekarang bisa menggunakan PIN baru' : 'You can now use your new PIN',
        done: isIndonesian ? 'Selesai' : 'Done',
        invalidOtp: isIndonesian ? 'Kode OTP salah atau kadaluarsa' : 'Invalid or expired OTP code',
        pinMismatch: isIndonesian ? 'PIN tidak cocok' : 'PINs do not match',
        noRecovery: isIndonesian
            ? 'Belum ada opsi pemulihan yang diatur. Silakan atur sekarang agar Anda bisa mereset PIN.'
            : 'No recovery options set. Please set them up now to reset your PIN.',
        otpSent: isIndonesian ? 'Kode OTP telah dikirim!' : 'OTP code has been sent!',
        // For local/offline mode
        localOtpNotice: isIndonesian
            ? 'Kode OTP Anda akan ditampilkan. Catat dan simpan kode ini.'
            : 'Your OTP code will be displayed. Note and save this code.',
        setupRecovery: isIndonesian ? 'Atur Opsi Pemulihan' : 'Setup Recovery Options',
    };

    useEffect(() => {
        const loadRecoveryOptions = async () => {
            const phone = await RecoveryService.getMaskedPhone();
            const email = await RecoveryService.getMaskedEmail();
            setMaskedPhone(phone);
            setMaskedEmail(email);
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

    const handleSendOtp = async () => {
        setIsLoading(true);
        try {
            const code = await RecoveryService.generateOTP();

            let sent = false;
            let errorMessage = '';

            if (method === 'email' && maskedEmail) {
                // Send via EmailJS (if configured)
                const fullEmail = await RecoveryService.getRecoveryEmail();

                if (fullEmail) {
                    // Force cast to any because TS might complain about mismatch if not fully propagated yet
                    const result = await EmailService.sendOtp(fullEmail, code) as any;

                    // Handle both boolean (old) and object (new) return types for safety
                    if (typeof result === 'boolean') {
                        sent = result;
                    } else {
                        sent = result.success;
                        if (!sent && result.error) {
                            errorMessage = result.error;
                        }
                    }
                } else {
                    // Fallback if email retrieval fails
                    errorMessage = 'Gagal mengambil email tujuan';
                }
            } else {
                // SMS/Phone (Simulation only for now as SMS API is paid)
                toast.info(`[SIMULASI] SMS ke ${maskedPhone}: Kode ${code}`);
                sent = true;
            }

            if (sent) {
                setGeneratedOtp(code);
                setCountdown(60);
                setStep('verify-otp');
                toast.success(t.otpSent);
            } else {
                // Show specific error if available
                if (errorMessage) {
                    toast.error(`Gagal mengirim: ${errorMessage}`);
                } else {
                    toast.error('Gagal mengirim kode OTP. Periksa key konfigurasi atau koneksi internet.');
                }
            }
        } catch (e) {
            console.error(e);
            toast.error('Terjadi kesalahan saat membuat OTP');
        }
        setIsLoading(false);
    };

    const handleVerifyOtp = async () => {
        setError('');
        const isValid = await RecoveryService.verifyOTP(otp);

        if (isValid) {
            await RecoveryService.clearOTP();
            setStep('new-pin');
        } else {
            setError(t.invalidOtp);
            setOtp('');
        }
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
                    // Show loading immediately to transition UI
                    setIsLoading(true);
                    setShowRecoverySetup(false);

                    // Small delay to ensure storage persistence and smooth transition
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Reload options
                    try {
                        const phone = await RecoveryService.getMaskedPhone();
                        const email = await RecoveryService.getMaskedEmail();
                        console.log('Reloaded options:', { phone, email });
                        setMaskedPhone(phone);
                        setMaskedEmail(email);
                    } catch (e) {
                        console.error('Failed to reload options:', e);
                    }

                    setIsLoading(false);
                }}
            />
        );
    }

    // No recovery options available
    if (!maskedPhone && !maskedEmail && step === 'choose-method') {
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
                    <div className="w-20 h-20 rounded-full bg-destructive/10 flex items-center justify-center mb-6">
                        <AlertCircle className="w-10 h-10 text-destructive" />
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
                {/* Choose Method */}
                {step === 'choose-method' && (
                    <div className="space-y-6">
                        <div className="text-center py-4">
                            <h2 className="text-xl font-bold text-foreground mb-2">{t.chooseMethod}</h2>
                            <p className="text-muted-foreground">{t.chooseMethodDesc}</p>
                        </div>

                        <div className="space-y-3">
                            {maskedPhone && (
                                <Card
                                    className={`p-4 cursor-pointer transition-all ${method === 'phone' ? 'ring-2 ring-primary' : ''
                                        }`}
                                    onClick={() => setMethod('phone')}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Phone className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{t.viaSms}</p>
                                            <p className="text-sm text-muted-foreground">{maskedPhone}</p>
                                        </div>
                                        {method === 'phone' && <CheckCircle className="w-5 h-5 text-primary" />}
                                    </div>
                                </Card>
                            )}

                            {maskedEmail && (
                                <Card
                                    className={`p-4 cursor-pointer transition-all ${method === 'email' ? 'ring-2 ring-primary' : ''
                                        }`}
                                    onClick={() => setMethod('email')}
                                >
                                    <div className="flex items-center gap-4">
                                        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
                                            <Mail className="w-6 h-6 text-primary" />
                                        </div>
                                        <div className="flex-1">
                                            <p className="font-medium">{t.viaEmail}</p>
                                            <p className="text-sm text-muted-foreground">{maskedEmail}</p>
                                        </div>
                                        {method === 'email' && <CheckCircle className="w-5 h-5 text-primary" />}
                                    </div>
                                </Card>
                            )}
                        </div>

                        <Button
                            onClick={() => setStep('send-otp')}
                            disabled={!method}
                            size="lg"
                            className="w-full"
                        >
                            {isIndonesian ? 'Lanjutkan' : 'Continue'}
                        </Button>
                    </div>
                )}

                {/* Send OTP */}
                {step === 'send-otp' && (
                    <div className="space-y-6 text-center py-8">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <Send className="w-10 h-10 text-primary" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-2">{t.sendCode}</h2>
                            <p className="text-muted-foreground">{t.sendingTo}</p>
                            <p className="font-medium text-foreground mt-2">
                                {method === 'phone' ? maskedPhone : maskedEmail}
                            </p>
                        </div>

                        {/* Local mode notice */}
                        <div className="p-4 bg-warning/10 rounded-xl border border-warning/20">
                            <p className="text-sm text-warning">{t.localOtpNotice}</p>
                        </div>

                        <Button onClick={handleSendOtp} size="lg" className="w-full">
                            {t.sendCode}
                        </Button>
                    </div>
                )}

                {/* Verify OTP */}
                {step === 'verify-otp' && (
                    <div className="space-y-6 text-center py-8">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
                            <Lock className="w-10 h-10 text-primary" />
                        </div>

                        <div>
                            <h2 className="text-xl font-bold text-foreground mb-2">{t.enterOtp}</h2>
                            <p className="text-muted-foreground">{t.enterOtpDesc}</p>
                        </div>

                        {/* OTP Input */}
                        <div className="flex justify-center gap-2">
                            {[0, 1, 2, 3, 4, 5].map((i) => (
                                <input
                                    key={i}
                                    type="text"
                                    inputMode="numeric"
                                    maxLength={1}
                                    value={otp[i] || ''}
                                    onChange={(e) => {
                                        const val = e.target.value.replace(/\D/g, '');
                                        if (val) {
                                            const newOtp = otp.slice(0, i) + val + otp.slice(i + 1);
                                            setOtp(newOtp.slice(0, 6));
                                            // Auto-focus next input
                                            if (i < 5 && val) {
                                                const nextInput = e.target.parentElement?.children[i + 1] as HTMLInputElement;
                                                nextInput?.focus();
                                            }
                                        }
                                    }}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Backspace' && !otp[i] && i > 0) {
                                            const prevInput = e.currentTarget.parentElement?.children[i - 1] as HTMLInputElement;
                                            prevInput?.focus();
                                        }
                                    }}
                                    className="w-12 h-14 text-center text-2xl font-bold rounded-xl bg-muted border-2 border-border focus:border-primary focus:outline-none transition-colors"
                                />
                            ))}
                        </div>

                        {error && <p className="text-destructive text-sm">{error}</p>}

                        {/* Resend */}
                        <div>
                            {countdown > 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    {t.resendIn} {countdown}s
                                </p>
                            ) : (
                                <button
                                    onClick={handleSendOtp}
                                    className="text-sm text-primary hover:underline"
                                >
                                    {t.resend}
                                </button>
                            )}
                        </div>

                        <Button
                            onClick={handleVerifyOtp}
                            disabled={otp.length < 6}
                            size="lg"
                            className="w-full"
                        >
                            {t.verify}
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
