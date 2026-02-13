import { useState, useEffect } from 'react';
import { LanguageSelectionScreen } from './LanguageSelectionScreen';
import { InteractiveTutorial } from './InteractiveTutorial';
import { PinSetupScreen } from './PinSetupScreen';
import { RecoveryOptionsScreen } from '@/components/RecoveryOptionsScreen';
import { useApp } from '@/contexts/AppContext';
import { useSafetyPin } from '@/contexts/SafetyPinContext';
import { Language } from '@/i18n/translations';

const ONBOARDING_COMPLETE_KEY = 'safetyshield_onboarding_complete';

type OnboardingStep = 'language' | 'tutorial' | 'pin' | 'recovery' | 'complete';

interface OnboardingFlowProps {
    children: React.ReactNode;
}

/**
 * OnboardingFlow - Orchestrates the onboarding screens
 * 
 * Shown once when user first opens the app.
 * Step 1: Language selection
 * Step 2: PIN creation
 * After completion, saves flag and never shows again.
 */
export function OnboardingFlow({ children }: OnboardingFlowProps) {
    const { state, setLanguage } = useApp();
    const { hasSafetyPin, isLoading: pinLoading, createSafetyPin } = useSafetyPin();
    const [step, setStep] = useState<OnboardingStep>('language');
    const [isLoading, setIsLoading] = useState(true);
    const [selectedLanguage, setSelectedLanguage] = useState<Language>(state.language);

    // Check if onboarding was already completed
    useEffect(() => {
        const checkOnboardingStatus = () => {
            try {
                const completed = localStorage.getItem(ONBOARDING_COMPLETE_KEY);
                if (completed === 'true') {
                    setStep('complete');
                }
            } catch (e) {
                console.error('Failed to check onboarding status:', e);
            }
            setIsLoading(false);
        };

        checkOnboardingStatus();
    }, []);

    // Sync selected language with app state
    useEffect(() => {
        setSelectedLanguage(state.language);
    }, [state.language]);

    const handleLanguageSelect = (lang: Language) => {
        setSelectedLanguage(lang);
        setLanguage(lang); // Update app-wide language immediately
    };

    const handleLanguageContinue = () => {
        setStep('tutorial');
    };

    const handleTutorialComplete = () => {
        setStep('pin');
    };

    const handlePinComplete = async (pin: string) => {
        try {
            await createSafetyPin(pin);
            // Move to recovery setup instead of completing immediately
            setStep('recovery');
        } catch (error) {
            console.error('Failed to create PIN:', error);
        }
    };

    const handleRecoveryComplete = async () => {
        // Mark onboarding as complete
        localStorage.setItem(ONBOARDING_COMPLETE_KEY, 'true');

        // Auto-enable protection after onboarding
        try {
            const LinkShield = (await import('@/plugins/LinkShield')).default;
            await LinkShield.setProtectionEnabled({ enabled: true });
        } catch (e) {
            console.error('Failed to auto-enable protection:', e);
        }

        setStep('complete');
    };

    // Show loading while checking status
    if (isLoading || pinLoading) {
        return (
            <div className="fixed inset-0 z-50 bg-background flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                    <div className="w-8 h-8 rounded-full bg-primary/20" />
                </div>
            </div>
        );
    }

    // If onboarding complete, show main app
    if (step === 'complete') {
        return <>{children}</>;
    }

    // Step 1: Language selection
    if (step === 'language') {
        return (
            <LanguageSelectionScreen
                selectedLanguage={selectedLanguage}
                onLanguageSelect={handleLanguageSelect}
                onContinue={handleLanguageContinue}
            />
        );
    }

    // Step 2: Tutorial
    if (step === 'tutorial') {
        return (
            <InteractiveTutorial
                onComplete={handleTutorialComplete}
                onSkip={handleTutorialComplete}
            />
        );
    }

    // Step 3: PIN setup
    if (step === 'pin') {
        return <PinSetupScreen onComplete={handlePinComplete} />;
    }

    // Step 4: Recovery Options
    if (step === 'recovery') {
        return (
            <RecoveryOptionsScreen
                isOnboarding
                onBack={() => setStep('pin')}
                onComplete={handleRecoveryComplete}
            />
        );
    }

    return null;
}

/**
 * Helper function to reset onboarding (for testing)
 */
export function resetOnboarding(): void {
    try {
        localStorage.removeItem(ONBOARDING_COMPLETE_KEY);
    } catch (e) {
        console.error('Failed to reset onboarding:', e);
    }
}
