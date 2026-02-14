import { useState, useEffect } from 'react';
import { useApp } from '@/contexts/AppContext';
import { Button } from '@/components/ui/button';
import { CheckCircle, ArrowUp, ShieldAlert } from 'lucide-react';
import { cn } from '@/lib/utils';

const PANIC_GUIDE_SHOWN_KEY = 'safetyshield_guide_panic_shown';

type GuideStep = 'idle' | 'activate' | 'success' | 'panic';

export function HomeGuideOverlay() {
    const { t, state } = useApp();
    const [step, setStep] = useState<GuideStep>('idle');

    useEffect(() => {
        // Step 1: Activation Guide
        // Show if protection is disabled
        if (!state.isProtectionEnabled) {
            // Add delay to let UI render
            const timer = setTimeout(() => setStep('activate'), 800);
            return () => clearTimeout(timer);
        }

        // Step 2 & 3: Success & Panic
        // If protection IS enabled
        else {
            if (step === 'activate') {
                // User just activated it, show Success immediately
                setStep('success');
            } else if (step === 'idle') {
                // App loaded already active. Check if we need to show Panic guide
                const panicShown = localStorage.getItem(PANIC_GUIDE_SHOWN_KEY);
                if (!panicShown && !state.isPanicMode) {
                    const timer = setTimeout(() => setStep('panic'), 1000);
                    return () => clearTimeout(timer);
                }
            }
        }
    }, [state.isProtectionEnabled, step]); // Added 'step' to dependency array to react to step changes

    const handleDismissActivate = () => {
        setStep('idle'); // Temporarily dismiss, but it will come back if they don't activate
    };

    const handleSuccessNext = () => {
        setStep('panic');
    };

    const handleDismissPanic = () => {
        localStorage.setItem(PANIC_GUIDE_SHOWN_KEY, 'true');
        setStep('idle');
    };

    if (step === 'idle') return null;

    return (
        <div className="fixed inset-0 z-50 pointer-events-none flex flex-col items-center">
            {/* Backdrop */}
            <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] animate-in fade-in duration-500" />

            {/* STEP 1: ACTIVATE (Points to Security Tab at Bottom) */}
            {step === 'activate' && (
                <div className="absolute bottom-24 mx-6 p-5 bg-primary text-primary-foreground rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-700 pointer-events-auto max-w-sm">
                    {/* Arrow pointing DOWN */}
                    <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-primary rotate-45 transform" />

                    <div className="relative z-10 text-center space-y-4">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto animate-bounce">
                            {/* Arrow pointing DOWN to the tab */}
                            <ArrowUp className="w-8 h-8 text-white rotate-180" />
                        </div>

                        <div>
                            <h3 className="font-bold text-xl">
                                {t.homeGuide.welcome}
                            </h3>
                            <p className="text-primary-foreground/90 text-sm mt-2 leading-relaxed">
                                {t.homeGuide.clickEnable}
                            </p>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full font-bold"
                            onClick={handleDismissActivate}
                        >
                            {t.homeGuide.dismiss}
                        </Button>
                    </div>
                </div>
            )}

            {/* STEP 2: SUCCESS (Centered) */}
            {step === 'success' && (
                <div className="absolute inset-0 flex items-center justify-center p-6 pointer-events-auto">
                    <div className="bg-card text-card-foreground p-6 rounded-2xl shadow-2xl max-w-sm w-full animate-in zoom-in-95 duration-300 border-2 border-primary">
                        <div className="flex flex-col items-center text-center space-y-4">
                            <div className="w-16 h-16 bg-success/10 rounded-full flex items-center justify-center animate-in scale-in duration-500">
                                <CheckCircle className="w-10 h-10 text-success" />
                            </div>

                            <div>
                                <h3 className="font-bold text-2xl">
                                    {t.homeGuide.successTitle}
                                </h3>
                                <p className="text-muted-foreground mt-2">
                                    {t.homeGuide.successDesc}
                                </p>
                            </div>

                            <Button
                                className="w-full"
                                size="lg"
                                onClick={handleSuccessNext}
                            >
                                {t.homeGuide.next}
                            </Button>
                        </div>
                    </div>
                </div>
            )}

            {/* STEP 3: PANIC MODE (Points to Panic Card) */}
            {step === 'panic' && (
                <div className="relative mt-80 mx-6 p-5 bg-destructive text-white rounded-xl shadow-2xl animate-in slide-in-from-bottom-5 duration-700 pointer-events-auto max-w-sm">
                    {/* Arrow pointing up - Adjusted position for Panic Card */}
                    {/* Panic card is usually below Status Card, so we push this down */}
                    <div className="absolute -top-3 left-1/2 -translate-x-1/2 w-6 h-6 bg-destructive rotate-45 transform" />

                    <div className="relative z-10 text-center space-y-4">
                        <div className="w-14 h-14 bg-white/20 rounded-full flex items-center justify-center mx-auto animate-pulse">
                            <ShieldAlert className="w-8 h-8 text-white" />
                        </div>

                        <div>
                            <h3 className="font-bold text-xl">
                                {t.homeGuide.panicTitle}
                            </h3>
                            <p className="text-white/90 text-sm mt-2 leading-relaxed">
                                {t.homeGuide.panicDesc}
                            </p>
                        </div>

                        <Button
                            variant="secondary"
                            size="sm"
                            className="w-full font-bold text-destructive hover:bg-white/90"
                            onClick={handleDismissPanic}
                        >
                            {t.homeGuide.dismiss}
                        </Button>
                    </div>
                </div>
            )}
        </div>
    );
}
