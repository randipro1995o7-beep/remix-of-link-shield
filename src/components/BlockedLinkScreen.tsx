import { useEffect } from 'react';
import { ShieldX, AlertOctagon, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useApp } from '@/contexts/AppContext';
import { getCategoryLabel, ScamCategory } from '@/lib/scamDatabase';
import { SafetyHistoryService } from '@/lib/storage';
import { Haptics, NotificationType } from '@capacitor/haptics';
import { playDangerSound } from '@/lib/alertSound';

interface BlockedLinkScreenProps {
    url: string;
    domain: string;
    scamCategory?: ScamCategory;
    onClose: () => void;
}

/**
 * BlockedLinkScreen - Shown when a link is in the known scam database
 * 
 * This screen CANNOT be bypassed. There is no "proceed anyway" option.
 * The user can only close this screen.
 */
export function BlockedLinkScreen({ url, domain, scamCategory, onClose }: BlockedLinkScreenProps) {
    const { t, state, refreshStats } = useApp();

    // Play alert sound and haptic notification when dangerous link is blocked
    useEffect(() => {
        const playAlertFeedback = async () => {
            // Play audio alert sound
            await playDangerSound();

            // Also vibrate
            try {
                await Haptics.notification({ type: NotificationType.Error });
            } catch (e) {
                // Haptics not available (e.g., on web), ignore silently
                console.debug('Haptics not available:', e);
            }
        };
        playAlertFeedback();
    }, []);

    const handleClose = async () => {
        // Record blocked decision
        await SafetyHistoryService.recordDecision({
            url,
            domain,
            riskLevel: 'high', // Use 'high' for storage compatibility (blocked is not in storage type)
            action: 'blocked',
            source: 'external',
        });
        // Refresh global stats
        await refreshStats();
        onClose();
    };

    const categoryLabel = scamCategory
        ? getCategoryLabel(scamCategory, state.language as 'en' | 'id')
        : t.blocked.unknownScam;

    return (
        <div
            className="fixed inset-0 z-50 bg-background flex flex-col animate-fade-in"
            role="alertdialog"
            aria-labelledby="blocked-title"
            aria-describedby="blocked-description"
        >
            {/* Header with warning background */}
            <div className="bg-destructive/10 border-b border-destructive/20 safe-area-top">
                <div className="flex items-center justify-between p-4">
                    <div className="w-12" aria-hidden="true" />
                    <h1 id="blocked-title" className="font-bold text-destructive text-lg">
                        {t.blocked.title}
                    </h1>
                    <button
                        onClick={handleClose}
                        className="w-12 h-12 flex items-center justify-center rounded-full hover:bg-destructive/20 transition-colors"
                        aria-label={t.common.close}
                    >
                        <X className="w-6 h-6 text-destructive" />
                    </button>
                </div>
            </div>

            {/* Main Content */}
            <div className="flex-1 overflow-y-auto px-4 pt-6 pb-40">
                {/* Large Warning Icon */}
                <div className="flex justify-center mb-6">
                    <div className="w-24 h-24 rounded-full bg-destructive/20 flex items-center justify-center animate-pulse">
                        <ShieldX className="w-14 h-14 text-destructive" aria-hidden="true" />
                    </div>
                </div>

                {/* Warning Title */}
                <h2 className="text-2xl font-bold text-destructive text-center mb-2">
                    {t.blocked.dangerTitle}
                </h2>
                <p id="blocked-description" className="text-center text-muted-foreground mb-6">
                    {t.blocked.dangerDesc}
                </p>

                {/* Domain Info */}
                <Card className="p-4 mb-4 bg-destructive/5 border-destructive/20">
                    <p className="text-sm text-muted-foreground mb-1">{t.blocked.attemptedUrl}</p>
                    <p className="font-mono text-sm text-destructive break-all">{domain}</p>
                </Card>

                {/* Scam Category */}
                <Card className="p-4 mb-4 bg-destructive/10 border-destructive/30">
                    <div className="flex items-start gap-3">
                        <AlertOctagon className="w-6 h-6 text-destructive flex-shrink-0 mt-0.5" aria-hidden="true" />
                        <div>
                            <p className="font-semibold text-destructive">{t.blocked.identifiedAs}</p>
                            <p className="text-destructive/80 mt-1">{categoryLabel}</p>
                        </div>
                    </div>
                </Card>

                {/* Explanation */}
                <Card className="p-4 mb-4">
                    <h3 className="font-semibold text-foreground mb-2">{t.blocked.whyBlocked}</h3>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                        {t.blocked.whyBlockedDesc}
                    </p>
                </Card>

                {/* What to do */}
                <Card className="p-4 mb-4 bg-muted/50">
                    <h3 className="font-semibold text-foreground mb-2">{t.blocked.whatToDo}</h3>
                    <ul className="text-sm text-muted-foreground space-y-2">
                        <li>• {t.blocked.tip1}</li>
                        <li>• {t.blocked.tip2}</li>
                        <li>• {t.blocked.tip3}</li>
                    </ul>
                </Card>
            </div>

            {/* Fixed Bottom - Single Close Button */}
            <div className="fixed bottom-0 left-0 right-0 p-4 bg-background border-t border-border safe-area-bottom">
                <Button
                    onClick={handleClose}
                    size="lg"
                    className="w-full h-14 text-lg gap-2"
                >
                    <X className="w-5 h-5" aria-hidden="true" />
                    {t.blocked.closeButton}
                </Button>

                {/* No "proceed anyway" button - this is intentional */}
                <p className="text-center text-xs text-muted-foreground mt-3">
                    {t.blocked.cannotProceed}
                </p>
            </div>
        </div>
    );
}
