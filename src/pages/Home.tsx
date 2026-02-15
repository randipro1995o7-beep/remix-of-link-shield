import { useState } from 'react';
import { StatusCard } from '@/components/StatusCard';
import { StatsDisplay } from '@/components/StatsDisplay';
import { DemoLinkButton } from '@/components/DemoLinkButton';
import { SafetyStatsChart } from '@/components/SafetyStatsChart';
import { useApp } from '@/contexts/AppContext';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { QrCode, Lock, Unlock, ShieldAlert } from 'lucide-react';
import { QRScannerScreen } from '@/components/QRScannerScreen';
import { HomeGuideOverlay } from '@/components/home/HomeGuideOverlay';
import { NewsSection } from '@/components/home/NewsSection';
import { cn } from '@/lib/utils';

/**
 * Home Page
 * 
 * Uses assistive language throughout.
 * No absolute security claims.
 */
export default function Home() {
  const { t, state, setPanicMode } = useApp();
  const [showQRScanner, setShowQRScanner] = useState(false);

  // Show QR Scanner overlay
  if (showQRScanner) {
    return <QRScannerScreen onClose={() => setShowQRScanner(false)} />;
  }

  return (
    <div className="p-4 space-y-6 animate-fade-in">
      {/* Header */}
      <header className="sticky top-0 z-10 bg-background/80 backdrop-blur-md pt-4 pb-2 -mx-4 px-4 flex justify-between items-center transition-all">
        <div>
          <h1 className="text-display text-foreground">
            {t.appName}
          </h1>
          <p className="text-muted-foreground">
            {t.tagline}
          </p>
        </div>
        {/* QR Scan Button */}
        <Button
          onClick={() => setShowQRScanner(true)}
          variant="outline"
          size="icon"
          className="w-12 h-12 rounded-full"
          aria-label="Scan QR Code"
        >
          <QrCode className="w-6 h-6" />
        </Button>
      </header>

      {/* Status Card */}
      <StatusCard />

      {/* Panic Mode Control */}
      <Card className={cn(
        "p-4 border-l-4 transition-all duration-300",
        state.isPanicMode
          ? "bg-destructive/10 border-l-destructive shadow-lg shadow-destructive/20 border-destructive"
          : "bg-card border-l-transparent hover:border-l-destructive/50",
        !state.isProtectionEnabled && "opacity-50 pointer-events-none grayscale"
      )}>
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className={cn(
              "p-2.5 rounded-full transition-colors flex-shrink-0",
              state.isPanicMode ? "bg-destructive text-destructive-foreground animate-pulse" : "bg-muted text-muted-foreground"
            )}>
              {state.isPanicMode ? <Lock className="w-5 h-5" /> : <Unlock className="w-5 h-5" />}
            </div>
            <div>
              <h3 className={cn("font-semibold truncate", state.isPanicMode ? "text-destructive" : "text-foreground")}>
                {t.home.panicMode}
              </h3>
              <p className="text-xs text-muted-foreground line-clamp-2">
                {state.isPanicMode
                  ? t.home.panicModeActiveDesc
                  : t.home.panicModeInactiveDesc}
              </p>
            </div>
          </div>
          <Switch
            checked={state.isPanicMode}
            onCheckedChange={(checked) => setPanicMode(checked)}
            disabled={!state.isProtectionEnabled}
            aria-label={t.home.togglePanicMode}
            className={cn(state.isPanicMode && "data-[state=checked]:bg-destructive")}
          />
        </div>
      </Card>

      {/* Stats */}
      <section aria-label="Safety statistics">
        <StatsDisplay />
      </section>

      {/* Activity Chart */}
      <section aria-label="Safety Activity Chart">
        <SafetyStatsChart />
      </section>

      {/* News Section */}
      <section aria-label="Security News">
        <NewsSection />
      </section>

      {/* Demo Section - only shown for testing */}
      {state.isProtectionEnabled && (
        <Card className="p-4 card-elevated animate-scale-in">
          <h3 className="font-medium text-foreground mb-3">
            {t.home.testSafety}
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            {t.home.testSafetyDesc}
          </p>
          <DemoLinkButton
            url="https://suspicious-site.example.com/claim-prize"
            source="SMS"
            label={t.home.simulateLink}
          />
        </Card>
      )}

      {/* Interactive Onboarding Guide */}
      <HomeGuideOverlay />
    </div>
  );
}
