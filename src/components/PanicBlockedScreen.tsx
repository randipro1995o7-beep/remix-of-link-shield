import { useEffect } from 'react';
import { ShieldAlert, Lock, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { playWarningSound } from '@/lib/alertSound';

interface PanicBlockedScreenProps {
    onClose: () => void;
    onUnlockRequest: () => void;
}

/**
 * PanicBlockedScreen - Shown when Panic Mode is active
 * 
 * Blocks all links that are not explicitly whitelisted.
 */
export function PanicBlockedScreen({ onClose, onUnlockRequest }: PanicBlockedScreenProps) {
    const { t } = useApp();

    // Play alert feedback
    useEffect(() => {
        const playAlertFeedback = async () => {
            await playWarningSound();
            try {
                await Haptics.notification({ type: NotificationType.Warning });
            } catch (e) {
                console.debug('Haptics not available:', e);
            }
        };
        playAlertFeedback();
    }, []);

    return (
        <div
            className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in"
            role="alertdialog"
            aria-labelledby="panic-title"
            aria-describedby="panic-description"
        >
            {/* Header with warning background */}
            <div className="bg-destructive/10 border-b border-destructive/20 safe-area-top">
                <div className="flex items-center justify-between p-4">
                    <div className="w-12" aria-hidden="true" />
                    <h1 id="panic-title" className="font-bold text-destructive text-lg">
                        Panic Mode Active
                    </h1>
                    <button
                        onClick={onClose}
                        className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-destructive/20 transition-colors"
                        aria-label="Close"
                    >
                        <X className="w-6 h-6 text-destructive" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-10 pb-40">
                {/* Large Lock Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-destructive/10 flex items-center justify-center animate-scale-in border-4 border-destructive/20">
                        <Lock className="w-12 h-12 text-destructive" aria-hidden="true" />
                    </div>
                </div>

                {/* Warning Title */}
                <h2 className="text-2xl font-bold text-foreground text-center mb-2">
                    Link Blocked
                </h2>
                <p id="panic-description" className="text-center text-muted-foreground mb-8 max-w-xs mx-auto">
                    This link was blocked because Panic Mode is currently authorized to block all unknown traffic.
                </p>

                {/* Info Card */}
                <Card className="p-5 mb-4 border-l-4 border-l-destructive shadow-sm">
                    <div className="flex items-start gap-4">
                        <ShieldAlert className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" />
                        <div>
                            <h3 className="font-medium text-foreground">Strict Protection</h3>
                            <p className="text-sm text-muted-foreground mt-1">
                                Only links in your confirmed whitelist are allowed while Panic Mode is enabled.
                            </p>
                        </div>
                    </div>
                </Card>

            </div>

            {/* Fixed Bottom Actions */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
                <Button
                    onClick={onClose}
                    variant="ghost"
                    size="lg"
                    className="w-full h-12 text-muted-foreground mb-2"
                >
                    Close
                </Button>

                <Button
                    onClick={onUnlockRequest}
                    size="lg"
                    variant="destructive"
                    className="w-full h-14 text-lg gap-2 shadow-lg shadow-destructive/20"
                >
                    <Lock className="w-5 h-5" aria-hidden="true" />
                    Unlock Panic Mode
                </Button>
            </div>
        </div>
    );
}
