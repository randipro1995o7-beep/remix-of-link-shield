import { useState, useEffect } from 'react';
import { ArrowLeft, Lock, CheckCircle, Mail, KeyRound, Phone, AlertCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useApp } from '@/contexts/AppContext';
import { SafetyPinService, RecoveryService } from '@/lib/storage';
import { EmailService } from '@/lib/email/EmailService';
import { toast } from 'sonner';
import {
    InputOTP,
    InputOTPGroup,
    InputOTPSlot,
} from "@/components/ui/input-otp";

interface ForgotPinScreenProps {
    onBack: () => void;
    onSuccess: () => void;
}

type Step = 'select-method' | 'otp' | 'new-pin' | 'confirm-pin' | 'success' | 'setup-recovery' | 'rate-limited';

export function ForgotPinScreen({ onBack, onSuccess }: ForgotPinScreenProps) {
    const { state } = useApp();
    const [step, setStep] = useState<Step>('select-method');

    // Rate Limit State
    const [waitTime, setWaitTime] = useState<string>('');

    // Recovery Data
    const [maskedPhone, setMaskedPhone] = useState<string | null>(null);
    const [maskedEmail, setMaskedEmail] = useState<string | null>(null);
    const [rawPhone, setRawPhone] = useState<string | null>(null);
    const [rawEmail, setRawEmail] = useState<string | null>(null);

    // Fallback Input State
    const [fallbackInput, setFallbackInput] = useState('');
    const [fallbackType, setFallbackType] = useState<'email' | 'phone'>('email');

    // OTP State
    const [selectedMethod, setSelectedMethod] = useState<'phone' | 'email' | null>(null);
    const [otp, setOtp] = useState('');
    const [generatedOtp, setGeneratedOtp] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);

    // PIN State
    const [newPin, setNewPin] = useState('');
    const [confirmPin, setConfirmPin] = useState('');
    const [error, setError] = useState('');

    const isIndonesian = state.language === 'id';

    const t = {
        title: isIndonesian ? 'Lupa PIN' : 'Forgot PIN',
        selectTitle: isIndonesian ? 'Pilih Metode Pemulihan' : 'Select Recovery Method',
        selectDesc: isIndonesian
            ? 'Pilih ke mana kode OTP akan dikirim'
            : 'Choose where to send the OTP code',
        sendTo: isIndonesian ? 'Kirim ke' : 'Send to',

        verify: isIndonesian ? 'Verifikasi' : 'Verify',
        otpTitle: isIndonesian ? 'Masukkan Kode OTP' : 'Enter OTP Code',
        otpDesc: (target: string) => isIndonesian
            ? `Kode dikirim ke ${target}`
            : `Code sent to ${target}`,

        newPinTitle: isIndonesian ? 'Buat PIN Baru' : 'Create New PIN',
        newPinDesc: isIndonesian ? 'Masukkan PIN 4 digit yang baru' : 'Enter a new 4-digit PIN',
        confirmPinTitle: isIndonesian ? 'Konfirmasi PIN Baru' : 'Confirm New PIN',
        confirmPinDesc: isIndonesian ? 'Masukkan kembali PIN baru' : 'Re-enter your new PIN',
        successTitle: isIndonesian ? 'PIN Berhasil Direset!' : 'PIN Reset Successful!',
        successDesc: isIndonesian ? 'Anda sekarang bisa menggunakan PIN baru' : 'You can now use your new PIN',
        done: isIndonesian ? 'Selesai' : 'Done',

        noRecoveryTitle: isIndonesian ? 'Atur Pemulihan' : 'Setup Recovery',
        noRecoveryDesc: isIndonesian
            ? 'Anda belum mengatur email atau nomor HP. Masukkan sekarang untuk mereset PIN.'
            : 'You haven\'t set up a recovery email or phone number. Enter one now to reset your PIN.',
        setupEmail: isIndonesian ? 'Masukkan Email' : 'Enter Email',
        setupPhone: isIndonesian ? 'Masukkan Nomor HP' : 'Enter Phone Number',
        continue: isIndonesian ? 'Lanjut' : 'Continue',

        rateLimitTitle: isIndonesian ? 'Batas Perubahan PIN' : 'PIN Change Limit',
        rateLimitDesc: (time: string) => isIndonesian
            ? `Anda hanya dapat mengubah PIN sekali dalam 24 jam. Silakan coba lagi dalam ${time}.`
            : `You can only change your PIN once every 24 hours. Please try again in ${time}.`,

        pinMismatch: isIndonesian ? 'PIN tidak cocok' : 'PINs do not match',
        invalidOtp: isIndonesian ? 'Kode OTP salah' : 'Invalid OTP code',
        resend: isIndonesian ? 'Kirim Ulang' : 'Resend Code',
    };

    // Load Data & Check Rate Limit on Mount
    useEffect(() => {
        const init = async () => {
            try {
                // 1. Check Rate Limit
                const limitCheck = await SafetyPinService.canChangePin();
                if (!limitCheck.allowed && limitCheck.waitTimeMs) {
                    const hours = Math.ceil(limitCheck.waitTimeMs / (1000 * 60 * 60));
                    setWaitTime(`${hours} ${isIndonesian ? 'jam' : 'hours'}`);
                    setStep('rate-limited');
                    return; // Stop here if limited
                }

                // 2. Load Recovery Options
                const mPhone = await RecoveryService.getMaskedPhone();
                const mEmail = await RecoveryService.getMaskedEmail();
                const options = await RecoveryService.getRecoveryOptions();
                const rPhone = options.phone;
                const rEmail = options.email;

                setMaskedPhone(mPhone);
                setMaskedEmail(mEmail);
                setRawPhone(rPhone);
                setRawEmail(rEmail);

                if (!rPhone && !rEmail) {
                    setStep('setup-recovery');
                }
            } catch (e) {
                console.error('Failed to initialize forgot pin screen', e);
                // Fallback to setup if error, but logging it is important
                if (step !== 'rate-limited') {
                    setStep('setup-recovery');
                }
            }
        };
        init();
    }, []);

    const handleSetupRecovery = async () => {
        if (!fallbackInput) {
            toast.error(isIndonesian ? 'Mohon isi data' : 'Please enter data');
            return;
        }

        setIsLoading(true);
        try {
            if (fallbackType === 'email') {
                if (!fallbackInput.includes('@')) {
                    toast.error(isIndonesian ? 'Email tidak valid' : 'Invalid email');
                    setIsLoading(false);
                    return;
                }
                await RecoveryService.saveRecoveryEmail(fallbackInput);
                setRawEmail(fallbackInput);
                const masked = await RecoveryService.getMaskedEmail();
                setMaskedEmail(masked);

                // Immediately proceed to OTP
                handleSelectMethod('email', fallbackInput);
            } else {
                if (fallbackInput.length < 10) {
                    toast.error(isIndonesian ? 'Nomor HP tidak valid' : 'Invalid phone number');
                    setIsLoading(false);
                    return;
                }
                await RecoveryService.saveRecoveryPhone(fallbackInput);
                setRawPhone(fallbackInput);
                const masked = await RecoveryService.getMaskedPhone();
                setMaskedPhone(masked);

                // Immediately proceed to OTP
                handleSelectMethod('phone', fallbackInput);
            }
        } catch (error) {
            console.error(error);
            toast.error('Failed to save recovery info');
            setIsLoading(false);
        }
    };

    const handleSelectMethod = async (method: 'phone' | 'email', directTarget?: string) => {
        const target = directTarget || (method === 'phone' ? rawPhone : rawEmail);
        if (!target) return;

        setSelectedMethod(method);
        setIsLoading(true);

        const code = EmailService.generateOTP();
        setGeneratedOtp(code);

        try {
            let result;
            if (method === 'phone') {
                result = await EmailService.sendPhoneOTP(target, code);
            } else {
                result = await EmailService.sendOTP(target, code);
            }

            if (result.success) {
                toast.success(isIndonesian ? 'Kode OTP terkirim!' : 'OTP sent!');
                setStep('otp');
            } else {
                toast.error(isIndonesian ? 'Gagal mengirim OTP: ' + result.error : 'Failed to send OTP: ' + result.error);
            }
        } catch (e) {
            toast.error('Error sending OTP');
        } finally {
            setIsLoading(false);
        }
    };

    const handleVerifyOTP = () => {
        if (otp === generatedOtp) {
            toast.success(isIndonesian ? 'Verifikasi berhasil!' : 'Verification successful!');
            setStep('new-pin');
        } else {
            toast.error(t.invalidOtp);
            setOtp('');
        }
    };

    const handleKeyPress = (key: string) => {
        if (key === 'backspace') {
            if (step === 'new-pin') {
                setNewPin(prev => prev.slice(0, -1));
                setError('');
            } else if (step === 'confirm-pin') {
                setConfirmPin(prev => prev.slice(0, -1));
                setError('');
            }
        } else {
            if (step === 'new-pin' && newPin.length < 4) {
                setNewPin(prev => prev + key);
                setError('');
            } else if (step === 'confirm-pin' && confirmPin.length < 4) {
                setConfirmPin(prev => prev + key);
                setError('');
            }
        }
    };

    // Auto-advance PIN entry
    useEffect(() => {
        if (step === 'new-pin' && newPin.length === 4) {
            setTimeout(() => {
                setStep('confirm-pin');
                setConfirmPin('');
            }, 200);
        }

        if (step === 'confirm-pin' && confirmPin.length === 4) {
            if (confirmPin === newPin) {
                SafetyPinService.save(newPin); // This now records the timestamp
                toast.success(t.successTitle);
                setStep('success');
            } else {
                setError(t.pinMismatch);
                setConfirmPin('');
            }
        }
    }, [newPin, confirmPin, step, t.pinMismatch, t.successTitle]);

    // Render Steps

    // -1. Rate Limited
    if (step === 'rate-limited') {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in shadow-2xl">
                <div className="flex items-center p-4 safe-area-top border-b border-border">
                    <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="flex-1 text-center font-semibold">{t.title}</h1>
                    <div className="w-12" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-orange-100 flex items-center justify-center mb-6">
                        <Clock className="w-10 h-10 text-orange-600" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{t.rateLimitTitle}</h2>
                    <p className="text-muted-foreground mb-8">{t.rateLimitDesc(waitTime)}</p>

                    <Button onClick={onBack} className="w-full max-w-xs">
                        {t.done}
                    </Button>
                </div>
            </div>
        );
    }

    // 0. No Recovery Options -> Setup Recovery
    if (step === 'setup-recovery') {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in shadow-2xl">
                <div className="flex items-center p-4 safe-area-top border-b border-border">
                    <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="flex-1 text-center font-semibold">{t.title}</h1>
                    <div className="w-12" />
                </div>
                <div className="flex-1 flex flex-col items-center justify-center px-8 text-center">
                    <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                        <AlertCircle className="w-10 h-10 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">{t.noRecoveryTitle}</h2>
                    <p className="text-muted-foreground mb-8">{t.noRecoveryDesc}</p>

                    <div className="w-full max-w-sm space-y-4">
                        <div className="flex bg-muted rounded-lg p-1">
                            <button
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${fallbackType === 'email' ? 'bg-background shadow' : 'text-muted-foreground'}`}
                                onClick={() => { setFallbackType('email'); setFallbackInput(''); }}
                            >
                                Email
                            </button>
                            <button
                                className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${fallbackType === 'phone' ? 'bg-background shadow' : 'text-muted-foreground'}`}
                                onClick={() => { setFallbackType('phone'); setFallbackInput(''); }}
                            >
                                Phone
                            </button>
                        </div>

                        <Input
                            value={fallbackInput}
                            onChange={(e) => setFallbackInput(e.target.value)}
                            placeholder={fallbackType === 'email' ? 'example@email.com' : '08123456789'}
                            type={fallbackType === 'email' ? 'email' : 'tel'}
                            className="h-12"
                        />

                        <Button
                            className="w-full h-12"
                            onClick={handleSetupRecovery}
                            disabled={isLoading}
                        >
                            {isLoading ? 'Verifying...' : t.continue}
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    // 1. Select Recovery Method
    if (step === 'select-method') {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in shadow-2xl">
                <div className="flex items-center p-4 safe-area-top border-b border-border">
                    <button onClick={onBack} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="flex-1 text-center font-semibold">{t.title}</h1>
                    <div className="w-12" />
                </div>

                <div className="flex-1 px-6 pt-10">
                    <div className="text-center mb-8">
                        <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
                            <Lock className="w-8 h-8 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t.selectTitle}</h2>
                        <p className="text-muted-foreground">{t.selectDesc}</p>
                    </div>

                    <div className="space-y-4">
                        {maskedPhone && (
                            <Card
                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors border-primary/20"
                                onClick={() => handleSelectMethod('phone')}
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Phone className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{t.sendTo} Phone</p>
                                    <p className="text-sm text-muted-foreground">{maskedPhone}</p>
                                </div>
                            </Card>
                        )}

                        {maskedEmail && (
                            <Card
                                className="p-4 flex items-center gap-4 cursor-pointer hover:bg-muted/50 transition-colors border-primary/20"
                                onClick={() => handleSelectMethod('email')}
                            >
                                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                                    <Mail className="w-5 h-5 text-primary" />
                                </div>
                                <div className="flex-1">
                                    <p className="font-medium">{t.sendTo} Email</p>
                                    <p className="text-sm text-muted-foreground">{maskedEmail}</p>
                                </div>
                            </Card>
                        )}

                        {isLoading && (
                            <div className="flex justify-center p-4">
                                <div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" />
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // 2. Enter OTP
    if (step === 'otp') {
        const targetMask = selectedMethod === 'phone' ? maskedPhone : maskedEmail;
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in shadow-2xl">
                <div className="flex items-center p-4 safe-area-top border-b border-border">
                    <button onClick={() => setStep('select-method')} className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-muted">
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                    <h1 className="flex-1 text-center font-semibold">{t.title}</h1>
                    <div className="w-12" />
                </div>

                <div className="flex-1 flex flex-col px-6 pt-10 items-center">
                    <div className="mb-8 text-center">
                        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-6">
                            <KeyRound className="w-10 h-10 text-primary" />
                        </div>
                        <h2 className="text-xl font-bold mb-2">{t.otpTitle}</h2>
                        <p className="text-muted-foreground">{t.otpDesc(targetMask || '')}</p>
                    </div>

                    <div className="mb-8">
                        <InputOTP maxLength={6} value={otp} onChange={(value) => setOtp(value)}>
                            <InputOTPGroup>
                                <InputOTPSlot index={0} />
                                <InputOTPSlot index={1} />
                                <InputOTPSlot index={2} />
                                <InputOTPSlot index={3} />
                                <InputOTPSlot index={4} />
                                <InputOTPSlot index={5} />
                            </InputOTPGroup>
                        </InputOTP>
                    </div>

                    <Button
                        className="w-full max-w-xs h-12 text-lg mb-4"
                        onClick={handleVerifyOTP}
                        disabled={otp.length < 6}
                    >
                        {t.verify}
                    </Button>

                    <Button variant="ghost" onClick={() => selectedMethod && handleSelectMethod(selectedMethod)} disabled={isLoading}>
                        {t.resend}
                    </Button>
                </div>
            </div>
        );
    }

    // 3. Success (Same as before)
    if (step === 'success') {
        return (
            <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in shadow-2xl">
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

    // 4. New PIN / Confirm PIN (Same as before)
    const currentPin = step === 'new-pin' ? newPin : confirmPin;
    const title = step === 'new-pin' ? t.newPinTitle : t.confirmPinTitle;
    const desc = step === 'new-pin' ? t.newPinDesc : t.confirmPinDesc;

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in shadow-2xl">
            <div className="flex items-center p-4 safe-area-top border-b border-border">
                <button
                    onClick={() => step === 'confirm-pin' ? setStep('new-pin') : setStep('select-method')}
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
