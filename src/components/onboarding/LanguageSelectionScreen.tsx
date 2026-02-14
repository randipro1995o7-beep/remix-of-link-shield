import { Check, ChevronRight, Search, Globe, Sparkles } from 'lucide-react';
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
    { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
    { code: 'tl', name: 'Filipino', nativeName: 'Tagalog', flag: '🇵🇭' },
    { code: 'lo', name: 'Lao', nativeName: 'ລາວ', flag: '🇱🇦' },
    { code: 'my', name: 'Burmese', nativeName: 'မြန်မာစာ', flag: '🇲🇲' },
    { code: 'km', name: 'Khmer', nativeName: 'ខ្មែរ', flag: '🇰🇭' },
    { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
    { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },

    { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
    { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
    { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
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
 * Redesigned for a premium, modern feel.
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
        <div className="fixed inset-0 z-50 bg-background flex flex-col animate-in fade-in duration-500">
            {/* Header Area */}
            <div className="pt-12 pb-6 px-6 bg-background/95 backdrop-blur-xl sticky top-0 z-20 border-b border-border/40 shadow-sm">
                <div className="flex items-center gap-3 mb-6">
                    <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center shadow-inner">
                        <Globe className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold tracking-tight text-foreground">
                            Welcome
                        </h1>
                        <p className="text-muted-foreground text-sm">
                            Select your language to continue
                        </p>
                    </div>
                </div>

                {/* Search Bar - Modernized */}
                <div className="relative group">
                    <Search className="absolute left-3.5 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4 transition-colors group-focus-within:text-primary" />
                    <input
                        type="text"
                        placeholder="Search language..."
                        value={searchQuery}
                        onChange={(e) => setSearchQuery(e.target.value)}
                        className="w-full pl-10 pr-4 py-3 rounded-xl bg-muted/40 border border-transparent focus:border-primary/20 focus:bg-background focus:ring-4 focus:ring-primary/10 outline-none transition-all duration-300 text-sm placeholder:text-muted-foreground/70"
                    />
                </div>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 overflow-y-auto px-6 py-4 scrollbar-hide">
                <div className="space-y-3 pb-32">
                    {filteredLanguages.map((lang, index) => {
                        const isSelected = selectedLanguage === lang.code;
                        return (
                            <div
                                key={lang.code}
                                className={cn(
                                    "group relative overflow-hidden rounded-xl transition-all duration-300 cursor-pointer",
                                    "hover:shadow-md active:scale-[0.98]",
                                    isSelected
                                        ? "ring-2 ring-primary shadow-lg shadow-primary/10 bg-primary/5"
                                        : "border border-border/40 bg-card/50 hover:bg-card hover:border-border"
                                )}
                                onClick={() => onLanguageSelect(lang.code)}
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                <div className="p-4 flex items-center gap-4">
                                    <span className="text-3xl drop-shadow-sm transition-transform duration-300 group-hover:scale-110 origin-center">
                                        {lang.flag}
                                    </span>

                                    <div className="flex-1 min-w-0">
                                        <p className={cn(
                                            "font-semibold text-base truncate transition-colors",
                                            isSelected ? "text-primary" : "text-foreground"
                                        )}>
                                            {lang.nativeName}
                                        </p>
                                        <p className="text-xs text-muted-foreground truncate">
                                            {lang.name}
                                        </p>
                                    </div>

                                    <div className={cn(
                                        "w-6 h-6 rounded-full flex items-center justify-center transition-all duration-300",
                                        isSelected
                                            ? "bg-primary text-primary-foreground scale-100 shadow-sm"
                                            : "bg-muted/50 text-transparent scale-90"
                                    )}>
                                        <Check className="w-3.5 h-3.5" strokeWidth={3} />
                                    </div>
                                </div>

                                {/* Active State Background Decoration */}
                                {isSelected && (
                                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 via-transparent to-transparent opacity-50 pointer-events-none" />
                                )}
                            </div>
                        );
                    })}

                    {filteredLanguages.length === 0 && (
                        <div className="text-center py-12 space-y-3 animate-in fade-in slide-in-from-bottom-4">
                            <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-2">
                                <Search className="w-6 h-6 text-muted-foreground" />
                            </div>
                            <p className="text-muted-foreground font-medium">No language found</p>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setSearchQuery('')}
                                className="rounded-full"
                            >
                                Clear search
                            </Button>
                        </div>
                    )}
                </div>
            </div>

            {/* Floating Bottom Button */}
            <div className="absolute bottom-0 left-0 right-0 p-6 pt-12 bg-gradient-to-t from-background via-background/95 to-transparent z-20 safe-area-bottom">
                <Button
                    onClick={onContinue}
                    size="lg"
                    className="w-full h-14 text-lg font-semibold rounded-2xl shadow-xl shadow-primary/25 hover:shadow-primary/40 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 group"
                >
                    <span className="mr-2">
                        {selectedLanguage === 'id' ? 'Lanjutkan' : 'Continue'}
                    </span>
                    <ChevronRight className="w-5 h-5 transition-transform duration-300 group-hover:translate-x-1" />
                </Button>
            </div>
        </div>
    );
}
