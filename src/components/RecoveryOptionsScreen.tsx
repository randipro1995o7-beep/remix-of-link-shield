import { useState, useEffect } from 'react';
import { ArrowLeft, Phone, Mail, CheckCircle, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { RecoveryService } from '@/lib/storage';
import { toast } from 'sonner';

interface RecoveryOptionsScreenProps {
    onBack: () => void;
    onComplete?: () => void;
    isOnboarding?: boolean;
}

/**
 * Recovery Options Screen
 * 
 * Allows user to set up recovery phone and/or email for PIN reset.
 * Simple save only - Verification happens during PIN reset flow.
 */
export function RecoveryOptionsScreen({ onBack, onComplete, isOnboarding }: RecoveryOptionsScreenProps) {
    const { state } = useApp();
    const [phone, setPhone] = useState('');
    const [email, setEmail] = useState('');
    const [existingPhone, setExistingPhone] = useState<string | null>(null);
    const [existingEmail, setExistingEmail] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    const [activeField, setActiveField] = useState<'phone' | 'email' | null>(null);

    const isIndonesian = state.language === 'id';

    const t = {
        title: isIndonesian ? 'Pengaturan Pemulihan' : 'Recovery Setup',
        subtitle: isIndonesian
            ? 'Tambahkan nomor HP atau email untuk reset PIN jika lupa'
            : 'Add phone or email to reset PIN if forgotten',
        phoneLabel: isIndonesian ? 'Nomor HP' : 'Phone Number',
        phonePlaceholder: isIndonesian ? 'Contoh: 08123456789' : 'e.g., 08123456789',
        emailLabel: 'Email',
        emailPlaceholder: isIndonesian ? 'Contoh: email@gmail.com' : 'e.g., email@gmail.com',
        save: isIndonesian ? 'Simpan' : 'Save',
        skip: isIndonesian ? 'Lewati' : 'Skip',
        saved: isIndonesian ? 'Tersimpan' : 'Saved',
        saveSuccess: isIndonesian ? 'Pengaturan pemulihan disimpan!' : 'Recovery options saved!',
        invalidPhone: isIndonesian ? 'Nomor HP tidak valid' : 'Invalid phone number',
        invalidEmail: isIndonesian ? 'Email tidak valid' : 'Invalid email address',
        whyImportant: isIndonesian
            ? 'Jika Anda lupa PIN, opsi ini akan digunakan untuk verifikasi identitas Anda.'
            : 'If you forget your PIN, these options will be used to verify your identity.',
        cancel: isIndonesian ? 'Batal' : 'Cancel',
    };

    useEffect(() => {
        const loadExisting = async () => {
            try {
                const maskedPhone = await RecoveryService.getMaskedPhone();
                const maskedEmail = await RecoveryService.getMaskedEmail();
                setExistingPhone(maskedPhone);
                setExistingEmail(maskedEmail);
            } catch (e) {
                console.error('Failed to load recovery options:', e);
            }
            setIsLoading(false);
        };
        loadExisting();
    }, []);

    const resetForm = () => {
        setActiveField(null);
        setPhone('');
        setEmail('');
    };

    const handleSavePhone = async () => {
        if (!phone.trim()) return;

        setIsSaving(true);
        try {
            await RecoveryService.saveRecoveryPhone(phone);
            const masked = await RecoveryService.getMaskedPhone();
            setExistingPhone(masked);
            resetForm();
            toast.success(t.saveSuccess);
        } catch (e) {
            toast.error(t.invalidPhone);
        }
        setIsSaving(false);
    };

    const handleSaveEmail = async () => {
        if (!email.trim()) return;

        setIsSaving(true);
        try {
            await RecoveryService.saveRecoveryEmail(email);
            const masked = await RecoveryService.getMaskedEmail();
            setExistingEmail(masked);
            resetForm();
            toast.success(t.saveSuccess);
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
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <div className="w-12 h-12 rounded-full bg-primary/10 animate-pulse" />
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
                <h1 className="font-semibold text-foreground">{t.title}</h1>
                <div className="w-12" />
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-6">
                {/* Info Banner */}
                <div className="flex items-start gap-3 p-4 bg-primary/5 rounded-xl border border-primary/10">
                    <Shield className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                    <p className="text-sm text-muted-foreground">{t.whyImportant}</p>
                </div>

                {/* Phone Section */}
                <Card className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Phone className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-foreground">{t.phoneLabel}</p>
                            {existingPhone && (
                                <p className="text-sm text-success flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    {existingPhone}
                                </p>
                            )}
                        </div>
                    </div>

                    {activeField === 'phone' ? (
                        <div className="space-y-3 animate-fade-in">
                            <input
                                type="tel"
                                value={phone}
                                onChange={(e) => setPhone(e.target.value)}
                                placeholder={t.phonePlaceholder}
                                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={resetForm} className="flex-1">
                                    {t.cancel}
                                </Button>
                                <Button onClick={handleSavePhone} disabled={!phone.trim() || isSaving} className="flex-1">
                                    {t.save}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => { resetForm(); setActiveField('phone'); }}
                            disabled={activeField !== null}
                            className="w-full"
                        >
                            {existingPhone
                                ? (isIndonesian ? 'Ubah Nomor' : 'Change Number')
                                : (isIndonesian ? 'Tambah Nomor' : 'Add Number')
                            }
                        </Button>
                    )}
                </Card>

                {/* Email Section */}
                <Card className="p-4 space-y-4">
                    <div className="flex items-center gap-3">
                        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                            <Mail className="w-5 h-5 text-primary" />
                        </div>
                        <div className="flex-1">
                            <p className="font-medium text-foreground">{t.emailLabel}</p>
                            {existingEmail && (
                                <p className="text-sm text-success flex items-center gap-1">
                                    <CheckCircle className="w-3 h-3" />
                                    {existingEmail}
                                </p>
                            )}
                        </div>
                    </div>

                    {activeField === 'email' ? (
                        <div className="space-y-3 animate-fade-in">
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder={t.emailPlaceholder}
                                className="w-full px-4 py-3 rounded-xl bg-muted border border-border focus:border-primary focus:outline-none transition-colors"
                                autoFocus
                            />
                            <div className="flex gap-2">
                                <Button variant="outline" onClick={resetForm} className="flex-1">
                                    {t.cancel}
                                </Button>
                                <Button onClick={handleSaveEmail} disabled={!email.trim() || isSaving} className="flex-1">
                                    {t.save}
                                </Button>
                            </div>
                        </div>
                    ) : (
                        <Button
                            variant="outline"
                            onClick={() => { resetForm(); setActiveField('email'); }}
                            disabled={activeField !== null}
                            className="w-full"
                        >
                            {existingEmail
                                ? (isIndonesian ? 'Ubah Email' : 'Change Email')
                                : (isIndonesian ? 'Tambah Email' : 'Add Email')
                            }
                        </Button>
                    )}
                </Card>
            </div>

            {/* Bottom Action */}
            <div className="p-4 border-t border-border safe-area-bottom">
                <Button
                    onClick={handleComplete}
                    size="lg"
                    className="w-full"
                    disabled={activeField !== null}
                >
                    {isOnboarding && !existingPhone && !existingEmail
                        ? t.skip
                        : (isIndonesian ? 'Selesai' : 'Done')
                    }
                </Button>
            </div>
        </div>
    );
}
