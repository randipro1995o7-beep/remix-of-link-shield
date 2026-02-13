import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { useApp } from '@/contexts/AppContext';
import { FileText, Shield, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TermsPrivacyScreenProps {
    onContinue: () => void;
}

export function TermsPrivacyScreen({ onContinue }: TermsPrivacyScreenProps) {
    const { t } = useApp();
    const [accepted, setAccepted] = useState(false);

    return (
        <div className="flex flex-col h-full min-h-screen bg-background animate-in fade-in slide-in-from-bottom-4 duration-500">
            {/* Header */}
            <div className="pt-12 pb-6 px-6 text-center space-y-2">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                    <FileText className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {t.terms.title}
                </h1>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                    {t.terms.subtitle}
                </p>
            </div>

            {/* Scrollable Content */}
            <div className="flex-1 px-6 pb-4 overflow-hidden flex flex-col gap-4">
                <ScrollArea className="flex-1 rounded-md border p-4 bg-card/50">
                    <div className="space-y-6">
                        {/* Intro */}
                        <p className="text-sm text-foreground font-medium">
                            {t.terms.intro}
                        </p>

                        {/* Terms Section */}
                        <div className="space-y-2">
                            <h3 className="flex items-center gap-2 font-semibold text-primary">
                                <Shield className="w-4 h-4" />
                                {t.terms.termsTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t.terms.termsContent}
                            </p>
                        </div>

                        {/* Privacy Section */}
                        <div className="space-y-2">
                            <h3 className="flex items-center gap-2 font-semibold text-primary">
                                <Lock className="w-4 h-4" />
                                {t.terms.privacyTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t.terms.privacyContent}
                            </p>
                        </div>
                    </div>
                </ScrollArea>

                {/* Agreement Checkbox */}
                <div
                    className={cn(
                        "flex items-start gap-3 p-4 rounded-xl border transition-all duration-300",
                        accepted ? "bg-primary/5 border-primary/20" : "bg-card border-border"
                    )}
                    onClick={() => setAccepted(!accepted)}
                >
                    <Checkbox
                        id="terms-check"
                        checked={accepted}
                        onCheckedChange={(checked) => setAccepted(checked as boolean)}
                        className="mt-1"
                    />
                    <div className="grid gap-1.5 leading-none">
                        <label
                            htmlFor="terms-check"
                            className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 cursor-pointer select-none"
                        >
                            {t.terms.agreeLabel}
                        </label>
                    </div>
                </div>
            </div>

            {/* Footer Actions */}
            <div className="p-6 pt-2 bg-background safe-area-bottom">
                <Button
                    onClick={onContinue}
                    disabled={!accepted}
                    className="w-full h-12 text-base shadow-lg shadow-primary/20 transition-all"
                    size="lg"
                >
                    {t.terms.continue}
                </Button>
            </div>
        </div>
    );
}
