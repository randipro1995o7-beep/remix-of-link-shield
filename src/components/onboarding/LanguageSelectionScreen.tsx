import { Globe, Check, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Language } from '@/i18n/translations';

// Language options with native names and flags
const LANGUAGE_OPTIONS: { code: Language; name: string; nativeName: string; flag: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
];

interface LanguageSelectionScreenProps {
    selectedLanguage: Language;
    onLanguageSelect: (lang: Language) => void;
    onContinue: () => void;
}

/**
 * LanguageSelectionScreen - First onboarding screen
 * 
 * Shown when user first opens the app.
 * Clean, simple design for choosing preferred language.
 */
export function LanguageSelectionScreen({
    selectedLanguage,
    onLanguageSelect,
    onContinue
}: LanguageSelectionScreenProps) {

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
            {/* Header */}
            <div className="safe-area-top" />

            {/* Main Content */}
            <div className="flex-1 flex flex-col items-center justify-center px-6 py-8">
                {/* Icon */}
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6">
                    <Globe className="w-10 h-10 text-primary" />
                </div>

                {/* Title - shown in both languages */}
                <h1 className="text-2xl font-bold text-foreground text-center mb-2">
                    Welcome to Link Guardian
                </h1>
                <p className="text-muted-foreground text-center mb-2">
                    Selamat datang di Link Guardian
                </p>

                {/* Subtitle */}
                <p className="text-sm text-muted-foreground text-center mb-8">
                    Please choose your language / Pilih bahasa Anda
                </p>

                {/* Language Options */}
                <div className="w-full max-w-sm space-y-3">
                    {LANGUAGE_OPTIONS.map((lang) => (
                        <Card
                            key={lang.code}
                            className={cn(
                                "p-4 cursor-pointer transition-all duration-200",
                                "hover:border-primary/50 hover:shadow-md",
                                selectedLanguage === lang.code
                                    ? "border-primary bg-primary/5 ring-2 ring-primary/20"
                                    : "border-border"
                            )}
                            onClick={() => onLanguageSelect(lang.code)}
                            role="button"
                            tabIndex={0}
                            aria-pressed={selectedLanguage === lang.code}
                        >
                            <div className="flex items-center gap-4">
                                {/* Flag */}
                                <span className="text-3xl" role="img" aria-label={lang.name}>
                                    {lang.flag}
                                </span>

                                {/* Language info */}
                                <div className="flex-1">
                                    <p className="font-semibold text-foreground">{lang.nativeName}</p>
                                    <p className="text-sm text-muted-foreground">{lang.name}</p>
                                </div>

                                {/* Check mark */}
                                {selectedLanguage === lang.code && (
                                    <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                                        <Check className="w-4 h-4 text-primary-foreground" />
                                    </div>
                                )}
                            </div>
                        </Card>
                    ))}
                </div>
            </div>

            {/* Bottom Button */}
            <div className="p-6 safe-area-bottom">
                <Button
                    onClick={onContinue}
                    size="lg"
                    className="w-full h-14 text-lg gap-2"
                >
                    {selectedLanguage === 'id' ? 'Lanjutkan' : 'Continue'}
                    <ChevronRight className="w-5 h-5" />
                </Button>
            </div>
        </div>
    );
}
