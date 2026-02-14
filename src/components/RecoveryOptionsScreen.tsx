import { useState, useEffect } from 'react';
import { ArrowLeft, Mail, CheckCircle, Shield, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { RecoveryService } from '@/lib/storage';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface RecoveryOptionsScreenProps {
    onBack: () => void;
    onComplete?: () => void;
    isOnboarding?: boolean;
}

export function RecoveryOptionsScreen({ onBack, onComplete, isOnboarding }: RecoveryOptionsScreenProps) {
    const { state } = useApp();
    const [email, setEmail] = useState('');
    const [existingEmail, setExistingEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);

    const isIndonesian = state.language === 'id';

    const t = {
        title: isIndonesian ? 'Amankan Akun Anda' : 'Secure Your Account',
        subtitle: isIndonesian
            ? 'Tambahkan email untuk memulihkan PIN jika Anda lupa.'
            : 'Add an email to recover your PIN if you forget it.',
        emailPlaceholder: 'name@example.com',
        save: isIndonesian ? 'Simpan & Lanjut' : 'Save & Continue',
        skip: isIndonesian ? 'Lewati untuk sekarang' : 'Skip for now',
        saveSuccess: isIndonesian ? 'Email pemulihan disimpan!' : 'Recovery email saved!',
        invalidEmail: isIndonesian ? 'Format email tidak valid' : 'Invalid email format',
        secureNote: isIndonesian
            ? 'Email Anda hanya disimpan lokal di perangkat ini.'
            : 'Your email is stored locally on this device only.',
    };

    useEffect(() => {
        const loadExisting = async () => {
            try {
                const maskedEmail = await RecoveryService.getMaskedEmail();
                setExistingEmail(maskedEmail);
            } catch (e) {
                console.error('Failed to load recovery options:', e);
            }
            setIsLoading(false);
        };
        loadExisting();
    }, []);

    const handleSaveEmail = async () => {
        if (!email.trim() && !existingEmail) return;

        // If field is empty but we have existing, just continue
        if (!email.trim() && existingEmail) {
            handleComplete();
            return;
        }

        if (!email.includes('@')) {
            toast.error(t.invalidEmail);
            return;
        }

        setIsSaving(true);
        try {
            await RecoveryService.saveRecoveryEmail(email);
            const masked = await RecoveryService.getMaskedEmail();
            setExistingEmail(masked);
            toast.success(t.saveSuccess);
            handleComplete();
        } catch (e) {
            toast.error(t.invalidEmail);
        }
        setIsSaving(false);
    };

    const handleComplete = () => {
        if (onComplete) {
            onComplete();
        } else {
            onBack();
        }
    };

    if (isLoading) {
        return <div className="fixed inset-0 bg-background" />;
    }

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in slide-in-from-right duration-500">
            {/* Minimal Header */}
            {!isOnboarding && (
                <div className="safe-area-top p-4">
                    <button
                        onClick={onBack}
                        className="w-10 h-10 flex items-center justify-center rounded-full hover:bg-muted transition-colors"
                    >
                        <ArrowLeft className="w-6 h-6" />
                    </button>
                </div>
            )}

            {/* Main Content - Centered */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 -mt-12">

                <div className="w-24 h-24 rounded-3xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center mb-8 shadow-sm">
                    <Mail className="w-12 h-12 text-blue-500" />
                </div>

                <h1 className="text-2xl font-bold text-center mb-3">
                    {t.title}
                </h1>

                <p className="text-muted-foreground text-center mb-8 max-w-xs leading-relaxed">
                    {t.subtitle}
                </p>

                {/* Input Area */}
                <div className="w-full max-w-sm space-y-4">
                    <div className="relative">
                        <input
                            type="email"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            placeholder={existingEmail || t.emailPlaceholder}
                            className={cn(
                                "w-full h-16 px-6 rounded-2xl bg-muted/50 border-2 border-transparent focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all text-lg",
                                email && "border-primary/50 bg-background"
                            )}
                        />
                        {existingEmail && !email && (
                            <div className="absolute right-4 top-1/2 -translate-y-1/2 flex items-center gap-1 text-success text-xs font-medium bg-success/10 px-2 py-1 rounded-full pointer-events-none">
                                <CheckCircle className="w-3 h-3" />
                                <span>Saved</span>
                            </div>
                        )}
                    </div>

                    <Button
                        onClick={handleSaveEmail}
                        disabled={isSaving || (!email && !existingEmail)}
                        size="lg"
                        className="w-full h-14 text-lg font-semibold rounded-2xl shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all"
                    >
                        {isSaving ? (
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                        ) : (
                            <>
                                {t.save}
                                <ArrowRight className="w-5 h-5 ml-2" />
                            </>
                        )}
                    </Button>

                    {isOnboarding && (
                        <button
                            onClick={handleComplete}
                            className="w-full py-3 text-sm text-muted-foreground hover:text-foreground transition-colors"
                        >
                            {t.skip}
                        </button>
                    )}
                </div>

                {/* Privacy Note */}
                <div className="flex items-center gap-2 mt-12 text-xs text-muted-foreground bg-muted/50 px-4 py-2 rounded-full">
                    <Shield className="w-3 h-3" />
                    <span>{t.secureNote}</span>
                </div>
            </div>
        </div>
    );
}
