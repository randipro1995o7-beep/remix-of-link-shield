import { Globe, Check, ChevronRight, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import { Language } from '@/i18n/translations';
import { useState } from 'react';

// Language options with native names and flags
const LANGUAGE_OPTIONS: { code: Language; name: string; nativeName: string; flag: string }[] = [
    { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
    { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
    { code: 'ms', name: 'Malay', nativeName: 'Bahasa Melayu', flag: '🇲🇾' },
    { code: 'th', name: 'Thai', nativeName: 'ไทย', flag: '🇹🇭' },
    { code: 'tl', name: 'Filipino', nativeName: 'Tagalog', flag: '🇵🇭' },
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦' },
    { code: 'my', name: 'Burmese', nativeName: 'မြန်မာစာ', flag: '🇲🇲' },
    { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
    { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
    { code: 'pt-br', name: 'Portuguese (Brazil)', nativeName: 'Português (Brasil)', flag: '🇧🇷' },
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
    const [searchQuery, setSearchQuery] = useState('');

    const filteredLanguages = LANGUAGE_OPTIONS.filter(lang =>
        lang.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        lang.nativeName.toLowerCase().includes(searchQuery.toLowerCase())
    );

    return (
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in">
            {/* Header */}
            <div className="flex flex-col items-center pt-8 pb-4 px-6 bg-background/80 backdrop-blur-md sticky top-0 z-10 border-b border-border/50">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 ring-4 ring-primary/5">
                    <Globe className="w-8 h-8 text-primary" />
                </div>

                <h1 className="text-xl font-bold text-foreground text-center">
                    Select Language / Pilih Bahasa
                </h1>

                {/* Search Bar */}
                <div className="w-full max-w-sm mt-4 relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <input
                        type="text"
                        placeholder="Search language..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-9 pr-4 py-2 rounded-lg bg-muted/50 border border-border focus:border-primary focus:ring-1 focus:ring-primary outline-none transition-all text-sm"
                    />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-4 py-4 scrollbar-hide">
                <div className="w-full max-w-sm mx-auto space-y-3 pb-24">
                    {filteredLanguages.map((lang) => (
                        <Card
                            key={lang.code}
                            className={cn(
                                "relative overflow-hidden transition-all duration-300 transform",
                                "cursor-pointer active:scale-[0.98]",
                                selectedLanguage === lang.code
                                    ? "border-primary bg-primary/5 shadow-md scale-[1.02] ring-2 ring-primary/20"
                                    : "border-border/50 hover:border-primary/50 hover:bg-muted/30"
                            )}
                            onClick={() => onLanguageSelect(lang.code)}
                            role="button"
                            tabIndex={0}
                            aria-pressed={selectedLanguage === lang.code}
                        >
                            <div className="p-4 flex items-center gap-4">
                                {/* Flag with shadow */}
                                <span className="text-3xl filter drop-shadow-sm transition-transform duration-300 group-hover:scale-110" role="img" aria-label={lang.name}>
                                    {lang.flag}
                                </span>

                                {/* Language info */}
                                <div className="flex-1">
                                    <p className={cn(
                                        "font-semibold transition-colors",
                                        selectedLanguage === lang.code ? "text-primary" : "text-foreground"
                                    )}>
                                        {lang.nativeName}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{lang.name}</p>
                                </div>

                                {/* Selection Indicator */}
                                <div className={cn(
                                    "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                                    selectedLanguage === lang.code
                                        ? "bg-primary scale-100 opacity-100"
                                        : "bg-muted scale-90 opacity-0"
                                )}>
                                    <Check className="w-4 h-4 text-primary-foreground" />
                                </div>
                            </div>

                            {/* Animated Background for active state */}
                            {selectedLanguage === lang.code && (
                                <div className="absolute inset-0 bg-primary/5 -z-10 animate-in fade-in duration-300" />
                            )}
                        </Card>
                    ))}

                    {filteredLanguages.length === 0 && (
                        <div className="text-center py-8 text-muted-foreground">
                            <p>No language found matching "{searchQuery}"</p>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Bottom Button */}
            <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-background via-background to-transparent pt-12 safe-area-bottom">
                <div className="max-w-sm mx-auto">
                    <Button
                        onClick={onContinue}
                        size="lg"
                        className="w-full h-14 text-lg gap-2 shadow-lg shadow-primary/20 hover:shadow-primary/30 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98]"
                    >
                        {selectedLanguage === 'id' ? 'Lanjutkan' : 'Continue'}
                        <ChevronRight className="w-5 h-5 animate-pulse" />
                    </Button>
                </div>
            </div>
        </div>
    );
}
