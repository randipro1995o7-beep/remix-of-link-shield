import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { ShieldAlert, ShieldCheck, ArrowRight } from 'lucide-react';

interface FinalOnboardingScreenProps {
    onComplete: () => void;
}

export function FinalOnboardingScreen({ onComplete }: FinalOnboardingScreenProps) {
    const { t } = useApp();

    return (
        <div className="flex flex-col h-full min-h-screen bg-background animate-in fade-in slide-in-from-bottom-8 duration-700">
            {/* Header */}
            <div className="pt-12 pb-6 px-6 text-center space-y-2">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4 animate-bounce-slow">
                    <ShieldCheck className="w-8 h-8 text-primary" />
                </div>
                <h1 className="text-2xl font-bold tracking-tight text-foreground">
                    {t.finalOnboarding.title}
                </h1>
                <p className="text-muted-foreground max-w-xs mx-auto text-sm">
                    {t.finalOnboarding.subtitle}
                </p>
            </div>

            {/* Content Cards */}
            <div className="flex-1 px-6 flex flex-col gap-4 overflow-y-auto">
                {/* Panic Mode Card */}
                <Card className="p-4 border-l-4 border-l-destructive bg-card/50">
                    <div className="flex gap-4">
                        <div className="mt-1 bg-destructive/10 p-2 rounded-full h-fit">
                            <ShieldAlert className="w-5 h-5 text-destructive" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-foreground">
                                {t.finalOnboarding.panicTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t.finalOnboarding.panicDesc}
                            </p>
                        </div>
                    </div>
                </Card>

                {/* Default App Card */}
                <Card className="p-4 border-l-4 border-l-primary bg-card/50">
                    <div className="flex gap-4">
                        <div className="mt-1 bg-primary/10 p-2 rounded-full h-fit">
                            <ShieldCheck className="w-5 h-5 text-primary" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="font-semibold text-foreground">
                                {t.finalOnboarding.defaultTitle}
                            </h3>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                {t.finalOnboarding.defaultDesc}
                            </p>
                        </div>
                    </div>
                </Card>
            </div>

            {/* Footer */}
            <div className="p-6 safe-area-bottom">
                <Button
                    onClick={onComplete}
                    className="w-full h-12 text-base shadow-lg shadow-primary/25"
                    size="lg"
                >
                    {t.finalOnboarding.finishButton}
                    <ArrowRight className="w-4 h-4 ml-2" />
                </Button>
            </div>
        </div>
    );
}
